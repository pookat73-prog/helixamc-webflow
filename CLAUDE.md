# Helix AMC Webflow — Claude 작업 가이드

## 워크플로우
- 작업 완료(커밋·푸시) 후 자동으로 PR 생성, 자동 머지까지 수행.

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
