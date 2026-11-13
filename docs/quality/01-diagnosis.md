# HELIX 홈페이지 안정화 — STEP 01 정밀진단

작성일: 2026-11-13 (Asia/Seoul). 범위: 구조·Git 이력·현재 적용 경로 진단 및 문서화. **구현 코드, Webflow 설정, 배포 설정, AGENTS.md는 변경하지 않았다.**

## 1. 결론과 판정 기준

회귀 위험의 중심은 파일 개수가 아니라 **같은 속성과 화면 상태를 여러 계층이 동시에 소유하는 구조**다. 공통 CSS의 보호 규칙을 홈 CSS가 다시 덮고, 페이지의 긴 문자열 처리 규칙을 전역 `!important`가 무력화하는 사례를 현재 코드로 재현했다. Webflow에 있는 초기 화면 제어 코드와 GitHub 모듈의 연동, 서로 다른 고정 SHA를 사용하는 로더도 수정 영향과 검증 대상을 넓힌다.

다만 사용자가 겪은 각각의 회귀에 대한 화면·재현 순서·문제 커밋은 제공되지 않았다. 아래의 **구조적 충돌 확인**을 **모든 과거 증상의 원인 확정**으로 확대하지 않는다. 현재 정상인 공통 UI나 의도적인 기기별 차이는 유지한다.

| 표기 | 의미 |
| --- | --- |
| 확인 | 실제 파일·diff·실행 결과로 검증한 사실. 역사적 사고는 당시 기록과 현재 상태를 분리한다. |
| 유력 가설 | 코드상 발생 경로가 있으나 해당 증상을 직접 재현하지 못함 |
| 추가 검증 | 현재 자료만으로 적용 여부·사용자 의도·인과관계를 판단할 수 없음 |
| 유지 | 필요한 보호장치 또는 이번 범위에서 변경 필요성이 입증되지 않은 구조 |

위험도 `높음`은 여러 화면의 배치·노출·스크롤에 영향을 줄 수 있는 경계, `중간`은 특정 상태·컴포넌트의 수정 예측성을 떨어뜨리는 경계다. 장애 빈도나 현재 사이트 전체의 고장 여부를 수치화한 등급은 아니다.

## 2. 저장소·브랜치·보존 기록

