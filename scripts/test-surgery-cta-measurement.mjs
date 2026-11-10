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

const internal=read('internal-medicine/bootstrap.js');
const internalSource=internal.slice(internal.indexOf('/* 내과 CTA 측정:'));
const internalSelector='.hx-sg-cta-row a, #hx-im-areas a[href]';
function internalClick(f,href,outro=true){
 const link={getAttribute:()=>href,closest:sel=>sel==='.hx-sg-cta-row'&&outro?{}:null};
 for(const fn of f.handlers)fn({target:{closest:sel=>sel===internalSelector?link:null}});
}
test('internal medicine CTA clicks keep page, placement and device with one semantic event',()=>{
 for(const device of ['mobile','desktop']){
  const f=fixture({pathname:'/internal-medicine',device});
  vm.runInNewContext(internalSource,f.context);vm.runInNewContext(internalSource,f.context);
  for(const href of ['/seocho','/ilsan','https://www.svicc.co.kr/?utm_source=existing'])internalClick(f,href);
  internalClick(f,'https://www.svicc.co.kr/?fbclid=ignored',false);
  assert.equal(f.handlers.length,1);assert.equal(f.events.length,4);assert.equal(f.requests.length,0);
  assert.deepEqual(f.events.map(e=>e.params.branch_key),['seocho','ilsan','svicc','svicc']);
  for(const e of f.events){assert.equal(e.name,'internal_medicine_branch_click_'+device);assert.equal(e.params.page,'internal_medicine');assert.equal(e.params.transport_type,'beacon');assert(!JSON.stringify(e.params).includes('fbclid'));}
  assert.equal(f.events[0].params.cta_src,'internal_medicine_outro');
  assert.equal(f.events[3].params.cta_src,'internal_medicine_areas');
  for(const href of ['#https://www.svicc.co.kr/','/faq','https://evil.example/seocho','javascript:alert(1)','mailto:a@example.com'])internalClick(f,href);
  assert.equal(f.events.length,4);
 }
});
test('internal medicine CTA excludes staging, operators and other pages, including exclusions after initialization',()=>{
 for(const options of [{hostname:'helixanimalmedicalcenter.webflow.io'},{excluded:true},{pathname:'/services'}]){
  const f=fixture({pathname:'/internal-medicine',...options});vm.runInNewContext(internalSource,f.context);internalClick(f,'/seocho');assert.equal(f.events.length,0);
 }
 const f=fixture({pathname:'/internal-medicine/'});vm.runInNewContext(internalSource,f.context);
 f.window.__helixNoMeasure=true;internalClick(f,'/seocho');assert.equal(f.events.length,0);
});
test('inspection mode lists the tracked internal medicine CTAs while preserving operator exclusions',()=>{
 const inspector=read('global/ga-inspector.js');
 const stop=inspector.indexOf('  /* 페이지 단위 측정');
 const inspect=inspector.slice(0,stop)+'\nwindow.testTargets=TARGETS;window.testPage=PAGE;})();';
 const f=fixture({pathname:'/internal-medicine',excluded:true});
 f.context.location.search='?ga-inspect=1';
 f.context.document.querySelector=()=>null;
 vm.runInNewContext(inspect,f.context);
 assert.equal(f.window.testPage,'internal_medicine');assert.equal(f.window.__helixNoMeasure,true);
 const targets=f.window.testTargets.filter(t=>t.event.startsWith('internal_medicine_branch_click_'));
 assert.equal(targets.length,2);
 for(const target of targets){
  for(const href of ['/seocho','/ilsan','https://www.svicc.co.kr/?utm_source=existing'])assert.equal(target.match({getAttribute:()=>href}),true);
  for(const href of ['#','https://evil.example/seocho','/faq'])assert.equal(target.match({getAttribute:()=>href}),false);
 }
 const floating=read('global/floating-cta.js');
 const start=floating.indexOf('  function ctaPage() {'),end=floating.indexOf('  var CTA_PAGE = ctaPage();',start);
 vm.runInNewContext(floating.slice(start,end)+'\nwindow.testCtaPage=ctaPage();',f.context);
 assert.equal(f.window.testCtaPage,'internal_medicine');
 assert.equal(f.events.length,0);assert.equal(f.requests.length,0);
 assert(internal.indexOf("'global/ga-inspector.js'")<internal.indexOf('var gsap ='));
});

console.log(`CTA measurement regression checks passed: ${passed}. All requests mocked; no production events or leads.`);
