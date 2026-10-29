/* G1/G2: supplied synthetic source records only; no transport or translation. */
(() => {
  'use strict';
  const plain=(v,max=200000)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(v);
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const source=v=>typeof v==='string'&&/^synthetic:mail:[a-z0-9-]+$/.test(v);
  const revision=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
  const labels={complete:'完整',partial:'部分内容',missing:'缺失',failed:'失败',binding_mismatch:'来源不匹配',header_only:'仅邮件头，正文未读取',unavailable:'来源不可用'};
  const coverage={partial:'仅部分历史已提供',unread:'历史尚未读取',unavailable:'历史来源不可用',unknown:'历史覆盖范围未知'};
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
        translation=Object.freeze({status:'missing',text:'',reason:'原文正文尚不可核实，未将译文标为全文。'});
      }else if(original.status==='partial'&&translation.status==='complete'){
        translation=Object.freeze({...translation,status:'partial',reason:'原文仅部分可用，译文不代表整封邮件。'});
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
    n.append(el('p','','发件人：'+row.sender),el('p','',row.time===null?'时间未知：未提供可核实时间':'时间：'+row.sent_at),
      el('p','','来源：'+row.source_id),el('p','','来源版本：'+row.source_revision));
    return n;
  }
  function render(value){
    const root=el('section','source-mail-reader');root.id='source-mail-reader';
    root.setAttribute('aria-label','选中源邮件阅读');
    if(!value){root.append(el('h3','','源邮件'),el('p','source-mail-state','当前没有可核实的选中源邮件正文；未使用摘要或其他邮件替代。'));return root;}
    let selected=value.selected_source_id;
    function draw(){
      root.replaceChildren();
      const row=value.messages.find(m=>m.source_id===selected);
      const current=el('article','source-mail-current');current.dataset.sourceId=row.source_id;
      current.append(el('h3','','当前选中邮件 · 源邮件中文译文'),el('p','source-mail-notice','这不是AI摘要、建议或英文回复的中文回译。'),
        el('h4','source-mail-subject',row.subject||'未提供主题'),metadata(row));
      const translated=row.translation;
      current.append(el('p','source-mail-state','源邮件译文：'+labels[translated.status]+(translated.reason?' · '+translated.reason:'')));
      if(translated.text){const text=el('div','source-mail-body',translated.text);text.id='source-mail-chinese';current.append(text);}
      else current.append(el('p','source-mail-missing','当前源邮件没有可展示的中文正文；未沿用旧译文。'));
      const toggle=el('button','source-mail-original-toggle','查看同源英文原文');toggle.type='button';
      toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','source-mail-original');
      toggle.disabled=!['complete','partial'].includes(row.original.status);
      const original=el('section','source-mail-original');original.id='source-mail-original';original.hidden=true;
      original.append(el('h4','','同源英文原文 · '+labels[row.original.status]),metadata(row),el('div','source-mail-body',row.original.text));
      toggle.addEventListener('click',()=>{original.hidden=!original.hidden;toggle.setAttribute('aria-expanded',String(!original.hidden));toggle.textContent=original.hidden?'查看同源英文原文':'收起同源英文原文';});
      current.append(toggle,el('p','source-mail-state','英文正文：'+labels[row.original.status]),original);root.append(current);
      const history=el('details','source-mail-history');history.id='source-mail-history';history.open=false;
      const rows=value.messages.filter(m=>m.source_id!==selected);
      const summary=el('summary','','历史往来（已提供 '+rows.length+' 封） · '+coverage[value.coverage]);
      history.append(summary,el('p','source-mail-notice','仅展示已提供记录，不代表完整线程或完整翻译。展开、收起和切换不会读取或翻译更多邮件。'),
        el('p','source-mail-order','可核实时间从早到晚；同一时间保持已提供顺序。未知时间单列，不推断先后。'));
      const known=rows.filter(m=>m.time!==null).sort((a,b)=>a.time-b.time),unknown=rows.filter(m=>m.time===null);
      for(const [heading,group] of [['时间已知',known],['时间未知（先后未判定）',unknown]]){
        if(group.length)history.append(el('h4','',heading));
        for(const item of group){
          const entry=el('article','source-mail-history-entry');entry.dataset.sourceId=item.source_id;
          entry.append(el('h5','',item.subject||'未提供主题'),metadata(item),
            el('p','source-mail-state','英文正文：'+labels[item.original.status]+'；中文译文：'+labels[item.translation.status]));
          const read=el('button','source-mail-select','阅读这封邮件');read.type='button';read.setAttribute('aria-label','阅读 '+item.source_id);
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
