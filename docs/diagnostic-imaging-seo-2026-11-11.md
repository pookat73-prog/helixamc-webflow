# 영상의학과 개설 SEO

## 작업 개요

의료진 감수가 완료된 `/diagnostic-imaging`의 검색·공유 설정, 구조화 데이터와 진료과목 진입 링크를 보완한다. 감수된 본문과 디자인은 유지한다.

## 기술적 결정 사항

- Webflow SEO 제목: `영상의학과 · CT·MRI·초음파 | 헬릭스동물메디컬센터`.
- Webflow 검색 설명과 Open Graph 제목·설명을 검사·판독·촬영 및 마취 관리·협진에 맞춰 저장. 기존 페이지의 판독 모니터 이미지를 공유 이미지로 지정.
- WebPage, Service, BreadcrumbList를 연결하고 기존 `https://helix-amc.com/seocho#branch` VeterinaryCare 식별자를 재사용한다. 지점별 검사시간·가격·감수일은 생성하지 않는다.
- 기존 자동 로더 방침 유지. 영상의학과에는 개별 bootstrap이 없으므로 이미 연결된 `global/bootstrap.js`에서 해당 경로에서만 동일 immutable SHA의 스니펫을 읽는다. 모션 설정과 무관하게 작동하고 중복 삽입을 방지한다.
- Webflow 도구의 freeform 코드·이미지 설정 쓰기 기능이 스키마 또는 내부 오류로 지원되지 않았다. head/footer를 덮어쓰지 않고 기존 저장소 로더에서 사진 3장의 빈 alt만 보완한다. 사진 원본과 크기는 유지한다.
- 진료과목 세 가지 반응형 카드의 속성과 자식을 보존하여 실제 `a[href]`로 전환한다. 페이지 이동·새 탭·키보드 탐색을 지원한다. services 구조화 데이터의 상세 URL도 추가한다.
- 신규 스니펫을 기존 워크플로우의 purge와 warm-up 목록 양쪽에 등록한다.
- FAQ 본문에 없는 질문·답변이나 FAQPage 마크업을 추가하지 않는다.

## 현재 상태

- 변경 전: H1 1개, 핵심 본문은 응답 HTML 텍스트, canonical 단일·정상, robots 차단 없음, 사이트맵 포함 확인.
- Webflow 제목·검색 설명·공유 정보 저장 완료. 공개 적용은 해당 도메인 Publish가 필요하다.
- 후보 검증: PC 1440px, 모바일 390px 및 모션 줄이기 환경에서 JSON-LD 단일 삽입, 참조 연결, H1, canonical, 사진 alt, 가로 넘침 없음, 진료과목 카드 이동, 타 페이지 미삽입 확인.
- 브라우저는 이 환경의 CA 저장소를 상속하지 않아 curl의 기존 CA·프록시 설정으로 HTTPS 응답을 검증해 Chromium에 전달했다. TLS 검증을 끄지 않았다. 후보 실행은 변경 파일만 로컬 응답으로 대체한다. 실제 스테이징 실행은 파일 대체 없이 확인한다.

## 다음 단계

staging 반영 후 공개 HTML·실행 결과를 확인한다. main 승격은 사용자의 별도 지시 후 진행한다. 정식 Publish 뒤 Google Search Console과 네이버 서치어드바이저에서 URL 수집·색인 상태를 확인한다. 이 작업에서는 해당 관리도구에 접근하지 않았으며 수집 요청이나 색인 완료를 주장하지 않는다.

## 참고 파일 및 링크

- `/diagnostic-imaging`, `/services`
- `scripts/build-seo.js`, `seo-snippets/diagnostic-imaging.html`
- `global/bootstrap.js`, `services/dept-nav.js`
- `scripts/test-diagnostic-imaging-seo.cjs` (`--candidate` 또는 실제 스테이징 기본 실행)
- Google FAQ 리치 결과 종료: https://developers.google.com/search/updates#deprecating-the-faq-rich-result-feature
