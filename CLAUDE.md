# Helix AMC Webflow — Claude 작업 가이드

## 🔌 MCP 가 필요할 땐 링크부터 선제시 (LOCKED v1)

Webflow Designer MCP (또는 다른 MCP) 도구를 써야 하는 작업이면, **무작정 먼저 호출해서 실패하고 나서 링크 달라고 하지 말 것.** 사용자가 매번 그 패턴에 지침 사항. 대신:

1. 작업에 MCP 가 필요하다고 판단되는 즉시, **사용자에게 먼저 "이 작업은 Webflow Designer MCP 연결이 필요합니다 → [Designer 열기 링크]" 를 선제시**.
2. Webflow Designer MCP 도구 (`element_tool`, `style_tool`, `de_*` 등) 는 **Designer 캔버스 세션이 열려 있어야** 동작. 헤드리스로는 실패함.
   - Designer 열기: `https://webflow.com/design/helix-amc` (Site ID `69d090ea69d828e27d16ea29`) — Designer 우상단 Apps 패널에서 MCP/Companion 활성화.
3. 링크 제시 후, 사용자가 "열었다" 확인하면 그 때 MCP 호출.
4. MCP 없이도 가능한 대안 (repo CSS/JS 직접 수정 등) 이 있으면 그 대안도 함께 제시해 사용자가 고르게 함.

## 🔥 새 폴더/페이지 작업 시 — 워크플로우 paths 필터 점검 (LOCKED v1, PR #621~#630 교훈)

**증상**: 코드 푸시 → PR 머지했는데 사이트에 반영 안 됨. "캐시 기다려 주세요" 만 반복하게 됨.

**원인**: `.github/workflows/webflow-deploy.yml` 의 `on.push.paths` 와 퍼지 대상 `FILES` 목록에 해당 폴더가 빠져 있으면, 푸시가 워크플로우를 **아예 트리거 안 함** → jsDelivr `@main`/`@staging` 캐시가 옛 bootstrap 그대로 → 사용자 브라우저에 영영 새 코드 도달 안 함.

### 새 작업 시작 전 BLOCKING CHECK

`{newdir}/` 폴더에서 작업을 시작하기 전, **반드시 먼저** `.github/workflows/webflow-deploy.yml` 을 열어 두 가지를 확인:

1. `on.push.paths` 에 `'{newdir}/**'` 포함되어 있는가?
2. `Purge jsDelivr cache` 단계의 `FILES=()` 배열에 `{newdir}/bootstrap.js` (또는 그 폴더의 동적 로더 파일) 포함되어 있는가?

둘 중 하나라도 누락이면, **콘텐츠 작업 PR 과 별개로** 먼저 워크플로우 패치 PR 을 만들거나 같은 PR 에 함께 넣어야 함.

### ⚠️ 함정 — 워크플로우 자체 변경은 paths 필터에 안 걸림

`.github/workflows/webflow-deploy.yml` 만 수정한 PR 은 그 자체로 워크플로우를 트리거 안 함 (paths 필터에 `.github/**` 없음). 따라서:

- 워크플로우 paths 를 늘리는 PR 머지 **직후**, 그 폴더 안 파일에 사소한 변경 (예: 헤더 주석의 버전 번호 bump) 을 추가 푸시해서 워크플로우를 실제로 한 번 돌려야 함
- 혹은 워크플로우 패치와 콘텐츠 변경을 같은 PR 에 넣어 한 번에 처리

### 진단 코맨드

새 폴더 작업 들어가기 전 무조건:
```bash
grep -E "paths:|FILES=\(" -A20 .github/workflows/webflow-deploy.yml | head -40
```
해당 폴더 보이면 OK, 안 보이면 먼저 워크플로우 패치.

### 실패 사례 (재발 금지)

PR #621 (네이버 SDK 키 파라미터 수정) 머지했는데 사이트 반영 안 됨 → "캐시 기다리세요" 안내 → 사용자 시크릿 창 새로고침 수회 → PR #622 (workflow paths 추가) 머지했는데 그 PR 자체도 트리거 안 됨 → PR #623 (seocho/bootstrap 헤더 bump) 으로 강제 트리거 → 그제서야 반영. 사용자가 "하루종일 뺑이쳤다" 분노. 첫 PR 만들기 전 본 체크 1분만 하면 됐던 일.

