# 의료진 고유 주소 — CMS 없는 정적 페이지

## 현재 상태

- GitHub 변경은 PR #1871로 staging에 병합했다. Webflow에는 `/doctors/` 폴더와 26명 정적 상세 및 서초 내부 링크를 구성하고 .webflow.io에만 게시했다. 운영 게시·Search Console 제출 없음.
- 원본 기준: 운영 main `77ab867f628fe19eb584f7740cc0106e35403f31`의 의료진 데이터. 개인 JSON은 변경하지 않음.
- 공개 목록 26명(방사선사 2명 포함). `_index.json`의 draft와 목록에 없는 파일은 제외.
- 엄하림(draft), 구해인(목록 제외)은 생성하지 않음. 방사선사의 기존 모달 버튼 숨김은 유지.
- 실제 Webflow 페이지 한도, 폴더 경로 생성, 대표 도메인, 운영 HTTP 응답·robots·사이트맵·원본/렌더링 비교는 게시 전 확인 필요.
- main/staging이 갈라져 있으므로 전체 staging을 이번 작업으로 운영 승격하지 않는다. 다른 작업·의료진 정보 변경을 별도 검토한다.

## 스테이징 적용 기록 (2026-10-21)

- PR: https://github.com/pookat73-prog/helixamc-webflow/pull/1871 (staging 병합 `5b2343f7d1ace5b464e0f85a71031af8c1b36ccf`). 운영 main은 미변경.
- 상세 페이지 자산은 동일 트리의 `c62807530a21b52559ceee1d10e09d356f4b667d`로 고정했다. 기존 staging의 내과·입력 포커스·workflow 설정을 보존했다.
- Webflow WHTML 가져오기가 CSS 클래스와 관리 자산에 없는 사진 주소를 누락했다. 원문을 보존하기 위해 각 정적 페이지의 footer freeform에 생성 HTML 본문을 그대로 저장했다. 이는 Webflow가 응답 HTML에 포함하는 정적 코드이며, JS 실행/클릭/fetch로 본문을 만들지 않는다. 사용자가 코드를 붙여넣거나 이력을 이중 관리하지 않는다.
- 26명 모두 저장된 footer를 다시 읽어 생성 본문과 글자 단위로 일치함을 확인했다. head의 noindex·대표 주소 후보·고정 SHA도 26명 모두 확인했다. 이는 저장 상태 검사이며 실제 게시 응답 검증과 구분한다.
- 서초 데스크톱/모바일 의료진 섹션 다음에 일반 링크 목록 1개를 삽입하고 원본 순서대로 26개 목적 주소를 확인했다. 카드 템플릿·분과·배열은 수정하지 않았다.
- 모든 상세 페이지에 `noindex, nofollow`를 명시했다. 운영 승인 후 별도 제거 전까지 검색 수집 허용 완료로 보고하지 않는다.
- 공용 head에 저장소 밖 Google/Meta/TikTok 추적이 있다. stage 도메인에서 차단하는 전체 head 교체가 자동 승인 검토에 의해 거절되어 실행하지 않았다. 기존 공용 head는 유지한다. 저장소 측정 게이트만으로 공용 head까지 차단된다고 보고하지 않는다.
- 26명 페이지의 `draft:false`는 최초 자동 승인 검토에서 거절됐으나, 사용자에게 향후 전체 운영 Publish에 포함될 수 있음을 설명하고 명시적 추가 승인을 받아 적용했다.
- `customDomains: []`, `publishToWebflowSubdomain: true`로 스테이징만 게시했다. Webflow의 lastPublished/fullSiteCompiledAt이 `2026-10-21T02:36:29.343Z`로 갱신됐다. www/비www 운영 도메인의 게시 시각은 모두 `2026-10-20T00:49:32.807Z`로 그대로임을 확인했다.
- 실제 주소: `https://helixanimalmedicalcenter.webflow.io/doctors/isoyun` 및 `/seocho#medical-team`. 오른쪽 Codex 브라우저에 실제 상세 주소 열기를 요청했다.
- API 재조회에서 26명 경로·고유 제목·게시 대상 상태와 사이트맵 포함 설정을 확인했다. 고정 SHA의 modal.css/modal.js/card-render.js는 실제 CDN HTTP 200이며 로컬 검토 파일과 SHA-256이 같았다.
- 실행 환경의 네트워크 설정 변경 후에도 실제 stage/운영 도메인 접속은 proxy CONNECT 403이다. 공개 HTTP·렌더링·robots/sitemap 검증은 아직 못 했다.
- 페이지 ID·고정 자산·검사 상태·남은 항목은 `docs/doctor-staging-deployment.json`에 기록했다. 이 JSON에는 이력 본문을 복제하지 않는다.

