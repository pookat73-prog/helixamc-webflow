# 의료진 직접 방문 체류 보완 — 2026-10-27

## 1. 작업 개요

기준 main: `1796dd260cc25702e3ba6c3c360feb92f39859ed`.
직접 방문의 `doctor_time_on_page`에 공개 DOM에서 확인한 의료진 식별값을 붙인다.
모달·고유 주소·원고·GA4 기본 조회수 정의·수신 웹앱은 변경하지 않는다.

## 2. 기술적 결정 사항

- `global/page-time.js`: DOM 준비 후 `[data-doctor-detail]`에서 slug, doctor, group, branch를 고정하고 view_type=page, 쿼리/해시 없는 정확한 page_location을 전송한다. 목록 모달은 이 마커가 없어 기존 동작을 유지한다.
- 기존 active_sec 증가분, 누적 시간, 탭 숨김 제외, 60초 무조작 제한, 중복 초기화 방지는 유지한다. 별도 읽기 이벤트를 추가하지 않아 체류를 이중 합산하지 않는다.
- 직접 프로필 내부의 scroll 이벤트도 활동으로 인식한다. `global/scroll-depth.js`는 실제 스크롤 영역 `.helix-doctor-modal_panel`의 위치·높이를 사용한다. 기존 목록/모달은 창 스크롤 정책을 유지한다.
- `global/ga4-base.js`: GA4 매개변수 25개 제한 안에서도 view_type과 page_location을 보존한다. 원본 시트에는 기존처럼 전체 객체를 남긴다.
- 입력 폼 내용·개인정보를 읽지 않는다. 기존 운영자·스테이징 제외를 유지한다.

## 3. 현재 상태

### 검증 통과

- 기존 test-measurement-coverage: 13개 회귀 검사.
- test-doctor-pages: 26명 정적 생성, PC/모바일 전체 본문·대표 주소·가로 넘침, 기존 24명 모달과 새 탭·직접 접속·뒤로/앞으로·닫기·중복 이벤트 방지·운영자/스테이징 제외.
- 신규 test-doctor-measurement: 1440px/390px에서 식별값, 실제 GA4 전달 객체 25개 제한, 증가분 체류, 숨은 탭 제외, 내부 패널 스크롤 깊이, 중복 초기화, 다른 의료진으로 이동 확인. 가상 시계와 로컬 응답을 사용하고 모든 실제 외부 전송을 차단했다.

### 운영 로드 순서 확인

운영 `https://www.helix-amc.com/doctors/gimtaeseong`의 실제 HTML을 읽었다.
공통 진입점과 ga4-base/session/sheet-log는 `09c8ca9474fde2d66ca8dcddbc8a180c0cd8305e`, 의료진 페이지의 defer 자산은 `db3e79c9dc7f45780a4690b6e558966897d3e472`로 고정되어 있다.
공통 진입점은 최신 SHA를 비동기로 찾지만 defer 구버전이 먼저 초기화할 수도 있다. 따라서 저장소 main 변경만으로 이번 수정의 운영 도달을 보장할 수 없다.

운영 HTML/자산 주소는 아직 변경하지 않았다. 실제 GA4·원본 시트 수신은 미검증이며 보완 완료 상태가 아니다.

## 4. 다음 단계

1. 측정 전용 PR은 CLAUDE.md의 main 직행 예외를 따른다. 다른 staging 작업은 승격하지 않는다.
2. 검증된 커밋의 전체 SHA를 사용해 의료진 페이지의 기존 자산 주소를 교체한다. 먼저 실행되는 공통 ga4-base도 같은 검증 버전인지 확인한다. 새 CSS/JS 모듈을 운영에 추가할 필요는 없다.
3. Webflow에 미게시 변경이 있으면 사이트 전체 Publish로 함께 공개하지 않는다. 이 제약을 해결할 승인된 게시 경로에서만 반영한다. 사용자에게 코드 붙여넣기를 요구하지 않는다.
4. 운영 DOM·실제 로드 자산·첫 초기화·측정 파라미터를 따로 확인한다. 필요한 최소 QA 표본으로 전송/GA4 수신/시트 수신을 각각 검증하고 분석 제외 여부도 확인한다.

## 5. 참고 파일 및 링크

- `global/page-time.js`, `global/scroll-depth.js`, `global/ga4-base.js`
- `scripts/test-doctor-measurement.mjs`: `PLAYWRIGHT_MODULE`과 필요 시 `CHROMIUM_PATH`로 기존 Playwright/Chromium을 선택해 실행
- `scripts/test-doctor-pages.mjs`, `scripts/test-measurement-coverage.mjs`
- 컨트롤 센터의 대응 PR은 `doctor-pages-v3` 분석 의미 버전과 구버전 인덱스 재처리를 포함한다.

## 운영 게시 직전 추가 검증

운영 공통 ga4-base.js(`09c8ca9474fde2d66ca8dcddbc8a180c0cd8305e`)를 먼저 실행하는 순서에서도 신규 Playwright 검사를 PC/모바일로 통과했다. UTM과 클릭 직후 체류에서도 view_type·page_location을 포함한 식별값이 전달되며 중복 초기화가 없다. 공통 head를 수정하지 않고 의료진 페이지의 세 변경 JS 자산 주소만 교체한다. Webflow의 단일 페이지 게시(pageId)로 의료진 페이지만 게시하며, 다른 페이지의 미게시 변경은 포함하지 않는다.

## 운영 반영 경로 확정

Webflow 단일 페이지 게시 요청은 실제 서버에서 HTTP 400 `Invalid parameter: pageId`로 거부됐다. 따라서 코드 주소를 시험 교체한 김태성 페이지는 즉시 원래 head로 복원했고 사이트 전체 Publish는 실행하지 않았다. 다른 페이지의 미게시 변경을 함께 공개하지 않는다.

운영에 이미 설치된 공통 measure-gate 로더가 최신 main의 측정 모듈을 읽는 경로를 이용한다. 구버전 page-time이 먼저 초기화됐다면 새 모듈은 기존 시계를 다시 만들지 않고 doctor_time_on_page의 공개 의료진 식별값만 보완한다. 내부 패널 스크롤도 기존 시계의 활동 감지에 전달한다. 새 scroll-depth는 이 경우 페이지 열림을 다시 보내지 않고 패널 스크롤만 한 번 초기화한다.

실제 운영에 고정된 구버전 ga4-base, scroll-depth, page-time을 먼저 실행하는 PC/모바일 검사에서 식별값·25개 매개변수 제한·증가분 체류·숨은 탭 제외·내부 스크롤·중복 초기화·다른 의료진 이동을 통과했다. 로더의 기존 SHA 조회/캐시/실패시 고정 버전 폴백 정책은 유지하며, 최신 모듈을 불러오지 못한 방문까지 보완됐다고 주장하지 않는다.