---

## 워크플로우 — **staging 우선 배포** (LOCKED v1, PR #546)

### 브랜치 전략
- `main` = 정식 사이트 (`helixamc.com` 등)
- `staging` = Webflow 스테이징 사이트 (`*.webflow.io`)
- `claude/*` = 작업 브랜치

### 배포 흐름
1. 작업 완료 → 커밋·푸시 → PR 생성. **PR base 는 항상 `staging`**.
2. **PR 생성 직후 Claude 가 즉시 머지** (squash) → `staging` 브랜치 갱신 → 워크플로우가 `@staging` 캐시 퍼지 → 스테이징 사이트에만 반영 (정식 무영향)
3. 사용자가 스테이징에서 검증 후 OK 라고 하면, 그 때 `staging → main` PR 생성·머지 → 정식 반영

### 머지 자동화 — 사용자 별도 지시 없어도 기본값 (LOCKED)
- `claude/* → staging` PR 은 **사용자 확인 대기 없이 즉시 머지**. 머지하지 않으면 스테이징 사이트에 반영이 안 돼 사용자가 검증할 수 없음.
- 도구: `mcp__github__merge_pull_request` (`merge_method: "squash"`).
- 머지 실패 (CI 실패, 충돌 등) 시에만 사용자에게 보고. 성공 시 PR 번호·머지 SHA 만 짧게 알림.
- `staging → main` PR 은 **사용자가 명시적으로 "main 으로 올려" 라고 지시할 때만** 생성·머지. 자동 머지 금지.

### 절대 금지
- ❌ PR base 를 `main` 으로 직접 만들기 (긴급 hotfix 외)
- ❌ `staging` 검증 없이 main 직진
- ❌ 워크플로우에 staging↔main 자동 동기화 재도입 (분리 의미 소실)
- ❌ `claude/* → staging` PR 을 만들어 놓고 머지 안 하기 — 사용자 검증 불가

### 메커니즘
- `home/bootstrap.js` + `about/bootstrap.js`: `var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';`
- `*.webflow.io` 도메인 → `@staging` 브랜치 콘텐츠 로드
- 정식 도메인 → `@main` 브랜치 콘텐츠 로드
- 워크플로우 (`.github/workflows/webflow-deploy.yml`): `main` / `staging` 푸시 둘 다 트리거, **푸시된 ref 의 캐시만** 퍼지/워밍업

## ⚠️ 모바일 viewport 격리 — 건드리지 말 것 (LOCKED v1, PR #586/#587/#588)

**대상 파일**: `global/global.css`

### 확정 규칙

```css
html, body {
  overflow-x: clip;          /* ⚠️ hidden 절대 금지 */
  max-width: 100vw;
}
body,
body > .page-wrapper,
body > main,
body > .main-wrapper {
  transform: none !important;
  filter: none !important;
  perspective: none !important;
}
header.header {
  position: fixed !important;
  top: 0 !important;
  transform: none !important;
  transition: none !important;
}
```

### 왜 필요한가

모바일 about 에서 (1) 헤더가 스크롤 따라 위로 사라지고 (2) 서브헤더가 헤더 밑에 안 붙고 (3) 가로 스크롤이 생기며 (4) fixed 위로가기 버튼이 옆으로 밀리는 회귀가 반복 발생.

**원인 두 가지**:
1. 어떤 자손이 100vw 초과 → 가로 스크롤 가능
2. 어떤 ancestor (body / page wrapper / IX2 가 박은 transform) 에 `transform`/`filter`/`perspective` 가 걸려 새 containing block 생성 → 자식의 `position: fixed` 가 viewport 가 아닌 그 ancestor 기준으로 잡혀 함께 스크롤됨

### ⚠️ overflow-x: hidden 절대 금지 (재시도 금지)

`overflow-x: hidden` 을 쓰면 브라우저가 `overflow-y` 를 `auto` 로 묵시 승격시킴 → **body 가 스크롤 컨테이너로 승격** → 자손의 `position: sticky` 가 viewport 가 아닌 body 기준이 되어 무력화됨 (서브헤더가 헤더 밑에 안 붙는 직접 원인).

