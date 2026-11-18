# HELIX D04 — 실행 완료·pending·버전 일관성 후속

2026-11-18 (Asia/Seoul). 시작 a6eaff7, 기존 검증 소스 f44264e 및 제품90ee4a2/7bea97c를 보존한다. 기존 작업장은 clean이고 원격 HEAD가 일치한다. main3c4f78d4/staginga074f455 및 채택 후보7195463도 그대로다. 루트 AGENTS/관련 CLAUDE와 HANDOFF/13을 읽었다.

## 최종 판정 — 동결52a31c8, 단일21단계 통과 / 전체 구조 미완료

제품과 검사 소스를 `52a31c860e146f765a5b8885d3874292c87b614f`로 동결한 **새 clone의 단일 연속21단계가 전부 통과**했다. 이전18단계 결과나 개별 실행 성공을 합산하지 않았다. 이후 마감 전달은 문서·증거만 바꾼다. [최종 대장](evidence/execution-final.json)에 source/tests SHA, 단계별 exit, 실제 응답 SHA, 복구/음성 대조와 한계를 기록했다. 이는 별도 clone의 자동 재실행이며 별도 사람의 최종 감사는 아니다.

| 구분 | 실제 판정 |
| --- | --- |
| 실제 개선 완료 | E1 `06d07a3`: 실제 GSAP native 실패가 partial DOM/영구 guard 중단을 만들던 경로를 의존성 대기→원래 초기화 완료로 분리. P3 `be8f38a`: 동일 생산자의 exact URL pending태그를3→1로 줄임. 전송 요청은 브라우저가 이미 합쳤으므로 measured wire 절감으로 보고하지 않음 |
| 결합 영향 보존 | 5페이지×3크기15쌍, 홈3크기·11 hot경계, motion6, CTA gap/border 각각108쌍·36통제, intro/consent·hero12·기존 CSS/JS소유권 검사를 보존. 새 dependency8쌍16실행/pending8실행/foreign4조건도 같은 연속 검사 안에서 통과 |
| 오류를 남긴 검증 통과 | HTTP200 early/partial/syntax6조건은 오류가 남는다는 분류 결과다. native load/guard를 기능 성공으로 처리하지 않음. shared-only 구생산자의 조기 native실패 경계도 해결로 승격하지 않음. 요청 cap과 영구 실패 경계 통과는 메뉴 가용성 성공이 아님 |
| 복구 검증 | 실제 원격 E1 역커밋15be74b/P3 역커밋ceeac82를 다른 새 clone에서 각각 적용→회귀 검출→자기 diff만 역적용. 별도1px4→5px 오류도 검출/복구. 세 경우 모두 원래 바이트·clean 상태로 돌아옴 |
| 실제 적용 준비 완료 |719 전체 tree254파일의 차이1개, 실제 고정 URL24개 모두200·이전 SHA일치, 기존 production12는 같은 패키지 이력으로 보존하고 실제 staging 분기는 새 단일12조건 리허설로 별도 통과(21단계와 합산하지 않음). [15의 staging-only head/inverse](15-services-adoption-approval.md)는 **미적용·별도 승인 대상**이며 E1/P3는719에 없음 |
| 환경 부족·미검증 | WebKit2227 실행파일/실제Safari·iOS·iPad 없음. 측정은 차단해 측정 기능 미검증. 공개 운영에 새 코드가 적용되지 않았으므로 운영 오류 감소율·실제 효과도 미검증 |

### 자산과 증거를 해석하는 범위

- 기존 고정 raw8개 manifest와 body2,130개를 다시 해시 검증했다. 초기 기록을 최신 응답으로 교체하지 않았다. 기준 PNG33/286응답·mask·100px·threshold0.2·expected failure는 변경하지 않았다.
- 새21단계는 이전과 같은 원시 입력을 재생하고 **현재 후보 bytes를 지정 경로에 overlay**한 격리 검증이다. 이 URL이 실제 운영에서 새 코드를 전달했다는 의미가 아니다. 각 요청/overlay SHA는 로컬 raw에 있다.
- Nov18의 공개10HTML은 Nov17 마감 HTML과 모두 동일했다. 실제 현재 `@main`3자산 응답은 현재 main Git blob과 일치했다. services가 쓰는 분 단위 query 형태의 **동일 URL을 실제2회 조회**해200/같은 메뉴 SHA도 확인했다. 이것은 한 시점의 실제 관측이며 미래 edge/browser cache 호환성 보증이나 실브라우저 cache 시험은 아니다. 원시 `branch-query/results.json`은 새 시점 기록으로 따로 보존한다.
- syntax/throw는 명시적 오류 fixture, foreign pending JSON태그는 명시적 메타데이터 fixture다. 실제 존재했던 응답이나 실제 실행으로 취급하지 않았다. GSAP 복원은 테스트가 같은 실제 archived URL로 수행한 외부 복원이다. 제품은 새 재시도·타이머를 추가하지 않았다.
- pending 통제 진입에서 메뉴 외 자원의 관측 요청 집계도 원본/후보4쌍 모두 같았다. 측정 차단 입력에서의 집계이며 다른 모듈의 초기화·측정 전체 정상/중복 제거를 입증한 것은 아니다.

