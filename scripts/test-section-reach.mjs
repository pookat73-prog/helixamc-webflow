import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../global/section-reach.js',import.meta.url),'utf8');
let passed=0;
function test(name,run){run();passed++;console.log('✓ '+name);}
function fixture({hostname='www.helix-amc.com',pathname='/',noMeasure=false,mutationSupport=true}={}){
 let now=0,queries=0;const selectors=new Map(),events=[],frames=[],intervals=[],windowEvents=new Map(),documentEvents=new Map(),ios=[],mos=[];
 const add=(map,name,fn)=>{if(!map.has(name))map.set(name,[]);map.get(name).push(fn);};
 const element=({visible=true,parent=null}={})=>({tagName:'SECTION',visible,parent,offsetParent:visible?{}:null,getClientRects(){return this.visible?[{}]:[];},getBoundingClientRect(){return {top:0,bottom:this.visible?600:0,height:this.visible?600:0};},closest(){return this.parent||this;}});
 const document={readyState:'complete',hidden:false,body:element(),documentElement:{scrollHeight:3000,clientHeight:800},querySelector:()=>null,querySelectorAll(sel){queries++;return selectors.get(sel)||[];},addEventListener:(name,fn)=>add(documentEvents,name,fn)};
 document.body.scrollHeight=3000;
 const window={innerWidth:1280,innerHeight:800,pageYOffset:0,__helixNoMeasure:noMeasure,gtag:(kind,event,params)=>events.push({kind,event,params:JSON.parse(JSON.stringify(params))}),addEventListener:(name,fn)=>add(windowEvents,name,fn)};
 const context={window,document,location:{hostname,pathname,search:''},Date:class extends Date{static now(){return now;}},console,requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},setInterval:fn=>{intervals.push(fn);return intervals.length;},IntersectionObserver:class{constructor(fn){this.fn=fn;this.targets=new Set();this.observeCalls=0;ios.push(this);}observe(el){this.observeCalls++;this.targets.add(el);}unobserve(el){this.targets.delete(el);}},...(mutationSupport?{MutationObserver:class{constructor(fn){this.fn=fn;this.live=false;mos.push(this);}observe(){this.live=true;}disconnect(){this.live=false;}}}:{})};
 const run=()=>vm.runInNewContext(source,context,{timeout:1000});
 const fire=(map,name,event={})=>{for(const fn of map.get(name)||[])fn(event);};
 return {run,selectors,events,ios,mos,intervals,window,document,element,
  flushFrames(){let turns=0;while(frames.length){assert.ok(turns++<20,'bounded animation-frame work');frames.shift()();}},
  mutate(){for(const mo of mos)if(mo.live)mo.fn([{type:'childList'}]);},
  enter(...els){for(const io of ios)io.fn(els.filter(el=>io.targets.has(el)).map(target=>({target,isIntersecting:true})));},
  advance(ms){now+=ms;for(const fn of intervals)fn();},
  event(name,value){fire(windowEvents,name,value);},visibility(hidden){document.hidden=hidden;fire(documentEvents,'visibilitychange');},
  count(name){return events.filter(e=>e.event===name).length;},dwell(name){return events.filter(e=>e.event===name).reduce((n,e)=>n+e.params.dwell_sec,0);},get queries(){return queries;},get pending(){return frames.length;}
 };
}
const sec2='.home_background_2 h2.home_title',sec3='.home_background_3 h2.home_title, .home_background_3-mobile h2.home_title';
test('native home headings register before animation hooks; hidden desktop cannot suppress mobile',()=>{
 const f=fixture(),two=f.element(),desktop=f.element({visible:false}),mobile=f.element();
 f.selectors.set(sec2,[two]);f.selectors.set(sec3,[desktop,mobile]);f.run();f.enter(two,desktop,mobile);
 assert.equal(f.count('home_sec_sec2'),1);assert.equal(f.count('home_sec_sec3'),1);
 assert.equal(f.events.find(e=>e.event==='home_sec_sec3').params.section_index,3);
 desktop.visible=true;desktop.offsetParent={};f.enter(desktop);assert.equal(f.count('home_sec_sec3'),1);
});
test('late DOM starts dwell at discovery and starts only one timer',()=>{
 const f=fixture();f.run();assert.equal(f.intervals.length,0);f.advance(10000);
 const two=f.element();f.selectors.set(sec2,[two]);f.mutate();f.flushFrames();f.enter(two);f.advance(3000);f.event('pagehide');
 assert.equal(f.count('home_sec_sec2'),1);assert.equal(f.dwell('home_dwell_sec2'),3);assert.equal(f.intervals.length,1);
 f.event('pagehide');assert.equal(f.dwell('home_dwell_sec2'),3);
});
test('repeated class mutation and resize do not retransmit reach or reset dwell',()=>{
 const f=fixture(),two=f.element();f.selectors.set(sec2,[two]);f.run();f.enter(two);const before=f.ios[0].observeCalls,queries=f.queries;
 for(let i=0;i<100;i++)f.mutate();assert.equal(f.pending,1);f.flushFrames();assert.ok(f.queries-queries<15);
 f.advance(3000);for(let i=0;i<20;i++)f.event('resize');f.flushFrames();f.advance(3000);f.visibility(true);
 assert.equal(f.count('home_sec_sec2'),1);assert.equal(f.dwell('home_dwell_sec2'),6);assert.equal(f.ios[0].observeCalls,before);assert.equal(f.intervals.length,1);
});
test('replacing a section preserves accumulated dwell and per-key reach guard',()=>{
 const f=fixture(),old=f.element();f.selectors.set(sec2,[old]);f.run();f.enter(old);f.advance(3000);
 const replacement=f.element();old.visible=false;old.offsetParent=null;f.selectors.set(sec2,[replacement]);f.mutate();f.flushFrames();f.enter(replacement);f.advance(2000);f.visibility(true);
 assert.equal(f.count('home_sec_sec2'),1);assert.equal(f.dwell('home_dwell_sec2'),5);assert.equal(f.intervals.length,1);assert.ok(!f.ios[0].targets.has(old));
});
test('legacy two-heading markup keeps original event names and positions',()=>{
 const f=fixture(),two=f.element(),three=f.element();f.selectors.set('.section2-heading',[two,three]);f.run();f.enter(two,three);
 assert.equal(f.count('home_sec_sec2'),1);assert.equal(f.count('home_sec_sec3'),1);
 assert.equal(f.events.find(e=>e.event==='home_sec_sec2').params.section_index,2);
});
test('script reinjection keeps exactly one observer, timer and reach event',()=>{
 const f=fixture(),two=f.element();f.selectors.set(sec2,[two]);f.run();f.run();f.enter(two);
 assert.equal(f.ios.length,1);assert.equal(f.mos.length,1);assert.equal(f.intervals.length,1);assert.equal(f.count('home_sec_sec2'),1);
});
test('page cache restore resumes dwell without recounting reach or resending flushed seconds',()=>{
 const f=fixture(),two=f.element();f.selectors.set(sec2,[two]);f.run();f.enter(two);f.advance(3000);f.event('pagehide');assert.ok(!f.mos[0].live);
 f.advance(20000);f.event('pageshow',{persisted:true});f.flushFrames();assert.ok(f.mos[0].live);f.advance(2000);f.visibility(true);
 assert.equal(f.count('home_sec_sec2'),1);assert.equal(f.dwell('home_dwell_sec2'),5);assert.equal(f.intervals.length,1);
});
test('sections sharing an ancestor remain distinct observation targets',()=>{
 const f=fixture({pathname:'/services'}),parent=f.element(),cards=['im','sg','di','oc','dt'].map(()=>f.element({parent}));
 ['im','sg','di','oc','dt'].forEach((key,i)=>f.selectors.set('.dept-card_'+key,[cards[i]]));f.run();f.enter(...f.ios[0].targets);
 for(const key of ['im','sg','di','oc','dt'])assert.equal(f.count('services_sec_'+key),1);
 assert.equal(f.ios[0].observeCalls,5);
});
test('all sections can arrive after initialization without MutationObserver via load fallback',()=>{
 const f=fixture({mutationSupport:false});f.run();const two=f.element();f.selectors.set(sec2,[two]);f.event('load');f.flushFrames();f.enter(two);assert.equal(f.count('home_sec_sec2'),1);
});
test('staging and operator exclusion gates remain effective',()=>{
 for(const options of [{hostname:'helixanimalmedicalcenter.webflow.io'},{noMeasure:true}]){const f=fixture(options);f.run();assert.equal(f.ios.length,0);assert.equal(f.events.length,0);}
});
test('late hidden elements do not create dwell before they become visible',()=>{
 const f=fixture(),two=f.element({visible:false});f.run();f.selectors.set(sec2,[two]);f.mutate();f.flushFrames();f.advance(5000);f.enter(two);assert.equal(f.count('home_sec_sec2'),0);
 two.visible=true;two.offsetParent={};f.mutate();f.flushFrames();f.enter(two);f.advance(2000);f.visibility(true);
 assert.equal(f.count('home_sec_sec2'),1);assert.equal(f.dwell('home_dwell_sec2'),2);
});
console.log(`Section measurement regression checks passed: ${passed}. No network or production events.`);
