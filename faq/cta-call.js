/* ================================================================
   HELIX AMC — FAQ 하단 CTA '전화 문의하기' → 전화 앱 연결 + GA4 측정
   ================================================================
   대상: FAQ 페이지 맨 아래 CTA 카드(.faq-cta_surface) 안의
         '전화 문의하기' 버튼(Webflow 클래스 FAQ_CTA(call)).

   동작 흐름 (seocho/seocho.js 의 전화 핸들러와 동일 톤):
     1. 클릭 → confirm("02-2135-9119 로 전화 연결하시겠습니까? ...")
     2. 확인 시
        a) 번호를 클립보드에 복사 (실패해도 다음 단계 진행 — 데스크탑 대비)
        b) GA4 event 전송 → event_callback 안에서 tel: 이동 (beacon 보장)
        c) 1000ms 안전 타임아웃 — gtag 실패해도 전화는 무조건 연결
     3. 취소 시: 아무것도 안 함

   ※ 측정 자체는 확인창이 없어도 된다(클릭 시점에 beacon 으로 먼저 쏨).
     확인창을 두는 이유는 (1) 데스크탑에선 tel: 이 아무 동작도 안 해서
     번호 복사가 실질적인 대안이고 (2) 앱 전환 직전에 전송이 확실히
     끝나도록 한 박자 벌어주기 때문. 사이트 전체(서초/응급)와 동일 규약.

   전화번호는 CTA 안에 이미 표시된 숫자(.faq-cta_tel + .faq-cta_tel(Red))
   에서 읽어 합친다 → 02-2135-9 + 119 = 0221359119. 못 읽으면 대표번호로 폴백.

   GA4 이벤트: faq_phone_call
     params: { item_type:'phone_call', page:'faq', branch:'서초',
               section:'faq_cta', device:'mobile'|'desktop', value:'0221359119' }
   (스테이징은 global/ga4-base.js 의 no-op gtag stub 이 조용히 무시)

   디버그: URL 에 ?debug-faq-call=1
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqCtaCallInit) return;
  window.__helixFaqCtaCallInit = true;

  var FALLBACK_DIGITS = '0221359119';   // 대표번호 — CTA 에서 숫자를 못 읽을 때만

  var DEBUG = /[?&]debug-faq-call=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ-CALL]'].concat(Array.prototype.slice.call(arguments)));
  }

  function device() { return window.innerWidth <= 767 ? 'mobile' : 'desktop'; }
  function digitsOnly(s) { return (s || '').replace(/\D+/g, ''); }

  function formatDisplay(d) {
    if (d.length === 10 && d.indexOf('02') === 0) return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6);
    if (d.length === 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    return d;
  }

  /* ── 클립보드 복사 (seocho 핸들러와 동일 폴백 구조) ───────────── */
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) { return false; }
  }
  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
      }
    } catch (e) {}
    return Promise.resolve(fallbackCopy(text));
  }

  /* ── GA4 전송 후 콜백으로 tel: 이동 ──────────────────────────── */
  function trackCall(digits, cb) {
    var params = {
      item_type: 'phone_call',
      page: 'faq',
      branch: '서초',
      section: 'faq_cta',
      device: device(),
      value: digits
    };
    var fired = false;
    function done() { if (fired) return; fired = true; try { cb && cb(); } catch (e) {} }
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        params.event_callback = done;
        window.gtag('event', 'faq_phone_call', params);
        setTimeout(done, 1000);       // gtag callback 누락 대비 안전 타임아웃
        log('gtag sent', params);
        return;
      }
      if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        var dl = {};
        for (var k in params) { if (params.hasOwnProperty(k) && k !== 'event_callback') dl[k] = params[k]; }
        dl.event = 'faq_phone_call';
        window.dataLayer.push(dl);
        log('dataLayer pushed', dl);
      }
    } catch (e) { log('track error', e); }
    setTimeout(done, 0);              // gtag 없거나 실패 → 즉시 진행
  }

  /* ── CTA 카드 / 버튼 / 번호 찾기 ─────────────────────────────
     Webflow 가 클래스명을 변환(대소문자·괄호)할 수 있어 클래스는 느슨하게
     보고, 최종 판별은 버튼 글자('전화 문의')로 한다. */
  function ctaRoot() {
    return document.querySelector('[class*="faq-cta_surface" i]');
  }

  function readDigits(root) {
    var parts = root ? root.querySelectorAll('[class*="faq-cta_tel" i]') : [];
    var raw = '';
    for (var i = 0; i < parts.length; i++) raw += (parts[i].textContent || '');
    var d = digitsOnly(raw);
    if (d.length >= 9 && d.length <= 11) return d;
    log('CTA 번호 파싱 실패, 대표번호 폴백', raw);
    return FALLBACK_DIGITS;
  }

  function findButton(root) {
    var scope = root || document;
    /* 1순위: 클래스에 faq_cta + call 이 함께 들어간 요소 */
    var byClass = scope.querySelector('[class*="faq_cta" i][class*="call" i]');
    if (byClass) return byClass;
    /* 2순위: 글자가 '전화 문의…' 인 최말단 요소 */
    var all = scope.querySelectorAll('div,a,span,button,p,h1,h2,h3,h4,h5,h6');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length) continue;                       // 텍스트 리프만
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^전화\s*문의/.test(t)) return el;
    }
    return null;
  }

  function bind(btn, digits) {
    if (btn.__helixFaqCallBound) return;
    btn.__helixFaqCallBound = true;

    var pretty = formatDisplay(digits);
    btn.style.cursor = 'pointer';
    if (!btn.getAttribute('role') && btn.tagName !== 'A' && btn.tagName !== 'BUTTON') {
      btn.setAttribute('role', 'button');
    }
    if (!btn.hasAttribute('tabindex') && btn.tagName !== 'A' && btn.tagName !== 'BUTTON') {
      btn.setAttribute('tabindex', '0');
    }
    btn.setAttribute('aria-label', '전화 ' + pretty + ' 로 연결');

    function handler(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      var ok = window.confirm(pretty + ' 로 전화 연결하시겠습니까?\n번호가 자동으로 복사됩니다.');
      if (!ok) { log('사용자 취소'); return; }

      copyText(pretty);
      trackCall(digits, function () {
        log('전화 연결', 'tel:' + digits);
        window.location.href = 'tel:' + digits;
      });
    }

    btn.addEventListener('click', handler);
    btn.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') handler(ev);
    });
    log('bound', pretty, btn);
  }

  function tryBind() {
    var root = ctaRoot();
    var btn = findButton(root);
    if (!btn) return false;
    bind(btn, readDigits(root));
    return true;
  }

  function start() {
    if (tryBind()) return;
    /* 늦게 렌더되는 경우 대비 — 0.5초 간격 최대 6초 재시도 */
    var n = 0;
    var iv = setInterval(function () {
      if (tryBind() || ++n >= 12) clearInterval(iv);
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
