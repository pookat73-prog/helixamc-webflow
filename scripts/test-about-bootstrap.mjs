import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../about/bootstrap.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function fixture({cached, fresh=false, initialized=true}={}) {
  const added=[],requests=[],properties={},timers=new Map();let timerId=0,now=100000000;
  const image=(hero,rect)=>({loading:'lazy',matches:()=>hero,getBoundingClientRect:()=>rect,setAttribute(k,v){this[k]=v;}});
  const images=[image(true,{width:0,height:0,top:0,bottom:0}),image(false,{width:0,height:0,top:0,bottom:0}),image(false,{width:100,height:100,top:3000,bottom:3100})];
  const store=new Map(cached?[['helix.sha.main',JSON.stringify({sha:cached,t:now-700000})]]:[]);
  const document={readyState:'complete',head:{appendChild(el){added.push(el);}},documentElement:{style:{setProperty(k,v){properties[k]=v;}}},createElement:tag=>({tag,style:{}}),querySelector:()=>null,querySelectorAll:sel=>sel==='img'?images:[],addEventListener(){}};
  const context={document,location:{hostname:'helix-amc.com',search:fresh?'?fresh=1':''},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console:{log(){},warn(){}},MutationObserver:class{observe(){}disconnect(){}},AbortController,Date:class extends Date{static now(){return now;}},setTimeout(fn,ms){timers.set(++timerId,{fn,at:now+ms});return timerId;},clearTimeout:id=>timers.delete(id),fetch(url,options){return new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));}};
  context.window=context;context.innerHeight=900;context.addEventListener=()=>{};
  if(initialized)for(const name of ['__helixGateInit','__helixGA4Init','__helixSessionInit','__helixSheetLogInit'])context[name]=true;
  vm.runInNewContext(source,context);
  return {context,added,requests,images,properties,store,async tick(ms){now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn();}await flush();}};
}
{
  const f=fixture({cached:'aaaaaaaaaa',fresh:true});
  assert(f.added.some(e=>e.id==='helix-about-initial-layout'&&e.textContent.includes('#cert{display:block!important}')));
  assert.equal(f.images[0].loading,'eager');assert.equal(f.images[1].loading,'lazy');assert.equal(f.images[2].loading,'lazy');
  await f.tick(2500);assert.equal(f.context.HELIX_REF,'aaaaaaaaaa');
  const scripts=f.added.filter(e=>e.tag==='script').map(e=>e.src);
  assert(scripts.some(s=>s.includes('@aaaaaaaaaa/about/about.js')));
  assert(!scripts.some(s=>/global\/(ga4-base|measure-gate|session|sheet-log)\.js/.test(s)));
  assert(scripts.findIndex(s=>s.includes('about/about.js'))<scripts.findIndex(s=>s.includes('ga-inspector.js')));
  assert.equal(f.added.find(e=>e.src?.includes('ScrollTrigger')).async,true);
  const before=f.added.length;f.requests[0].resolve({ok:true,json:async()=>({object:{sha:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'}})});await flush();
  assert.equal(f.added.length,before,'late API response must not load a second version');
  assert.equal(f.context.HELIX_REF,'aaaaaaaaaa');
  console.log('✓ stalled version API: initial layout, cached fallback, one version, priority order, initialized-module dedup, hidden image priority');
}
{
 const f=fixture({fresh:true,initialized:false});f.requests[0].reject(new Error('offline'));await flush();
 assert.equal(f.context.HELIX_REF,'main');assert(f.added.some(e=>e.src?.includes('@main/global/measure-gate.js')));
 console.log('✓ first visit offline: branch fallback and missing measurement modules retained');
}
{
 const f=fixture({cached:'aaaaaaaaaa',fresh:true});f.requests[0].resolve({ok:true,json:async()=>({object:{sha:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'}})});await flush();await f.tick(3000);
 assert.equal(f.context.HELIX_REF,'bbbbbbbbbb');
 assert(f.properties['--helix-cat-mark'].includes('@bbbbbbbbbb/'));
 assert(f.added.filter(e=>e.src?.includes('/about/about.js')).length===1);
 console.log('✓ fresh version success: immutable asset addresses and timeout cancellation');
}
console.log('About bootstrap failure-path checks passed');