| 항목 | 확인 결과 |
| --- | --- |
| 실제 저장소 | `https://github.com/pookat73-prog/helixamc-webflow.git` |
| 작업 경로 | `/workspace/helixamc-webflow` |
| 시작 브랜치 / HEAD | `work` / `c2041b471f52435c3f349b8f068488d358fc5af5` (2026-11-05, #2014) |
| 시작 Git 상태 | tracked 변경·staged 변경・untracked 파일 없음. shallow 저장소 아님. 기존 worktree는 1개. |
| 문서 작업 브랜치 | `docs/helix-quality-step01-20261113` — 시작 HEAD에서 생성 |
| 원격 main, 읽기 API 확인 | `68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d` (2026-11-13, #2068) |
| 원격 staging, 읽기 API 확인 | `11daa6d47a864d49dda835b7c208f726f275b629` (#2067) |
| Git 통신 제약 | `git ls-remote origin refs/heads/main refs/heads/staging`가 `CONNECT tunnel failed, response 403`. `github.com` Git HTTPS 경로가 환경 정책상 차단됨. `api.github.com` 읽기와 jsDelivr 읽기는 가능. |
| 기존 인계 문서 | 요청한 `docs/quality/HANDOFF.md`는 없었음. 루트의 반응형·측정로그 `HANDOVER-*.md`는 보존. |

로컬 HEAD를 최신 배포본으로 간주하지 않았다. API의 `compare/c2041b4…68aaaa4` 결과는 ahead 464, 변경 파일 41개다. **464는 병합된 과거 staging 이력까지 포함한 도달 가능 커밋 차이이며, 11월 5일 이후 신규 작업 464건이라는 뜻이 아니다.** 같은 API에서 해당 시각 이후 작성된 main 이력을 조회하면 36개가 반환된다. 원격 main 대비 staging 비교는 ahead 22 / behind 3이다. 단순히 어느 한 브랜치를 다른 쪽으로 덮어쓸 상태가 아니다.

최신 코드 확인 방법:

1. 시작 HEAD의 `git archive`를 저장소 밖 임시 분석 공간에 풀었다.
2. API compare에 나온 변경 파일 41개를 **main의 전체 SHA 주소**로 내려받아 대체했다.
3. 각 다운로드의 Git blob SHA-1을 API의 파일 SHA와 대조했다. 41개 모두 일치했다.
4. 이 스냅샷으로 최신 소스와 테스트를 분석했다. 원본 worktree의 구현 파일과 Git 이력은 바꾸지 않았다.

따라서 본문 소스 위치는 별도 표시가 없으면 **main `68aaaa4…` 기준**이다. 문서 커밋의 부모는 로컬 `c2041b4…`이므로, GitHub에서는 아래 고정 SHA 링크를 사용해 코드를 검토한다. 문서 인계 시 구현 커밋을 병합하지 말고 문서 커밋만 cherry-pick한다.

## 3. 현재 화면이 만들어지는 경로

| 계층 | 실제 책임·결합 지점 | 진단상 의미 |
| --- | --- | --- |
| Webflow 공개 HTML / 생성 CSS / IX2 | DOM, 기기별 복제 섹션, 기본 배치, 인라인 스타일·인터랙션 | 저장소만으로 전체 계산 스타일과 시작 상태를 복원할 수 없다. |
| Webflow head의 인라인 코드 | 첫 화면 가림·복구·최종 배치·모바일 퀵액세스, GitHub 로더 선택 | 저장소 모듈 수정과 별개로 초기 상태·노출 시점을 바꿀 수 있다. |
| 페이지 bootstrap | 공통 자산 + 페이지 자산 선택, SHA 결정, 주입 순서 | 공통 자산 목록이 여러 페이지 로더에 반복된다. 목록 중복이 곧 중복 실행을 뜻하지는 않는다. |
| `global/bootstrap.js` | 페이지가 이미 연결한 경로·실행 가드를 확인하고 빠진 공통 UI만 보완 | 최신 버전은 옛 전역 로더와 역할이 다르다. 경로 중복 방지는 유지할 가치가 있다. |
| CSS / GSAP / JS 주입 스타일 | opacity·transform·box-shadow·위치·노출 상태를 함께 제어 | 속성별 소유자와 인계 시점을 보지 않고 CSS만 수정하면 회귀를 놓친다. |

실제 홈 HTML에는 `hx-home-recovery`, `hx-home-initial-final-layout`, `hx-home-firstpaint`, `helix-home-responsive-photos`, `hx-mobile-quickbar-compact`, `hx-mobile-quickbar-alignment` 등의 스타일 블록이 존재한다. 이 ID의 정의는 분석한 저장소 스냅샷에서 대응 파일로 완전히 관리되지 않는다. `section1.js`는 Webflow 쪽 `window.__hxHomeFirstpaintReveal`의 존재에 따라 fade duration/delay를 0으로 바꾼다. `coming-soon.js`도 이 함수를 호출하고 홈 viewport 배치를 준비한다. 이름상 토스트 모듈을 수정해도 첫 화면에 영향을 줄 수 있는 실제 의존이다.

### 공개 HTML·브라우저에서 확인한 버전

`?helix-noga=1&fresh=1`, 새 브라우저 context, Chromium으로 읽었다. 측정 전송을 차단하고 예약 제출은 하지 않았다.

| 대상 | 홈 본체와 페이지 자산 | 공통 UI 로더 | 추가 고정 자산 |
| --- | --- | --- | --- |
| 정식 홈 | `68aaaa4…` | `68aaaa4…` | 초기 측정 4개 `4aeeb4a…`, word-wrap `63812a31…`, 진입점 `ddec5a48…` |
| staging 홈 | **`0011fc2323a69260f758f84bc13e0a289e78d9b4`** | `11daa6d…` | 초기 측정 4개 `4aeeb4a…`, word-wrap `63812a31…` |

staging의 본체 고정은 캐시 추측이 아니다. **반환 HTML의 도메인 분기에서 해당 SHA를 직접 대입하고 `home/bootstrap.js`를 로드한 뒤 return**한다. 따라서 `fresh=1`도 이 경로에서는 최신 staging 홈 본체를 선택하지 않는다. 후보 고정이 의도된 진행 작업인지 확인하기 전에는 제거·승격하지 않는다. 정식과 staging의 Webflow 생성 CSS 파일명도 달랐다(`…3c2f00975.css` / `…73c0c0934.css`).

## 4. 주요 발견과 영향 범위

### D01 — 홈 섹션 CSS가 공통 스크롤 보호를 덮음

**확인 / 위험 높음.** [global/global.css:239](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/global/global.css#L239)는 `html, body { overflow-x: clip }`을 선언한다. 뒤에 연결되는 [home/global/sections-animations.css:8](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/home/global/sections-animations.css#L8)는 같은 선택자에 `hidden`을 선언한다. 선택자 우선순위가 같아 뒤쪽 규칙이 이긴다.

- 정식·staging, 390×900 / 1440×900 네 조건에서 html과 body의 계산값이 `overflow-x: hidden`, `overflow-y: auto`였다.
- 최신 CSS 격리 재현: 공통 CSS만 적용하면 root `clip` / body Y `visible`; 홈 섹션 CSS 추가 후 `hidden` / `auto`로 바뀐다.
- 컴포넌트 애니메이션 CSS가 문서 전체 스크롤 정책을 바꾸는 실제 범위 누출이다. `CLAUDE.md`의 모바일 viewport LOCKED가 보존하려는 `clip`과도 어긋난다.
- **미확정:** 이번 검사에서 홈 sticky 고장을 직접 재현하지는 않았다. overflow 충돌과 계산값은 확정, 개별 sticky/fixed 증상의 직접 원인은 추가 검증이다.
- STEP 02 입력: overflow의 소유자를 문서 계층으로 명시하고 홈·소개 sticky와 가로 스크롤의 전후 기준을 확보한다. `hidden`을 즉시 삭제하거나 `!important`를 추가하는 처방은 이번 단계에서 하지 않는다.

### D02 — 전역 줄바꿈 강제가 페이지 예외를 무력화함

**확인 / 위험 높음.** [global/word-wrap.css:4](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/global/word-wrap.css#L4)는 `body, body *`에 `word-break: keep-all`, `overflow-wrap: normal`, hyphens 관련 속성을 모두 `!important`로 지정한다. 모든 자손에 직접 적용하므로 단순 상속보다 영향이 강하다.

- [global/global.css:523](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/global/global.css#L523), 566의 내과 프로세스 `overflow-wrap: anywhere`는 normal 선언이므로 선택자 명시도가 높아도 이기지 못한다.
- 내과 page ID와 `.sj_step_list`를 갖춘 격리 DOM에서 최신 global CSS 적용 시 `anywhere`, word-wrap CSS 추가 시 `normal`이 됨을 확인했다.
- `707c67a8a8`(#2016)가 전역 강제를 도입했고 `63812a31fe`(#2017)가 이를 별도 자산으로 옮겼다. 파일 분리 뒤에도 선택 범위는 전역 그대로다. 실제 두 홈 모두 `@63812a31…/global/word-wrap.css`를 로드한다.
- **유력 가설:** 긴 영문·URL·식별자·입력값과 좁은 카드에서 넘침 또는 높이 변화가 생길 수 있다. 이번 단계에서 해당 콘텐츠의 사용자 장애는 재현하지 않았다.
- 다음 입력: 한글 단어 보존이라는 의도는 유지하되, 긴 문자열을 허용해야 할 컴포넌트·폼·프로세스의 예외 계약을 먼저 정한다. 전역 규칙의 일괄 철회도 승인된 해결책으로 간주하지 않는다.

### D03 — 같은 애니메이션 속성의 제어 주체가 겹침

**제어 중복 확인 / 타이밍 회귀는 유력 가설 / 위험 높음.** [home/global/buttons.js:58](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/home/global/buttons.js#L58)는 `.bt-box-3,.bt-box-4`를 IntersectionObserver로 관찰하고 inline `box-shadow !important`를 설정한 후 1.5초 뒤 제거·`is-looping` 전환을 한다. [sections-animations.js:126](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/home/global/sections-animations.js#L126)도 두 번째 heading의 `.bt-box-3`에 같은 속성·클래스·타이머를 제어한다.

- `is-looping` 검사는 이미 완료된 상태는 막지만, 다른 주체의 1.5초 대기 중 상태까지 단일 소유로 만들지는 않는다. 뷰포트 진입 순서에 따른 이른 전환 가능성은 후속 재현 대상이다.
- `CLAUDE.md` 글로우 LOCKED 표는 buttons.js가 1/2/3을 제외한다고 적지만 현재 코드는 3을 포함한다. 지침과 구현의 불일치가 확정된다. **문서만 보고 현재 코드를 자동 수정하지 않는다.**
- [section1.js:64](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/home/section1/section1.js#L64)의 ghost·detach/restore는 실제 DOM 위치를 옮긴다. 섹션 모듈은 `helix-s1-done` 후 ScrollTrigger를 재측정한다. 이 이벤트 의존 자체는 필요한 보호장치다.
- Webflow IX2·inline important·GSAP·CSS keyframe의 연결을 무시한 `!important` 일괄 제거는 위험하다. 속성별 소유자, 준비/노출/hold/loop 상태, 넘겨주는 이벤트를 표로 확정하는 것이 먼저다.

### D04 — Git 브랜치와 실제 검증 대상이 일치하지 않을 수 있음

**현재 버전 차이 확인 / 위험 높음.** 3절의 staging 본체 고정 때문에 최신 staging Git 코드를 검사한 결과와 공개 staging 화면 검사 결과를 동등하게 취급할 수 없다. 여러 SHA를 사용하는 것 자체는 초기 측정 순서·복구용 고정 버전을 위한 의도일 수 있다.

- 최신 [global/bootstrap.js:133](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/global/bootstrap.js#L133)의 `present(path)`는 **SHA와 무관하게 경로가 이미 있으면 건너뛴다**. 중복 UI를 막는 장점이 있지만, 예전 경로가 있으면 새 공통 UI 버전으로 업그레이드하지 않는 책임도 생긴다.
- 같은 파일의 121행 이후는 오래된 top-button 모듈을 보완하기 위해 capture 단계에서 클릭을 가로챈다. 175행 이후에는 `/services` 영상의학과 링크·SEO 보완도 포함한다. 공통 로더가 누락 자산 연결 외의 페이지별 호환 책임도 맡는다.
- **미확정:** mixed SHA가 현재 모든 화면의 오류를 일으킨다는 근거는 없다. 이번 홈 관찰에서는 페이지 오류·실패 요청이 없었다. 8조건 공통 UI 검사도 통과했다.
- 후속 검증마다 공개 HTML의 진입점, 실제 CSS/JS SHA, 적용한 Webflow 생성 CSS를 함께 기록해야 한다. 캐시 purge·Publish·후보 고정 해제는 이번 작업 범위에 포함하지 않는다.

### D05 — CTA CSS의 덧붙이기와 우선순위 누적

**확인 / 위험 중간.** [global/floating-cta.css:936](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/global/floating-cta.css#L936) 이후에는 디자인 본체 뒤로 같은 선택자를 다시 선언하는 블록이 이어진다.

- `.hx-fcta-shell .hx-fcta-form-btn` 높이는 base 38px → 후속 32px, 모바일 규칙 36px → 후속 28px로 겹친다. 최신 파일 끝에서는 `:root.hx-fcta-mobile-bar ...`가 모바일 bar용 44px를 다시 지정한다.
- form `::after`는 화살표를 선언한 뒤 후속 블록에서 `content:none !important; display:none !important`로 제거한다. 같은 제거 선언도 반복된다. 앞부분만 수정하면 화면이 바뀌지 않아 다시 더 강한 규칙을 붙이기 쉬운 구조다.
- `floating-cta-mobile-fix.css`도 모바일 row 뒤 column, 360px icon 숨김 뒤 inline-flex important 복원이 이어진다. **다만 이 파일의 레거시 규칙 전체는 `:not(.hx-fcta-mobile-bar)`로 보호되어 있고, 실제 홈에는 `hx-fcta-mobile-bar`가 있어 그 경로가 활성화되지 않는다.** 현재 홈 문제의 직접 원인으로 단정하지 않는다.
- CTA는 컴포넌트 prefix와 중복 초기화 가드를 갖고 있어 무조건 분리할 대상이 아니다. 다음에는 desktop/mobile-bar/legacy별 최종값과 필요한 호환 규칙을 먼저 구별한다.

### D06 — 반응형 판정의 목적 차이와 중복 viewport 교정

**복수 기준 확인 / 특정 기기 회귀는 추가 검증 / 위험 중간.** 저장소의 CSS 34개에서 주석을 제외하고 `@media` 조건 안의 px width만 추출하면 임계값이 20종이다: `1, 360, 374, 389, 478, 479, 480, 519, 600, 767, 768, 991, 992, 1000, 1024, 1100, 1200, 1279, 1280, 1439`.

- `1px` 두 곳은 `TEMP DISABLED`된 홈 반응형 블록이다. 이를 실제 사용자 화면 breakpoint로 집계해 오류라고 판단하거나 임의 활성화하면 안 된다.
- Webflow 레이아웃 기준 479/767/991과 [HelixVP](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/global/viewport.js#L57)의 tablet 상한 1039는 목적이 다르다. 측정용 mobile 판정은 767로 고정되어 있다. **차이 자체는 결함이 아니다.**
- [home/bootstrap.js:92](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/home/bootstrap.js#L92)의 iPad 교정은 touch-only, 폭 992~1400을 991로 바꾼다. 별도 [viewport-fix.js:81](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/global/viewport-fix.js#L81)는 원래 meta를 저장·복구하고 orientation 기준으로 다시 교정한다. 후자가 이미 교정된 meta를 원본으로 보관할 가능성은 코드상 존재한다.
- 애니메이션 JS에도 767/991/992와 시작 시점의 `innerWidth` 판정이 남아 있다. 회전 후 재생성되는 선과, 한 번만 초기화되는 fade/observer를 구분해야 한다.
- 다음 검증은 경계 ±1px, 1032px 세로 태블릿, 낮은 가로 폰, 세로↔가로 왕복에서 meta·innerWidth·data-vp·표시된 마크업 벌을 함께 기록한다. 전부 하나의 숫자로 통일하거나 vw를 일괄 px로 바꾸지 않는다.

### D07 — 공통 파일의 책임 범위와 DOM 구조 의존

**확인 / 위험 중간.** 최신 `global/global.css`는 916행이며, 내과 page ID로 묶인 배치와 영상의학과 모션·섹션 규칙도 포함한다. `coming-soon.js`는 토스트뿐 아니라 홈 viewport·heading 준비를 수행한다. `sections-animations.js`는 섹션 애니메이션·연결선·복사·전화·측정을 함께 다룬다.

- `.div-block-…`, heading의 NodeList 순번, `body > ...` 같은 구조 결합은 Webflow에서 래퍼를 추가하거나 기기별 복제 순서를 바꿀 때 재검증 범위를 넓힌다.
- 전역 SVICC 규칙도 `body:has(#hx-im-intro, .hx-sg-cta-row)`로 페이지의 다른 위치에 특정 노드가 있는지를 보고 버튼의 animation·shadow를 바꾼다(global CSS 371~392행). 독립 버튼의 결과가 페이지 구성에 의존한다.
- 반면 `html[data-wf-page="…"]`, `#hx-di-page`, `.hx-im-*`, `.hx-fcta-*`처럼 실제 대상을 제한한 규칙은 격리 경계로 유효하다. 공통 파일에 있다는 이유만으로 전역 누출이라고 부르지 않는다.
- **과도한 추상화가 주원인이라는 근거는 찾지 못했다.** 프레임워크 컴포넌트 트리보다는 Webflow DOM + IIFE 모듈 구조다. 파일 분리나 범용 컴포넌트 추가보다 현재 선택 범위·소유 속성·호환 경계를 기록하는 것이 우선이다.

### D08 — 안전장치는 존재하나 CSS 충돌을 자동 차단하지 못함

**확인 / 위험 중간.** 최신 [site-quality.yml](https://github.com/pookat73-prog/helixamc-webflow/blob/68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d/.github/workflows/site-quality.yml)은 JS 문법, 접근성 소스 계약, 예약 제출·키보드 포커스·측정·의료진 페이지 검사를 실행한다. 테스트가 없다는 진단은 틀리다.

- `scripts/test-home-loading.mjs`에는 CSS 준비·실패 재시도·로더 중복·측정 순서 등의 실행 검증이 있다. `test-shared-ui.cjs`는 브라우저에서 공통 UI 개수·메뉴·CTA·위로가기·푸터 위치를 검사한다. `test-internal-medicine-care.cjs`에는 다양한 폭과 무관한 섹션의 geometry 보존 검사도 있다.
- 그러나 이 세 테스트는 현재 workflow에 모두 연결되어 있지 않다. 자동 CI에는 실제 브라우저의 CSS cascade 충돌·전후 스크린샷 비교가 없다.
- `check-site-quality.mjs`의 주요 계약 검사는 소스 문자열 확인이다. D01/D02의 최종 계산 스타일·시각 결과까지 보장하지 않는다.
- 배포 workflow와 품질 workflow는 별도다. workflow 파일에서 품질 job의 성공에 대한 `needs` 연결은 없으며, GitHub branch protection의 required check 설정은 이번에 확인하지 않았다.
- 다음에는 D01/D02 및 선택한 한 컴포넌트의 invariant를 검사하는 작은 안전장치를 우선한다. 모든 화면을 같은 픽셀값으로 강제하거나 현재 구현을 그대로 복제한 assertion을 늘리지 않는다.

## 5. Git 이력으로 확인한 반복 패턴

### 반복 수정 파일

로컬에서 재현 가능한 집계: `git log --since=2026-10-01 --no-merges --format= --name-only`의 파일명 등장 횟수. 끝점은 `c2041b4`이다. 자동 생성 파일도 원자료에 포함되지만 아래는 시각 관련 파일만 제시한다. **최신 원격 전체 순위가 아니다.**

| 파일 | 등장 횟수 | 해석 |
| --- | --- | --- |
| `internal-medicine/headline-highlight.js` | 11 | 강조·링·모션 관련 반복 수정 후보 |
| `global/global.css` | 9 | 공통·내과 배치 변경이 집중 |
| `internal-medicine/bootstrap.js` | 8 | 페이지 진입과 주입 UI 변경 |
| `global/floating-cta.js` | 8 | 공통 예약 UI·기능 변경 |
| `services/surgery-bootstrap.js` | 7 | 외과 페이지 공통·개별 동작 |
| `global/floating-cta.css` / `services/surgery-card-stack.css` | 각 5 | 반응형·모양 보정 |
| `home/bootstrap.js` / `global/floating-cta-mobile-fix.css` | 각 4 | 로딩·CTA 간격 보정 |

11월 5일 이후 원격 이력에서는 영상의학과 그림자 #2019→#2020→#2021→#2022→#2023, 선 위치 #2025→#2026→#2027, 강조 재생 #2031→#2032→#2033, 모바일 강조·회전 #2053→#2055→#2057처럼 같은 요소의 조정이 이어진다. 이는 수정 집중의 증거지만, 디자인 조율도 포함하므로 전부 회귀 수정이라고 세지 않는다.

### 원인·수습 diff가 있는 사례

| 근거 커밋 | 전후 변화 | 현재 판정 |
| --- | --- | --- |
| [`f5952c3` #1440](https://github.com/pookat73-prog/helixamc-webflow/commit/f5952c38f44dec449f3a486ececb191ef5adc45d) | body의 `font-variation-settings: 'wght' 500` 제거. 자식 700 굵기까지 500으로 눌리던 상속 원인이 커밋 본문·diff에 기록됨. | 역사적 전역 상속 사고. 현재 해당 선언은 제거되어 있음. 해결 상태 유지. |
| [`37d24d1` #1462](https://github.com/pookat73-prog/helixamc-webflow/commit/37d24d10fe50b7e6cfbf9203f217142e84a24080) | FAQ 목록의 `display:block !important`를 `flow-root !important`로 변경. 반복 padding 보정 대신 margin collapse 경로 차단. | 현재 flow-root 유지. 이미 해결된 검은 줄을 미해결로 재분류하지 않음. |
| `HANDOVER-반응형-2026-08-17.md`, #1426~#1431 | 새 반응형 CSS를 등록했지만 구 로더 캐시 때문에 브라우저에 도달하지 않았다고 기록. 기존 CSS로 합침. | 당시 운영 기록. 현행 모든 로더가 동일하게 고장났다는 증거로 사용하지 않음. |
| `1dbcc5d`, `aa50056`, `582607b` | CTA 디자인 승격 때 두 CSS 330줄 추가/49줄 삭제, 이후 간격 보정 추가, cached legacy보다 mobile bar를 우선하도록 선택자 강화. | D05 덧붙이기와 호환 우선순위의 실제 이력. 줄 수 자체가 잘못의 증거는 아님. |
| `88530ef` #1944 | 내과 모서리 seam 처방을 global CSS 한 파일에서 33줄 변경하며 중첩 레이어를 줄임. | 국소적인 원인 제거 사례. 전면 재작성의 필요성을 지지하지 않음. |
| `eee9d7565b` #2015 → `02a69f7154` #2029 | 첫 화면 자산 준비에 맞춘 공개 head 연동, 보조 스크립트가 홈 초기화를 막지 않도록 주입 방식 조정. | Webflow·GitHub 양쪽 상태를 확인해야 하는 근거. 성능 수치 향상은 이번에 측정하지 않음. |
| `3e485ee69d` #2038 → `1d230cfe91` #2041 | 누락 공통 UI 보완 로더 도입 후, 구 top-button 모듈에도 적용되는 capture 보완 추가. | 혼재 버전의 호환 책임이 공통 로더로 모이는 근거. 현재 테스트는 통과. |
| `c140072961` #2066 → `68aaaa4f5e` #2068 | 서초 모바일 의료진 숨김 7줄 추가, 초기 아이콘 크기 9줄 추가. | 최근에도 CSS 도착 전과 후의 상태를 따로 제어함. 두 변경 사이 회귀 인과관계는 미확정. |

### Codex의 불필요한 광범위 수정 여부

확인 가능한 것은 **수정된 파일과 선택 범위**다. `707c67a8a8`은 영상의학과 인트로 변경과 전 사이트 `body * !important` 정책을 한 global CSS 변경에 담았고, `63812a31fe`가 고정 버전 페이지에도 적용되도록 분리했다. 전역 파급은 확정이지만 당시 요청에 전 사이트 줄바꿈 변경이 포함됐는지는 이 기록만으로 판정할 수 없다.

로컬 2026-10-01~시작 HEAD의 no-merge 메시지 98개 중 Codex 언급은 1개였다. 작성자·짧은 제목만으로 AI 종류나 승인 범위를 추정하지 않았다. **Codex가 불필요한 광범위 수정을 했다고 확정할 자료는 부족하다.** 이를 확인하려면 원 요청, PR 본문·전체 diff, 수정 전후 화면을 같은 건으로 연결해야 한다. 반대로 `581ffbe`(#1995)는 CTA CSS 4줄 변경으로 예약 라벨 정렬만 수정했다. 작은 변경 단위가 가능한 사례도 존재한다.

## 6. 유지 대상으로 분류한 구조

- **Webflow와 GitHub의 역할 분담:** Webflow 기본 DOM·배치를 유지하고 외부 자산으로 보완하는 구조 자체를 교체할 근거는 없다.
- **고정 SHA 자산과 환경 분리:** immutable URL, hostname 기준 staging/main 분리, 초기화 가드·누락 경로 보완을 유지한다. 고정 SHA가 항상 최신이어야 한다는 가정만 제거한다.
- **필수 CSS 준비 후 홈 측정:** 최신 홈 로더의 critical CSS 대기·뷰포트→홈 배치→hero 순서와 관련 로딩 테스트를 유지한다.
- **기기별 복제 마크업:** 과거 인계 문서에서 유지하기로 결정되어 있다. 이번 조사로 통합 필요성이 입증되지 않았다.
- **한정된 페이지 선택자와 prefix:** page ID·section root·컴포넌트 prefix를 사용한 유효한 격리를 보존한다. 큰 파일이라는 이유만으로 옮기지 않는다.
- **기존 LOCKED 보호:** overflow `clip`, FAQ `flow-root`, fixed 헤더, 폰트 준비 게이트, about 본문 박스의 상시 노출, 글로우 인계 규칙을 임의 약화하지 않는다. D01/D03처럼 코드와 문서가 다른 지점은 먼저 재현한다.
- **정상 공통 UI와 현재 검사:** 확인한 메뉴·예약창·위로가기·푸터 동작, 측정 차단과 예약 제출·포커스 테스트를 유지한다.

## 7. 수행한 검증과 한계

| 검사 | 대상 | 결과 / 의미 |
| --- | --- | --- |
| `node scripts/check-site-quality.mjs` | 로컬 `c2041b4` | 8개 검사 통과, JS 86개 문법 포함. CSS 시각 품질 보증은 아님. |
| `node scripts/test-performance-loader-requests.mjs` | 로컬 `c2041b4` | 9개 loader PASS. 속도 측정 결과는 아님. |
| `node scripts/test-home-loading.mjs` | 해시 검증한 최신 main 스냅샷 | 6개 출력 그룹 통과. lookup 실패·캐시·배포별 분리·critical CSS·hero·quickbar 순서 등. |
| `node scripts/test-floating-cta-focus.mjs` | 동일 스냅샷 | 15 시나리오 통과. |
| `node scripts/test-floating-cta-submit.mjs` | 동일 스냅샷 | 6 시나리오 통과. 네트워크를 모의하며 실제 예약을 제출하지 않음. |
| `test-shared-ui.cjs`, override=0 | 실제 staging `/`, `/discover-helix`, `/services`, `/faq` × 1440×900 / 390×844 | 총 8조건 PASS, page error 없음. 각 페이지의 모든 섹션·모든 미디어 경계를 검증한 것은 아님. |
| 별도 실제 홈 관찰·스크린샷 | 정식·staging × 390×900 / 1440×900 | 4조건에서 hero·CTA 노출, 가로 문서 폭=viewport, 페이지 오류·실패 요청 0. D01 계산값 확인. |
| 최신 CSS 격리 DOM 실행 | Chromium 390×844, 최신 global / home sections / word-wrap 순차 적용 | `clip→hidden`, body Y `visible→auto`, 텍스트 wrap `anywhere→normal` 확인. 사이트 코드는 변경하지 않음. |

첫 브라우저 시도는 Cloud 프록시 CA를 Chromium이 신뢰하지 않아 `ERR_CERT_AUTHORITY_INVALID`로 실패했다. 환경에 제공된 **해당 프록시 인증서의 SPKI만 지정**해 재실행했고 위 브라우저 검사들을 완료했다. 사이트 자체의 TLS 장애로 기록하지 않는다.

임시 증거는 `/tmp/helix-quality-evidence/`에 있다(`browser-results.json`, `snapshot-results.json`, `compare-main.json`, `compare-staging.json`, `commit-*.json`, 공개 HTML, 스크린샷, `shared-ui-staging/results.json`). 이는 환경 종료 시 소실될 수 있으므로 이 문서에 핵심 관찰·재현 조건·SHA를 남겼다. 추가 증거를 GitHub에 보존해야 한다면 다음 단계에서 필요한 파일만 선별한다. 이번 커밋은 요청한 Markdown 두 파일만 포함한다.

확인하지 않은 것: Safari/iOS 실기기, 회전·모든 breakpoint 경계, 사용자별 과거 재현 경로, 초저속 네트워크의 전체 상태 전이, 다른 페이지의 모든 계산 스타일, GitHub branch protection·과거 Actions 실행 결과, Webflow Designer 편집 원본과 승인 이력. 이 검사는 라이브 수정·Publish·성능 개선·전체 정상화를 완료했다는 의미가 아니다.

## 8. STEP 02에 넘길 입력과 완료 조건

**준비 상태: 다음 단계 설계 착수 가능. 구현 착수 전 재현 기준·소유 경계부터 확정해야 한다.**

1. 이 문서와 [HANDOFF.md](HANDOFF.md)를 읽고 최신 Git/공개 HTML SHA를 다시 확인한다. staging `0011fc…` 후보의 작업 목적·현재 담당 범위를 기존 기록으로 확인한다.
2. D01/D02를 우선 재현 대상으로 고정한다. 정상 대조 화면은 홈·소개·FAQ·진료과목의 desktop/mobile과 해당 sticky·폼·긴 문자열이다. D03은 두 observer의 발사와 inline shadow 제거 시각을 기록한다.
3. 다음 단계 산출물은 **소유권·영향 범위 표와 작은 변경 후보**다. 대상 선택자·속성·상태·로더·영향 페이지·유지 invariant·되돌릴 단위를 적는다. 새로운 파일이나 추상화 추가는 그 자체로 개선 목표가 아니다.
4. 첫 구현 단위는 독립적으로 검증 가능한 충돌 하나로 제한한다. 같은 PR에서 전체 breakpoint 변경·글로우 정리·로더 교체를 묶지 않는다. 필요한 실제 코드 변경은 별도 후속 작업이다.
5. 후보의 완료 기준은 요청한 화면의 개선 **그리고 무관한 정상 화면의 계산값·배치·동작 보존**이다. 실제 로드 SHA와 Webflow 스타일 버전을 전후 증거에 포함한다. 테스트 통과나 Git merge만으로 화면 반영을 확정하지 않는다.

### 다시 확인할 명령·참고

```bash
git status --short --branch
git log -18 --date=iso-strict --format='%h %ad %s'
git show f5952c3 -- global/global.css
git show 37d24d1 -- faq/faq-stack.css
git show 581ffbe -- global/floating-cta.css
git log --since=2026-10-01 --no-merges --format= --name-only
git log -1 --format='%H %s' -- docs/quality/01-diagnosis.md docs/quality/HANDOFF.md
```

공개 홈에서 read-only로 실제 상태 확인:

```js
({
  sha: window.__helixCommitSha,
  ref: window.__helixHomeBootstrapRef,
  viewport: document.querySelector('meta[name="viewport"]')?.content,
  overflow: [document.documentElement, document.body].map(el => ({
    tag: el.tagName,
    x: getComputedStyle(el).overflowX,
    y: getComputedStyle(el).overflowY
  })),
  assets: [...document.querySelectorAll('script[src],link[rel="stylesheet"]')]
    .map(el => el.src || el.href)
    .filter(url => url.includes('helixamc-webflow'))
})
```

관련 기준: [AGENTS.md](../../AGENTS.md), [CLAUDE.md](../../CLAUDE.md), [README.md](../../README.md), [반응형 인계 기록](../../HANDOVER-반응형-2026-08-17.md). 이 문서와 다른 현재 상태가 관찰되면 과거 진단을 덮어쓰기보다 후속 관찰의 날짜·SHA·변경된 판정을 남긴다.
