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

## E1 — 실제 GSAP 실패와 메뉴 초기화 점유 분리

원본 f44264e 메뉴를 services/FAQ의 실제 생산자와 실행하면 GSAP native 실패 뒤 메뉴 resource200/native load는 발생하지만 `gsap.set`에서 오류가 난다. claim=true, 메뉴/장식 DOM은1개씩, burger 이벤트0, 완료=false다. 같은 GSAP 응답을 실제 script URL로 복원하고 생산자를 재진입해도 원본은 guard 때문에 회복하지 않는다. 임의 throw로 새 원인을 주장한 것이 아니다. 원시 `dependency-probe/results.json`과 수정 전 red를 보존했다.

제품 **06d07a3**은 기존 claim을 소유권으로 유지하고, GSAP가 없을 때 partial DOM 생성 전에 native load를 기다린다. module-local listener 하나는 의존성이 확인되면 해제하고 원래 초기화 본문을 그대로 수행한다. 이벤트 등록 이후 `__helixHamburgerReady=true`를 별도로 기록한다. 새 retry/전역 timer/공통 초기화 계층은 없다. GSAP 복원 자체는 테스트가 수행한 외부 복원이며 제품이 다운로드를 재시도한 것이 아니다. 영구 GSAP 실패는 대기 상태로 남고 시간만으로 실패를 단정하지 않는다. 임의 실행 예외/구문 오류에 대한 범용 복구는 여전히 미해결이다.

검사 **98f6583**: services/FAQ×1440/390×정상/GSAP실패 =8쌍16실행. 원본 실패→후보 정상복원, 메뉴 추가 요청0/claim1/DOM1/Escape·초점, 정상 geometry·타이포 exact 보존. 이미 검증한 다른 제품을 재작성하지 않았다. 독립 복구 **15be74b9a43288e15cdb48fa7d0971f1fb02f9c8** (`recovery/helix-menu-dependency-20261118`)는 이 메뉴 hunk만 되돌린다. 제품은 해당 단위 검증 완료, 새 통합 검증은 아직 진행 전이다.

## P3 — 생산자가 소유한 exact URL pending만 재사용

통제 입력은 실제 services 생산자를 메뉴 응답 보류 중 native async script로2회 재진입시키는 것이다. 공개 head가 실제 중복됐다고 주장하지 않는다. 원본은 같은 URL script태그3개를 삽입한다. Chromium은 이때 wire요청을1개로 합쳤으므로 중복 전송3회라고 기록하지 않는다. native 실패 때 태그별 fallback도 중복 삽입된다. 원본 red는 태그3≠1로 실패했다.

제품 **be8f38a**은 생산자가 append 전에 자기 pending URL을 표시하고 native load/error에서 해제한다. 다른 진입은 **src와 pending표시가 모두 선택 URL과 같은 경우만** 재사용한다. 다른 버전/알 수 없는 태그의 존재·guard를 실행 성공으로 승격하지 않는다. 기존 실패 retirement·동일2회 cap·fallback은 유지한다. 범위는 services 생산자의 메뉴JS 하나이며 CSS/공통 소비자/다른 모듈은 변경하지 않았다.

검사 **4b278e8**:2폭×10초지연정상/10초지연뒤native실패×원본/후보8실행. pending태그3→1, 성공 wire1/실패뒤fallback wire2 동일, 메뉴/claim1과 실제 기능 보존. 별도4조건은 알 수 없는 같은URL 태그와 다른URL pending의 소유권을 빼앗지 않는지 확인했다. 이4조건의 inert JSON script는 **명시적 메타데이터 fixture**이며 실제 실행/과거 응답이 아니다. 독립 복구 **ceeac82525b1a267a1d6b9e2d1bc7e74afce26bd** (`recovery/helix-producer-pending-20261118`)는 P3만 되돌리고 E1/P1/P2는 보존한다.

## 응답·실행·점유·완료 판정

| 관측 | 구분/남은 경계 |
| --- | --- |
| HTTP200 + native load | 파일 전달 성공. 구문/실행 완료의 증거가 아님 |
| Syntax/실행 오류 | 기존 early/partial 조건을 유지하고 syntax 주입2조건 추가. 구문 오류는 claim=false, partial오류는 claim=true여도 완료 아님. 모두 미해결 오류로 기록 |
| 메뉴 응답 pending10초 | load/error/claim/메뉴0. 검사 관측 시간 경과를 resource failure로 변환하지 않음 |
| 늦은 원래 메뉴 응답 | 같은 요청 도착 뒤 메뉴1/이벤트/초점 복구, 신규 timer/retry 없음 |
| GSAP 실패 뒤 외부 복원 | claim1이 기다리다가 실제 load 후 완료됨. 완료 전 partial DOM 없음 |
| 영구 native 실패 | 기존 요청 상한을 지키고 미가용으로 남음. 검사 pass는 실패 분류/상한 검증이지 기능 회복 성공이 아님 |

## 장기 버전 일관성 및719 채택 검토

main3c4f78d4/staginga074f455/후보719 tip은 시작 시 동일했다.10개 공개HTML·생성CSS·pin을 읽기 전용 재관측했고 기존 원시 HTML을 덮지 않았다.719의24개 실제 CDN 응답은 전부200/이전 SHA일치다. Git tree254파일 전체대조의 유일한 차이는 services/bootstrap.js다. [별도 승인안15](15-services-adoption-approval.md)에 정확한 staging-only head와 inverse를 보존했다. 이번 E1/P3는719에 들어 있지 않다. 기존12조건은 같은 패키지의 검증 이력으로 재사용하며 오늘 새21단계에 합산하지 않는다.

이번 현재 @main 메뉴JS SHA는 `4aa23eeae351559499937e78a2e415f5f16947572100b299411703f0b541d4c5`, 메뉴CSS `1c2b23f51a05e9d2f8fada59a22bd4c85f251c1353d89e4095c8d512a74299b0`이며 공개 고정 자산과 같다. 현재 응답이 같다는 사실은 향후 main 갱신·edge/browser cache 일관성 보장이 아니다. 생산자는 entry immutable SHA를 원자적으로 선택하지만 native실패 뒤 @main fallback은 다른 시점의 응답을 선택할 수 있다. shared consumer는 먼저 성공/점유한 모듈을 존중하며 버전 호환성을 자동 판정하지 않는다. 과거 응답 부재를 현재 bytes/alias로 대신하지 않았고 실재 drift가 없으므로 pin/정상fallback을 강제 통일하지 않았다. 향후 실제 호환성 파손은 새 시점의 원본 응답을 따로 확보해 재현해야 한다.

## 새 동결 검사와 이후 순서

기존18단계의 검사는 그대로 유지하며 syntax2조건과 E1/P3/foreign boundary3단계를 추가한 **단일21단계**를 새 clone의 새 동결 소스로 실행한다. 이전 성공과 합산하지 않는다.1px·E1/P3 개별 inverse를 각각 주입해 회귀 검출/자기 hunk 복구를 확인한다. 기존 PNG/mask/100px/threshold0.2/expected failure는 변경하지 않는다. 최종 결과 전까지 전체 통합 통과로 표시하지 않는다.

이후 D03/D07의 새로운 firstpaint 원본 실패→D02 미수정 root→D05 살아 있는 속성 순서로 좁힌다. 이전 진단/완료 hook·내과/intro/consent·CTA5단위는 반복하지 않는다. 범위가 증명되지 않으면 해당 단위는 미해결로 남긴다. D06은 이번에도 WebKit2227 실행파일이 없으므로 제품 미변경/환경 부족 미검증이다. V0/U01은 재개하지 않는다.
