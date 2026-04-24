# helixamc-webflow

Webflow 커스텀 코드를 GitHub에서 관리하는 레포입니다.

## 구조

```
home/
  section1/
    section1.css      - 섹션 1 히어로 글로우 애니메이션 스타일
    section1.js       - 섹션 1 GSAP 타임라인 로직
  global/
    buttons.css       - 전체 버튼(Bt Box 1~4) 후광 스타일
    buttons.js        - 전체 버튼 IntersectionObserver 트리거 로직
```

## Webflow 임베드 방법

### 섹션 1 히어로 애니메이션
Webflow **Site Settings > Custom Code > Head Code**에 추가:

```html
<!-- Section 1 Hero Animation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section1/section1.css">
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section1/section1.js"></script>
```

> **주의**: GSAP는 한 번만 로드해야 합니다. 위 임베드 코드에 이미 포함되어 있으므로 별도로 추가하지 마세요.
> **캐시 문제 시**: `@latest` 대신 커밋 SHA로 교체 → `@71b5003a0eb234910c758ff85c9b95a341080483`

---

### 전체 버튼 후광 애니메이션 (Bt Box 1~4)
Webflow **Site-wide Head Custom Code**에 추가 (GSAP 불필요):

```html
<!-- Global Button Glow -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/global/buttons.css">
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/global/buttons.js"></script>
```

| 버튼 | CSS 클래스 | 후광 컬러 |
|------|-----------|---------|
| Bt Box 1 | `.bt-box-1` | 메인블루 `#0075d6` |
| Bt Box 2 | `.bt-box-2` | 메인블루 `#0075d6` |
| Bt Box 3 | `.bt-box-3` | 메인블루 `#0075d6` |
| Bt Box 4 | `.bt-box-4` | SVIC 퍼플 `#5528aa` |

동작 순서: 버튼이 뷰포트에 30% 이상 진입 → 후광 0.6s 페이드인(`is-holding`) → 1.5s 후 breathing 루프(`is-looping`).

---

## 업데이트 반영

파일을 수정하면 자동으로 jsDelivr에 반영됩니다 (최대 12시간).
즉시 반영이 필요한 경우 브라우저 캐시를 비우거나 `?v=timestamp` 추가.

## Dependencies

- 섹션 1: GSAP 3.12.2+ (CDN에서 로드)
- 전역 버튼: 외부 의존성 없음 (IntersectionObserver 사용)
