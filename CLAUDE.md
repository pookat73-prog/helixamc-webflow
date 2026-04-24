# Helix AMC Webflow — Claude 작업 가이드

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

## ⚠️ 버튼 글로우 — 건드리지 말 것 (LOCKED v3)

**모든 버튼 통일 동작**: 최고밝기 초기 설정 → 버튼 opacity 페이드인하면서 글로우도 같이 등장 → 1.5s 홀드 → shimmer/pulse

### bt-box-1 (section1.js + buttons.css)

| 파일 | 역할 |
|---|---|
| `home/section1/section1.js` | 초기화 시 box-shadow 최고밝기 inline !important 설정 → opacity 페이드인 → 완료 후 1.5s setTimeout → inline 제거 + `is-looping` 추가 |
| `home/global/buttons.css` | `.bt-box-1.is-looping { animation: glowShimmerBlue 2.4s infinite; transition: none !important }` |

**동작 순서:**
1. 초기화 시 `box-shadow: 0 0 2.6vw 0.9vw rgba(0,117,214,1) !important` inline 설정
2. 버튼 opacity 0→1 페이드인 (GSAP, 0.8s) — opacity가 box-shadow에도 적용되므로 글로우도 같이 페이드인
3. 페이드인 완료 후 1.5초 홀드 (최고밝기 유지)
4. inline box-shadow 제거 + `is-looping` 클래스 추가 → CSS shimmer (78%~100%, 2.4s 주기)

### bt-box-2/3/4 (buttons.js)

| 역할 |
|---|
| IntersectionObserver가 버튼 viewport 진입 감지 → `gsap.set`으로 maxGlow 즉시 설정 → 1.5s 홀드 후 pulse loop (yoyo minGlow ↔ maxGlow) |

**핵심 포인트:**
- `.bt-box-1` 베이스 `transition: box-shadow 0.6s`가 is-looping 전환 시 개입하지 않도록 `.is-looping`에 `transition: none !important` 필수
- 글로우 페이드인은 **별도 GSAP 트윈을 하지 않고**, 버튼 자체의 opacity 페이드인에 편승
- bt-box-2/3/4는 opacity 페이드인이 없으면 Webflow 기본 reveal 타이밍에 맞춰 IntersectionObserver가 발사

**이전에 시도했다가 실패한 방식들 (재시도 금지):**
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
- bt-box-1 글로우 로직 수정 ❌ → 위 LOCKED 섹션 참조.

## 디버그 팁
- 라인 애니메이션: URL에 `?debug-line=1` 추가 → 콘솔 로그
- 배포 확인: 시크릿 창으로 사이트 열고 DevTools Network에서 파일이 `cdn.jsdelivr.net/gh/.../@<sha>/...` 형태로 로드되는지 확인
- Actions Summary에서 붙여넣을 head code 다시 볼 수 있음

## 📌 Version Backup 1 (섹션 1 버튼까지 확정)

**커밋**: `828e698` (divider: BTN1_CLASS .discover-helix_button으로 복원)

**안정적 상태**:
- ✅ 섹션 1 Hero: 슬로건/버튼/배경 페이드인 애니메이션
- ✅ 버튼 1 글로우: LOCKED (절대 수정 금지)
- ⚠️ 섹션 1-2 헬릭스 라인: 위치 조정 중

**복원 방법**: `git revert d94c9d4` (현재) → `828e698`로 돌아옴

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