`overflow-x: clip` 은 overflow-y 에 영향을 주지 않아 sticky 가 정상 동작. 가로 스크롤 차단 효과는 동일. 현대 브라우저 (iOS Safari 16+ / Chrome 90+ / Firefox 81+) 모두 지원.

### 변경하면 안 되는 것

- ❌ `overflow-x: clip` → `hidden` 으로 회귀 (sticky 즉시 깨짐)
- ❌ `html, body` 의 `overflow-x` 규칙 제거 (가로 스크롤 회귀)
- ❌ `body / .page-wrapper / main wrapper` 의 `transform: none !important` 제거 (IX2 가 박는 transform 으로 fixed 어긋남 재발)
- ❌ `header.header { position: fixed !important; top: 0 !important; transform: none !important }` 의 어느 한 줄도 약화 (모바일 hide-on-scroll 회귀)
- ❌ `section.subheader { position: sticky !important; top: var(--header-h, 56px) !important }` (about.css) 의 sticky 모드 변경

### 시도했다가 실패한 방식 (재시도 금지)

- PR #586: `overflow-x: hidden !important` → 가로 스크롤은 막혔으나 서브헤더 sticky 동시 파괴 (이 LOCKED 의 핵심 교훈)
- header 만 fixed 처리, body transform 무력화 누락 → IX2 의 wrapper transform 으로 fixed 어긋남 재발

### 디버그

모바일에서 회귀 의심 시:
```js
// DevTools console — body 의 스크롤 컨테이너 여부 확인
getComputedStyle(document.body).overflowY  // 'visible' 이어야 함. 'auto' 면 sticky 깨짐
// transform 박힌 ancestor 확인
[...document.querySelectorAll('body *')].filter(el => getComputedStyle(el).transform !== 'none').slice(0, 5)
```

---

## 프로젝트 개요
Webflow로 만든 Helix 동물병원(helix-amc) 사이트의 커스텀 CSS/JS를
GitHub에서 관리하고 jsDelivr CDN으로 자동 배포하는 구조.

## 핵심 아키텍처 — **Bootstrap 패턴**

