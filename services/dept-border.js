/* ================================================================
   HELIX AMC — 진료과목(services) 카드 U자 테두리
   기존 Webflow 등록 스크립트 deptUshapeBorder v0.0.30 을 이관.
   services/bootstrap.js 가 로드.

   대상: .dept-card_im / _sg / _di / _dt / _oc, .div-block-263
   각 카드 상/좌/하단에 그라데이션 SVG 라인을 그려 U자 테두리 연출.

   변경점 (원본 대비):
   - 안과(.dept-card_oc) 에 자기 왼쪽 테두리 추가(lg: null → OCL). 원본은
     안과 왼쪽변을 컨테이너(div-block-263) 테두리에서 빌렸는데, 호버로 안과가
     커질 때 dept-nav.js 가 컨테이너 테두리를 숨겨 왼쪽변이 사라지던 문제 →
     안과가 자기 왼쪽변을 갖게 해 스케일과 함께 움직이도록.
   - OCL: 안과 왼쪽 테두리용 세로 그라데이션. 위는 실선 블루, 아래로 갈수록
     투명(alpha 0)하게 풀어져 바닥에서 툭 끊겨 보이지 않게 함(55%→100% 페이드).
   - 컨테이너(div-block-263) 테두리 draw 제거. 안과·치과가 각자 자기 테두리를
     갖게 되어 중복이고, 호버로 카드가 커질 때 자기 테두리(이동)와 컨테이너
     테두리(고정)가 두 줄로 보이는 잔상의 원인이었음. 컨테이너 SH 그림자는 유지.
   - 카드 z-index(tz) 1→0. 카드가 각자 stacking context 를 만들면 화살표 버튼이
     "다른 카드"의 겹침 그림자(z-index 15) 밑에 갇혀 어둡게 묻혔음. z-index 를
     걷어내면(층 순서는 DOM 순서로 동일 유지) 화살표(z-index 16)가 그림자(15)를
     전역에서 이기고, 이미지(0)는 그림자 밑이라 어두워지는 효과는 유지됨.

   태블릿(768~991) 한정 변경 (초기 버전):
   - 내과(im)·외과(sg) 도 이 뷰에서만 안과(oc) 와 동일하게 밑변 없는 역ㄱ자
     (위+왼쪽) + 왼쪽변 하단 페이드(OCL) 로 그린다. 데스크탑/모바일은 그대로
     ㄷ자(FULL, 위+왼쪽+밑변) 유지.
   - 안과처럼 어두운 드리움 그림자(SH)를 내과=바닥('bo'), 외과=바닥('bo')+
     오른쪽('ri')에 추가(기본 그라데이션). SH 에 바닥 방향('bo') 지원 추가.
   - R() 이 resize 마다 재실행되므로 뷰 경계를 넘나들면 자동 재그림.

   가로모바일(landscape mobile) 한정 변경:
   - 카드별 테두리 모양을 나눠 그린다:
       · 내과(im)·외과(sg)·영상의학과(di) → 역ㄱ자(OCL): 밑변 없음 + 왼쪽 세로선이
         아래로 갈수록 투명(하단 페이드). 사용자 지정 최종 룩.
       · 안과(oc)·치과(dt) → ㄷ자(FULL, 위+왼쪽+밑변 실선). 두 카드 통일.
     데스크탑/태블릿은 기존 규칙(안과만 OCL, 나머지 FULL) 그대로 유지.
     판정 기준은 landscape-mobile.js 와 동일하게 "가로 방향 + 높이 ≤500 + 폭 ≤767"
     (LSMOB). resize/orientationchange 로 뷰가 바뀌면 R() 재실행되어 자동 전환.

   세로모바일(portrait mobile) 한정 변경:
   - 치과(dt) 제외 전부(내·외·영·안) 역ㄱ자(OCL: 밑변 없음 + 왼쪽 세로선 하단
     페이드). 치과만 ㄷ자(FULL). 안과는 세로모바일에서 LSMOB 이 아니라 기본 else
     로 이미 OCL 이 되므로 별도 처리 불필요. 판정: "세로 방향 + 폭 ≤767" (PMOB).

   모바일(세로/가로) 가로선 — 카드 폭 끝까지 + 끝에서만 고정 길이 페이드:
   - 카드마다 폭이 달라도 가로선(위/아래)을 각 카드 폭 끝까지 그린다. 넓은 카드도
     선이 꽉 차 "많이 보임". 왼쪽 cyan 팁은 고정 길이(CY px), 오른쪽 끝 페이드도
     고정 길이(FT px)로 일정 → 카드 폭이 달라도 사라지는 모양이 동일.
   - 즉 "동일 길이"가 아니라 "동일한 끝처리(고정 CY 팁 + 고정 FT 꼬리)". 이전의
     최소폭(HL) 통일 방식은 넓은 카드 선이 너무 짧아 폐기.
   - MOB(=PMOB||LSMOB) 에서만 적용(hl 플래그). 데스크탑/태블릿은 기존 전체폭+선형
     페이드 유지.
   - 영상의학과(di) 카드 높이: 가로모바일에서 services.css 가 사진 제거 후
     텍스트 높이로 접어(height:auto) 내·외과보다 짧아 보이던 문제 → LSMOB 일 때
     내과(im)(없으면 외과 sg) 카드의 실측 높이를 인라인 !important 로 복사해
     내·외과와 동일 높이로 맞춤. 그 외 뷰는 인라인 해제로 services.css 복원.
     높이 변경을 A() 테두리 재그림 전에 수행해 테두리가 바뀐 높이로 그려짐.
   ================================================================ */
