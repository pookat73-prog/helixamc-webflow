# HELIX D04 — 실행 완료·pending·버전 일관성 후속

2026-11-18 (Asia/Seoul). 시작 a6eaff7, 기존 검증 소스 f44264e 및 제품90ee4a2/7bea97c를 보존한다. 기존 작업장은 clean이고 원격 HEAD가 일치한다. main3c4f78d4/staginga074f455 및 채택 후보7195463도 그대로다. 루트 AGENTS/관련 CLAUDE와 HANDOFF/13을 읽었다.

작업량 대, 현재 모델 유지·높은 추론 강도 권장·예상 사용량 높음. 이미 승인된 조사/격리 수정/검증/복구/문서/작업 브랜치 전달을 연속 수행한다. 공개 head/pin/설정, main/staging 병합, Publish/운영 배포는 금지하며 실행하지 않는다.

## 실제 원인부터 좁히는 순서

1. 기존 HTTP200 임의 throw 검사는 반복하지 않고, 메뉴의 실제 의존성 GSAP가 실패할 때 claim/DOM/이벤트 상태와 의존성 복원 뒤 생산자 재진입을 확인한다. services와 FAQ의 실제 생산자를 사용한다. 새 전역 timer/자원 재시도를 추가하지 않는다.
2. 기존10초 무응답과 현재 pending 도중 생산자 중복 진입을 구분한다. 정상 지연을 실패로 바꾸지 않고 실제 요청 수와 초기화 수를 측정한다. 실제 책임이 입증되는 한 단위만 수정한다.
3. mutable fallback의 선택 책임/현재 main/ref/실제 응답을 대조한다. 과거 응답을 최신 응답으로 덮지 않으며 합성 drift는 실제 운영 drift와 구분한다. 정상 fallback을 일괄 immutable로 바꾸지 않는다.
4. 기존7195463의 Git tree/현재 CDN 도달/현재 head 일치를 갱신 확인하고 기존 통과 결과를 재사용한다. 적용·원상복구 head를 정확히 제시하되 미적용으로 유지한다.
5. 제품/검사 분리·개별 역커밋을 유지하고 변경 후 동결 소스에서 기존18단계와 새 단위를 단일 연속 실행한다. 1px/제품별 오류 검출·복구도 새 소스에서 확인한다. 기존 PNG/mask/100px/threshold0.2/expected failure는 바꾸지 않는다.

scope는 메뉴 module의 초기화 점유와 완료, services/FAQ 생산자의 자원 소유권이다. CSS·디자인·메뉴 동작/글로우 타이밍·viewport·기존 fallback 횟수는 보존한다. D03/D07→D02→D05→실제 엔진 D06 순서는 유지하며 선행 원본 재현·실제 소비자·환경이 없으면 해당 범위만 보류한다. V0 새 실험/U01 적용은 하지 않는다.

새 raw는 `/workspace/artifacts/helix-execution-residual-20261118` 로컬 전용이다. 기존 원시 입력과 검증 결과는 변경하지 않는다. GitHub에는 source/tests/판정·해시·복구·적용 제안을 보존한다.
