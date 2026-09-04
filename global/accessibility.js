(function () {
  'use strict';

  if (window.__helixAccessibilityInit) return;
  window.__helixAccessibilityInit = true;

  function pagePath() {
    var p = (location.pathname || '/').toLowerCase();
    return p.length > 1 ? p.replace(/\/$/, '') : p;
  }

  function replaceTag(el, tagName) {
    if (!el || el.tagName.toLowerCase() === tagName) return el;
    var next = document.createElement(tagName);
    for (var i = 0; i < el.attributes.length; i++) {
      next.setAttribute(el.attributes[i].name, el.attributes[i].value);
    }
    while (el.firstChild) next.appendChild(el.firstChild);
    el.parentNode.replaceChild(next, el);
    return next;
  }

  function addServicesHeading() {
    if (document.querySelector('h1')) return;
    var heading = document.createElement('h1');
    heading.textContent = '진료과목';
    heading.setAttribute('data-hx-a11y-heading', 'services');
    heading.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    document.body.insertBefore(heading, document.body.firstChild);
  }

  function fixHeadingStructure(path) {
    if (path === '/services') {
      addServicesHeading();
      return;
    }

    if (path === '/specialty-care' && !document.querySelector('h1')) {
      replaceTag(document.querySelector('h2.spec-title'), 'h1');
      return;
    }

    if (path === '/discover-helix') {
      var duplicateTitles = document.querySelectorAll('h1.about_contents-title');
      for (var i = 0; i < duplicateTitles.length; i++) {
        replaceTag(duplicateTitles[i], 'h2');
      }
    }
  }

  function setAltIfEmpty(img, text) {
    if (img && !(img.getAttribute('alt') || '').trim()) img.setAttribute('alt', text);
  }

  function fixMeaningfulImageText(path) {
    if (path === '/seocho') {
      var images = document.images;
      for (var i = 0; i < images.length; i++) {
        var src = images[i].currentSrc || images[i].src || '';
        if (src.indexOf('Facility%20Cert') !== -1) {
          setAltIfEmpty(images[i], '응급·중환자 진료 시설 인증 배지');
        } else if (src.indexOf('Cat-Friendly-Clinic') !== -1) {
          setAltIfEmpty(images[i], '고양이 친화 병원 골드 등급 인증 배지');
        }
      }
    }

    if (path === '/ilsan') {
      setAltIfEmpty(
        document.querySelector('img.hero15y-logo'),
        '헬릭스동물메디컬센터 일산 분원 15주년 로고'
      );
    }
  }

  function init() {
    var path = pagePath();
    fixHeadingStructure(path);
    fixMeaningfulImageText(path);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
