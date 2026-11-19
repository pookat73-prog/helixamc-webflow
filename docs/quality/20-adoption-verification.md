# HELIX 실제 적용 자산 검증과 독립 감사 준비

2026-11-19 KST. 시작69fff7d, 검증 동결06f8bba, D02 제품46af337/복구19455fd를 보존한다. D02/D05는 종료 범위이며 새 미세 CSS·전면 리팩터링을 하지 않는다. 현재 단계는 실행 중이며 적용 호환성·독립 감사 완료가 아니다.

## 범위와 보존

작업량 중~대. 산출물은403 원인/응답 대장, 운영 기준의 최소 제품 diff와 전달용 스냅샷, 실제 URL 전용 호환성 검사, 누락/실패 분류 재검토, 최종 판정/HANDOFF다. 현재 선택 모델 유지·높은 추론 강도 권장·예상 사용량 높음이다. 승인은 이미 받은 범위를 적용하며 중간 승인을 반복하지 않는다. 로더/초기화 변경은 고위험으로 다룬다. main/staging 병합·공개 head/pin/설정·Publish·배포는 실행하지 않는다. 신규 raw는 로컬 전용이며 외부 업로드하지 않는다.

실제 shell/브라우저 자원이 있는 기존 공간이 복구됐고 clean HEAD69fff7d를 확인했다. 현재 main3c4f78d4/staginga074f455는 이전과 같다. 기존 원시 입력·검사·제품·백업을 그대로 보존한다. 전체 작업 브랜치 병합/기존 파일 전체 덮어쓰기/reset/clean/restore는 하지 않는다.

## 403의 새 판별 근거

이전 page-time 실패 시각은UTC00:30:10.539 마지막 성공~00:30:14.928 실패파일 생성 사이이며 정확한 실패 응답 헤더/본문은 남아 있지 않다. footer도UTC00:35:03.449 마지막 성공~00:35:05.617 실패기록 생성 사이다. 이 자료 공백을 복원한 것처럼 채우지 않는다.

같은 실제 commit46af와 정확한 두 URL을 urllib 기본 요청으로 한 번씩만 재확인했다. page-time은UTC01:57:03.955 요청에서200·13,879byte·immutable 캐시HIT였고 원본 Git blob과 같다. footer는UTC01:57:04.676 요청에서403·183byte, 본문이 **Package size exceeded the configured limit of50MB**였다. CDN 캐시MISS·60초 응답 정책과 원본 헤더/본문을 로컬 보존했다. 두 경로는 Git에 실제 존재한다. 같은 URL 재시도를 중단했다.

현재403은 경로 누락이나 브라우저 실행 실패가 아니라 CDN의 package-size 거절이라는 직접 근거가 있다. 이전 헤더/본문이 없어 모든 과거403의 원인을 소급 확정하지 않는다. 같은 대형 commit의 일부 파일이 기존 immutable 캐시에서200인 것과 uncached 파일403이 공존할 수 있음을 구분한다.

## 최소 제품과 전달 패키지

현재 main과 작업 소스의 관련 runtime 차이는10파일뿐이다. 공개 main의 실제 고정URL10응답을200으로 받아 Git blob과 검증했고 다른 runtime은 같다. main/staging의 관련 runtime tree도 같다. 개별 스타일/초기화 변경은 기존 검증된 단위만 선택한다.7195463은 최신 개선이 없는 과거 참고 후보다.

main의 추적 blob 합계63,220,642byte,46af는75,328,068byte다. 루트의 `시퀀스 01_1.mp4`25,461,752byte와 `헬릭스 작품 (저용량).mp4`22,336,046byte는 현재10HTML/런타임 텍스트와 기존12입력에서 소비가 확인되지 않았다. 모르는 외부 소비까지 없다고 단정하지 않는다. **원본 main/staging/작업 소스에서 두 파일을 삭제하지 않는다.**

