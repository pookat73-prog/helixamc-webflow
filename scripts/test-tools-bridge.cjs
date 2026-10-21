const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../global/ga-inspector.js'),'utf8');
const bridge=source.split('/* HELIX_TOOLS_BRIDGE_START')[1].split('*/').slice(1).join('*/').split('/* HELIX_TOOLS_BRIDGE_END */')[0];
test('workspace bridge only accepts its exact opening origin/window and strips private parameter values',()=>{
 const sent=[],handlers={},opener={closed:false,postMessage:(message,origin)=>sent.push({message,origin})};
 const context={window:{opener,__helixNoMeasure:true,addEventListener:(name,fn)=>handlers[name]=fn},location:{pathname:'/ilsan'},boxMap:[{target:{label:'전화',event:'cta_call'}}],events:[{name:'cta_call',time:'12:00:00',params:{phone:'private-phone',sid:'private-visitor',email:'private-email'}}],setTimeout};vm.createContext(context);vm.runInContext(bridge,context);
 const req={type:'HELIX_INSPECT_REQUEST',version:1},origin='https://helix-website-control-center.pookat73.workers.dev';
 handlers.message({origin:'https://evil.example',source:opener,data:req});handlers.message({origin,source:{},data:req});assert.equal(sent.length,0);
 handlers.message({origin,source:opener,data:req});assert.equal(sent.length,1);assert.equal(sent[0].origin,origin);assert.equal(sent[0].message.measurementBlocked,true);const text=JSON.stringify(sent[0]);assert.ok(!text.includes('private-'));assert.deepEqual(Array.from(sent[0].message.events[0].keys),['phone','sid','email']);assert.equal(sent[0].message.targets[0].count,1);
});
test('normal visits exit before any bridge or DOM initialization; bridge performs no analytics writes',()=>{assert.ok(!/gtag\(|fetch\(|localStorage|\.cookie|postMessage\([\s\S]*?,\s*['"]\*['"]/.test(bridge));vm.runInNewContext(source,{location:{search:''}});vm.runInNewContext(source,{location:{search:'?ga-inspect=1',hostname:'test.webflow.io'},console:{log(){}}});});