### staging 적용안의 추가 검증 경계

production12 이력을 staging으로 승격하지 않았다. 실제 staging 공통entry490 및 @staging fallback을 확인하고, 정상·생산자2회실패·영구실패×2폭×원본/후보의 새12조건을 별도 연속 실행했다. 초기9URL 누락과 복구 단계490 메뉴JS 누락의2실패는 보존했으며, 실제 공통16 FILES를 대조해 의존 closure를 완성했다. 추가19응답은 실제 URL200·Git blob과 일치한다. 원래 source/기준/기존 raw를 바꾸지 않았다. 정상 geometry·타이포 exact, 메뉴1·Escape/초점, 실패 후3회 cap을 확인했다. 이는 공개 적용 검증이 아닌 hostname별 로컬 리허설이며 이전production12/core21과 합산하지 않는다. [15의 보완 절](15-services-adoption-approval.md)에 입력과 한계를 기록했다.

### 남은 문제와 확정된 다음 독립 실행

| 순서 / 위험 | 남은 단위와 상태 | 다음 실행·승격 조건 / 중단 조건 |
| --- | --- | --- |
| D04 / 높음 | 임의 HTTP200 구문·실행 예외와 과거 partial guard, 구생산자/shared-only 조기실패는 미해결 | 오류 생산자의 실제 side effect/DOM/이벤트 소유자를 먼저 특정한다. 임의 guard reset/범용 재시도는 중복 초기화 위험이 있어 적용하지 않음. native 오류 채택 개선은 검증된719의 제한된 적용안으로 분리 |
| D04 / 중~높음 | 조용한 pending의 영구 무응답 여부, 구생산자가 표시하지 않은 pending, 두 실제 다른 버전의 동시 pending 전체는 미해결/미검증 | finite10초를 실패로 오판하지 않는다. 새 실제 소유자 신호가 있으면 그 자산만 검사. pending 표시가 없는 태그를 추정 채택하거나 timeout/요청 cap을 늘리지 않음 |
| D04 / 높음 | 미래 `@main` drift/cache 호환성은 미해결 | 다음 실제 main 갱신 때 원래 고정 응답과 새 mutable 응답을 별도 보존해 producer-only/shared-only/matched/실패를 재현한다. 공개 pin/일괄 immutable화는 이번 변경에 포함하지 않음 |
| D03/D07 / 높음·중작업 | hero/firstpaint의 나머지 책임은 미완료 | 공개 head가 `__hxHomeFirstpaintReveal`와 최종 ready class를 소유하고 coming-soon이 호출, section1이 ready/done을 생산한다. 이 source/공개HTML SHA를 기록했다. 기존 guarded 다중 진입 자체를 오류로 보지 않으며 새 원본 실패·critical CSS/폰트/노출 순서를 먼저 입증. 공개 head 책임 이동은 별도 승인 범위 |
| D02 / 중·중작업 | 다른 폼 label/제목 및 desktop 소비자 미완료 | 기존 내과/intro/consent는 그대로 두고 다음 실제 label root 하나에서 게시 문구와 합성 한글/영문/URL/숫자·직접/자손을 분리한다. 원본 넘침→후보 containment/비대상5×3 exact가 있어야 제품 커밋. 전역 wrap 철회·일괄 예외 금지 |
| D05 / 중·소~중작업 | 나머지 실제 소비 속성은 미완료 | 완료 높이/폭/장식/간격/색상은 반복하지 않는다. 살아 있는 소비자와 실제 후행 무효화 하나를 찾고108쌍/36통제로 입증. 소비자 없음·미재현이면 미수정 |
| D06 / 높음·조건부 | 환경 부족 미검증 | 실제WebKit/실기기 확보 후 cold·회전·fixed/sticky/메뉴·폼·카드 노출 검사. Chromium 폭 전환을 대신 쓰지 않으며 viewport 제품 변경 없음 |
| 전체 최종 감사 | 미완료 | 위 미해결과 실제 채택 효과를 해결/한정한 뒤 새 동결 소스의 독립 검수. 이번 단위 통과로 전체 구조 안정화 완료를 선언하지 않음 |

V0는 새 판별 근거 없이 재개하지 않았고 U01도 보류한다. 다른 진행자의 코드, 기존 정상 디자인/기능과 source 개선을 보존했다. main/staging 병합, 공개 head/pin/설정 변경, Webflow Publish, 운영 배포는 **없다**.

새 raw의 본문·PNG·전체로그·대장 상세는 `/workspace/artifacts/helix-execution-residual-20261118` **로컬 전용**이다. GitHub에는 source/tests·판정/핵심 SHA·대장 SHA·개별 복구·미적용 적용안을 보존한다. 원격 body archive가 없으므로 이 머신 없이 완전 재생 가능한 인계라고 주장하지 않는다.

아래는 시작 및 개별 검증 당시의 진행 이력이다. 현재 판정은 위 최종 절과 대장을 따른다.

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
