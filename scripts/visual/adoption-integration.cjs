#!/usr/bin/env node
// A single stop-on-failure run: unchanged selected25 suite, then actual delivery candidates.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync,execFileSync}=require('node:child_process');
const {repo}=require('./runtime.cjs');
const out=process.env.HELIX_ADOPTION_INTEGRATION_OUTPUT;
assert.ok(out && process.env.HELIX_ADOPTION_INPUTROOT && process.env.HELIX_ADOPTION_PROFILE);
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim(),'','Freeze a clean separate work copy');
fs.mkdirSync(out,{recursive:true});
const result={source:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),pass:false,stages:[]};
const stages=[{name:'previous25',file:'next-integration.cjs',env:{HELIX_INTEGRATION_OUTPUT:path.join(out,'previous25')}},...['production','staging'].map(target=>({name:'actual-assets-'+target,file:'adoption-assets.cjs',env:{HELIX_VISUAL_TARGET:target,HELIX_VISUAL_RECORD:'0',HELIX_ADOPTION_OUTPUT:path.join(out,'actual-assets-'+target)}}))];
for(const s of stages){
 const p=spawnSync(process.execPath,[path.join(repo,'scripts/visual',s.file)],{cwd:repo,env:{...process.env,...s.env},encoding:'utf8',maxBuffer:16*1024*1024});
 fs.writeFileSync(path.join(out,s.name+'.log'),(p.stdout||'')+(p.stderr||''));
 result.stages.push({name:s.name,exit:p.status,error:p.error?.message||null});
 if(s.name.startsWith('actual-assets-') && p.status===0){const report=JSON.parse(fs.readFileSync(path.join(out,s.name,'results.json')));result.stages.at(-1).coverageComplete=report.pass;result.stages.at(-1).unavailableOriginal=report.unavailableOriginal||[];}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(s.name,p.status===0?'PASS':'FAIL');
 if(p.status!==0||p.error){process.exitCode=1;break;}
}
if(result.stages.length===stages.length&&result.stages.every(s=>s.exit===0)){result.verifiedContractsPass=true;result.pass=result.stages.every(s=>s.coverageComplete!==false);result.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));}