## 관리 원본과 생성

원본은 `seocho/doctors/data/<group>/_index.json`과 `<slug>.json`뿐이다.
`_all.json`은 기존 스크립트가, 상세 HTML은 아래 스크립트가 같은 개인 JSON에서 만든다.
이력 텍스트는 배열 순서·원문을 유지하며 HTML로 안전하게 이스케이프한다. 분과는 현재 Webflow의 표시 순서·명칭에 맞춘다.
빈 섹션은 생략한다. 개인별 세부 진료 정보는 현재 데이터에 없으므로 추정해 쓰지 않는다.

```sh
node scripts/build-doctor-pages.mjs
node scripts/test-doctor-pages.mjs
node scripts/preview-doctor-pages.mjs
```

기본 출력은 `/tmp/helix-doctor-preview/`이며 저장소에 26명 이력을 중복 저장하지 않는다.

| 출력 | 용도 |
|---|---|
| `doctors/<slug>.html` | 최초 응답에 전체 이력이 포함된 로컬 HTML |
| `fragments/<slug>.html` | Webflow 정적 페이지 본문으로 적용할 생성 결과 |
| `fragments/seocho-links.html` | 서초 페이지 원본 HTML에 포함할 일반 내부 링크 목록 |
| `manifest.json` | 경로·제목·대표 주소·본문·head·원본 해시·CMS 미사용 상태 |
| `404.html` | 로컬 404 본문. HTTP 상태는 서버에서 404로 반환 |

원본 변경 후 반드시 재생성한다. 상세 페이지/manifest/fragment의 이력을 수동 편집하지 않는다.
이전 manifest에 있던 생성 페이지와 fragment는 재생성 시 제거하므로 휴직·삭제 대상이 로컬 출력에 남지 않는다.
Webflow에서도 이전/새 manifest의 경로 차이를 확인해 삭제·비공개 대상을 반영해야 한다.

## 링크와 기존 모달

- 카드의 `href`는 `/doctors/<slug>`이며 일반 클릭은 기존 모달을 연다.
- Ctrl/Cmd/Shift/Alt 클릭, 중간 버튼, 새 창·다운로드 링크는 가로채지 않는다.
- 모달의 ‘전체 이력 페이지 보기’는 일반 링크다. 클릭해 이동하며 페이지뷰를 별도로 만들지 않는다.
- 상세 페이지의 상·하단 링크는 `/seocho#medical-team`으로 돌아간다.
- `seocho-links.html`의 nav에 `id="medical-team"`이 있다. 삽입 전 같은 id의 존재를 확인하고 중복하지 않는다.
- 내부 링크 목록은 Webflow 본문에 실제로 삽입한다. JS로만 생성하거나 head의 숨김 텍스트로 대체하지 않는다.
- 모달·상세 페이지 모두 기존 `modal.css`를 사용한다. 기존 modal 스타일은 유지하고 독립 페이지 전용 클래스만 추가했다.
- 새 런타임 파일·라이브러리·프레임워크·CMS는 없다. 기존 파일은 이미 CDN purge/warm-up 대상이다.

## 측정 정의

