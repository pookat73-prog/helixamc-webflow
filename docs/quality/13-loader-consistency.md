# HELIX D04 — 혼합 자산과 로더 일관성 실행

2026-11-17 (Asia/Seoul). 시작 HEAD `37521891d3d967e899db18c33b3c29cdc37d9822`, 검증 소스 `b2277bfad32db10ded5cb5372759b906b1ac1d98`. 기존 작업장은 clean이며 앞선15단계 통과 소스와 원시 입력을 보존한다. 사용자 승인 범위에서 연속 진행한다. main/staging 병합, 공개 pin/설정 변경, Webflow Publish, 운영 배포는 하지 않는다.

작업량 대, 현재 모델 유지, 추론 강도 높음 권장, 예상 사용량 높음. 모델은 변경하지 않았다. 산출물은 상태·URL·소유자 추적, 재현된 원인의 최소 제품 커밋, 별도 검사·복구 커밋, 새 동결 소스의 연속 검증과 인계다.

## 시작 경계와 보존

- main `3c4f78d4` / staging `a074f455` / 작업3752189를 API로 확인했다. 정식·staging10HTML은 이전 SHA와 같고 생성CSS/pin도 같다.
- 과거 branch JS 성공 응답을 새 응답으로 채우지 않는다. 이번 시점의 실제 `@main/home/global/hamburger.js`와CSS 응답을 별도 root에 새로 캡처했고, 각각 현재 main immutable Git blob과 바이트가 같은지 확인했다. **현재 응답의 검증이며 과거 응답 복원이 아니다.** 기존8개 입력 root는 불변이다. 합성 alias를 운영 자산으로 취급하지 않는다.
- 주요 생산자는 services `injectJs`/FAQ `injectCss`, 소비자는 공통 `present`/`boot`다. 모듈 자체의 초기화 guard와 실제 메뉴 DOM/리스너/기능을 함께 확인한다. 태그 존재 또는HTTP200만으로 성공이라 판단하지 않는다.
- services native 오류 기록·기존 bounded retry, FAQ 성공 fallback·CSS 순서/재사용, 기존 CSS/폰트·critical 준비·scroll lock·glow·viewport·D02/D05 개선을 보존한다. 새 전역 timer/공통 초기화 계층을 만들지 않는다.

## 실행 순서와 판단 기준

1. 기존4혼합 조건을 출발점으로 native resource 실패, HTTP200 실행 전/초기화 중 예외, pending/무응답, 성공 및 중복 진입을 추적한다. URL/ref/SHA/삽입·제거/native 이벤트/guard/메뉴 DOM/이벤트 등록을 구분한다.
2. 실제 원본 실패가 확인된 경우에만 생산자의 자기 실패태그 수명과 소비자의 성공·실패·pending 판정을 독립 단위로 개선한다. 동일 파일/초기화 경로의 제품 수정은 순차 수행한다.
3. 정상/현재 실제fallback/한쪽 업데이트/일치/한쪽·양쪽 실패/다른 소유자 성공/중복 진입/같은URL 재사용/메뉴·Escape·초점/요청 상한을 비교한다. 현재 실제 응답·과거 원시 응답·통제 입력을 별도로 표시한다.
4. 두 번 실패하면 덮어쓰기를 중단하고 증거·원인을 재진단한다. 검증된 제품 단위마다 역커밋을 별도 보존하며 원본 PNG/mask/100px/threshold0.2/expected failure는 유지한다.
5. D04 해결 또는 안전한 수정의 선행조건 부족을 확인한 뒤 무응답→다른 초기화/firstpaint→D02→D05→실제 엔진 D06의 독립 단위를 조사한다. 미재현/고위험/환경 부족은 해당 항목만 보류한다.

새 raw 증거는 `/workspace/artifacts/helix-loader-consistency-20261117`에 로컬 전용으로 보존하며 GitHub에는 소스/검사/판정/해시/복구를 전달한다.

## 단위 P1 — 생산자의 native 실패 소유권 철회

제품 `90ee4a2`는 services 메뉴JS가 native error를 받은 뒤 **그 생산자 자신의 실패 script만** 제거한다. 기존 정확한 URL 오류 기록은 detached node에 남고 기존 fallback/공통 retry 상한은 그대로다. 공통 로더가 다른 생산자의 태그를 삭제하지 않는다. pending·성공·다른 모듈·CSS는 손대지 않았다.

원본 producer-only는 두 실패 뒤2요청/메뉴0이었고, 후보는 구공통로더에서도3요청/메뉴1로 회복했다. 2폭×producer-only/matched×정상/현재 실제fallback/두실패/영구실패의 **단일16조건**에서 정상1/폴백2/복구3/영구4요청 상한을 확인했다. 영구 실패는 메뉴 복구가 아니다. 실제 메뉴 열기/Escape·닫기/애니메이션 완료 뒤 초점 복원, 초기화1회·중복 진입 뒤 추가 요청/리스너0도 확인했다. 검사5d75156와 제품을 분리했고 [결과·별도 역커밋](evidence/consistency-native-owner.json)을 남겼다.

진단16조건은 HTTP200 실행 전 예외와 guard 기록 직후 예외를 구분했다. 후자는 guard=true/menu0이며 guard도 성공 증거가 아니다. Resource Timing responseStatus는 성공 CSS/실패 JS 모두0이라 과거 상태 추측에 사용할 수 없었다. shared-only가 시작되기 전 구생산자 오류는 현재 소비자만으로 복원할 신뢰할 상태가 없다. 타이머/재요청을 더하지 않는다.

검사 전제 실패도 보존했다. 첫 새 검사에 Node 변수를 브라우저 predicate로 전달하지 않은 오류를 수정했고, focus는 기존 closeMenu의0.28초 onComplete 뒤 복원됨을 확인해 동일 복원 assertion을 완료 시점에 검사했다. after-entry를 만들려고 실제 ordered JS를 잡아 둔 새 검사와 기존 도구의JS 프로브는 진입 의존성으로 정지했다. 제품 보정/async 전환으로 우회하지 않고 그 입력을 실제 services 지원 경로에서 제외했다. **기존 정상 경로의 실패를 통과 처리한 것이 아니다.**
