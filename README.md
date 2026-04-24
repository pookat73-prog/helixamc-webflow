# helixamc-webflow

Webflow 커스텀 코드를 GitHub에서 관리하는 레포입니다. jsDelivr CDN으로 배포되며, `latest` 브랜치 푸시 시 자동 릴리스 + CDN 퍼지 + Webflow publish가 실행됩니다.

## 구조

```
home/
  section1/
    section1.css         섹션 1 히어로 글로우 스타일
    section1.js          섹션 1 GSAP 타임라인 로직
  section-divider/
    divider.css          Button 1 → Section 2 수직 연결선 스타일
    divider.js           DOM 주입 + 동적 위치 계산
  global/
    buttons.css          전체 버튼(Bt Box 1~4) 후광 스타일
    buttons.js           IntersectionObserver 트리거 로직
.github/workflows/
  webflow-deploy.yml     push 시 릴리스 생성 → Webflow publish → CDN 퍼지
```

## Webflow 임베드

### 페이지 세팅 (홈)
**Page Settings > Custom Code > Head Code**:
```html
<!-- Section 1 Hero Animation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section1/section1.css">
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section1/section1.js"></script>

<!-- Section Divider (S1 → S2) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section-divider/divider.css">
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section-divider/divider.js"></script>
```

### 사이트 세팅 (전역)
**Site Settings > Custom Code > Head Code**:
```html
<!-- Global Button Glow -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/global/buttons.css">
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/global/buttons.js"></script>
```

> GSAP는 페이지 세팅에서 한 번만 로드됩니다. 중복 로드 금지.
> 캐시 문제 시 `@latest` → `@<commit-SHA>` 또는 `@<release-tag>` (예: `@auto-20260424030232`).

## Webflow 클래스 요구사항

| 파일 | 필요 클래스 | 설명 |
|------|-----------|------|
| section1.js | `.home_slogan` `.div-block-150` `.discover-helix_button` `.flex-block-23` | 히어로 등장 순서 대상 |
| divider.js | `.discover-helix_button` (Button 1) `.section2-heading` | 선의 시작/끝 앵커 |
| buttons.js | `.bt-box-1` `.bt-box-2` `.bt-box-3` `.bt-box-4` | 후광 트리거 대상 |

## 배포 플로우

```
latest 푸시 (home/** 변경)
  ↓
webflow-deploy.yml
  1. 릴리스 auto-YYYYMMDDhhmmss 생성        (jsDelivr @latest 갱신)
  2. Webflow publish API 호출                (helixanimalmedicalcenter.webflow.io)
  3. jsDelivr 개별 파일 + 패키지 전체 퍼지
  ↓
라이브 사이트 반영 (CDN 전파 ~1분)
```

## 동작 세부

### Section 1 Hero (GSAP)
- t=0.3s: 슬로건 페이드인 (1.2s, power2.out)
- t=0.8s: 배경 페이드인 (2.0s, power3.out)
- t=0.9s: 버튼 페이드인 (1.9s, power2.out)
- 버튼 진입 + 1.5s → `is-holding` → `is-looping` (2.8s 루프)

### Section Divider
- `.discover-helix_button` 정중앙 x, 바텀 y
- `.section2-heading` 탑 y − 0.5vw
- 1px `#0075d6` 수직선, z-index 9999
- 리사이즈/폰트 로드/load 이벤트에 재위치

### Button Glow
- IntersectionObserver threshold 0.3
- 진입 → `is-holding` (0.6s 페이드인) → 1.5s → `is-looping`
- `.bt-box-4` 만 퍼플 `#5528aa`, 나머지 블루 `#0075d6`

## Dependencies

- Section 1: GSAP 3.12.2+ (cdnjs)
- Divider: 없음 (vanilla JS)
- Buttons: IntersectionObserver (브라우저 네이티브)
