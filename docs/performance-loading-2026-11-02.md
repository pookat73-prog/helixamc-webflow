# 성능 개선 2차 — 모습·동작 보존

- 현재 staging 위에 기존 CSS/JS 파일만 수정한다. 다른 작업의 변경은 보존한다.
- 9개 bootstrap에서 점검용 스크립트는 실제 점검 URL에서만 요청한다. 공통 측정 4개는 자체 초기화 플래그가 true일 때만 요청을 생략하며, 실패 복구는 유지한다.
- 무손실 배경 3개는 원본 해상도·디코딩 RGBA를 유지한다. 내과 2개 3,686,780 → 2,603,290바이트, 일산 1개 1,798,895 → 1,289,118바이트. GitHub 이미지 커밋 6e64a396af818ff7531044c4fc7e40c5b463ad03 고정 주소로 제공한다.
- Webflow 내과·일산 head의 helix-lossless-backgrounds 스타일은 원래 CSS background-image 선언과 media 조건을 그대로 복사해 사진 URL만 교체한다. 그라데이션·구도·크기·레이아웃은 유지한다. 늦게 로드되는 global.css에 넣으면 원본과 새 파일을 모두 받을 수 있어 head에서 body 생성 전 적용한다. 모바일 img의 기존 반응형 후보는 그대로 유지한다.
- Webflow FAQ·특화진료: sessionStorage 60초 → 공통 localStorage 10분. fresh=1과 마지막 정상 버전 12시간 복구를 보존한다. 내과·외과 head는 같은 helix.sha.<branch> 키를 공유한다. 첫 방문의 모든 조회를 완전히 합친 것은 아니며 상담 CTA의 별도 키는 유지한다.
- 글꼴·GSAP 버전·애니메이션·기존 대기·의료진 데이터·실제 계측 정의·동의/운영자 제외 규칙은 변경하지 않는다.
- 진료과목 배경 지연 요청은 빠른 스크롤에서 빈 배경 가능성이 있어 이번에 강제 적용하지 않는다.
- 전후 검사는 정적 스냅샷 10페이지 × 390/768/1440px의 화면·배치 및 사진 구간 픽셀 비교다. 외부 스크립트·폰트가 양쪽에서 동일하게 차단된 통제된 비교이며 실제 운영 전체 화면 검증과 구분한다. 기능·측정은 기존 로컬 회귀 검사로 별도 확인한다.
- staging 우선. main/staging 전체 병합 금지. 정식 승격 시 현재 main에 성능 패치만 옮긴다. Webflow 저장된 head 변경은 향후 정식 Publish에 포함될 수 있으므로 다음 운영 게시 전에 함께 검토한다.

검사: scripts/test-performance-loader-requests.mjs, scripts/test-about-bootstrap.mjs, 기존 측정 회귀 검사. 원문 head 백업·사진 픽셀 대조·30개 비교 기록은 /workspace/performance-investigation-2026-11-02/에 보관한다.
