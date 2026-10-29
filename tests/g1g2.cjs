// Focused source-reader checks; modeled DOM is not a browser or native acceptance.
// Minimal Node model adapted from the existing synthetic context test harness.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/source_mail_g1g2.json'), 'utf8'));
let checks = 0;
const effects = [];
const test = (name, fn) => { try { fn(); checks++; } catch (e) { e.message = name + ': ' + e.message; throw e; } };
class Node {
  constructor(tag) { this.tagName=tag;this.children=[];this.parent=null;this.className='';this._text='';this.events={};this.dataset={};this.disabled=false; }
  set textContent(v) { this._text=String(v);this.children=[]; }
  get textContent() { return this._text+this.children.map(n=>n.textContent).join(''); }
  append(...nodes) { for(const n of nodes){n.parent=this;this.children.push(n);} }
  replaceChildren(...nodes) { this.children=[];this._text='';this.append(...nodes); }
  setAttribute(k,v) { this[k]=String(v); }
  addEventListener(t,fn) { (this.events[t]??=[]).push(fn); }
  click() { if(!this.disabled)for(const fn of this.events.click||[])fn(); }
  focus() { doc.activeElement=this; }
  querySelectorAll(s) { return this.children.flatMap(n=>[n,...n.querySelectorAll('*')]).filter(n=>s==='*'||(s[0]==='#'?n.id===s.slice(1):s[0]==='.'?n.className.split(' ').includes(s.slice(1)):n.tagName===s)); }
  querySelector(s) { return this.querySelectorAll(s)[0]||null; }
}
const doc = new Node('document'); doc.createElement = t => new Node(t);
const win = {};
const forbidden = name => () => { effects.push(name);throw Error('Unexpected '+name); };
const context = {window:win,document:doc,fetch:forbidden('fetch'),XMLHttpRequest:forbidden('xhr'),WebSocket:forbidden('websocket')};
for(const name of ['open','fetch','postMessage','showOpenFilePicker'])win[name]=forbidden(name);
for(const name of ['localStorage','sessionStorage','indexedDB']){
  Object.defineProperty(context,name,{get:forbidden(name)});
  Object.defineProperty(win,name,{get:forbidden(name)});
}
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'source/source-mail.js'),'utf8'),context);
const reader = win.SourceMailReader;
const data = () => JSON.parse(JSON.stringify(fixture.snapshot.cards[0].source_mail));
const normalize = (value=data(), synthetic=true) => reader.normalize(value,'matter:synthetic:g1g2',synthetic);
const show = value => reader.render(normalize(value));
const a = data().messages[0], b = data().messages[1];
test('full Chinese is primary and English starts collapsed',()=>{
  const view=show();assert.equal(view.querySelector('#source-mail-chinese').textContent,a.translation.text);
  assert.ok(view.textContent.includes('长文结束：27 件。'));
  assert.equal(view.querySelector('#source-mail-original').hidden,true);
  assert.equal(view.querySelector('#source-mail-history').open,false);
});
test('reveal and history switching keep original and translation together',()=>{
  const view=show();view.querySelector('.source-mail-original-toggle').click();
  assert.equal(view.querySelector('#source-mail-original').hidden,false);
  assert.ok(view.querySelector('#source-mail-original').textContent.includes(a.original.text));
  view.querySelector('.source-mail-select').click();
  assert.equal(view.querySelector('#source-mail-chinese').textContent,b.translation.text);
  assert.equal(view.querySelector('#source-mail-original').hidden,true);
  view.querySelector('.source-mail-original-toggle').click();
  assert.ok(view.querySelector('#source-mail-original').textContent.includes(b.original.text));
  assert.ok(!view.querySelector('#source-mail-original').textContent.includes(a.original.text));
  view.querySelector('.source-mail-select').click();
  assert.equal(view.querySelector('#source-mail-chinese').textContent,a.translation.text);
});
test('normalization copies input and reading does not mutate it',()=>{
  const value=data(),before=JSON.stringify(value),bound=normalize(value),view=reader.render(bound);
  view.querySelector('.source-mail-select').click();assert.equal(JSON.stringify(value),before);
  value.messages[0].translation.text='MUTATED';assert.equal(bound.messages[0].translation.text,a.translation.text);
});
test('no source does not reuse another source',()=>{const view=reader.render(null);assert.equal(view.querySelector('#source-mail-chinese'),null);assert.ok(!view.textContent.includes(a.translation.text));});
test('non-synthetic input cannot activate the reader',()=>assert.equal(normalize(data(),false),null));
for(const kind of ['missing-selected','duplicate-source','wrong-matter','bad-revision','malformed-body','coverage-overclaim'])test(kind+' is rejected',()=>{
  const value=data();
  if(kind==='missing-selected')value.selected_source_id='synthetic:mail:missing';
  if(kind==='duplicate-source')value.messages.push(value.messages[0]);
  if(kind==='wrong-matter')value.matter_key='matter:other';
  if(kind==='bad-revision')value.messages[0].source_revision='bad';
  if(kind==='malformed-body')value.messages[0].translation.text={};
  if(kind==='coverage-overclaim')value.coverage='complete';
  assert.equal(normalize(value),null);
});
for(const field of ['source_id','source_revision'])test('mismatched translation '+field+' is withheld',()=>{
  const value=data();value.messages[0].translation[field]=b[field];
  const view=show(value);assert.equal(view.querySelector('#source-mail-chinese'),null);assert.ok(view.textContent.includes('来源不匹配'));
});
for(const availability of ['header_only','unavailable'])test(availability+' suppresses body',()=>{
  const value=data();value.messages[0].availability=availability;
  const view=show(value);assert.equal(view.querySelector('#source-mail-chinese'),null);assert.equal(view.querySelector('.source-mail-original-toggle').disabled,true);
});
for(const state of ['missing','failed'])test('translation '+state+' stays explicit',()=>{
  const value=data();value.messages[0].translation.status=state;
  const view=show(value);assert.equal(view.querySelector('#source-mail-chinese'),null);assert.ok(view.textContent.includes(state==='failed'?'失败':'缺失'));
});
test('partial original downgrades claimed complete translation',()=>{
  const value=data();value.messages[0].original.status='partial';
  const view=show(value);assert.ok(view.textContent.includes('原文仅部分可用'));assert.equal(view.querySelector('#source-mail-chinese').textContent,a.translation.text);
});
test('wrong-source original disables unsafe viewing',()=>{
  const value=data();value.messages[0].original.source_id=b.source_id;
  const view=show(value);assert.equal(view.querySelector('.source-mail-original-toggle').disabled,true);assert.equal(view.querySelector('#source-mail-chinese'),null);
});
test('unknown date and incomplete history remain explicit',()=>{
  const value=data();value.messages[1].sent_at='2026-02-30T00:00:00Z';
  const view=show(value);assert.ok(view.textContent.includes('时间未知（先后未判定）'));assert.ok(view.textContent.includes('不代表完整线程'));
});
test('empty supplied history does not claim no history exists',()=>{
  const value=data();value.messages=value.messages.slice(0,1);assert.ok(show(value).textContent.includes('不能据此认定没有历史'));
});
test('hostile body is inert text',()=>{
  const value=data(),marker='<img src=x onerror=fetch(1)><script>alert(1)</script>https://invalid.example';
  for(const row of value.messages)for(const field of ['original','translation'])row[field].text=marker;
  const view=show(value);view.querySelector('.source-mail-original-toggle').click();
  assert.equal(view.querySelector('#source-mail-chinese').textContent,marker);
  for(const tag of ['img','script','a','iframe'])assert.equal(view.querySelector(tag),null);
});
assert.deepEqual(effects,[]);
console.log(JSON.stringify({status:'SOURCE_READER_COMPONENT_PASS',checks,side_effects:effects,limit:'Modeled DOM; no browser layout, real mail, translation quality, native integration or release claim'}));
