#!/usr/bin/env node
// One continuous selected integration run. Stop at the first failure; do not merge old results.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync,execFileSync}=require('node:child_process');
const {repo}=require('./runtime.cjs');
const output=process.env.HELIX_INTEGRATION_OUTPUT||path.join(repo,'.visual-results/next-integration');
const base=process.env.HELIX_INTEGRATION_BASE||'42d432705def71d5486472b4f94aa099ad8d8c31';
const files=['global/bootstrap.js','global/global.css','global/floating-cta.css','home/global/sections-animations.js','home/global/buttons.js','home/global/hamburger.css','home/global/hamburger.js'];
assert.ok(process.env.HELIX_INTERACTION_INPUT,'Supply the immutable current page inputs');
fs.mkdirSync(output,{recursive:true});
for(const f of files){const p=path.join(output,'foundation',f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,execFileSync('git',['show',base+':'+f],{cwd:repo}));}
const common={...process.env,HELIX_VISUAL_OVERLAY_ROOT:repo};
const stages=[
 {name:'integrity',file:'scripts/visual/corpus.cjs',args:['verify'],env:{}},
 {name:'scope',file:'scripts/visual/scope.cjs',env:{HELIX_SCOPE_PATHS:'/,/discover-helix,/services,/faq,/internal-medicine',HELIX_SCOPE_OVERLAY:files.join(','),HELIX_SCOPE_BASE_OVERLAY:files.join(','),HELIX_SCOPE_BASE_ROOT:path.join(output,'foundation'),HELIX_SCOPE_OUTPUT:path.join(output,'scope')}},
 {name:'interactions',file:'scripts/visual/interactions.cjs',env:{HELIX_VISUAL_OVERLAY:files.join(','),HELIX_INTERACTION_WIDTHS:'1440,820,390',HELIX_INTERACTION_TRANSITIONS:'990,991,992,766,767,768,478,479,480,820,1440',HELIX_INTERACTION_OUTPUT:path.join(output,'interactions')}},
 {name:'heading-motion',file:'scripts/visual/heading-lifecycle.cjs',env:{HELIX_STRUCTURE_BASE:'7f4cb178d8b37bbef927f2cd49ea0d5b9e1eab8b',HELIX_LIFECYCLE_VERSIONS:'original,candidate',HELIX_STRUCTURE_OUTPUT:path.join(output,'motion')}},
 {name:'cta-gap',file:'scripts/visual/cta-copy-gap.cjs',env:{HELIX_STRUCTURE_BASE:'42d432705def71d5486472b4f94aa099ad8d8c31',HELIX_STRUCTURE_OUTPUT:path.join(output,'cta-gap')}},
 {name:'form-intro',file:'scripts/visual/form-intro-wrap.cjs',env:{HELIX_STRUCTURE_BASE:'21bccd670b1a8d4692f38777abbb4804fbaaf6a5',HELIX_STRUCTURE_PATHS:'/',HELIX_STRUCTURE_WIDTHS:'1440,820,390',HELIX_STRUCTURE_OUTPUT:path.join(output,'form-intro')}},
 {name:'quality',file:'scripts/check-site-quality.mjs',env:{}},
 {name:'home-loading',file:'scripts/test-home-loading.mjs',env:{}},
];
const result={source:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),base,coverage:'One continuous selected integration: five-page closed contracts, home interactions/motion, CTA108/36, home form intro3 pairs, quality/loading. Individual form15/zig12/foreignCSS16 are separate unit runs. Original V0 suite remains failing.',stages:[],pass:false};
for(const s of stages){const p=spawnSync(process.execPath,[path.join(repo,s.file),...(s.args||[])],{cwd:repo,env:{...common,...s.env},encoding:'utf8',maxBuffer:16*1024*1024});fs.writeFileSync(path.join(output,s.name+'.log'),(p.stdout||'')+(p.stderr||''));result.stages.push({name:s.name,exit:p.status,error:p.error?.message||null});fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(result,null,2));console.log(s.name,p.status===0?'PASS':'FAIL');if(p.status!==0||p.error){process.exitCode=1;break;}}
if(result.stages.length===stages.length&&result.stages.every(s=>s.exit===0)){result.pass=true;fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(result,null,2));console.log('PASS next selected structural integration');}