| 지표 | 이벤트/기준 | 해석 |
|---|---|---|
| 모달 선택 | `seocho_doctor_detail_desktop/mobile` | 기존 의미인 클릭/열기 요청. 본문 표시 성공 보장이 아님 |
| 전체 이력 이동 선택 | `doctor_full_history_click` | 모달 안 링크 클릭. 도착 성공/페이지뷰에 합산하지 않음 |
| 상세 페이지 조회 | GA4 기본 `page_view`, `/doctors/` 경로 필터 | GA4 조회수 보고의 기준 |
| 자체 방문 로그 | `doctor_page_view` | 기존 시트용 페이지 열림. GA4 기본 페이지뷰와 더하지 않음 |
| 상세 스크롤·체류 | `doctor_scroll_depth`, `doctor_time_on_page` | 조회수와 합산하지 않음 |

`doctor_page_view`에는 page=doctor, view_type=page, slug, doctor, group, branch가 있다.
모달 이벤트는 기존 이름·파라미터를 유지한다. 새 탭 선택은 모달 이벤트가 아니다.
GA4와 시트는 같은 행동의 별도 수집처이므로 두 저장소의 건수도 합산하지 않는다.
스테이징 측정 차단과 운영자 제외는 유지한다. 새 링크 이벤트는 정식 도메인에서만 실행한다.
새 맞춤 측정기준의 GA4 등록 여부와 실제 수신은 운영 승인 후 확인한다.
일산 인스타그램 버튼 계측 수정은 이 작업에 포함하지 않는다.

## 로컬 검증 환경의 한계

검토 서버는 `/seocho`의 의료진 영역과 상세 주소만 제공하며 모든 응답에 `X-Robots-Tag: noindex, nofollow`를 붙인다.
로컬에서는 GA4 로더를 넣지 않는다. 모달 테스트에는 gtag 대체 함수를 사용하며 실제 분석 서버로 전송하지 않는다.
Webflow 읽기 전용 API로 가져온 카드 구조·스타일은 `scripts/fixtures/doctor-preview/`에 있다.
이는 운영 전체 페이지 복제가 아니며, 외부 이미지·폰트와 스타일 변수 일부는 현재 네트워크 환경에서 확인할 수 없다.
fixture가 없는 환경에서는 전체 서초 화면처럼 제시하지 말고, fixture를 읽기 전용 API로 다시 준비한다.

브라우저 검사(기존 환경의 Playwright 사용, 의존성 추가 없음):

```sh
DOCTOR_BROWSER_TEST=1 PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node scripts/test-doctor-pages.mjs
```

전체 26명을 1440px와 390px에서 JS 없이 점검한다. 모달이 있는 24명은 양쪽 폭에서 원본 이력을 대조한다.
직접 접속·새로고침·뒤로 가기·새 탭·반환 링크·없는 주소 404·포커스 복귀·측정 중복을 검사한다.
실제 결과는 `/tmp/helix-doctor-preview/validation.json`에 저장한다. 테스트가 실패하면 통과로 보고하지 않는다.

## 사용자 검토 이후의 적용 절차 — 아직 실행하지 않음

2026-10-21 로컬 검증 결과:

- 정적 검사 4개 그룹 통과(전체 26명 원본·번들 일치, 제목/주소/이력/링크, SHA 자산, 삭제/중복/오류 처리).
- 1440px/390px 각각 전체 26명: JS 비활성 상태의 본문·HTTP 200·제목·canonical·가로 넘침 검사 통과.
- 각 폭에서 24명 모달의 이름·전체 이력·상세 링크를 원본과 대조. 기존 열기 이벤트가 한 선택당 1회임을 확인.
- 실제 로컬 서버에서 새 탭 열기 통과. 가상 운영 도메인의 첫 새 탭 탐색은 브라우저 라우팅 제한이 있어 이 항목만 실제 로컬 주소로 분리해 검사했다.
- 닫기 버튼·ESC·포커스 복귀, 상세 이동·새로고침·뒤로 가기·의료진 안내 복귀 통과.
- 없는 주소/엄하림/구해인/잘못된 하위 경로는 로컬 HTTP 404.
- 전체 이력 이동 클릭 1회, 상세 페이지 자체 로그 1회, 모듈 재주입 중복 없음, 스테이징/운영자 측정 제외 통과. 실제 GA4 전송은 수행하지 않음.
- 저장소 품질 검사 8개 그룹과 기존 섹션 측정 회귀 검사 12개 통과.
- 외부 이미지·폰트·Webflow 원본 전체 화면·운영 응답·검색 설정·실제 이벤트 수신은 미검증.