전달 전용 [`package/helix-adoption-20261119`](https://github.com/pookat73-prog/helixamc-webflow/tree/package/helix-adoption-20261119)의 초기 commit9ac23b8은 main tree를 기준으로10개 제품 파일만 검증된 source blob으로 바꾸고 이 두 root 동영상을 패키지에서 제외한다. 나머지 공개 파일은 보존한다. 이 branch는 CDN 도달 검증용 전달 snapshot이며 **어느 소스 브랜치에도 병합하면 안 된다.** 원본 파일·이력은 그대로다. 원복은 source main을 바꾸는 것이 아니라 승인 후 바꿀 loader 선택을 기존 값으로 돌리는 방식이다.

이 패키지 URL은 존재하는 실제 CDN 응답과 Git blob을 확인하고 있다. 기존 응답을 새 URL alias로 붙이지 않는다. 모든 자산을 최신@main으로 대체하거나 운영 pin을 바꾸지 않는다. full FILES/SEO 선택 경로 수집과 실제 브라우저 채택·기능 검증은 아직 완료 전이다.

## 검증 계약과 현재 제한

실제10HTML은 별도 새 로컬 입력으로 읽었다. Webflow head의 firstpaint 소유권은 보존한다. 적용 제안은 page producer와 shared consumer가 같은 패키지 자산을 선택하도록 정확한 코드와 inverse를 별도 기록하며 공개 HTML에 쓰지 않는다. 부분 적용·기존 fallback·old/new 혼합·GSAP 지연/실패·pending·중복 진입·요청 상한을 실제 body 기준으로 구분한다.

완전한 입력이 확보돼야 기존25단계와 전용 호환성 검사를 새 동결 소스의 단일 연속 실행으로 판정한다. 예전25/부분 성공을 합산하지 않는다. 운영 응답 자체 오류와 인위적 오류 주입을 구분하고 분류 pass를 기능 회복으로 세지 않는다. 자산이 계속 막히면 소스 한정 검토는 진행하되 실제 호환성·전체 감사 완료로 승격하지 않는다.

Safari/iOS/iPad·V0/U01·두 Drive 원격 다운로드 SHA 미검증은 유지한다. 기존 두 파일 중복 업로드와 신규 raw 외부 업로드는 하지 않는다. 최종 판정은1실제 차단 결함/2적용 호환성 완료·감사 진입 가능/3환경·자산 부족 중 근거에 맞춰 갱신한다.

## 실행 중 추가 기록 — 실제 코드의 FAQ native 실패 슬롯

초기 전달9ac23b8의 실제70URL 전체200/Git blob 일치를 확인했다. 원본 응답을 덮어쓰거나 다른 버전 alias로 대신하지 않았다. 기존 정식HTML을 복제한 private head 선택 fixture에서만 생산자/공통 소비자 ref를9ac으로 선택했고 runtime overlay는0이었다.

services/FAQ의 정상 로드는 각각 메뉴1·JS요청1·실행오류0이었다. 실제 JS 본문은 유지한 채 생산자의 immutable 요청과@main fallback 두 요청만 native abort하고 공통 소비자를 뒤에 시작시켰다. services는 요청3/메뉴1/Escape·초점 복귀지만 FAQ는 요청2/메뉴0이었다. 실패한 두 script가 DOM에 남아 공통 소비자의 path 존재 검사에서 정상 owner로 오인됐다. 이는 실제 코드의 지원 실패 경로 재현이며 현재 운영 정상 요청 자체가 실패했다는 주장은 아니다.

제품[acda53e](https://github.com/pookat73-prog/helixamc-webflow/commit/acda53e6237556c42128e996bebf9e7b60eca922)는 FAQ injectJs의 메뉴 native-error 경로만8줄 추가/1줄 대체한다. 실패URL을 기존 소비자 protocol로 표시하고 해당 script를 제거한 다음 기존 fallback을 호출한다. HTTP200/native load를 실행 성공으로 바꾸지 않는다. 다른 JS, CSS 재사용/cascade와 FAQ 성공 fallback·횟수는 보존하며 timer/observer/retry를 추가하지 않는다.

전달 snapshot의 후속[d3fd524](https://github.com/pookat73-prog/helixamc-webflow/commit/d3fd5243b1edb371a119e9ba2e257ec19f6d0b4b)는FAQ 한blob만 바뀌었다. 실제70URL을 다시 HTTP200/Git blob으로 검증했고 같은4조건에서 정상1요청·실패복구3요청/메뉴1·Escape/초점 복귀를 확인했다. 원본 실패 로그·PNG·입력과 후보 결과를 모두 로컬 보존한다. 전체 새 통합 검증 전에는 검증 완료 제품으로 승격하지 않는다.

원인별 별도 [역커밋ed38a23](https://github.com/pookat73-prog/helixamc-webflow/commit/ed38a23e3bc1b949a9188bb8e0a8948fd113f069)은recovery/helix-faq-native-owner-20261119에만 보존했다. 작업/main/staging에는 적용하지 않는다. 이후 실제 해당 hunk 회귀 검출/복구를 확인한다.

공통 소비자가 먼저 pending owner를 확인한 다음 생산자가 실패하는 순서는 별도 probe2회에서 선행 조건을 만들지 못했다. 첫 probe는 미완료 route를 닫은 도구 오류, 두 번째는 gate/early-consumer 사전조건 timeout이었다. 이를 새 제품 결함이나 ‘실제 경로에서 도달 불가’로 확대하지 않는다. 더 많은 임시 덮어쓰기를 추가하지 않고 이 probe를 중단해 한계를 보존했다.

현재 Git main/staging runtime은 같지만 **실제 staging Home head는ccb68a7c**를 고정한다. 그 tree에는 현재main과 다른 관련runtime15개가 있어 실적용 검토에서 별도로 보존한다. 같은main payload로 staging을 덮어쓴다고 가정하지 않는다.

## staging cohort 보존과 추가 호환성 조사

실제ccb68의 Home bootstrap/globalCSS/coming-soon/sections/Section1/top-button6자산을200/Git blob으로 확보했다. coming-soon/sections/Section1의 검증된 main→작업 hunk만 해당ccb68 원본에fuzz0으로 이관했다. 역패치 결과도 세 파일 모두 정확한 실제ccb68 SHA로 돌아갔다. Home FILES의집합은 main과 같지만 순서가 달라 원래 bootstrap을 보존했다.

staging Home만을 위한 [619d3d2](https://github.com/pookat73-prog/helixamc-webflow/commit/619d3d2e9e78131ace18a519400a6aae75320b21)를 별도package/helix-staging-home-20261119에 만들었다. main용d3fd를 기준으로Home bootstrap/v3·globalCSS·top-button·inspector를ccb68으로 보존하고, 위 세 파일은ccb68+검증 hunk만 담았다. 현재staging의 공통 소비자는tip의global/bootstrap을 쓰므로 이 경로는 최신 검증 공통 소비자를 유지한다. 이 전달 스냅샷도 병합/공개 적용 금지이며 일반staging 페이지 전체의 base로 쓰지 않는다. 실제70URL200/Git blob은 확인했지만 실제 화면/모션 비교 전 호환성 완료가 아니다.

새 네트워크 조건은 메뉴DOM만으로 판정하면 부족했다. 생산자의 첫 메뉴JS 요청만 native 실패하면@main fallback은 실제200/구형JS4aa23e…로 성공한다. services/FAQ에서 메뉴1/요청2·Escape/초점은 정상이지만 실제 배경 wheel이0→120/600px로 움직였다. 새 CSS와 구JS의root scroll-lock protocol이 일치하지 않는다. 정상 fallback 분류 pass를 기능 보존으로 승격하지 않는다.

다른 소비자의 동적SVG/배경동영상이 초기정적FILES 수집에 없어 불완전 입력 실패를 보존했다. 이를 제품 결함이나 성공으로 합산하지 않고 실제 소비 URL 수집으로 분리했다. Playwright route.fetch의EAI_AGAIN은 상속 proxy를 사용하는urllib 성공 경로와 달랐다. 환경Networking 문서의 기존 proxy/CA를 유지하는 클라이언트로 정확한GET을 수집하며 설정/허용목록/TLS·PNG·기대값을 바꾸지 않는다. 입력이 완성된 원본에서 원인별 재현을 확인하기 전 다른 생산자 코드를 수정하지 않는다.

## 추가 원본 재현과 격리 제품 — 통합 검증 전 체크포인트

완전한 실제 입력에서 Home/About/내과도 JS native 두 실패 뒤 메뉴0이었다. 첫 실패 뒤 mutable branch fallback 성공 시에는 메뉴가 생겨도 배경 wheel 잠금이 깨졌다. CSS는5생산자×첫 실패/두 실패10조건에서 실패한 link가 남아 공통 소비자의 채택을 막았다. 페이지오류·미기록 네트워크 오류는0인 재현만 근거로 삼았다.

제품3f4c76d는 Home/About/Services/FAQ/내과의 메뉴 CSS/JS native 실패 영수증을 보존하고 global 소비자가 실패한 CSS를 정상 owner로 세지 않게 한다. 기존 services JS E1/P3와 다른 자산은 유지한다. 별도 역커밋df54a04는 해당42줄만 되돌린다.

제품cb0c4d8은5생산자의 메뉴 CSS/JS 한 쌍에만 기존1회 retry를 같은 immutable ref로 한정한다. 다른 자산의 fallback·순서·callback은 보존한다. FAQ의 재사용 link에 같은 실패URL을 다시 넣으면 Chromium에서 두 번째 native 요청이 생기지 않아, 이 CSS retry에만 고정 `?hx-menu-retry=1`을 사용한다. 실제 고정 query URL도 같은 Git blob/200으로 확인했다. 역커밋bcc284b를 별도 보존했다. 요청 상한을 늘리거나 전역 timer/observer를 추가하지 않았다.

새 판별 근거가 있는 늦은 API 순서도 재현했다. 실제 staging FAQ에서 두 API 응답을 제어해 page producer와 shared boot가 모두 window.load 이후 실행되도록 했다. 기존99f85c8은 실제 shared boot 시 producer script가 pending인 상태에서 두 native 실패를 놓쳐 메뉴0/요청2였다. `__helixSharedUiInit`나 CTA class만으로 consumer 완료를 판정하지 않고 실제 boot와 native 사건 시각을 기록했다. 제품8c4aa80은 이 외부 pending owner의 native 완료/실패만 직접 관찰한다. 성공 자산은 존중하고, 실패 시 기존 loadMissing이 새 producer retry를 다시 찾아 부족한 자산만 채운다. 재시도·전역 타이머·guard reset은 추가하지 않았다. 로컬 후보는 같은 입력에서 메뉴1/요청3이었다. 역커밋d55ebb8은 이 제품만 되돌린다. 원본/후보 HTTP200 JS 본문은 유지하며 fault는 요청 native abort로 명시한다. 일반 HTTP200 실행 예외의 해결과 혼동하지 않는다.

최신 전달 후보는 main 계열 `d63ed35ca19c6f2f830c3dc28f74cc15d9f70870`, 실제 staging Home 계열 `0a989dddfeabcdffdfc4437341637686f229c6d4`다. 각각74개 실제 URL이 HTTP200/Git blob 일치다. staging의 callback-free/eager Home 로더·FILES 순서·cache 정책은 보존하고 확인된 메뉴 소유권 단위만 별도 이관했으며 역패치로 원본 bytes 보존을 확인했다. 모두 미적용 snapshot이고 병합 금지다. **이 체크포인트에서는 새25+실제 후보 통합 검증·최종 감사 진입을 아직 완료로 판정하지 않는다.**

## 적용안·원복 검토 체크포인트 — 이전 staging 후보 대체

staging Home의0a989dd는 과거ccb68→작업 변경분만 이관해 최신 firstpaint 계약의 기존 main 선행 코드를 누락했다. 실제 native 사건에서done만 발생하고ready가 없음을 검출했다. 이는 새 Section1 제품 결함이 아니라 전달 패키지 조립 결함이다. 검증된 coming-soon/sections/Section1 세 파일의 기존 ready·font·consumer·CTA 전화 소유권 선행 코드까지 포함한 **823c7975504878474f0c9efba332668867f3eb30**으로 대체했다. 처음 실패와 수정 후 Home1440 원본 비교·역전환 성공을 보존했다. 해당세 파일 외 staging bootstrap 순서/cache·globalCSS·top-button·inspector는 보존한다. staging Home만 소비하므로 해당 cohort의 page-ID 내과 CSS 차이를 무작정 통일하지 않는다. 다른4페이지는d63ed35를 선택한다. 두 최종 후보의 실제 URL은각74개 모두200/Git blob 일치다.

새 원본 staging About 수집은13:00:38/13:01:12 KST에 `@a074f455a4/global/floating-cta.css`와 `@a074f455a4adc3dd8515255f6d779dea0afeeb10/global/floating-cta-mobile-fix.css`가403이었다. 두 본문 모두같은50MB package-size 제한이고 full SHA·헤더·본문을 로컬 보존했다. 같은 실패GET을 반복하지 않고 원본 staging 비Home4페이지 비교를 미승격 범위로 묶었다.4페이지 모두에서 직접403을 관측했다는 주장은 아니다. 후보 자산이나다른 URL로 원본 응답을 채우지 않는다. 원본 staging Home3크기 입력과 새 후보5페이지3크기 입력은 별도 확보했다.

Webflow2.2의 site identity·site/page freeform code를 **읽기 전용**으로 확인했다. 변경할5개page head와site footer의 producer/shared 구간은 공개10HTML과각각정확히1회 일치하고 저장된전체page head도10HTML에 그대로있다. API에 쓰기/Publish는 하지 않았다. [6개 적용/역변경 패치와 전체블록 SHA](proposals/adoption-20261119/manifest.json), [파일별 이유·실제 URL/SHA·복구 경계](evidence/adoption-package.json)를 준비했다. 패치 forward/reverse가 실제 저장블록 bytes로 정확히 왕복하며 firstpaint head와 site head, 구간밖 코드는 불변이다. 전체before/after head·HTML raw는 로컬에만 둔다.

패치의기계적원복 성공과 운영원복 가능성을 구분한다. 기존큰ref의 cold CDN 경로가403일수있어 기존코드로되돌리는 것만으로 운영복구를 보증하지 않는다. 실제 적용 전에는 도달가능한 원복 cohort와5page producer+scoped shared의동시일치·Publish 범위를 재검증해야 한다. 현재는 적용 승인을 요청할 단계가 아니다. main/staging·공개head/pin·설정·Publish·운영배포는 금지 상태다.

4개제품의 정식 역커밋을 별도동결작업본에 zero-context 단위로 적용해 모두원본기능실패를 검출했다. FAQ/Home native 실패와load후pending은메뉴0, cohort 역변경은 wheel0→600으로 실패했고 각자 hunk 복구후 실제메뉴기능이통과했다. 제품/검사코드는분리하고 baseline PNG·mask·100px·threshold0.2·expected failure를 바꾸지 않았다.1px compact gap4→5도320에서검출하고자기한줄복구후108쌍/36편집이통과했다. 이별도음성대조는통합성공에합산하지않는다.

동결검사소스09291a0의별도clean clone에서 기존25단계+정식/스테이징실제자산검사를 **한 번의연속실행**으로진행중이다. 미확보원본staging비교는명시적coverage blocker이며도구가전체pass=true를줄수없도록했다. 소스/자산소유권·검사누락·실패분류는구현검사와다른관점으로따로검토했고 실제선택코드26조건과148개실제응답의Git일치도검증했다. 동일실행자의소스한정검토이며외부독립감사완료는아니다. 별도stage Hero검사에서동적Adobe폰트5개가누락된실패는입력문제로보존하고, 기존동결통합입력을수정하지않는별도입력에서실제GET만추가수집후엄격재생중이다.
