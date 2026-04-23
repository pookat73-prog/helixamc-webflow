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

Webflow 홈페이지 **Head Custom Code**에 다음 코드를 추가합니다:

```html
<!-- Section 1 Hero Animation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<style>
/* 1. 검은 도화지 강제: 배경 이미지가 없어도 흰 글씨가 보이도록 설정 */
.home_background {
  background-color: #0d1117 !important;
  opacity: 1 !important;
  visibility: visible !important;
}
/* 2. 초기화: 모든 트랜지션 제거 및 강제 은닉 */
.home_slogan, .div-block-150, .discover-helix_button, .flex-block-23 {
  opacity: 0;
  visibility: hidden;
  transition: none !important;
  will-change: opacity, box-shadow;
}
/* 3. 광채 수치 표준화 (#0075d6, #5528aa) */
.discover-helix_button.is-holding {
  box-shadow: 0 0 2.5vw 0.8vw rgba(0, 117, 214, 0.6) !important;
}
.flex-block-23 .cta-style.is-holding {
  box-shadow: 0 0 2.5vw 0.8vw rgba(85, 40, 170, 0.6) !important;
}
/* 4. 루프 애니메이션 */
@keyframes glowLoopBlue {
  0%, 100% { box-shadow: 0 0 2.5vw 0.8vw rgba(0, 117, 214, 0.6); }
  50% { box-shadow: 0 0 1.0vw 0.3vw rgba(0, 117, 214, 0.3); }
}
@keyframes glowLoopPurple {
  0%, 100% { box-shadow: 0 0 2.5vw 0.8vw rgba(85, 40, 170, 0.6); }
  50% { box-shadow: 0 0 1.0vw 0.3vw rgba(85, 40, 170, 0.3); }
}
.is-looping.discover-helix_button { animation: glowLoopBlue 2.8s infinite ease-in-out !important; }
.flex-block-23 .cta-style.is-looping { animation: glowLoopPurple 2.8s infinite ease-in-out !important; }
</style>
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/home/section1/section1.js"></script>
```

> **주의**: GSAP는 한 번만 로드해야 합니다. 위 임베드 코드에 이미 포함되어 있으므로 별도로 추가하지 마세요.

## 업데이트 반영

파일을 수정하면 자동으로 jsDelivr에 반영됩니다 (최대 12시간).
즉시 반영이 필요한 경우 브라우저 캐시를 비우거나 `?v=timestamp` 추가.

## Dependencies

- GSAP 3.12.2+ (CDN에서 로드)