1. 사용자 로컬 검토를 받는다. 정적 페이지 잔여 한도와 `/doctors/<slug>` 폴더 경로를 읽기 전용으로 확인한다. 요금제 변경 필요 시 실행하지 않는다.
2. 대표 도메인 www 유무와 리디렉션을 실제 응답으로 확인한다. 현재 기본값 `https://helix-amc.com`은 기존 SEO 설정을 따른 후보이며 manifest의 canonicalVerified=false를 유지한다.
3. 승인된 원본을 확정하고 같은 버전의 `_all.json`/정적 본문이 일치하는지 검사한다. staging의 다른 의료진 변경을 무심코 함께 적용하지 않는다.
4. 확정된 자산 커밋 SHA로 `--asset-ref <전체 SHA> --origin <확인한 대표 도메인> --out <출력 폴더>`를 사용해 재생성한다. CSS/기존 분석 스크립트는 해당 SHA의 GitHub/jsDelivr에서 불러온다. 이 명령은 Webflow를 수정하거나 게시하지 않는다.
5. Webflow 정적 폴더·페이지를 준비하고 manifest의 제목·설명을 연결한다. 본문은 WHTML 가져오기의 누락을 피하기 위해 생성 HTML을 page footer freeform에 그대로 저장한다. fetch 후 본문을 만드는 앱 셸이나 CMS 템플릿으로 바꾸지 않는다. Webflow가 title을 생성하므로 head에 title을 중복 삽입하지 않는다. canonical도 하나만 유지한다.
6. 서초 원본 본문에 생성 링크 목록을 한 번만 삽입한다. 기존 카드 템플릿/순서/그룹은 변경하지 않는다. 같은 이름/이력의 수동 사본을 만들지 않는다.
7. 이전 manifest와 비교해 휴직/제외 페이지를 비공개 또는 제거한다. 없는 주소는 Webflow 실제 404로 확인한다. noindex만 붙인 200 페이지로 대체하지 않는다.
8. 스테이징 전용 게시를 진행한다. 기존 미게시 Webflow 작업이 함께 반영되는지 확인한다. 스테이징 검색 제외는 유지하고, 실제 HTML·HTTP·반응형·경로와 자산 SHA를 검사한다.
9. 운영 게시 명시적 승인 후 이번 변경만 운영에 반영한다. main/staging 전체 병합이나 사이트 전체 Publish로 관련 없는 변경을 함께 내보내지 않도록 변경 목록을 검토한다. Webflow 본문과 모달 데이터 반영을 같은 릴리스로 관리하고 실패하면 중단·직전 manifest로 복구한다.
10. 운영에서 원본 HTML/렌더링, 200/404, 고유 title, canonical, robots/noindex/헤더, 사이트맵 26개 경로, 내부 링크, 실제 이벤트 수신을 확인한다. Search Console 제출은 별도 명시적 승인 후 수행한다.

검색 등록 가능한 상태, 실제 색인 생성, 검색 노출·클릭은 서로 다른 단계다. 주소 생성 또는 사이트맵 포함만으로 검색 노출 완료라고 보고하지 않는다.

CDN workflow는 정적 HTML 검토용 artifact를 만들 뿐 Webflow 쓰기/Publish는 수행하지 않는다. 코드 변경은 staging에만 병합했고 Webflow Publish도 운영 도메인을 제외한 스테이징에만 실행했다. 실제 게시 후 전체 HTTP/화면 회귀 검증은 네트워크 제한으로 미완료다.
