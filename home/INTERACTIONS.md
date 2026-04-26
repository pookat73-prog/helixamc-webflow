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

## 3. Section 1 → Section 2 연결선 (Helix Connector)

버튼 1(`.discover-helix_button`) 하단 중앙에서 섹션 2 헤딩 상단까지
스크롤 연동 **그려지다 지워지는** SVG 사인파 헬릭스 선 (ScrollTrigger 구동).

### 구현 방식

- **요소**: `<svg class="helix-line-svg">` + `<path class="helix-line-path">`
- **경로**: 진폭 14px, 5주기 사인파 (120포인트 폴리라인)
- **애니메이션**: GSAP ScrollTrigger + `stroke-dashoffset`
- **위치**: JS에서 동적 측정 (button 중앙 기준, height = button bottom → sec2 heading top)

### ScrollTrigger Timeline

```javascript
gsap.timeline({
  scrollTrigger: {
    trigger: ".discover-helix_button",
    start: "bottom center",
    endTrigger: ".section2_heading", 
    end: "center center",
    scrub: true  // scroll-linked
  }
})
```

### 2단계 애니메이션

| 단계  | 구간                     | 동작                                            |
|-------|--------------------------|------------------------------------------------|
| Draw  | trigger → ~80% of 범위   | `strokeDashoffset: L → 0` (위에서 아래로 그려짐) |
| Erase | ~60% of 범위 → end       | `strokeDashoffset: 0 → -L` (시작점 따라오며 지움) |
| 겹침  | 20%                      | 두 단계가 겹쳐서 부드러운 전환                 |

### 섹션 2 헤딩 탐지

1. `.section2-heading` 클래스 우선
2. 없으면 버튼 조상의 형제에서 첫 heading(`h1~h4`, `class*="heading"`) 자동 탐색

### 스타일

- **색상**: `#0075d6` (메인블루)
- **두께**: 1px
- **z-index**: 9999
- **stroke 속성**: linecap=round, linejoin=round (부드러운 끝)

### 의존성

- GSAP 3.12.2 (이미 Webflow head에 로드됨)
- **ScrollTrigger** (bootstrap.js에서 자동 로드)

### 옵션

- URL `?debug-line=1` 또는 `window.DEBUG_SECTION_LINE = true` → 상세 로그 + ScrollTrigger 마커

### 파일

- `home/section-divider/divider.js` — SVG 생성, ScrollTrigger timeline, stroke-dashoffset 애니메이션
- `home/section-divider/divider.css` — 스타일 기본값

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
