import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire('/tmp/helix-ci-audit/package.json');const {chromium}=require('playwright');
const puppeteer=require('puppeteer-core');const {startFlow}=await import(pathToFileURL(require.resolve('lighthouse')));
const out='medicine-staging-results';fs.mkdirSync(out,{recursive:true});const summaries=[];
const old='https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6a45e8bd91b794ab174bf80a_%EB%82%B4%EA%B3%BC.jpg';
const newer='https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6ad6b0bad182f0e668c6e9fa_%EB%82%B4%EA%B3%BC-%EC%A0%84%EB%8B%AC%EC%B5%9C%EC%A0%81%ED%99%94-q95-20261019.webp';
for(let run=1;run<=3;run++)for(const variant of (run%2?['baseline','candidate']:['candidate','baseline'])){
 const browser=await puppeteer.launch({executablePath:chromium.executablePath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let replaced=0;const errors=[];
 try{
  const page=await browser.newPage();await page.setRequestInterception(true);
  page.on('request',async request=>{try{if(/\.css(?:\?|$)/.test(request.url())&&request.url().includes('cdn.prod.website-files.com')){const response=await fetch(request.url());let body=await response.text();if(variant==='baseline'){replaced+=body.split(newer).length-1;body=body.split(newer).join(old);}await request.respond({status:response.status,contentType:'text/css',body});}else await request.continue();}catch(e){errors.push(e.message);await request.abort().catch(()=>{});}});
  const flow=await startFlow(page,{name:`Medicine image ${variant} ${run}`,config:{extends:'lighthouse:default',settings:{onlyCategories:['performance']}},flags:{logLevel:'error'}});
  await flow.navigate('https://helixanimalmedicalcenter.webflow.io/services');const result=await flow.createFlowResult();const lhr=result.steps[0].lhr;
  fs.writeFileSync(`${out}/lighthouse-${variant}-${run}.json`,JSON.stringify(lhr));
  const images=(lhr.audits['network-requests']?.details?.items||[]).filter(x=>x.url===old||x.url===newer);
  const expected=variant==='baseline'?old:newer,unwanted=variant==='baseline'?newer:old;
  const validation={restoredRules:replaced,expectedImage:images.some(x=>x.url===expected),unwantedImage:images.some(x=>x.url===unwanted)};
  const record={run,variant,time:lhr.fetchTime,version:lhr.lighthouseVersion,score:lhr.categories.performance.score,settings:lhr.configSettings,environment:lhr.environment,warnings:lhr.runWarnings,runtimeError:lhr.runtimeError,images,validation,errors,metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index','total-byte-weight'].map(k=>[k,lhr.audits[k]?.numericValue]))};
  if(lhr.runtimeError||errors.length||!validation.expectedImage||validation.unwantedImage||(variant==='baseline'&&!replaced))record.failure='Controlled image/network validation failed';summaries.push(record);console.log('LH_PAIR '+JSON.stringify(record));
 }catch(e){summaries.push({run,variant,failure:e.message});console.error(e.stack);}finally{await browser.close();fs.writeFileSync(`${out}/lighthouse-pairs.json`,JSON.stringify(summaries,null,2));}
}
if(summaries.some(x=>x.failure))process.exitCode=1;
