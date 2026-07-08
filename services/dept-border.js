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
   - 이 뷰에서는 안과(oc) 도 치과(dt) 와 동일하게 ㄷ자(FULL, 위+왼쪽+밑변 실선)
     로 그린다. 데스크탑/세로모바일/태블릿은 기존 역ㄱ자(밑변 없음)+왼쪽변 하단
     페이드(OCL) 그대로 유지. 판정 기준은 landscape-mobile.js 와 동일하게
     "가로 방향 + 높이 ≤500 + 폭 ≤767" (LSMOB). resize/orientationchange 로
     뷰가 바뀌면 R() 재실행되어 자동 전환.
   - 영상의학과(di) 카드 높이: 가로모바일에서 services.css 가 사진 제거 후
     텍스트 높이로 접어(height:auto) 내·외과보다 짧아 보이던 문제 → LSMOB 일 때
     내과(im)(없으면 외과 sg) 카드의 실측 높이를 인라인 !important 로 복사해
     내·외과와 동일 높이로 맞춤. 그 외 뷰는 인라인 해제로 services.css 복원.
     높이 변경을 A() 테두리 재그림 전에 수행해 테두리가 바뀐 높이로 그려짐.
   ================================================================ */
(function(){var NS='http://www.w3.org/2000/svg',SKY='#7dd3fc',BLU='#0075d6',SW=3,K=0.3;function E(t,a){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);return e}function G(id,x1,y1,x2,y2,sts){var g=E('linearGradient',{id:id,gradientUnits:'userSpaceOnUse',x1:x1,y1:y1,x2:x2,y2:y2});sts.forEach(function(s){g.appendChild(E('stop',{offset:s[0],'stop-color':s[1],'stop-opacity':s[2]}))});return g}function P(d,gid,solid){var at={d:d,fill:'none','stroke-width':SW,'stroke-linecap':'round','stroke-linejoin':'round'};at.stroke=solid?BLU:('url(#'+gid+')');return E('path',at)}function B(el,a,tz,nb,lg,co){Array.from(el.children).forEach(function(c){if(c.getAttribute&&c.getAttribute('data-hx-u'))c.remove()});if(getComputedStyle(el).position==='static')el.style.position='relative';if(tz)el.style.zIndex='11';var cs=getComputedStyle(el),w=el.clientWidth,h=el.clientHeight,o=SW/2;if(!w||!h)return;var rT=parseFloat(cs.borderTopLeftRadius)||0,rB=parseFloat(cs.borderBottomLeftRadius)||0,tT=Math.max(rT,o),tB=Math.max(rB,o);var u='u'+Math.random().toString(36).slice(2,7);var s=E('svg',{viewBox:'0 0 '+w+' '+h,width:w,height:h,fill:'none'});s.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:20';var d=E('defs');d.appendChild(G(u+'t',tT,0,w,0,[[0,SKY,1],[K,BLU,1],[1,BLU,a]]));if(lg&&!co)d.appendChild(G(u+'l',0,0,0,h,lg));if(!nb)d.appendChild(G(u+'b',tB,h,w,h,[[0,BLU,1],[1,BLU,a]]));s.appendChild(d);s.appendChild(P('M '+tT+' '+o+' L '+w+' '+o,u+'t'));if(co){if(rT>o)s.appendChild(P('M '+tT+' '+o+' A '+(rT-o)+' '+(rT-o)+' 0 0 0 '+o+' '+rT,null,true))}else if(lg){var lp='M '+tT+' '+o;lp+=rT>o?' A '+(rT-o)+' '+(rT-o)+' 0 0 0 '+o+' '+rT:' L '+o+' '+o;lp+=' L '+o+' '+(rB>o?h-rB:h-o);lp+=rB>o?' A '+(rB-o)+' '+(rB-o)+' 0 0 0 '+tB+' '+(h-o):' L '+tB+' '+(h-o);s.appendChild(P(lp,u+'l'))}if(!nb)s.appendChild(P('M '+tB+' '+(h-o)+' L '+w+' '+(h-o),u+'b'));s.setAttribute('data-hx-u','1');el.appendChild(s)}function A(sel,a,tz,nb,lg,co){document.querySelectorAll(sel).forEach(function(el){B(el,a,tz,nb,lg,co)})}function SH(sel,dir){var attr='data-hx-sh-'+(dir||'l');document.querySelectorAll(sel).forEach(function(el){var old=el.querySelector('['+attr+']');if(old)old.remove();if(getComputedStyle(el).position==='static')el.style.position='relative';var w=el.clientWidth,h=el.clientHeight,reach=w*0.6,reachV=h*0.6;var sh=document.createElement('div');sh.setAttribute(attr,'1');var css='position:absolute;pointer-events:none;z-index:15;';if(dir==='bo'){/* 바닥 드리움: 바닥변이 가장 어둡고 위로 갈수록 투명 */var gradB='linear-gradient(to top, rgba(13,17,23,1) 0%, rgba(13,17,23,1) 5%, rgba(13,17,23,0) 55%, rgba(13,17,23,0) 100%)';css+='left:0;bottom:0;width:100%;height:'+reachV+'px;background:'+gradB+';'}else{var grad='linear-gradient(to left, rgba(13,17,23,1) 0%, rgba(13,17,23,1) 5%, rgba(13,17,23,0) 55%, rgba(13,17,23,0) 100%)';css+='top:0;width:'+reach+'px;height:100%;background:'+grad+';';css+=(dir==='ri')?'right:0':'left:-'+reach+'px'}sh.style.cssText=css;el.appendChild(sh)})}function R(){var FULL=[[0,SKY,1],[K,BLU,1],[1,BLU,1]];var FADE=[[0,SKY,1],[K,BLU,1],[0.4,BLU,1],[0.5,BLU,0.2]];var OCL=[[0,SKY,1],[K,BLU,1],[0.55,BLU,1],[1,BLU,0]];var TAB=window.innerWidth>=768&&window.innerWidth<=991;/* 가로모바일: landscape-mobile.js 와 동일 기준(가로 방향 + 높이 ≤500 + ≤767). 이 뷰에서만 안과를 치과와 동일한 ㄷ자(FULL, 밑변 있는 실선)로 그림 */var LSMOB=window.matchMedia('(orientation: landscape)').matches&&window.innerHeight<=500&&window.innerWidth<=767;/* 가로모바일: 영상의학과(di) 카드 높이를 내과(im)(없으면 외과 sg) 카드에 맞춰 복사. services.css 가 세로폰용으로 걸어둔 height:auto(텍스트 높이로 접힘) 를 인라인 !important 로 이겨 내외과와 동일 높이로. 그 외 뷰에선 인라인 해제해 services.css 규칙 복원. 높이 변경 후 아래 A() 가 이 높이로 테두리를 다시 그림. */(function(){var di=document.querySelector('.dept-card_di'),im=document.querySelector('.dept-card_im')||document.querySelector('.dept-card_sg');if(LSMOB&&di&&im){var rh=im.getBoundingClientRect().height;if(rh>0){di.style.setProperty('box-sizing','border-box','important');di.style.setProperty('height',rh+'px','important');di.style.setProperty('min-height',rh+'px','important');di.style.setProperty('align-self','start','important')}}else if(di){di.style.removeProperty('box-sizing');di.style.removeProperty('height');di.style.removeProperty('min-height');di.style.removeProperty('align-self')}})();if(TAB){/* 태블릿(768~991)만: 내과·외과를 안과처럼 밑변 없는 역ㄱ자 + 왼쪽변 하단 페이드(OCL) + 안과식 드리움 그림자(내과=바닥, 외과=바닥+오른쪽) */A('.dept-card_im,.dept-card_sg',0,0,1,OCL);A('.dept-card_di,.dept-card_dt',0,0,false,FULL);SH('.dept-card_im','bo');SH('.dept-card_sg','bo');SH('.dept-card_sg','ri')}else{A('.dept-card_im,.dept-card_sg,.dept-card_di,.dept-card_dt',0,0,false,FULL)}if(LSMOB){/* 가로모바일: 안과도 치과와 동일하게 ㄷ자(밑변 있는 실선) */A('.dept-card_oc',0,0,false,FULL)}else{/* 그 외(데스크탑/세로모바일/태블릿): 기존 역ㄱ자 + 왼쪽변 페이드 유지 */A('.dept-card_oc',0,0,1,OCL)}SH('.dept-card_sg');SH('.dept-card_di');SH('.div-block-263');SH('.div-block-263','ri')}if(document.readyState!=='loading')R();else document.addEventListener('DOMContentLoaded',R);var T;window.addEventListener('resize',function(){clearTimeout(T);T=setTimeout(R,150)});window.addEventListener('orientationchange',function(){clearTimeout(T);T=setTimeout(R,220)});
/* services.css 가 모바일(≤991px)에서 영상의학과 카드를 텍스트 높이로 접은 뒤
   U자 테두리를 다시 그려야 줄어든 카드에 맞음. CSS 링크 로드/레이아웃 확정
   이후(load) + 안전 지연 재드로우. R 은 기존 테두리를 지우고 다시 그려 멱등. */
window.addEventListener('load',R);setTimeout(R,600)})();
