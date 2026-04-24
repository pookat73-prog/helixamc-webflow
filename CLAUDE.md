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

## ⚠️ bt-box-1 글로우 — 건드리지 말 것 (LOCKED)

**현재 작동 중인 구현** (`commit 1f2f7b2`, 확정):

| 파일 | 역할 |
|---|---|
| `home/section1/section1.js` | 페이드인 완료 후 GSAP으로 글로우 0.5s 페이드인, 완료 시 `clearProps` + `is-looping` 클래스 추가 |
| `home/global/buttons.css` | `.bt-box-1.is-looping { animation: glowShimmerBlue 2.4s infinite ease-in-out }` |

**글로우 동작 순서 (절대 바꾸지 말 것):**
1. 버튼 opacity 0→1 페이드인 (GSAP, 0.8s)
2. GSAP `boxShadow` 0→`2.6vw 0.9vw rgba(0,117,214,1)` 페이드인 (0.5s)
3. `gsap.set(box1, { clearProps: 'boxShadow' })` → `box1.classList.add('is-looping')`
4. CSS `glowShimmerBlue` 애니메이션 (78%~100% 밝기, 2.4s 주기) 아롱아롱 유지

**이전에 시도했다가 실패한 방식들 (재시도 금지):**
- `is-holding` CSS 클래스 (`box-shadow !important`) → CSS animation 충돌로 shimmer 불가
- GSAP multi-shadow 트위닝 (`'... rgba(...), ... rgba(...)'`) → 파싱 오류로 툭 꺼짐
- `is-looping`만 단독 추가 (GSAP 페이드인 없이) → 팟! 튀는 현상

**bt-box-1에만 해당** — bt-box-2/3/4는 `buttons.js`의 IntersectionObserver + GSAP으로 별도 관리.

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

## 컨텍스트
- Webflow Site ID: `69d090ea69d828e27d16ea29`
- GitHub 리포: `pookat73-prog/helixamc-webflow`
- 기본 브랜치: `main`
- 사용자 소통 언어: **한국어**
