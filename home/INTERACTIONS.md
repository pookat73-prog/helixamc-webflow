# 홈페이지 (Home) 인터랙션 기능 설명서

**대상 페이지**: 홈 (`/`)
**범위**: `home/` 디렉토리 내 모든 CSS/JS로 구현되는 인터랙션

> 다른 페이지(소개/진료/예약 등) 인터랙션은 각 페이지 디렉토리의
> `INTERACTIONS.md`로 별도 관리.
> 배포·아키텍처 정보는 루트 `CLAUDE.md` 참고.

---

## 1. Section 1: Home Hero 등장 애니메이션

페이지 로드 시 슬로건 → 버튼 → 배경 순서로 차례 등장하는 GSAP 타임라인.

### 타임라인

| 요소           | 클래스            | 시작(delay) | 지속 | 이징                                   |
|----------------|-------------------|-------------|------|----------------------------------------|
| 슬로건         | `.home_slogan`    | t=0.3s      | 1.2s | 비대칭 ease-in-out (in 60% / out 40%)  |
| 버튼 래퍼      | `.bt-box-1`       | t=1.3s      | 0.8s | `expo.out` (확 켜졌다 서서히 안착)     |
| 배경           | `.div-block-150`  | t=1.45s     | 1.5s | 비대칭 ease-in-out (in 75% / out 25%, power3) |

**의도**: 슬로건이 충분히 부각된 뒤(약 1초 간격), 버튼과 배경이 거의
동시에 붙어 등장 — "슬로건~~~~~~~~~~~배(버)경튼" 타이밍 감각.

### 비대칭 이징

`asymInOut(inRatio, inPow)` — `home/section1/section1.js` 내부 구현.
- `inRatio`: ease-in 구간이 전체에서 차지하는 비율
- `inPow`: ease-in 파워 (2=quad, 3=cubic)
- 0.5 지점을 경계로 앞쪽은 `Math.pow(t, inPow)`, 뒤쪽은 quadratic ease-out

### Virtual Placeholder (DOM 분리)

`.home_slogan`·`.bt-box-1`은 Webflow 구조상 `.div-block-150`의 **자식**.
CSS `opacity`는 부모에서 자식으로 캐스케이드되므로 배경을 fade-in 하는 동안
자식도 함께 가려지는 문제가 있음. 해결:

1. 페이지 로드 시 각 자식을 `cloneNode(true)`해서 **고스트**(투명
   placeholder)를 원래 위치에 삽입 → 레이아웃 slot 유지
2. 원본은 `.div-block-150`의 부모 요소로 이동, `position: absolute` +
   측정된 좌표로 고스트 위에 고정 → 배경 opacity 상속 차단
3. 배경 fade 완료(≈ t=2.95s) 시점에 원본을 원래 DOM 위치로 복귀 +
   고스트 제거 → 반응형 레이아웃 재개

구현: `home/section1/section1.js` 의 `detachWithGhost()`

### 옵션

- URL `?debug-s1=1` 또는 `window.DEBUG_SECTION1 = true` → 상세 로그

### 파일

- `home/section1/section1.js` — 타임라인·이징·DOM 분리 로직
- `home/section1/section1.css` — FOUC 방지 초기 숨김, `.home_background` 검은 도화지

---

## 2. 글로벌 버튼 글로우 (`.bt-box-1` ~ `.bt-box-4`)

파란색 계열(`#0075d6`) 3종과 SVIC 퍼플(`#5528aa`) 1종의 "숨 쉬는" 글로우.
홈페이지에 국한되지 않고 사이트 전역에서 사용되는 공통 효과.

### 2단계 상태 머신

| 상태           | 클래스        | 효과                                         |
|----------------|---------------|----------------------------------------------|
| 기본           | (없음)        | `transition: box-shadow 0.6s ease` 대기      |
| 정적 풀 글로우 | `.is-holding` | `box-shadow: 0 0 0.8vw 0.25vw <color 0.85>`  |
| 브리딩 루프    | `.is-looping` | `glowLoopBlue` / `glowLoopPurple` 2.8s infinite |

### Keyframes

```
@keyframes glowLoopBlue  /* 또는 Purple */
  0%, 100% → max glow (is-holding과 동일 수치, 필수 일치)
  50%      → min glow  (0.4vw 0.1vw, alpha 0.08)
```

### 트리거

- **Section 1 버튼 (`.bt-box-1`)**: `section1.js`가 fade-in `onStart`
  시점에 `is-holding` 추가, `onComplete` 후 1.5s 뒤 `is-looping` 추가
- **그 외 버튼들**: `buttons.js`의 IntersectionObserver가 threshold 0.3으로
  관찰 → 뷰포트 진입 시 `is-holding` → 1.5s 뒤 `is-looping`
- **중복 방지**: section1.js가 관리하는 `.bt-box-1`에 `data-s1-init`
  속성을 찍어두면 buttons.js는 건너뜀. 고스트 placeholder(`data-s1-ghost`)도 제외.

### 파일

- `home/global/buttons.css` — 글로우 스타일·keyframes
- `home/global/buttons.js` — IntersectionObserver 트리거

---

## 3. Section 1 → Section 2 헬릭스 라인 (Double-Helix Connector)