(function(){var NS='http://www.w3.org/2000/svg',SKY='#7dd3fc',BLU='#0075d6',SW=3,K=0.3,CY=44,FT=70;function E(t,a){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);return e}function G(id,x1,y1,x2,y2,sts){var g=E('linearGradient',{id:id,gradientUnits:'userSpaceOnUse',x1:x1,y1:y1,x2:x2,y2:y2});sts.forEach(function(s){g.appendChild(E('stop',{offset:s[0],'stop-color':s[1],'stop-opacity':s[2]}))});return g}function P(d,gid,solid){var at={d:d,fill:'none','stroke-width':SW,'stroke-linecap':'round','stroke-linejoin':'round'};at.stroke=solid?BLU:('url(#'+gid+')');return E('path',at)}function B(el,a,tz,nb,lg,co,bf,hl){Array.from(el.children).forEach(function(c){if(c.getAttribute&&c.getAttribute('data-hx-u'))c.remove()});if(getComputedStyle(el).position==='static')el.style.position='relative';if(tz)el.style.zIndex='11';var cs=getComputedStyle(el),w=el.clientWidth,h=el.clientHeight,o=SW/2;if(!w||!h)return;var rT=parseFloat(cs.borderTopLeftRadius)||0,rB=parseFloat(cs.borderBottomLeftRadius)||0,tT=Math.max(rT,o),tB=Math.max(rB,o);var u='u'+Math.random().toString(36).slice(2,7);var s=E('svg',{viewBox:'0 0 '+w+' '+h,width:w,height:h,fill:'none'});s.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:20';var tstops,bstops;if(hl){/* 모바일: 선은 카드 폭 끝까지, 끝에서만 고정 길이(FT px)로 페이드. 왼쪽 cyan 팁도 고정 길이(CY px) */var _ts=w-tT,_bs=w-tB;var _cf=Math.min(CY/_ts,0.45),_tf=Math.max(_cf+0.04,(_ts-FT)/_ts),_bf2=Math.max(0.5,(_bs-FT)/_bs);tstops=[[0,SKY,1],[_cf,BLU,1],[_tf,BLU,1],[1,BLU,a]];bstops=[[0,BLU,1],[_bf2,BLU,1],[1,BLU,a]]}else{tstops=bf?[[0,SKY,1],[K,BLU,1],[bf,BLU,1],[1,BLU,a]]:[[0,SKY,1],[K,BLU,1],[1,BLU,a]];bstops=bf?[[0,BLU,1],[bf,BLU,1],[1,BLU,a]]:[[0,BLU,1],[1,BLU,a]]}var d=E('defs');d.appendChild(G(u+'t',tT,0,w,0,tstops));if(lg&&!co)d.appendChild(G(u+'l',0,0,0,h,lg));if(!nb)d.appendChild(G(u+'b',tB,h,w,h,bstops));s.appendChild(d);s.appendChild(P('M '+tT+' '+o+' L '+w+' '+o,u+'t'));if(co){if(rT>o)s.appendChild(P('M '+tT+' '+o+' A '+(rT-o)+' '+(rT-o)+' 0 0 0 '+o+' '+rT,null,true))}else if(lg){var lp='M '+tT+' '+o;lp+=rT>o?' A '+(rT-o)+' '+(rT-o)+' 0 0 0 '+o+' '+rT:' L '+o+' '+o;lp+=' L '+o+' '+(rB>o?h-rB:h-o);lp+=rB>o?' A '+(rB-o)+' '+(rB-o)+' 0 0 0 '+tB+' '+(h-o):' L '+tB+' '+(h-o);s.appendChild(P(lp,u+'l'))}if(!nb)s.appendChild(P('M '+tB+' '+(h-o)+' L '+w+' '+(h-o),u+'b'));s.setAttribute('data-hx-u','1');el.appendChild(s)}function A(sel,a,tz,nb,lg,co,bf,hl){document.querySelectorAll(sel).forEach(function(el){B(el,a,tz,nb,lg,co,bf,hl)})}function SH(sel,dir){var attr='data-hx-sh-'+(dir||'l');document.querySelectorAll(sel).forEach(function(el){var old=el.querySelector('['+attr+']');if(old)old.remove();if(getComputedStyle(el).position==='static')el.style.position='relative';var w=el.clientWidth,h=el.clientHeight,reach=w*0.6,reachV=h*0.6;var sh=document.createElement('div');sh.setAttribute(attr,'1');var css='position:absolute;pointer-events:none;z-index:15;';if(dir==='bo'){/* 바닥 드리움: 바닥변이 가장 어둡고 위로 갈수록 투명 */var gradB='linear-gradient(to top, rgba(13,17,23,1) 0%, rgba(13,17,23,1) 5%, rgba(13,17,23,0) 55%, rgba(13,17,23,0) 100%)';css+='left:0;bottom:0;width:100%;height:'+reachV+'px;background:'+gradB+';'}else{var grad='linear-gradient(to left, rgba(13,17,23,1) 0%, rgba(13,17,23,1) 5%, rgba(13,17,23,0) 55%, rgba(13,17,23,0) 100%)';css+='top:0;width:'+reach+'px;height:100%;background:'+grad+';';css+=(dir==='ri')?'right:0':'left:-'+reach+'px'}sh.style.cssText=css;el.appendChild(sh)})}
/* SEAM — 세로로 쌓인 카드 사이에 그림자를 얹어 '위 카드가 아래 카드를 덮은' 겹침 느낌.
   진료과목은 브레이크포인트별 카드 덱이 여러 개(데스크탑/태블릿/모바일)라 어느 덱이 보이는지
   코드로 단정하기 어렵다 → '실제로 렌더되는(크기 있는) 카드'만 측정(위 vis() 와 동일 원리)해서,
   같은 열에서 바로 위에 카드가 있는 카드의 top 에 그림자를 얹는다(가로로 나란한 데스크탑 뷰는
   세로 인접이 없어 자동 제외). 모바일(≤767)에서만 동작. z-index 14 로 이미지 위, 테두리(20)/드리움(15) 밑. */
function SEAM(){Array.prototype.forEach.call(document.querySelectorAll('[data-hx-seam],[data-hx-rdark]'),function(n){n.remove()});if(window.innerWidth>767)return;var cards=Array.prototype.slice.call(document.querySelectorAll('[class*="dept-card_"]')).filter(function(el){var r=el.getBoundingClientRect();return el.offsetParent&&r.width>4&&r.height>4});cards.forEach(function(el){var r=el.getBoundingClientRect(),below=null,gap=1e9;cards.forEach(function(o){if(o===el)return;var ro=o.getBoundingClientRect();var ov=Math.min(r.right,ro.right)-Math.max(r.left,ro.left);if(ov<Math.min(r.width,ro.width)*0.4)return;/* 같은 열(수평으로 겹치는) 카드만 위아래로 취급 */var g=ro.top-r.bottom;/* o 가 el 바로 아래면 g≈0 */if(g>=-4&&g<gap){gap=g;below=o}});if(!below)return;/* 아래에 카드가 있는 카드(=내·외·영·안)만 → 맨 아래 치과는 아래 카드가 없어 제외 */if(getComputedStyle(el).position==='static')el.style.position='relative';var sh=document.createElement('div');sh.setAttribute('data-hx-seam','1');/* 각 카드의 바닥에 얹는다: bottom:0 고정으로 그 카드 아래쪽에서 그림자가 시작(아래로 번지지 않음). 완전 어둠 밴드를 0~45% 로 도톰하게 유지 후 위로 소멸. */sh.style.cssText='position:absolute;left:0;bottom:0;width:100%;height:18px;pointer-events:none;z-index:14;background:linear-gradient(to top,rgba(13,17,23,1) 0%,rgba(13,17,23,1) 45%,rgba(13,17,23,.5) 75%,rgba(13,17,23,0) 100%)';el.appendChild(sh)});/* 오른쪽 어둠 — 모든 카드(치과 포함)가 어둠 속에서 등장하는 느낌: 오른쪽 끝이 가장 어둡고 왼쪽으로 갈수록 투명. z-index 13 로 이미지 위·바닥그림자(14) 밑. */cards.forEach(function(el){if(getComputedStyle(el).position==='static')el.style.position='relative';var rd=document.createElement('div');rd.setAttribute('data-hx-rdark','1');rd.style.cssText='position:absolute;top:0;right:0;height:100%;width:42%;pointer-events:none;z-index:13;background:linear-gradient(to right,rgba(13,17,23,0) 0%,rgba(13,17,23,.4) 62%,rgba(13,17,23,1) 100%)';el.appendChild(rd)})}
function R(){var FULL=[[0,SKY,1],[K,BLU,1],[1,BLU,1]];var FADE=[[0,SKY,1],[K,BLU,1],[0.4,BLU,1],[0.5,BLU,0.2]];var OCL=[[0,SKY,1],[K,BLU,1],[0.55,BLU,1],[1,BLU,0]];var TAB=window.innerWidth>=768&&window.innerWidth<=991;/* 가로모바일: landscape-mobile.js 와 동일 기준(가로 방향 + 높이 ≤500 + ≤767). 이 뷰에서만 안과를 치과와 동일한 ㄷ자(FULL, 밑변 있는 실선)로 그림 */var LSMOB=window.matchMedia('(orientation: landscape)').matches&&window.innerHeight<=500&&window.innerWidth<=767;/* 세로모바일: 세로 방향 + 폭 ≤767. 이 뷰에선 치과 제외 전부 역ㄱ자(OCL) */var PMOB=window.matchMedia('(orientation: portrait)').matches&&window.innerWidth<=767;/* 가로모바일: 영상의학과(di) 카드 높이를 내과(im)(없으면 외과 sg) 카드에 맞춰 복사. services.css 가 세로폰용으로 걸어둔 height:auto(텍스트 높이로 접힘) 를 인라인 !important 로 이겨 내외과와 동일 높이로. 그 외 뷰에선 인라인 해제해 services.css 규칙 복원. 높이 변경 후 아래 A() 가 이 높이로 테두리를 다시 그림. */(function(){/* 카드 클래스는 숨은 데스크탑 덱(dept-container-dt, 모바일 display:none → width 0)과 보이는 모바일 덱 양쪽에 있음. querySelector 는 숨은 덱을 먼저 잡으므로, 보이는(width>0) 인스턴스만 고른다. */function vis(sel){var r=null;document.querySelectorAll(sel).forEach(function(e){if(e.getBoundingClientRect().width>0)r=e});return r}var di=vis('.dept-card_di'),im=vis('.dept-card_im')||vis('.dept-card_sg');if(!di)return;if(LSMOB&&im){var rh=im.getBoundingClientRect().height;if(rh>0){di.style.setProperty('box-sizing','border-box','important');di.style.setProperty('height',rh+'px','important');di.style.setProperty('min-height',rh+'px','important');di.style.setProperty('align-self','start','important')}}else{di.style.removeProperty('box-sizing');di.style.removeProperty('height');di.style.removeProperty('min-height');di.style.removeProperty('align-self')}if(PMOB){/* 세로모바일(1열): 영상 칸만 justify-self=auto(내용폭) 라 좁게 나옴 → 다른 카드처럼 stretch + 전체폭 강제 */di.style.setProperty('justify-self','stretch','important');di.style.setProperty('width','100%','important');di.style.setProperty('max-width','none','important')}else{di.style.removeProperty('justify-self');di.style.removeProperty('width');di.style.removeProperty('max-width')}})();/* 모바일(세로/가로): 모든 카드의 가로선(위/아래)을 가장 좁은 카드 폭(HL)으로 통일. 카드마다 폭이 달라도 가로선 길이가 같아짐. 페이드는 HFS 지점부터 시작(더 멀리서 풀어짐). 데스크탑/태블릿은 HL=null 로 전체폭 유지. */var MOB=PMOB||LSMOB;var HL=MOB?1:null;if(TAB){/* 태블릿(768~991)만: 내과·외과를 안과처럼 밑변 없는 역ㄱ자 + 왼쪽변 하단 페이드(OCL) + 안과식 드리움 그림자(내과=바닥, 외과=바닥+오른쪽) */A('.dept-card_im,.dept-card_sg',0,0,1,OCL);A('.dept-card_di,.dept-card_dt',0,0,false,FULL);SH('.dept-card_im','bo');SH('.dept-card_sg','bo');SH('.dept-card_sg','ri')}else if(LSMOB){/* 가로모바일: 내·외·영은 역ㄱ자(밑변 없음 + 왼쪽 세로선 하단 페이드 OCL), 치과만 ㄷ자(FULL). 안과는 아래에서 FULL 로 그림. 가로선은 HL 로 통일 */A('.dept-card_im,.dept-card_sg,.dept-card_di',0,0,1,OCL,false,null,HL);A('.dept-card_dt',0,0,false,FULL,false,null,HL)}else if(PMOB){/* 세로모바일: 치과 제외 전부 역ㄱ자(OCL). 안과는 아래 else 에서 OCL 로 그려짐. 가로선은 HL 로 통일 */A('.dept-card_im,.dept-card_sg,.dept-card_di',0,0,1,OCL,false,null,HL);A('.dept-card_dt',0,0,false,FULL,false,null,HL)}else{A('.dept-card_im,.dept-card_sg,.dept-card_di,.dept-card_dt',0,0,false,FULL)}if(LSMOB){/* 가로모바일: 안과도 치과와 동일하게 ㄷ자(밑변 있는 실선). 가로선은 HL 로 통일 */A('.dept-card_oc',0,0,false,FULL,false,null,HL)}else{/* 그 외: 역ㄱ자(OCL). 세로모바일이면 HL 로 통일, 데스크탑/태블릿은 HL=null 로 전체폭 */A('.dept-card_oc',0,0,1,OCL,false,null,HL)}SH('.dept-card_sg');SH('.dept-card_di');SH('.div-block-263');SH('.div-block-263','ri');SEAM()}if(document.readyState!=='loading')R();else document.addEventListener('DOMContentLoaded',R);var T;window.addEventListener('resize',function(){clearTimeout(T);T=setTimeout(R,150)});window.addEventListener('orientationchange',function(){clearTimeout(T);T=setTimeout(R,220)});
/* services.css 가 모바일(≤991px)에서 영상의학과 카드를 텍스트 높이로 접은 뒤
   U자 테두리를 다시 그려야 줄어든 카드에 맞음. CSS 링크 로드/레이아웃 확정
   이후(load) + 안전 지연 재드로우. R 은 기존 테두리를 지우고 다시 그려 멱등. */
window.addEventListener('load',R);setTimeout(R,600)})();
