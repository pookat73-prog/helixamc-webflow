# HELIX D04 — 혼합 자산과 로더 일관성 실행

**최종 판정: 두 생산자 소유권 단위의 소스 개선과 격리 후보 검증 완료, 전체 혼합 자산 안정화는 미완료다.** 작업 소스/검사는 `f44264e1d9296071c2bde2a43db963c530447895`로 동결했고 별도 clone의 단일18단계가 모두 exit0으로 끝났다. 이후 전달 커밋은 문서·증거만 바꾼다. [최종 대장](evidence/consistency-final.json).

제품 변경은 `services/bootstrap.js` 한 파일의 +3/-1줄뿐이다. 생산자가 자기 native 실패 태그를 철회해 구소비자가 새 오류 속성을 몰라도 복구할 수 있게 했고, 다른 소유자가 초기화를 점유한 메뉴의 재요청을 막았다. CSS·공통 로더·메뉴 모듈·이전 개선은 byte/Git blob 기준으로 보존했다. main/staging 및 공개 head·pin·Publish·운영은 변경하지 않았다.

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

## 제품 P1 — native 실패 소유권 철회

제품 `90ee4a2`는 services 메뉴JS가 native error를 받은 뒤 **그 생산자 자신의 실패 script만** 제거한다. 기존 정확한 URL 오류 기록은 detached node에 남고 기존 fallback/공통 retry 상한은 그대로다. 공통 로더가 다른 생산자의 태그를 삭제하지 않는다. pending·성공·다른 모듈·CSS는 손대지 않았다.

원본 producer-only는 두 실패 뒤2요청/메뉴0이었고, 후보는 구공통로더에서도3요청/메뉴1로 회복했다. 2폭×producer-only/matched×정상/현재 실제fallback/두실패/영구실패의 **단일16조건**에서 정상1/폴백2/복구3/영구4요청 상한을 확인했다. 영구 실패는 메뉴 복구가 아니다. 실제 메뉴 열기/Escape·닫기/애니메이션 완료 뒤 초점 복원, 초기화1회·중복 진입 뒤 추가 요청/리스너0도 확인했다. 검사5d75156와 제품을 분리했고 [결과·별도 역커밋](evidence/consistency-native-owner.json)을 남겼다.

## 제품 P2 — 초기화 점유 채택

후속 독립 단위 P2 제품 `7bea97c`: 공통 로더가 메뉴를 실제 복구한 뒤 services 생산자가 재진입하면 메뉴 JS를 다시 요청하던 원본을 재현했다. 기존 initialized map에 메뉴의 초기화 점유 guard 한 항목만 연결해 그 추가 요청을1→0으로 줄였다. 단일4조건(2폭×원본/후보)에서 메뉴/초기화1회와 실제 열기/Escape/초점을 보존했다. P1은 양쪽 대조군에 동일하게 유지했다. **guard=true는 점유 의미이며 실행 성공의 증거로 승격하지 않는다.** [판정·독립 역커밋](evidence/consistency-claimed-adoption.json).

## 실제 자산 채택 후보 — 공개 설정 미변경

