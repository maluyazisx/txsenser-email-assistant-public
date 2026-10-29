/* Public synthetic-only interaction. No live AI, storage, mail, network or approval. */
(() => {
  'use strict';
  const data=window.FICTIONAL_MATTER, $=id=>document.getElementById(id);
  if(!data||data.demonstration!==true||data.matter_key!==data.source_mail?.matter_key||
     !Array.isArray(data.strategies)||data.strategies.length!==2||!window.SourceMailReader){
    $('flow-failure').hidden=false;return;
  }
  const text=(id,value)=>{$(id).textContent=value;};
  const add=(id,value)=>{const li=document.createElement('li');li.textContent=value;$(id).append(li);};
  const source=window.SourceMailReader.normalize(data.source_mail,data.matter_key,true);
  if(!source||source.selected_source_id!=='synthetic:mail:request'){$('flow-failure').hidden=false;return;}
  $('source-reader').replaceChildren(window.SourceMailReader.render(source));
  text('matter-title',data.matter.title);
  text('customer-name',data.customer.name);
  text('customer-contact',data.customer.contact+' · '+data.customer.role_en+'（'+data.customer.role_cn+'）');
  text('matter-brief',data.matter.brief);
  text('matter-stage',data.matter.stage);
  text('matter-next',data.matter.next_step);
  text('fact-suggestion',data.evidence.suggestion);
  text('fact-challenge',data.evidence.challenge);
  for(const fact of data.evidence.facts)add('known-facts',fact.text+'〔来源：'+fact.source_id+'〕');
  for(const missing of data.evidence.unknown)add('unknown-facts',missing);
  let selected=data.strategies[0], changed=false;
  function showStep(step){
    for(const node of document.querySelectorAll('[data-step-panel]'))node.hidden=node.dataset.stepPanel!==step;
    for(const button of document.querySelectorAll('nav.steps [data-step-button]'))
      button.setAttribute('aria-current',button.dataset.stepButton===step?'step':'false');
  }
  function choose(id){
    const found=data.strategies.find(s=>s.id===id);if(!found)return;
    selected=found;changed=false;
    $('reply-en').value=found.english;text('reply-zh',found.chinese);
    text('reply-sync','中文对照与当前预设英文一致（虚构示例）');
    $('reply-sync').dataset.state='matched';
    text('strategy-explanation',found.next);
    for(const b of document.querySelectorAll('[data-strategy]'))
      b.setAttribute('aria-pressed',String(b.dataset.strategy===found.id));
    text('copy-result','复制仅准备文本，不代表批准或发送。');
  }
  function edited(){
    changed=$('reply-en').value!==selected.english;
    text('reply-sync',changed?'中文对照待更新：英文已修改，下面是旧版中文，不能当作最新全文。':'中文对照与当前预设英文一致（虚构示例）');
    $('reply-sync').dataset.state=changed?'stale':'matched';
    text('copy-result','复制仅准备文本，不代表批准或发送。');
  }
  async function copy(){
    const value=$('reply-en').value;
    if(!value.trim()){text('copy-result','英文正文为空，不能复制。');return;}
    try{
      if(!navigator.clipboard?.writeText)throw new Error('clipboard_unavailable');
      await navigator.clipboard.writeText(value);
      text('copy-result','已复制当前英文正文；没有发送邮件，也没有改变审批状态。');
    }catch(_){
      $('reply-en').focus();$('reply-en').select();
      text('copy-result','浏览器不允许自动复制，已选中英文，请手工复制。');
    }
  }
  document.querySelectorAll('[data-step-button]').forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.stepButton)));
  document.querySelectorAll('[data-strategy]').forEach(b=>b.addEventListener('click',()=>{choose(b.dataset.strategy);showStep('reply');}));
  $('reply-en').addEventListener('input',edited);
  $('restore-reply').addEventListener('click',()=>choose(selected.id));
  $('copy-reply').addEventListener('click',copy);
  $('ceo-note').addEventListener('input',()=>text('note-state','想法仅在当前页面内显示，未发给 AI，也未跨天保存。'));
  $('go-to-reply').addEventListener('click',()=>showStep('reply'));
  choose(selected.id);showStep('read');
  window.BusinessDemo=Object.freeze({getSelection:()=>selected.id,isChineseStale:()=>changed});
})();