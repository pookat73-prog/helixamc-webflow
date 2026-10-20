import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../global/floating-cta.js',import.meta.url),'utf8');
const start=source.indexOf("  document.addEventListener('keydown', function (e) {");
const end=source.indexOf('  /* ── 페이지 식별',start);
assert.ok(start>=0&&end>start,'actual keyboard handler exists');
const successStart=source.indexOf('  function onSubmitSuccess() {');
const successEnd=source.indexOf('  } // end run()',successStart);
assert.ok(successStart>=0&&successEnd>successStart,'actual completion handler exists');

function fixture(){
 const document={activeElement:null,addEventListener(name,handler){assert.equal(name,'keydown');this.keydown=handler;}};
 const control=(name)=>({name,disabled:false,tabIndex:0,visible:true,visibility:'visible',focus(){document.activeElement=this;},getClientRects(){return this.visible?[{}]:[];}});
 const first=control('close'),middle=control('input'),last=control('submit'),doneClose=control('done-close'),outside=control('page-link');
 doneClose.visible=false;const controls=[first,middle,last,doneClose];let open=true,closed=0;
 const modal={classList:{contains(){return open;}},querySelectorAll(){return controls;}};
 const form={style:{display:''}};
 const context={document,window:{getComputedStyle:el=>({visibility:el.visibility})},modal,closeBtn:first,doneClose,form,done:{classList:{add(){doneClose.visible=true;middle.visible=false;last.visible=false;}}},formSrc:'floating_cta',ga(){},closeModal(){closed++;open=false;outside.focus();}};
 vm.runInNewContext(source.slice(start,end)+'\n'+source.slice(successStart,successEnd),context);
 const press=(key,shiftKey=false)=>{const event={key,shiftKey,prevented:false,preventDefault(){this.prevented=true;}};document.keydown(event);return event;};
 return {document,context,controls,first,middle,last,doneClose,outside,form,press,setOpen(value){open=value;},get closed(){return closed;}};
}
let checks=0;
function test(name,run){run(fixture());checks++;console.log('PASS '+name);}
test('last Tab wraps to first',f=>{f.last.focus();assert.equal(f.press('Tab').prevented,true);assert.equal(f.document.activeElement,f.first);});
test('first Shift Tab wraps to last',f=>{f.first.focus();assert.equal(f.press('Tab',true).prevented,true);assert.equal(f.document.activeElement,f.last);});
test('middle Tab retains native behavior',f=>{f.middle.focus();assert.equal(f.press('Tab').prevented,false);assert.equal(f.document.activeElement,f.middle);});
test('outside focus enters modal',f=>{f.outside.focus();f.press('Tab');assert.equal(f.document.activeElement,f.first);});
test('outside reverse Tab enters final control',f=>{f.outside.focus();f.press('Tab',true);assert.equal(f.document.activeElement,f.last);});
test('disabled controls are skipped',f=>{f.last.disabled=true;f.first.focus();f.press('Tab',true);assert.equal(f.document.activeElement,f.middle);});
test('negative tabindex is skipped',f=>{f.last.tabIndex=-1;f.first.focus();f.press('Tab',true);assert.equal(f.document.activeElement,f.middle);});
test('display none controls are skipped',f=>{f.last.visible=false;f.first.focus();f.press('Tab',true);assert.equal(f.document.activeElement,f.middle);});
test('visibility hidden controls are skipped',f=>{f.last.visibility='hidden';f.first.focus();f.press('Tab',true);assert.equal(f.document.activeElement,f.middle);});
test('single visible control stays focused',f=>{f.middle.visible=false;f.last.visible=false;f.first.focus();assert.equal(f.press('Tab').prevented,true);assert.equal(f.document.activeElement,f.first);});
test('closed modal leaves page keyboard alone',f=>{f.setOpen(false);f.outside.focus();assert.equal(f.press('Tab').prevented,false);f.press('Escape');assert.equal(f.closed,0);});
test('Escape closes open modal',f=>{f.first.focus();f.press('Escape');assert.equal(f.closed,1);assert.equal(f.document.activeElement,f.outside);});
test('non-navigation keys remain untouched',f=>{f.middle.focus();assert.equal(f.press('a').prevented,false);assert.equal(f.document.activeElement,f.middle);});
test('success focuses visible confirmation and skips hidden form',f=>{f.last.focus();f.context.onSubmitSuccess();assert.equal(f.form.style.display,'none');assert.equal(f.document.activeElement,f.doneClose);f.press('Tab');assert.equal(f.document.activeElement,f.first);f.press('Tab',true);assert.equal(f.document.activeElement,f.doneClose);});
test('late success never takes focus from closed page',f=>{f.setOpen(false);f.outside.focus();f.context.onSubmitSuccess();assert.equal(f.document.activeElement,f.outside);});
console.log(`All floating CTA focus tests passed (${checks} scenarios).`);
