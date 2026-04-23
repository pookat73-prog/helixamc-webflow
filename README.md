# helixamc-webflow

Webflow 커스텀 코드를 GitHub에서 관리하는 레포입니다.

## 구조

```
home/
  section1/
    section1.css      - 글로우 애니메이션 스타일
    section1.js       - GSAP 타임라인 로직
```

## Webflow 임베드 방법

Webflow 홈페이지 헤더에 다음 코드를 추가합니다:

```html
<!-- Section 1 Styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section1/section1.css">

<!-- Section 1 Script (requires GSAP) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section1/section1.js"></script>
```

## 업데이트 반영

파일을 수정하면 자동으로 jsDelivr에 반영됩니다 (최대 12시간).
즉시 반영이 필요한 경우 브라우저 캐시를 비우거나 `?v=timestamp` 추가.

## Dependencies

- GSAP 3.12.2+ (CDN에서 로드)
