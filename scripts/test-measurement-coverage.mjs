import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const files = Object.fromEntries(['measure-gate','ga4-base','session','sheet-log'].map(n => [n, read('global/' + n + '.js')]));
function fixture({path='/seocho',hostname='www.helix-amc.com',search='',embedded=false,beacon=true,offline=false,ipCached=true}={}) {
  let now=1000, next=0;
  const timers=new Map(), listeners={document:{},window:{}}, storage=new Map(), requests=[], scripts=[], beacons=[];
  const on=(surface,type,fn)=>{(listeners[surface][type]??=[]).push(fn);};
  const off=(surface,type,fn)=>{listeners[surface][type]=(listeners[surface][type]||[]).filter(f=>f!==fn);};
  const document={hidden:false,readyState:'loading',cookie:'',referrer:'',currentScript:null,
    querySelector:()=>null, getElementById:()=>null, getElementsByTagName:()=>[{parentNode:{insertBefore(s){scripts.push(s);}}}],
    createElement:()=>({style:{},appendChild(){},setAttribute(){},addEventListener(){}}),
    head:{appendChild(s){scripts.push(s);if(s.onload)queueMicrotask(s.onload);}},
    addEventListener:(t,f)=>on('document',t,f),removeEventListener:(t,f)=>off('document',t,f)};
  const store={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
  if(ipCached)storage.set('helix_sheetlog_internal','0');
  const window={innerWidth:390,addEventListener:(t,f)=>on('window',t,f),removeEventListener:(t,f)=>off('window',t,f)};
  window.self=window;window.top=embedded?{}:window;
  const location={pathname:path,hostname,search,href:'https://'+hostname+path+search};
  const navigator={onLine:!offline,sendBeacon:(url,body)=>{beacons.push({url,body});return beacon;}};
  const context=vm.createContext({window,document,location,navigator,localStorage:store,sessionStorage:store,URL,URLSearchParams,Blob,Response,console,
    Date:class extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}},
    setTimeout:(fn,ms=0)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),
    setInterval:(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms,ms});return id;},clearInterval:id=>timers.delete(id),
    fetch:(url,options)=>{requests.push({url,options});if(url.includes('ipify'))return new Promise(()=>{});return Promise.resolve({ok:true,json:async()=>({object:{sha:'a'.repeat(40)}})});}});
  const run=n=>vm.runInContext(files[n]||read(n),context);
  const fire=(surface,type,event={})=>{for(const fn of [...listeners[surface][type]||[]])fn(event);};
  const advance=ms=>{now+=ms;for(const [id,t]of [...timers])if(t.at<=now){if(t.ms)t.at=now+t.ms;else timers.delete(id);t.fn();}};
  const events=()=>Array.from(window.dataLayer||[]).filter(a=>a[0]==='event').map(a=>({name:a[1],params:a[2]}));
  return {context,window,document,storage,requests,scripts,beacons,run,fire,advance,events,navigator};
}
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
async function settle(){for(let i=0;i<12;i++)await Promise.resolve();}
await test('staging, operator and iframe exclusion replace pre-existing gtag and load no pixels',()=>{
  for(const options of [{hostname:'helixanimalmedicalcenter.webflow.io'},{search:'?helix-noga=1'},{embedded:true}]){
    const f=fixture(options);let calls=0;f.window.gtag=()=>calls++;
    f.run('measure-gate');f.run('ga4-base');f.window.gtag('event','x',{});
    assert.equal(calls,0);assert.equal(f.window.__helixNoMeasure,true);assert.equal(f.scripts.length,0);
  }
});
await test('exclusion also blocks legacy direct phone logging while preserving actual lead writes',async()=>{
  const f=fixture({search:'?helix-noga=1'});let calls=0;
  f.window.fetch=async()=>{calls++;return {ok:true};};f.run('measure-gate');
  const response=await f.window.fetch('https://helixamc-pm-default-rtdb.firebaseio.com/branches/seocho/phone_clicks.json',{method:'POST'});
  assert.equal(response.status,204);assert.equal(calls,0);
  await f.window.fetch('https://helixamc-pm-default-rtdb.firebaseio.com/branches/seocho/leads.json',{method:'POST'});assert.equal(calls,1);
});
await test('every event carries canonical page, device, event id and current version; legacy open is not a conversion',()=>{
  const f=fixture();f.run('ga4-base');f.run('session');
  f.window.gtag('event','seocho_doctor_detail_mobile',{doctor:'의료진',page:'home'});
  f.window.gtag('event','cta_open',{});f.window.gtag('event','cta_form_open',{});
  const [d,old,current]=f.events();assert.equal(d.params.page,'seocho');assert.equal(d.params.device,'mobile');assert.ok(d.params.sid&&d.params.event_id&&d.params.event_ts);
  assert.equal(d.params.measurement_version,'2026-10-21');assert.equal(old.params.conv,0);assert.equal(current.params.conv,1);
});
await test('certificate and doctor direct URLs have canonical page keys',()=>{
  for(const [path,page]of [['/aaha-cert','aaha_cert'],['/cat-cert/','cat_cert'],['/emergency-cert','emergency_cert'],['/doctors/gimtaeseong','doctor']]){
    const f=fixture({path});f.run('ga4-base');assert.equal(f.window.HelixMeasure.page(),page);
  }
});
await test('beacon refusal falls back once; accepted beacon is never resent; zero is preserved',async()=>{
  for(const accepted of [false,true]){
    const f=fixture({beacon:accepted});f.run('ga4-base');f.run('session');f.run('sheet-log');
    f.window.gtag('event','sample',{value:0});await settle();
    assert.equal(f.beacons.length,1);assert.equal(f.requests.filter(r=>r.options?.method==='POST').length,accepted?0:1);
    const payload=JSON.parse(await f.beacons[0].body.text());assert.equal(payload.value,0);assert.ok(payload.params.event_id);
  }
});
await test('offline queue sends once after online and obeys operator exclusion',async()=>{
  const f=fixture({offline:true});f.run('ga4-base');f.run('session');f.run('sheet-log');
  f.window.gtag('event','sample',{});await settle();assert.equal(f.beacons.length,0);
  assert.equal(JSON.parse(f.storage.get('helix_measurement_pending')).length,1);
  f.navigator.onLine=true;f.fire('window','online');await settle();assert.equal(f.beacons.length,1);
  f.fire('window','online');await settle();assert.equal(f.beacons.length,1);
  f.navigator.onLine=false;f.window.gtag('event','second',{});await settle();f.window.__helixNoMeasure=true;f.navigator.onLine=true;f.fire('window','online');await settle();assert.equal(f.beacons.length,1);
});
await test('stalled IP lookup is bounded and still permits the event after 1.5 seconds',async()=>{
  const f=fixture({ipCached:false});f.run('ga4-base');f.run('session');f.run('sheet-log');f.window.gtag('event','sample',{});
  await settle();assert.equal(f.beacons.length,0);f.advance(1500);await settle();assert.equal(f.beacons.length,1);
});
await test('active reading excludes hidden time, resumes after return, and caps idle time',()=>{
  const f=fixture();f.run('ga4-base');const reader=f.window.HelixMeasure.reader('read',{item_type:'read'});
  f.advance(3000);f.document.hidden=true;f.fire('document','visibilitychange');
  f.advance(120000);f.document.hidden=false;f.fire('document','visibilitychange');f.advance(3000);reader.stop();
  assert.equal(f.events().filter(e=>e.name==='read').reduce((n,e)=>n+e.params.read_sec,0),6);
  const idle=f.window.HelixMeasure.reader('idle',{});f.advance(120000);idle.stop();assert.equal(f.events().find(e=>e.name==='idle').params.read_sec,60);
});
await test('uniform click and semantic event share interaction id without recording input values or URL query',()=>{
  const f=fixture();f.run('ga4-base');f.run('session');
  const target={id:'test-control',tagName:'A',textContent:'예약 안내',matches:()=>false,getAttribute:k=>k==='href'?'/seocho?token=DO_NOT_LOG':null,
    closest:s=>s.startsWith('#helix-noga')?null:target};
  f.fire('document','click',{target});f.window.gtag('event','detail_action',{});
  const [click,detail]=f.events();assert.equal(click.name,'ui_click');assert.equal(click.params.conv,0);
  assert.equal(click.params.interaction_id,detail.params.interaction_id);assert.ok(!JSON.stringify(click).includes('DO_NOT_LOG'));
});
await test('FAQ reading ends at tab change rather than counting the newly hidden question',()=>{
  const f=fixture({path:'/faq'});f.run('ga4-base');f.document.readyState='complete';let disease=true;
  const link={classList:{contains:()=>disease}};
  f.document.querySelector=()=>({closest:()=>link});
  f.run('faq/faq-ga.js');
  const item={classList:{contains:()=>true},querySelector:()=>({textContent:'테스트 질문'})};
  const indicator={closest:()=>item};
  f.fire('document','click',{target:{closest:s=>s.includes('helix-faq-indicator')?indicator:null}});f.advance(0);f.advance(2500);
  disease=false;f.fire('document','click',{target:{closest:s=>s==='.w-tab-link'?link:null}});f.advance(0);f.advance(8000);f.fire('window','pagehide');
  const reads=f.events().filter(e=>e.name==='faq_read');assert.equal(reads.length,1);assert.equal(reads[0].params.read_sec,3);
});
await test('site entry loads a pinned fallback in order when GitHub lookup fails',async()=>{
  const f=fixture();f.document.currentScript={src:'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@'+'b'.repeat(40)+'/global/measure-gate.js',hasAttribute:()=>true};
  f.context.fetch=()=>Promise.reject(new Error('offline ref'));f.run('measure-gate');await f.window.__helixMeasurementReady;
  assert.deepEqual(f.scripts.map(s=>s.src.split('/').pop()),['ga4-base.js','session.js','sheet-log.js','scroll-depth.js','page-time.js']);
  assert.ok(f.scripts.every(s=>s.src.includes('@'+'b'.repeat(40))));
});
await test('advertising lead events contain only an opaque event id and respect runtime exclusion',()=>{
  const f=fixture();f.run('ga4-base');f.window.__helixTrackAdsLead('mock-saved-key');
  assert.equal(f.window.fbq.queue.filter(a=>a[1]==='Lead').length,1);assert.equal(f.window.ttq.filter(a=>a[1]==='SubmitForm').length,1);
  f.window.__helixNoMeasure=true;f.window.__helixTrackAdsLead('second');assert.equal(f.window.fbq.queue.filter(a=>a[1]==='Lead').length,1);
});
await test('GA4 parameter limit preserves semantic fields while the raw log retains all context',async()=>{
  const f=fixture();f.run('ga4-base');f.run('session');f.run('sheet-log');
  const params={doctor:'의료진',symptom:'공개 증상 분류',transport_type:'beacon'};
  for(let i=0;i<35;i++)params['extra_'+i]=i;
  f.window.gtag('event','wide_event',params);await settle();
  const measured=f.events().find(e=>e.name==='wide_event');
  assert.equal(Object.keys(measured.params).filter(k=>k!=='transport_type').length,25);
  assert.equal(measured.params.doctor,'의료진');
  const raw=JSON.parse(await f.beacons[0].body.text());assert.equal(raw.params.extra_34,34);assert.ok(raw.params.sid);
});
console.log(`${passed} measurement coverage regression checks passed. All transports mocked.`);