현재 공개 services pin ba91d70의 전체 tree를 기준으로 **services/bootstrap.js 한 파일만** 두 독립 커밋으로 이관한 [별도 채택 후보7195463](https://github.com/pookat73-prog/helixamc-webflow/tree/candidate/helix-services-owner-adoption-20261117)을 준비했다. 다른 asset Git blob은 전부 공개 pin과 같고, 생산자 bytes는 위 실제 pinned 함수 이관 검사와 동일하다. 작업 브랜치 전체나 최신 main/staging을 섞지 않았다. [자산24개·검증·복구](evidence/consistency-adoption-package.json).

실제 후보 immutable URL24개의 HTTP200/payload SHA/Git blob을 확보한 새 입력으로 **게시 기준/후보×2폭×정상/두실패/영구실패12조건을 한 번 완전히 실행**했다. 정상 배치/문구/타이포는 exact이며 메뉴/Escape/초점을 보존했다. 공개 구공통로더와도 두실패 뒤 기존2요청/menu0→후보3요청/menu1로 회복했다. 구공통로더는1회만 요청하므로 영구실패 상한도3이다. 작업 소스 공통로더의2회/총4회 상한과 구분한다. 영구실패는 기능 통과가 아니다.

실제 브라우저가 채택한 후보 URL은20개다. 남은4개는 measure-gate/ga4-base/session/sheet-log로, 먼저 점유한 기존 소유자의 다른 URL 요청을 확인했고 후보 URL로 중복 요청하지 않았다. 24개는 도달/바이트 검증 범위이며 전부 새 URL에서 실행됐다는 의미가 아니다. 측정은 차단했으므로 측정 기능 완료를 주장하지 않는다.

원래 브라우저 live 시도는 DNS EAI_AGAIN으로 중단됐다. 대체 읽기 경로의 최초 실제 응답도21/24였고3개가403이었다. 불완전한 묶음으로 재생을 기동한 준비 순서 오류를 보존하고 전체 검증을 중단했다. 응답 헤더 재진단에서 동일 URL3개가200/후보commit을 반환하고 payload SHA가 immutable blob과 같아진 새 사실을 확인했다. 기존 실패를 바꾸지 않고 완전한 별도24응답을 구성해 새12조건만 판정했다. 동일 SHA의 기존 content-addressed payload를 재사용한3개는 출처를 명시했고 과거 URL 응답을 새 응답으로 대체하지 않았다. 최초403의 원인은 미확정이며 특정 실행환경/시점의 실제 도달과 재생 검증이다.

[공개 head 변경안](evidence/consistency-proposed-services-head.patch)은 구pin→7195463의 구체적 **미적용 제안**이다. 공개 head/설정/pin·main/staging·Publish·운영은 바꾸지 않았다. 이 외부 변경은 별도 승인 대상이며 후보의 공개 staging 도달을 주장하지 않는다. 원격 source/판정/해시/복구는 보존하지만 body/PNG/전체 로그는 로컬 전용이다. 작업 소스의 최종18단계 연속 검증은 별도로 통과했으며 두 결과를 합산하지 않았다.

## 진단 근거와 한계

진단16조건은 HTTP200 실행 전 예외와 guard 기록 직후 예외를 구분했다. 후자는 guard=true/menu0이며 guard도 성공 증거가 아니다. Resource Timing responseStatus는 성공 CSS/실패 JS 모두0이라 과거 상태 추측에 사용할 수 없었다. shared-only가 시작되기 전 구생산자 오류는 현재 소비자만으로 복원할 신뢰할 상태가 없다. 타이머/재요청을 더하지 않는다.

검사 전제 실패도 보존했다. 첫 새 검사에 Node 변수를 브라우저 predicate로 전달하지 않은 오류를 수정했고, focus는 기존 closeMenu의0.28초 onComplete 뒤 복원됨을 확인해 동일 복원 assertion을 완료 시점에 검사했다. after-entry를 만들려고 실제 ordered JS를 잡아 둔 새 검사와 기존 도구의JS 프로브는 진입 의존성으로 정지했다. 제품 보정/async 전환으로 우회하지 않고 그 입력을 실제 services 지원 경로에서 제외했다. **기존 정상 경로의 실패를 통과 처리한 것이 아니다.**

## 최종 검증과 상태 구분

동결 작업본 `/workspace/helix-loader-final-20261117`의 **단일18단계**는 기존15단계를 보존하고 새 혼합 소유권24조건·점유 채택4조건·실행/pending 분류6조건을 추가했다. 이전 단위 실행이나 별도 채택 후보12조건을 이 결과에 합산하지 않았다.

| 범위 | 확인 결과 |
|---|---|
| 정상 보존 | 5페이지×3크기15쌍, 실제 휠/초점/겹친 잠금/카드 전환, 제목 모션6·hero12실행, 기존 intro3쌍/consent15쌍 통과 |
| CTA·CSS | 간격/테두리 각각108쌍/36통제 수정, 실제 FAQ 성공 fallback4·같은URL CSS 재사용4조건 통과. 원본PNG33/response286·mask·100px·threshold0.2·expected failure 불변 |
| JS 소유권 | 기존32조건과 혼합4조건 유지. 새 생산자만 업데이트한2조건은 이제 복구를 요구하며, 구생산자/새 shared만의 조기 실패2조건은 여전히 메뉴 없음으로 판정 |
| 추가 혼합24조건 | producer-only/shared-only/matched×2폭×정상/현재 실제fallback/두실패/영구실패. 성공·pending 태그 보존, 자기 실패만 제거, 정상1/폴백2/복구3/영구상한4, 초기화·리스너 중복0 확인 |
| 실행·pending6조건 | HTTP200 실행 전/guard 직후 예외4개는 실제 load가 와도 메뉴0인 실행 오류로 남음. pending2개는500ms 검사 deadline 뒤에도 실패로 바꾸지 않고 원래 응답을 해제하면 메뉴1로 회복 |
| 마감 | 품질9/홈 로딩6 통과. 주입한 실행 오류4개 외 unexpected JS/네트워크 오류 및 오프라인 재생 외부 전달0. 실측/예약 전송 차단 |

`success`는 여기서 실제 메뉴 DOM·열기/닫기·Escape·초점까지 확인한 범위다. native `failed`는 생산자가 자기 태그만 철회한다. `pending`은 완료 이벤트 전 상태이며 검사 `timeout`을 자산 실패로 바꾸지 않는다. HTTP200/초기화 guard는 각각 자원 수신/초기화 점유의 증거이며 실행 성공이 아니다. 다른 로더의 pending/부분 초기화를 일반적으로 정리하는 정책은 새로 만들지 않았다.

별도 negative clone에서1px 오류와 두 제품 역커밋을 각각 주입하자 회귀 검사가 모두 exit1로 검출했다. 실제 원격 역커밋의 diff를 최신 동결 파일에 각각 적용/역적용해 다른 단위 보존과 초기 SHA 복원을 확인했다. 정상 작업장/검증 clone/negative clone은 모두 clean이며 runtime SHA가 같다. 독립된 사람의 감사는 아니다.

| 단위 | 작업 소스 복구 | 채택 후보 복구 |
|---|---|---|
| native 소유권 | `458207f` | `2b48adc` |
| 초기화 점유 채택 | `2893726` | `f702659` |

복구는 해당 커밋의 diff만 새 격리 작업본에 적용한다. recovery 브랜치 전체 snapshot으로 최신 소스를 대체하지 않는다. 기존8개 입력 manifest/2130body 파일을 마감에 다시 검증했다. raw432파일의 목록/SHA와 후속 공개10HTML·엔진 확인의 SHA를 기록했지만 body/PNG/전체로그와 원시 대장은 로컬 전용이다. GitHub는 소스·검사·핵심 입력/결과 SHA·복구·미적용 head 제안을 보존한다.

## 남은 문제와 후속 실행 조건

동일18단계를 재현할 때는 새 격리 작업본을 `f44264e`로 고정하고 원본 `.visual-corpus/production`, 기존8개 root, 이번 실제 branch 캡처 `current-js`의 **같은 manifest/body**를 복원한다. raw가 없으면 미검증으로 남기며 최신 응답이나 합성 alias로 채우지 않는다. Playwright/Chromium/OS 버전 검사는 유지한다. 새 출력 경로에서 실행한다.

```bash
export HELIX_PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright
export HELIX_INTERACTION_INPUT=/workspace/artifacts/helix-residual-20261117/inputs/home
export HELIX_STRUCTURE_PAGE_INPUTS=/workspace/artifacts/helix-residual-20261117/inputs
export HELIX_INTERACTION_EXTRAS=/workspace/artifacts/helix-residual-20261117/resource-extra,/workspace/artifacts/helix-residual-20261117/order-fonts-v2
export HELIX_CURRENT_FALLBACK_INPUT=/workspace/artifacts/helix-loader-consistency-20261117/current-js
export HELIX_INTEGRATION_OUTPUT=/workspace/artifacts/helix-loader-replay-001
test ! -e "$HELIX_INTEGRATION_OUTPUT" && node scripts/visual/next-integration.cjs
```

| 순서 | 다음 독립 단위 | 현재 판정·선행 조건 | 최소 검증 / 중단 조건 | 작업량 |
|---|---|---|---|---|
| 1 | 구생산자/새 shared의 과거 실패 | 아직 미해결. 이미 사라진 이벤트를 tag/guard/Resource Timing만으로 안전하게 복원하지 않는다. services는 검증된 한 파일 채택 후보가 있으나 공개 pin 변경은 별도 승인 대상 | 새 승인 전 공개 변경 금지. 승인 대상은 후보7195463 head 제안이며 audit 브랜치 전체 이관이 아님. 새 공용 자산은 실제 도달/SHA와 정상·실패·동일URL·기존 성공 소유권을 확인 | 중 |
| 2 | 오류 없는 pending·실행 중 예외 | deadline/늦은 응답/부분 guard 진단만 완료. 제품 timeout은 없음. 무응답 원본 owner의 수명과 부분 DOM/이벤트 정리 책임부터 확인 | 기존 retry 상한·지연 성공 보존. 근거 없는 전역 timer/guard reset/중복 초기화 추가 금지 | 중~대 |
| 3 | D03/D07 firstpaint | 기존 hook 개선과 모션 검증은 보존. 다른 firstpaint 결합은 미완료 | 새로운 실제 원본 실패와 critical CSS/폰트/노출 순서가 확인된 한 경로만 변경 | 중 |
| 4 | D02 다른 root | 내과·intro·consent 완료 단위 보존, 나머지 미완료 | 게시 문구와 합성 입력을 구분해 root 하나 원본 실패→후보 통과 및5페이지×3크기 비대상 보존 | 중 |
| 5 | D05 다른 속성 | 완료 높이/폭/장식/간격/색상 보존. 소비자 없는 보조문구 정리는 계속 기각 | 실제 살아 있는 속성 하나의 후행 무효화와108쌍/36통제로 입증. 미재현이면 미수정 | 소~중 |
| 6 | D06 실제 엔진 회전 | webkit2227 실행파일/실제 Safari·iOS·iPad 부재로 미검증·제품 미변경 | 실제 환경 확보 전 viewport 변경/완료 선언 금지. Chromium 폭 변경으로 대체하지 않음 | 조건 충족 후 중 |

V0는 새 판별 근거가 없어 재개하지 않았고 U01도 적용하지 않았다. 수정 영향은 이번 services 생산자 경계에서 좁아졌지만 다른 생산자·관측창 밖 오류·전체 사이트 구조·공개 운영 안정화는 완료가 아니다.

기존 생산자의 `@main` 자원 fallback도 보존했다. 이번에 실제 확보한 branch 응답과 immutable 메뉴 자산은 바이트가 같지만, 가변 branch의 미래 변경까지 같은 버전이라고 보증한 것은 아니다. 이 선택 책임은 생산자에게 남아 있으며 장기 버전 일관성은 별도 단위로 검증해야 한다. 정상 fallback을 근거 없이 같은 URL 재요청이나 새 전역 version 계층으로 바꾸지 않았다.
