// 로컬 확인 전용. Webflow·CDN·GA4에 쓰거나 전송하지 않는다.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, ROOT, GROUPS, directory, readDoctors, escape } from './build-doctor-pages.mjs';

export function createPreview({outDir='/tmp/helix-doctor-preview', fixtureDir=join(ROOT,'scripts/fixtures/doctor-preview')} = {}) {
  build({outDir});
  const {doctors} = readDoctors();
  const fixture = name => existsSync(join(fixtureDir,name)) ? readFileSync(join(fixtureDir,name),'utf8') : '';
  function seocho() {
    const groups = GROUPS.map(([group,label]) => `<section class="preview-group"><h2>${escape(label)}</h2><div class="preview-desktop" data-doctor-group="${group}">${fixture('desktop.html')}</div><div class="preview-mobile" data-doctor-group="${group}">${fixture('mobile.html')}</div></section>`).join('');
    // 운영에 복사하지 않는 검토용 외곽. 카드 내부는 읽기 전용 API에서 가져온 구조.
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>서초 의료진 · 로컬 검토본 | 헬릭스</title>
<link rel="stylesheet" href="/__fixture/cards.css"><link rel="stylesheet" href="/seocho/seocho.css"><link rel="stylesheet" href="/seocho/doctors/modal.css">
<style>body{margin:0;background:#f4f7fb;color:#1a2230;font-family:Arial,sans-serif}.preview-shell{width:min(1200px,calc(100% - 40px));margin:32px auto}.preview-notice{font-size:14px;line-height:1.7;border-bottom:1px solid #dce6ee;padding-bottom:20px}.preview-group{margin:44px 0}.preview-desktop{display:flex;flex-wrap:wrap;gap:24px}.preview-mobile{display:none}.preview-group [data-doctor-template]{display:none!important}.preview-desktop>div{max-width:100%}.preview-shell a{color:#0065b8}.preview-shell .link-block-2{cursor:pointer}@media(max-width:767px){.preview-desktop{display:none}.preview-mobile{display:flex;flex-direction:column;gap:20px}.preview-shell{width:calc(100% - 32px)}.preview-group{margin:32px 0}}</style>
</head><body><main class="preview-shell"><p class="preview-notice">로컬 검토본 · 서초 의료진 영역<br>의료진 데이터와 카드 구성은 현재 운영본을 기준으로 합니다. 운영 페이지 전체 레이아웃·이미지 로드·게시 상태는 스테이징에서 추가 확인합니다.</p><h1>서초 본원 의료진</h1>${groups}${directory(doctors)}</main>
<script>window.__helixNoMeasure=true;window.HELIX_REF='local';window.HELIX_DOCTOR_BUNDLE_PROMISE=fetch('/__doctor-bundle').then(function(r){return r.json()});</script><script src="/seocho/doctors/card-render.js"></script><script src="/seocho/doctors/modal.js"></script></body></html>`;
  }
  return http.createServer((req,res) => {
    let path;
    try { path=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400);return res.end(); }
    const send = (status,type,body) => {
      res.writeHead(status,{'Content-Type':type,'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'});
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (path==='/') {res.writeHead(302,{Location:'/seocho'});return res.end();}
    if (path==='/seocho' || path==='/seocho/') return send(200,'text/html; charset=utf-8',seocho());
    if (path==='/__doctor-bundle') {
      const groups={};
      for (const {group,doctor} of doctors) {
        groups[group] ||= {order:[],doctors:{}};
        groups[group].order.push(doctor.slug);groups[group].doctors[doctor.slug]=doctor;
      }
      return send(200,'application/json',JSON.stringify({version:1,groups}));
    }
    const detail = doctors.find(d=>path===d.path || path===d.path+'/');
    if (detail) return send(200,'text/html; charset=utf-8',readFileSync(join(outDir,detail.path.slice(1)+'.html')));
    const fixtures={'/__fixture/cards.css':'cards.css'};
    if (fixtures[path]) return send(200,'text/css',fixture(fixtures[path]));
    const allowed = /^\/(seocho\/doctors\/(modal\.(css|js)|card-render\.js)|seocho\/seocho\.css)$/;
    if (allowed.test(path)) {
      const file=resolve(ROOT,'.'+path);
      if (existsSync(file) && statSync(file).isFile()) return send(200,extname(file)==='.css'?'text/css':'text/javascript',readFileSync(file));
    }
    return send(404,'text/html; charset=utf-8',readFileSync(join(outDir,'404.html')));
  });
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port=Number(process.env.PORT || 4173);
  createPreview().listen(port,'0.0.0.0',()=>console.log(`Local doctor preview: http://localhost:${port}/seocho (no publishing/analytics)`));
}
