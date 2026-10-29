/* G1/G2: supplied synthetic source records only; no transport or translation. */
(() => {
  'use strict';
  const plain=(v,max=200000)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(v);
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const source=v=>typeof v==='string'&&/^synthetic:mail:[a-z0-9-]+$/.test(v);
  const revision=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
  const labels={complete:'完整',partial:'部分内容',missing:'缺失',failed:'失败',binding_mismatch:'内容与当前邮件不一致',header_only:'仅邮件头，正文未读取',unavailable:'邮件暂不可用'};
  const coverage={partial:'仅提供部分历史',unread:'历史邮件尚未读取',unavailable:'历史邮件暂不可用',unknown:'历史是否完整尚不确定'};
  function timestamp(value){
    if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value))return null;
    const n=Date.parse(value);
    const canonical=value.includes('.')?value:value.slice(0,-1)+'.000Z';
    return Number.isFinite(n)&&new Date(n).toISOString()===canonical?n:null;
  }
  function body(value,row){
    if(!object(value)||!['complete','partial','missing','failed'].includes(value.status)||!plain(value.text)||!plain(value.reason,500))return null;
    if(value.source_id!==row.source_id||value.source_revision!==row.source_revision)return Object.freeze({status:'binding_mismatch',text:'',reason:''});
    const text=['complete','partial'].includes(value.status)?value.text:'';
    return Object.freeze({status:text.trim()?value.status:(['complete','partial'].includes(value.status)?'missing':value.status),text,reason:value.reason});
  }
  function normalize(value,key,synthetic){
    if(!synthetic||!object(value)||value.matter_key!==key||!source(value.selected_source_id)||
       !Object.hasOwn(coverage,value.coverage)||!Array.isArray(value.messages)||value.messages.length>100)return null;
    const seen=new Set(),messages=[];
    for(const row of value.messages){
      if(!object(row)||!source(row.source_id)||seen.has(row.source_id)||!revision(row.source_revision)||
         !plain(row.sender,300)||!row.sender.trim()||!plain(row.subject,500)||
         !(row.sent_at===null||plain(row.sent_at,80))||!['available','header_only','unavailable'].includes(row.availability))return null;
      seen.add(row.source_id);
      let original=body(row.original,row),translation=body(row.translation,row);
      if(!original||!translation)return null;
      if(row.availability!=='available'){
        original=translation=Object.freeze({status:row.availability,text:'',reason:''});
      }else if(!['complete','partial'].includes(original.status)&&['complete','partial'].includes(translation.status)){
        translation=Object.freeze({status:'missing',text:'',reason:'邮件英文正文暂无法核实，不能确认中文内容完整。'});
      }else if(original.status==='partial'&&translation.status==='complete'){
        translation=Object.freeze({...translation,status:'partial',reason:'只读到部分邮件，中文内容可能不完整。'});
      }
      messages.push(Object.freeze({source_id:row.source_id,source_revision:row.source_revision,
        sender:row.sender,subject:row.subject,sent_at:row.sent_at,time:timestamp(row.sent_at),
        original,translation,availability:row.availability}));
    }
    if(!seen.has(value.selected_source_id))return null; // Never substitute another source.
    return Object.freeze({selected_source_id:value.selected_source_id,coverage:value.coverage,messages:Object.freeze(messages)});
  }
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function metadata(row){
    const n=el('div','source-mail-meta');
    const formatted=row.time===null?'待确认':new Date(row.time).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})+'（北京时间）';
    n.append(el('p','','发件人：'+row.sender),el('p','','时间：'+formatted));
    return n;
  }
  function render(value){
    const root=el('section','source-mail-reader');root.id='source-mail-reader';
    root.setAttribute('aria-label','邮件正文阅读');
    if(!value){root.append(el('h3','','邮件正文'),el('p','source-mail-state','这件事尚未提供可阅读的邮件正文，不会显示其他邮件的内容。'));return root;}
    let selected=value.selected_source_id;
    function draw(){
      root.replaceChildren();
      const row=value.messages.find(m=>m.source_id===selected);
      const current=el('article','source-mail-current');current.dataset.sourceId=row.source_id;
      current.append(el('h3','','邮件正文（中文）'),
        el('h4','source-mail-subject',row.subject||'未提供主题'),metadata(row));
      const translated=row.translation;
      if(translated.status!=='complete')current.append(el('p','source-mail-state','中文内容：'+labels[translated.status]+(translated.reason?' · '+translated.reason:'')));
      if(translated.text){const text=el('div','source-mail-body',translated.text);text.id='source-mail-chinese';current.append(text);}
      else current.append(el('p','source-mail-missing','这封邮件暂时没有可展示的中文正文。'));
      const toggle=el('button','source-mail-original-toggle','查看英文原文');toggle.type='button';
      toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','source-mail-original');
      toggle.disabled=!['complete','partial'].includes(row.original.status);
      const original=el('section','source-mail-original');original.id='source-mail-original';original.hidden=true;
      original.append(el('h4','','英文原文'),el('div','source-mail-body',row.original.text));
      toggle.addEventListener('click',()=>{original.hidden=!original.hidden;toggle.setAttribute('aria-expanded',String(!original.hidden));toggle.textContent=original.hidden?'查看英文原文':'收起英文原文';});
      current.append(toggle);
      if(row.original.status!=='complete')current.append(el('p','source-mail-state','英文原文：'+labels[row.original.status]));
      current.append(original);root.append(current);
      const history=el('details','source-mail-history');history.id='source-mail-history';history.open=false;
      const rows=value.messages.filter(m=>m.source_id!==selected);
      const summary=el('summary','','历史邮件（'+rows.length+' 封已提供） · '+coverage[value.coverage]);
      history.append(summary,el('p','source-mail-notice','这里只显示已提供的往来，历史记录可能不完整。'),
        el('p','source-mail-order','有日期的邮件按时间先后排列，无法确认日期的单独列出。'));
      const known=rows.filter(m=>m.time!==null).sort((a,b)=>a.time-b.time),unknown=rows.filter(m=>m.time===null);
      for(const [heading,group] of [['按时间排列',known],['日期待确认的邮件',unknown]]){
        if(group.length)history.append(el('h4','',heading));
        for(const item of group){
          const entry=el('article','source-mail-history-entry');entry.dataset.sourceId=item.source_id;
          entry.append(el('h5','',item.subject||'未提供主题'),metadata(item));
          if(item.original.status!=='complete'||item.translation.status!=='complete')
            entry.append(el('p','source-mail-state','英文：'+labels[item.original.status]+'；中文：'+labels[item.translation.status]));
          const read=el('button','source-mail-select','阅读这封邮件');read.type='button';read.setAttribute('aria-label','阅读邮件：'+(item.subject||'未提供主题'));
          read.addEventListener('click',()=>{selected=item.source_id;draw();root.querySelector('.source-mail-original-toggle').focus({preventScroll:true});});
          entry.append(read);history.append(entry);
        }
      }
      if(!rows.length)history.append(el('p','','本次没有提供其他邮件，不能据此认定没有历史。'));
      root.append(history);
    }
    draw();return root;
  }
  window.SourceMailReader=Object.freeze({normalize,render});
})();