Webflow Page Settings의 `<head>`에 **딱 두 줄**만 붙여져 있음:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/home/bootstrap.js"></script>
```

`home/bootstrap.js`가 런타임에 GitHub API로 `main` 브랜치 최신 커밋 SHA를
조회해서, 그 SHA의 immutable jsDelivr URL로 CSS/JS를 동적 로드함.
이 덕분에 **jsDelivr `@main` 캐시 꼬임 문제를 원천 회피**.

## 배포 플로우
1. `home/**` 아래 파일 수정 → 커밋 → `main` 푸시
2. `.github/workflows/webflow-deploy.yml` 자동 실행 → bootstrap.js의 jsDelivr 캐시 퍼지
3. 사용자 사이트 새로고침 시 bootstrap이 최신 SHA 조회 → 즉시 반영
4. **Webflow 건드릴 일 없음** (최초 1회 붙여넣기 외)

## 파일 구조
```
home/
├── bootstrap.js              # 동적 로더 — 거의 건드리지 않음
├── section1/
│   ├── section1.css          # Hero 섹션 스타일
│   └── section1.js           # GSAP 타임라인 (슬로건/배경/버튼 순차 등장)
├── section-divider/
│   ├── divider.css           # S1→S2 연결선 (1px #0075d6)
│   └── divider.js            # 스크롤 연동 draw/erase 애니메이션
└── global/
    ├── buttons.css           # .bt-box-1~4 글로우
    └── buttons.js            # IntersectionObserver 트리거
```

## 주요 CSS 클래스 참조
- `.discover-helix_button` — Hero 메인 버튼 (알맹이)
- `.bt-box-1` ~ `.bt-box-4` — 버튼 래퍼 (글로우 효과 대상, `.bt-box-4`만 퍼플)
- `.flex-block-23 .cta-style` — 섹션별 CTA
- `.home_slogan`, `.div-block-150`, `.home_background` — Hero 영역 요소
- `.section2-heading` — (선택) 섹션 2 헤딩 명시용. 없으면 divider.js가 DOM 자동 탐지

## 색상 규약
- 메인 블루: `#0075d6`
- SVIC 퍼플: `#5528aa`
- 배경: `#0d1117`

## ⚠️ 버튼 글로우 — 건드리지 말 것 (LOCKED v4)

**모든 페이지 / 모든 버튼 통일 사양** (홈 + about 일괄 적용)

### 글로우 값 (단일 그림자 + α 변동)

| 종류 | 셀렉터 | box-shadow |
|---|---|---|
| 블루 | `.bt-box-1/2/3` (홈) / `.cta_seocho_button`, `.cta-style` (about) | `0 0 0.85vw 0.3vw rgba(0,117,214,α)` |
| 퍼플 (SVIC) | `.bt-box-4` (홈) / `.link-block` (about) | `0 0 1.05vw 0.5vw rgba(85,40,170,α)` |

- α 피크 (0%/100%): **1.0**
- α 밸리 (50%): **0.55**
- 주기: **5.0s**, 이징: **`cubic-bezier(0.445, 0.05, 0.55, 0.95)`** (easeInOutSine)
- blur/spread는 피크-밸리 동일, **α만 변동**

### 시퀀스 (모든 버튼 공통)

1. 초기화 시 maxGlow inline `!important` 설정 (피크 α=1.0)
2. 버튼 opacity 0→1 페이드인 (글로우도 opacity에 편승해 같이 등장)
3. 페이드인 완료 후 **1.5초 홀드** (피크 유지)
4. inline `box-shadow` 제거 + `is-looping` 클래스 추가 → CSS keyframe shimmer 핸드오프

### 통제 주체

| 버튼 | 페이드인 통제 | 키프레임 |
|---|---|---|
| `.bt-box-1` | `home/section1/section1.js` (Hero 시퀀스) | `glowShimmerBlue` @ `home/global/buttons.css` |
| `.bt-box-2` | `home/global/sections-animations.js` (sec2 ScrollTrigger) | `glowShimmerBlue` |
| `.bt-box-3` | `home/global/sections-animations.js` (sec3 ScrollTrigger) | `glowShimmerBlue` |
| `.bt-box-4` | `home/global/buttons.js` (IntersectionObserver) | `glowShimmerPurple` |
| `.cta_seocho_button`, `.cta-style` | `about/about.js` (IntersectionObserver) | `aboutGlowShimmerBlue` |
| `.link-block` | `about/about.js` (IntersectionObserver) | `aboutGlowShimmerPurple` |

### 핵심 포인트

- 베이스 `transition: box-shadow 0.6s` 가 is-looping 전환에 개입하지 않도록 `.is-looping` 에 `transition: none !important` 필수
- 글로우 페이드인은 **별도 GSAP 트윈을 하지 않고** 버튼 자체의 opacity 페이드인에 편승 (안 그러면 v1, v2 처럼 어두운 상태에서 밝아지는 느낌이 남)
- `home/global/buttons.js` 셀렉터에 `.bt-box-1`, `.bt-box-2`, `.bt-box-3` 의도적 제외 — 각각 section1.js / sections-animations.js 가 통제 (race 방지)
- 페이드인 maxGlow 인라인 값과 키프레임 0%/100% 값은 **반드시 동일** — 핸드오프 시 점프 방지
- 새 페이지/버튼 추가 시: 위 표의 값 그대로 사용 + 동일 시퀀스 (페이드인 → 1.5s 홀드 → is-looping)

### 이전에 시도했다가 실패한 방식들 (재시도 금지)
- `is-holding` CSS 클래스 (`box-shadow !important`) → CSS animation 충돌로 shimmer 불가
- GSAP multi-shadow 트위닝 fromVars → 파싱 오류로 툭 꺼짐
- GSAP 0.5~0.6s 글로우 페이드인 트윈 → 덜 밝은 상태에서 밝아지는 느낌 (v1, v2)
- `is-looping`만 단독 추가 → 툭! 튀는 현상 (글로우가 nothing → max로 점프)

## 하면 안 되는 것
- Webflow API로 head code 직접 수정 시도 ❌
  → Site API 토큰으로는 `PUT /v2/sites/{id}/custom_code`가 `invalid_auth_version` 403 반환. OAuth App 아니면 불가.
- jsDelivr `@main` 직접 참조 (bootstrap.js는 예외) ❌
  → 캐시 꼬임. 항상 bootstrap 패턴 통해서 commit SHA로 로드.
- `@latest` 사용 ❌ → GitHub Release에 바인딩되며 업데이트 안 됨.
- 버튼 글로우 로직 수정 ❌ → 위 LOCKED v4 섹션 참조 (홈 + about 통일 사양).

## 디버그 팁
- 라인 애니메이션: URL에 `?debug-line=1` 추가 → 콘솔 로그
- 배포 확인: 시크릿 창으로 사이트 열고 DevTools Network에서 파일이 `cdn.jsdelivr.net/gh/.../@<sha>/...` 형태로 로드되는지 확인
- Actions Summary에서 붙여넣을 head code 다시 볼 수 있음

## ⚠️ About 섹션 1 Hero 폰트 swap 깜빡임 차단 — 건드리지 말 것 (LOCKED v1)

**커밋**: PR #450 (`about/section1: width-metric ground-truth 게이트`)

### 문제 (해결됨)

`.about-heading` 페이드인 중간에 폴백 폰트 → 지정 폰트로 swap 되며 깜빡이던 현상.

### 확정 메커니즘 — `whenHeroFontReady` + `waitFontByMetric` (about/about.js)

페이드인 시작 게이트는 **3중 직렬**:

1. **`whenHeroFontReady()`** — `document.fonts.load()` 다중 호출
   - hard-coded `HERO_FONT='ds-endendend'` weight 400/700
   - `.about-heading` / `.about_contents_sub-title` 의 **computed** font-family/weight/style 도 동적 추출해 명시 load (텍스트 인자 포함)
   - `document.fonts.ready` 까지 대기
   - `document.fonts.check()` 폴링 (~0.5s 상한)
   - 2x rAF layout/paint 동기화

2. **`document.fonts.ready`** — 페이지 내 모든 in-use 폰트 대기

3. **`waitFontByMetric()`** — width-metric ground-truth (FontFaceObserver 기법)
   - `'BESbswy'` 텍스트를 두 off-screen span 에 렌더 (monospace fallback / target+monospace)
   - 두 span 의 `offsetWidth` 가 달라지는 순간 = target 폰트 실제 적용
   - `.about-heading` 의 computed family/weight/style 로 측정
   - 4s 폴링 상한

폴백 타임아웃: **6초** (3중 게이트 모두 실패 시 강제 시작)

### 시도했다가 실패한 방식 (재시도 금지)

- `document.fonts.load('1em "ds-endendend"')` 두 weight 만 트리거 → 헤딩 weight 가 다르면 무용 (PR #447)
- `document.fonts.ready` 만 추가 → API 자체가 일찍 resolve (PR #447 만으론 부족)
- `document.fonts.check()` 폴링 추가 → 여전히 false positive 케이스 (PR #448 만으론 부족)
- computed font-family 동적 추출 → 그래도 swap 잔존 (PR #449 만으론 부족)
- 폴백 타임아웃을 너무 짧게 (2s 등) → 폰트 로드 느린 환경에서 게이트 무효화

### 변경하면 안 되는 것

- 3중 게이트 중 하나라도 제거 ❌ (각 게이트가 서로의 false positive 를 방어)
- width-metric 의 'BESbswy' 텍스트 / monospace 폴백 변경 ❌ (FontFaceObserver 정석값)
- 폴백 타임아웃 6s 단축 ❌
- `runTextTimeline()` 의 GSAP `gsap.set(allText, { opacity: 0 })` 순서 변경 ❌

### 디버그

`?debug-about=1` 콘솔 로그:
- `font metric: loaded <family> (<ms>ms)` — 정상
- `font metric: TIMEOUT <family>` — 4s 안에 swap 감지 못함 → preload `<link>` 처방 검토

---

## ⚠️ About 핵심 장비 섹션 (캐논 알페닉스) — 건드리지 말 것 (LOCKED v1)

**커밋**: `d7af70a` (about/equipment: 알페닉스만 페이드 + 나머지 IX2 무력화 #445)

### 확정 사양

대상 페이지: **about** (홈 아님)

DOM 구조:
```
section.blackframe_image-he             ← 배경 (인터랙션 없음)
└── section.clearframe
    └── div
        ├── h2.parag_title-w            "핵심 장비"          (인터랙션 없음)
        ├── div.div-block-130
        │   └── div.about_title-a-b
        │       ├── h1.official-font_title     "캐논 알페닉스"  ← 유일한 인터랙션
        │       └── h1.official-font_title_en  "Canon Alphenix" (인터랙션 없음)
        └── p.nomalparag-w_left-spacing  "병변을 3D 영상으로..." (인터랙션 없음)
```

### 유일한 인터랙션: 한글 캐논 알페닉스

| 항목 | 값 |
|---|---|
| 트리거 | IO `rootMargin: '0px 0px -25% 0px'`, `threshold: 0` |
| 페이드 | opacity 0→1, 1.6s, `cubic-bezier(0.87, 0, 0.13, 1)` |
| sweep 시작 | 페이드 fire 시점 +1700ms |
| sweep 파라미터 | `peakColor: '0,117,214'`, `peakAlpha: 0.85`, `bandWidth: 14`, `duration: 1700` |
| sweep 메커니즘 | `helixShineSweep` (About Mini Title LOCKED v1 과 동일) |

### 핵심 메커니즘 — IX2 무력화

`about.js > initClearframeAlphenixReveal()` 가:
1. `section.blackframe_image-he` (없으면 `section.clearframe`) 안 모든 노드 순회
2. 알페닉스 h1 **제외** 한 모든 노드에서:
   - `data-w-id` 제거 → Webflow IX2 바인딩 차단
   - 인라인 `opacity` / `transform` / `visibility` 제거
   - `opacity:1` / `visibility:visible` / `transform:none` **!important 인라인** 강제
3. 다중 시점(즉시 / +300ms / +1200ms) — IX2 늦은 바인딩 커버

### 시도했다가 실패한 방식 (재시도 금지)

- `section.clearframe` 전체 opacity 0→1 페이드 → 헤드/영문/본문이 모두 같이 페이드돼 사용자 사양 위반 (PR #443/#444 이전 상태)
- 홈 페이지에 `home/equipment/equipment.js` 등록 → 핵심 장비 섹션은 about 페이지에만 있어 home 에선 무동작 (#443/#444). 현재 무해하지만 정리 보류 — 추후 home 에 같은 섹션 생기면 활용
- CSS `!important` 만으로 IX2 인라인 덮기 시도 → IX2 가 바인딩되면 매 프레임 opacity 갱신 가능성 → 인라인 !important + `data-w-id` 제거 둘 다 필요

### 변경하면 안 되는 것

- 캐논 알페닉스 외 다른 요소에 fade / scale / 인터랙션 추가 ❌
- 섹션 전체 페이드로 회귀 ❌
- sweep 파라미터 (peakAlpha 0.85, bandWidth 14, duration 1700) 변경 ❌
- 다중 시점 무력화 줄이기 ❌ (IX2 타이밍 race 재발)

---

## ⚠️ About Mini Title 빛반사 — 건드리지 말 것 (LOCKED v1)

**커밋**: `6d65738` (about: 빛반사 bg-clip 모드 영구 유지로 어긋남 제거)

### 확정 사양

대상: `about/about.js` 의 `.about_mini_title` 중 **텍스트 정확 매칭 4개**
- "일년 365일", "하루 24시간", "특화", "응급 케어"

| 항목 | 값 |
|---|---|
| peakColor | `0,117,214` (메인 블루) |
| peakAlpha | `0.6` |
| bandWidth | `28` (피크 ±28% gradient stop) |
| duration | `1500ms` |
| start delay | `150ms` (그룹 진입 후 첫 sweep 까지) |
| gap | `200ms` (sweep 종료 후 다음 sweep 까지) |
| bg-size | `500% 100%` (양 끝 모두 tint 가시 영역 밖) |
| keyframes | `helix-shine-sweep`: bg-position 100% → 0% |
| timing | `cubic-bezier(0.7, 0, 1, 1)` (급격한 ease-in) |
| trigger | 가장 가까운 안정적 부모 (section/main) IntersectionObserver, 카드덱 transform 회피 |
| 그룹 발사 | 같은 트리거 안의 mini title 들은 한 그룹으로 **순차** 재생 |

### 핵심 메커니즘 (재발 방지)

1. **`helixShinePrime`**: 페이지 로드 시점에 4개 mini title 모두 `bg-clip:text` + 단색 그라데이션 + `color:transparent` 영구 적용. 모드 전환 자체를 없앰.
2. **`helixShineSweep`**: bg-image 만 sweep 그라데이션으로 swap → 애니메이션 → 종료 후 단색 그라데이션으로 다시 swap. 렌더링 모드는 항상 동일.
3. base 색은 `getComputedStyle().color` 에서 RGBA 모두 파싱 (알파 보존). peakRGB 는 base 색과 peakColor 를 peakAlpha 로 미리 믹스해 stop 모두 동일 알파.
4. tint stop (`lo% ~ hi%`) 이 시작/종료 visible window 밖에 위치 → 잔여 틴트 없이 자연 종료.

### 시도했다가 실패한 방식 (재시도 금지)

- 오버레이 span 방식 (absolute position) → 1~2px 어긋난 안티앨리어스 가장자리가 흰 띠로 보임
- bg-clip:text 모드를 sweep 시점에만 적용/해제 → 모드 전환마다 글리프 렌더링이 바뀌어 "툭" 어긋남
- `mix-blend-mode: screen` → 부모 stacking context 와 충돌해 sweep 자체가 안 보임
- `background-size: 200%` + position `-25%` 오버슈트 → 좌측 25% 영역이 bg 커버 밖으로 빠져 와이퍼 재발
- 단일 sentinel 로 4개 동시 발사 → 카드덱 아래쪽 카드의 sweep 이 사용자 도달 전에 이미 끝남
- 엘리먼트 자체에 IntersectionObserver → 카드덱 transform 으로 intersect 가 안 잡혀 영영 발사 안 됨
- `transition` + RAF 더블 트릭 → 시작점 페인트를 건너뛰고 종료점만 보여주는 케이스 발생

## 📌 Version Backup 1 (섹션 1 버튼까지 확정)

**커밋**: `828e698` (divider: BTN1_CLASS .discover-helix_button으로 복원)

**안정적 상태**:
- ✅ 섹션 1 Hero: 슬로건/버튼/배경 페이드인 애니메이션
- ✅ 버튼 1 글로우: LOCKED (절대 수정 금지)
- ⚠️ 섹션 1-2 헬릭스 라인: 위치 조정 중

**복원 방법**: `git revert d94c9d4` (현재) → `828e698`로 돌아옴

---

---

## ⚠️ About 본문 박스 (.about_three_contents-box) — 건드리지 말 것 (LOCKED v1)

**커밋**: PR #553 → #554 → #555 (staging) → 본 PR 로 정식

### 확정 사양

대상: `.about_three_contents-box` (about 페이지 섹션 2 본문 박스 3개)

**인터랙션 전면 제거 — 항상 처음부터 그대로 표시.** 슬라이드 X, 페이드인 X, blur X.

### 확정 메커니즘

`about/about.css`:
```css
.about_three_contents-box,
.about_three_contents-box.is-visible {
  opacity: 1 !important;
  transform: none !important;
  filter: none !important;
  transition: none !important;
}
```

`about/bootstrap.js` FOUC 가드: `.about_three_contents-box` **제외**
(초기 `opacity:0` 박지 않음. 안 그러면 FOUC 가드 0 이 잠깐 보임).

### 시도했다가 실패한 방식 (재시도 금지)

- CSS 의 `translateX(-40px)` + `blur(4px)` 만 제거하고 opacity 페이드 유지 (PR #553) → 슬라이드 자체는 Webflow IX2 인라인 transform 이 박혀서 여전히 좌→우 이동
- `transform: none !important` 추가하되 opacity 페이드 유지 (PR #554) → 슬라이드는 멎었으나 페이드인 깜빡임이 남음
- about.js 에서 `.is-visible` 토글 코드를 건드리는 방식 → `initViewport60FadeIn` 이 `.about_contents-title` 등 다른 요소와 같은 셀렉터 묶음으로 처리해서 분리 어려움. CSS 측 `!important` 무력화가 더 깔끔.

### 변경하면 안 되는 것

- `.about_three_contents-box` 에 다시 페이드/슬라이드/blur 추가 ❌
- bootstrap FOUC 가드에 `.about_three_contents-box` 다시 포함 ❌
- 인터랙션 추가 요구가 와도, **사용자가 명시적으로 LOCKED v1 해제 지시** 하기 전까지 절대 손대지 말 것
- 다른 about 인터랙션 (헥사, history, 알페닉스 등) 수정 중에 이 박스의 `!important` 들을 약화시키지 말 것

### 참고 — Webflow IX2 인라인 transform

이 박스는 Webflow Designer 에서 `data-w-id` 인터랙션이 걸려 있어 페이지 진입 시 IX2 가 인라인 `transform: translateX(...)` 를 박음. CSS `!important` 가 IX2 인라인을 이기는 패턴 — IX2 가 인라인 `!important` 까지 박는 회귀가 발생하면 `about.js` 에서 박스의 `data-w-id` 를 제거하는 방식으로 에스컬레이션 (알페닉스 LOCKED v1 패턴).

---

## ⚠️ 헬릭스 라인 — 건드리지 말 것 (LOCKED v14)

**커밋**: `9f83866` (divider: erase end 25%→40%)

**확정 동작**:
- Draw: 버튼 바텀이 뷰포트 center 도달 시 그리기 시작 → 섹션2 헤딩 top 75% 도달 시 완성
- Hold: 버튼이 헤더에 완전히 가려질 때까지 풀 라인 유지
- Erase: 버튼 바텀이 헤더 하단에 닿는 순간 꼬리 출발 → 섹션2 헤딩 top 40% 도달 시 소멸
- SVG z-index: 헤더 z-index -1 (런타임 감지) → 헤더 아래에 위치

**핵심 교훈 (재시도 금지)**:
- erase `start: 'top bottom'` → scrollY<0 발사, 페이지 로드 시 44% 진행 → 라인 섹션 경계에서 출현
- navbar 변수 스코프 오류 (createSVGLine 지역변수를 initAnimationOnce에서 참조) → ReferenceError → 라인 미생성

---

## 📌 Version Current (섹션 2-4 애니메이션 작동 확인)

**주요 파일**:
- 📄 `home/global/sections-animations.js`: 섹션 2-4 애니메이션
  - 섹션 2, 3 헤딩 fade-in (`.section2-heading` × 2)
  - 섹션 4 카드 스태거 + 그림자 + SVICC 슬라이드 인
  - 복사 버튼 / 전화 링크 핸들러
- 🎨 `home/global/sections-animations.css`: 초기 숨김 상태

**핵심 수정사항**:
- 실제 Webflow DOM 클래스명으로 선택자 교체 (`.section2-heading`, `.home_branch-card`, `.home_background_svicc`, `.copy-text-button`)
- `helix-s1-done` 이벤트 수신 → `ScrollTrigger.refresh()` 호출
  - section1.js가 bt-box-1을 detach/restore하는 동안 측정된 위치는 stale
  - refresh 없으면 트리거가 "이미 지나감"으로 잘못 판단하여 애니메이션 발사 안 됨
- 1.5초 load 폴백 refresh 추가
- 카드 컨테이너 폴백: `.flex-block-23` → `#animal-medical-center` → 첫 카드 부모

**디버그**: URL에 `?debug-sections=1` 추가하면 `[Sections]` 로그 출력

## 컨텍스트
- Webflow Site ID: `69d090ea69d828e27d16ea29`
- GitHub 리포: `pookat73-prog/helixamc-webflow`
- 기본 브랜치: `main`
- 사용자 소통 언어: **한국어**
