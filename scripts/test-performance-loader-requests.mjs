import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const paths=['home/bootstrap.js','about/bootstrap.js','seocho/bootstrap.js','services/bootstrap.js','specialty/bootstrap.js','emergency/bootstrap.js','faq/bootstrap.js','internal-medicine/bootstrap.js','services/surgery-bootstrap.js'];
for(const path of paths){
 const s=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');const start=s.indexOf('  function loadFile(');const end=s.indexOf('\n  }',start)+4;const fn=s.slice(start,end);
 function fixture(search='',initialized=true){const requested=[];const c={window:{},location:{search},BRANCH:'staging',OWNER:'pookat73-prog',REPO:'helixamc-webflow',console,cdn:(r,p)=>'https://example.test/@'+r+'/'+p,injectCss:u=>requested.push(u),injectJs:u=>requested.push(u),document:{createElement:()=>({}),head:{appendChild:e=>requested.push(e.src||e.href)}}};if(initialized)for(const k of ['__helixGateInit','__helixGA4Init','__helixSessionInit','__helixSheetLogInit'])c.window[k]=true;vm.runInNewContext(fn,c);return{c,requested};}
 let f=fixture();f.c.loadFile('global/ga-inspector.js','a'.repeat(40));assert.equal(f.requested.length,0,path+' ordinary inspector');
 for(const search of ['?ga-inspect=1','?debug-ga=1']){f=fixture(search);f.c.loadFile('global/ga-inspector.js','a'.repeat(40));assert.equal(f.requested.length,1,path+' debug works');}
 if(path!=='internal-medicine/bootstrap.js')for(const module of ['measure-gate','ga4-base','session','sheet-log']){f=fixture();f.c.loadFile('global/'+module+'.js','a'.repeat(40));assert.equal(f.requested.length,0,path+' initialized');f=fixture('',false);f.c.loadFile('global/'+module+'.js','a'.repeat(40));assert.equal(f.requested.length,1,path+' recover missing');}
 f=fixture();for(const p of ['global/global.css','home/global/hamburger.js','home/global/footer.js'])f.c.loadFile(p,'a'.repeat(40));assert.equal(f.requested.length,3,path+' visual modules retained');console.log('PASS',path);
}
