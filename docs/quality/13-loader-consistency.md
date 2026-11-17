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

## 실제 자산 채택 후보 — 공개 설정 미변경

현재 공개 services pin ba91d70의 전체 tree를 기준으로 **services/bootstrap.js 한 파일만** 두 독립 커밋으로 이관한 [별도 채택 후보7195463](https://github.com/pookat73-prog/helixamc-webflow/tree/candidate/helix-services-owner-adoption-20261117)을 준비했다. 다른 asset Git blob은 전부 공개 pin과 같고, 생산자 bytes는 위 실제 pinned 함수 이관 검사와 동일하다. 작업 브랜치 전체나 최신 main/staging을 섞지 않았다. [자산24개·검증·복구](evidence/consistency-adoption-package.json).

실제 후보 immutable URL24개의 HTTP200/payload SHA/Git blob을 확보한 새 입력으로 **게시 기준/후보×2폭×정상/두실패/영구실패12조건을 한 번 완전히 실행**했다. 정상 배치/문구/타이포는 exact이며 메뉴/Escape/초점을 보존했다. 공개 구공통로더와도 두실패 뒤 기존2요청/menu0→후보3요청/menu1로 회복했다. 구공통로더는1회만 요청하므로 영구실패 상한도3이다. 작업 소스 공통로더의2회/총4회 상한과 구분한다. 영구실패는 기능 통과가 아니다.

원래 브라우저 live 시도는 DNS EAI_AGAIN으로 중단됐다. 대체 읽기 경로의 최초 실제 응답도21/24였고3개가403이었다. 불완전한 묶음으로 재생을 기동한 준비 순서 오류를 보존하고 전체 검증을 중단했다. 응답 헤더 재진단에서 동일 URL3개가200/후보commit을 반환하고 payload SHA가 immutable blob과 같아진 새 사실을 확인했다. 기존 실패를 바꾸지 않고 완전한 별도24응답을 구성해 새12조건만 판정했다. 동일 SHA의 기존 content-addressed payload를 재사용한3개는 출처를 명시했고 과거 URL 응답을 새 응답으로 대체하지 않았다. 최초403의 원인은 미확정이며 특정 실행환경/시점의 실제 도달과 재생 검증이다.

[공개 head 변경안](evidence/consistency-proposed-services-head.patch)은 구pin→7195463의 구체적 **미적용 제안**이다. 공개 head/설정/pin·main/staging·Publish·운영은 바꾸지 않았다. 이 외부 변경은 별도 승인 대상이며 후보의 공개 staging 도달을 주장하지 않는다. 원격 source/판정/해시/복구는 보존하지만 body/PNG/전체 로그는 로컬 전용이다. 작업 소스의 최종18단계 연속 검증은 별도로 진행 중이다.

후속 독립 단위 P2 제품 `7bea97c`: 공통 로더가 메뉴를 실제 복구한 뒤 services 생산자가 재진입하면 메뉴 JS를 다시 요청하던 원본을 재현했다. 기존 initialized map에 메뉴의 초기화 점유 guard 한 항목만 연결해 그 추가 요청을1→0으로 줄였다. 단일4조건(2폭×원본/후보)에서 메뉴/초기화1회와 실제 열기/Escape/초점을 보존했다. P1은 양쪽 대조군에 동일하게 유지했다. **guard=true는 점유 의미이며 실행 성공의 증거로 승격하지 않는다.** [판정·독립 역커밋](evidence/consistency-claimed-adoption.json).

제품 `90ee4a2`는 services 메뉴JS가 native error를 받은 뒤 **그 생산자 자신의 실패 script만** 제거한다. 기존 정확한 URL 오류 기록은 detached node에 남고 기존 fallback/공통 retry 상한은 그대로다. 공통 로더가 다른 생산자의 태그를 삭제하지 않는다. pending·성공·다른 모듈·CSS는 손대지 않았다.

원본 producer-only는 두 실패 뒤2요청/메뉴0이었고, 후보는 구공통로더에서도3요청/메뉴1로 회복했다. 2폭×producer-only/matched×정상/현재 실제fallback/두실패/영구실패의 **단일16조건**에서 정상1/폴백2/복구3/영구4요청 상한을 확인했다. 영구 실패는 메뉴 복구가 아니다. 실제 메뉴 열기/Escape·닫기/애니메이션 완료 뒤 초점 복원, 초기화1회·중복 진입 뒤 추가 요청/리스너0도 확인했다. 검사5d75156와 제품을 분리했고 [결과·별도 역커밋](evidence/consistency-native-owner.json)을 남겼다.

진단16조건은 HTTP200 실행 전 예외와 guard 기록 직후 예외를 구분했다. 후자는 guard=true/menu0이며 guard도 성공 증거가 아니다. Resource Timing responseStatus는 성공 CSS/실패 JS 모두0이라 과거 상태 추측에 사용할 수 없었다. shared-only가 시작되기 전 구생산자 오류는 현재 소비자만으로 복원할 신뢰할 상태가 없다. 타이머/재요청을 더하지 않는다.

검사 전제 실패도 보존했다. 첫 새 검사에 Node 변수를 브라우저 predicate로 전달하지 않은 오류를 수정했고, focus는 기존 closeMenu의0.28초 onComplete 뒤 복원됨을 확인해 동일 복원 assertion을 완료 시점에 검사했다. after-entry를 만들려고 실제 ordered JS를 잡아 둔 새 검사와 기존 도구의JS 프로브는 진입 의존성으로 정지했다. 제품 보정/async 전환으로 우회하지 않고 그 입력을 실제 services 지원 경로에서 제외했다. **기존 정상 경로의 실패를 통과 처리한 것이 아니다.**