버튼 1(`.discover-helix_button`) 하단 중앙에서 섹션 2 헤딩 상단까지
스크롤에 반응해 그려지다 지워지는 **DNA 이중나선** SVG.
두 사인 곡선(strand)이 서로 180° 위상차로 꼬이고, 사이에 base-pair
rungs가 일정 간격으로 그려져 헬릭스 모티브를 형성.

### 3 페이즈 (clipPath 마스킹)

| 페이즈 | 범위                                    | 동작                                  |
|--------|-----------------------------------------|---------------------------------------|
| 1      | 스크롤 시작 → 버튼 하단 뷰포트 이탈     | 위→아래로 그려짐 (bottom clip 1→0)    |
| 2      | 버튼 이탈 → 섹션 2 헤딩 50vh 도달       | 위에서부터 **느리게** 지워짐 (top 0→0.65) |
| 3      | 섹션 2 50vh → 15vh                      | 시작점이 도착점까지 **가속하며 수렴** (top 0.65→1, bottom 고정) |

**도착점은 절대 튕기지 않음** — Phase 3에서 `cBot = 0` 고정, `cTop`만 이동.

### 마일스톤 (절대 y 좌표)

- `M1 = btnBot_abs` (버튼 하단 절대 위치)
- `M2 = s2Top_abs - vh * 0.5`
- `M3 = s2Top_abs - vh * 0.15`

### Clip 계산

`clipPath: inset(<cTop>% 0 <cBot>% 0)` — 상단 cTop% + 하단 cBot%만 잘라냄.
SVG 컨테이너(`<div>`)에 적용되어 내부 strand·rungs까지 함께 마스킹.

### 헬릭스 지오메트리

- 컨테이너 폭: **28px**, `transform: translateX(-50%)`로 버튼 중앙 정렬
- Strand 진폭: ±10px (중심축 cx=14)
- 꼬임 수: `Math.max(2, round(lineH / 220))` — 대략 220px 당 1회 꼬임
  - lineH가 정수배 wavelength가 되도록 강제하여 양 끝(y=0, y=lineH)에서
    두 strand가 정확히 중앙(x=14)에 수렴
- Strand 보간: 2px 단위 선분으로 사인 근사 (1px stroke 기준 충분히 매끄러움)
- Rungs: 각 quarter-wavelength 위치(strand 최대 분리점)에 수평 1쌍 선분
- 높이 변경 시에만 path `d` 재생성 (캐시 `_lastH`, 스크롤 시 매 프레임
  재계산하지 않음 → 성능 보호)

### 섹션 2 헤딩 탐지

1. `.section2-heading` 클래스 우선
2. 없으면 버튼 조상의 형제에서 첫 heading(`h1~h4`, `class*="heading"`) 자동 탐색

### 스타일

- 색상: `#0075d6` (메인블루)
- Strand stroke: 1px (round cap·join)
- Rungs stroke: 0.75px, opacity 0.45 (보조 모티브 — 시각 노이즈 최소화)
- z-index: 9999
- `will-change: clip-path` (GPU 합성)

### 옵션

- URL `?debug-line=1` 또는 `window.DEBUG_SECTION_LINE = true`
  → 마일스톤·clip·헬릭스 재빌드 로그

### 파일

- `home/section-divider/divider.js` — SVG 생성·헬릭스 path 빌더·스크롤 update 루프 (RAF throttle)
- `home/section-divider/divider.css` — 컨테이너·strand·rungs 스타일

---

## 4. 배포 파이프라인 (Bootstrap 패턴)

Webflow head에 **한 번만** 붙여넣는 스크립트 2줄 → 이후 `main` 브랜치
푸시만으로 즉시 반영.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/home/bootstrap.js"></script>
```

### 동작

1. `bootstrap.js`가 GitHub API로 `main` 최신 커밋 SHA 조회
2. SHA-핀 immutable jsDelivr URL로 CSS/JS 6종 동적 로드
3. SHA URL에서 404가 나면 개별 파일 단위로 `@main` 폴백
4. GitHub API 전체 실패 시 → 전 파일 `@main` 폴백

### 자동화

- `.github/workflows/webflow-deploy.yml`: `home/**` 푸시 시 자동 실행,
  `bootstrap.js`의 `@main` jsDelivr 캐시 퍼지

### 로드 순서 (bootstrap.js `FILES` 배열)

```
home/section1/section1.css
home/section1/section1.js
home/section-divider/divider.css
home/section-divider/divider.js
home/global/buttons.css
home/global/buttons.js
```

`script.async = false`로 스크립트 실행 순서 보장.

---

## 5. 색상·값 규약

- 메인 블루: `#0075d6`
- SVIC 퍼플: `#5528aa`
- 다크 배경: `#0d1117`
- 글로우 max: `0.8vw 0.25vw` (spread / blur)
- 글로우 min: `0.4vw 0.1vw`
- 글로우 alpha: max 0.85 / min 0.08

---

## 6. 향후 확장 메모

- 홈페이지 추가 섹션은 `home/section{N}/` 디렉토리로 분리
- 새 CSS/JS는 `bootstrap.js`의 `FILES` 배열에 추가 필요
- 공통 훅(글로우·라인 스타일)은 `home/global/` 재사용
- **다른 페이지 인터랙션 작업 시**: 해당 페이지 루트에
  `{page}/INTERACTIONS.md` 새로 만들고 `{page}/bootstrap.js`(또는 통합
  bootstrap) 로드 전략 별도 문서화
