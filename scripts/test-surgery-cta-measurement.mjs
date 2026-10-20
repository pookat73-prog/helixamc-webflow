import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const floating=read('global/floating-cta.js');
const surgery=read('services/surgery-bootstrap.js');
const branchSource=surgery.slice(surgery.indexOf('/* 외과 본문 하단의 지점 선택.'));
const phoneSource=floating.slice(floating.lastIndexOf('(function () {'));
let passed=0;
function test(name,run){run();passed++;console.log('✓ '+name);}
function fixture({device='desktop',hostname='www.helix-amc.com',pathname='/surgery',excluded=false}={}){
 const events=[],requests=[],handlers=[];
 const location={hostname,pathname,search:'',origin:'https://'+hostname,href:'https://'+hostname+pathname};
 const window={__helixNoMeasure:excluded,HelixVP:{device:()=>device},gtag:(kind,name,params)=>events.push({name,params})};
 const context={window,HelixVP:window.HelixVP,location,URL,URLSearchParams,Date,console,
  document:{readyState:'complete',referrer:'',body:{},addEventListener:(name,fn)=>handlers.push(fn)},
  sessionStorage:{getItem:()=>null,setItem(){}},navigator:{userAgent:'isolated-regression-test'},
  fetch:(url,options)=>{requests.push({url,options});return Promise.resolve({ok:true});}};
 return {context,events,requests,handlers,window,click(href,selector){const link={getAttribute:()=>href};
  for(const fn of handlers)fn({target:{closest:sel=>sel===selector?link:null}});}};
}
test('mobile and PC branch clicks retain surgery context without a page wrapper or navigation interception',()=>{
 for(const device of ['mobile','desktop']){
  const f=fixture({device});vm.runInNewContext(branchSource,f.context);vm.runInNewContext(branchSource,f.context);
  for(const href of ['/seocho','/ilsan','https://www.svicc.co.kr/'])f.click(href,'.hx-sg-cta-row a');
  assert.equal(f.events.length,3);assert.equal(f.handlers.length,1);assert.equal(f.requests.length,0);
  assert.deepEqual(f.events.map(e=>e.params.branch_key),['seocho','ilsan','svicc']);
  for(const e of f.events){assert.equal(e.name,'surgery_branch_click_'+device);assert.equal(e.params.page,'surgery');assert.equal(e.params.cta_src,'surgery_outro');}
  for(const href of ['#https://www.svicc.co.kr/','/faq','https://other.example/seocho','javascript:alert(1)'])f.click(href,'.hx-sg-cta-row a');
  assert.equal(f.events.length,3);
 }
});
test('branch measurement excludes staging, operator visits and other pages',()=>{
 for(const options of [{hostname:'helixanimalmedicalcenter.webflow.io'},{excluded:true},{pathname:'/services'}]){
  const f=fixture(options);vm.runInNewContext(branchSource,f.context);f.click('/seocho','.hx-sg-cta-row a');assert.equal(f.events.length,0);
 }
});
test('phone database records exclude staging and operator visits while preserving normal page attribution',()=>{
 for(const options of [{},{excluded:true},{hostname:'helixanimalmedicalcenter.webflow.io'}]){
  const f=fixture(options);vm.runInNewContext(phoneSource,f.context);f.click('tel:0221359119','#hxFctaCallBtn');
  assert.equal(f.requests.length,options.excluded||options.hostname?0:1);
  if(f.requests.length){const request=f.requests[0];assert.equal(request.options.keepalive,true);assert.equal(JSON.parse(request.options.body).page,'/surgery');}
 }
 const f=fixture();vm.runInNewContext(phoneSource,f.context);f.window.__helixNoMeasure=true;f.click('tel:0221359119','#hxFctaCallBtn');assert.equal(f.requests.length,0);
});
test('direct form open emits one canonical form event and one legacy event without submitting',()=>{
 const start=floating.indexOf('  function openModalFromFab() {');
 const end=floating.indexOf("  toggle.addEventListener('click'",start);
 const events=[];let opens=0;
 const context={formSrc:'inline_cta',openModal:()=>opens++,ga:(name,params)=>events.push({name,params})};
 vm.runInNewContext(floating.slice(start,end)+'\nopenModalFromFab();',context);
 assert.equal(opens,1);assert.equal(context.formSrc,'floating_cta');
 assert.deepEqual(events.map(e=>e.name),['cta_open','cta_form_open']);
 assert.equal(events[1].params.cta_src,'floating_cta');
});
console.log(`CTA measurement regression checks passed: ${passed}. All requests mocked; no production events or leads.`);
