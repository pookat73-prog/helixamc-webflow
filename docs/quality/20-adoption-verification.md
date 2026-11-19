# HELIX 실제 적용 자산 검증과 독립 감사 준비

2026-11-19 KST. 시작69fff7d, 검증 동결06f8bba, D02 제품46af337/복구19455fd를 보존한다. D02/D05는 종료 범위이며 새 미세 CSS·전면 리팩터링을 하지 않는다. 최종 판정은3(자산 부족으로 특정 검증 보류)이며 전체 적용 호환성·독립 감사 완료가 아니다.

## 최종 실행·판정 — source21의 단일 연속 검사 완료, 전체 승격 보류

최종 소스·검사는 **21acccb421aee305aed8941ee5a5da87407f94fa**다. clean clone `helix-adoption-final-v4-20261119`와 불변 입력v5에서 기존25단계→실제 정식39→실제 스테이징41을 한 번의 중단 없는 부모 실행으로 완료했다(2026-11-19 16:49:38 KST). 환경 연결 전환 때도 같은 PID350429와 실행 파일·입력·source SHA가 유지됐다. 옛v1/v2/v3의 중단/실패·예비 검사를 합산하지 않는다. 제품은b3768c4 이후 불변이며 이후 마감은 문서·판정 자료다.

| 범위 | 정상 후보 | 원본 비교 완료 | 원본 비교 보류 | 실제 기능 복구 조건 | 영구 실패 분류 |
|---|---:|---:|---:|---:|---:|
| 정식 |15|15|0|22|2|
| 스테이징 |15|3|12|24|2|

80조건의 선택 계약은 모두 통과했다. 정식39조건의 범위는 완료됐지만 스테이징은 원본12비교 부족으로 전체 통과가 아니다. 부모 JSON의 `verifiedContractsPass:true`와 `pass:false`를 분리했고, 별도 승격 판정은 **exit2**를 반환했다. 영구 native 실패4조건은 사용 불가이며46복구에 포함하지 않는다. 정상30화면의 폼 전체 계산값/geometry 불변과 원본이 있는18화면의 같은 상태 예약창PNG byte exact를 확인했다. 현재 계약은 문구·제목타이포·높이·문서정책·링크·고정요소·폼/메뉴 기능이며 전체 페이지 픽셀 동일성을 뜻하지 않는다. footer V0를 해결한 것도 아니다.

추가 기록 판독에서 정상/고장 주입의 모든 실제 메뉴 생산자·공통 소비자는 선택한 동일 immutable ref였다. 1회 실패는2요청(각환경10조건),2회 실패는3요청(각10),10초 지연은1요청(각2),영구 실패는4요청(각2),load후 API 순서 복구는3요청(staging2)이었다. 새 retry 상한·전역timer/observer·초기화 guard reset은 없다. 실제 고장 주입은1440폭이고10초 pending/영구 실패는FAQ 중심이다. 정상 후보는5페이지×3크기이며Home ready/done·ghost·loop·역전환과 메뉴/폼 wheel·Escape·초점을 확인했다. 별도 실제stage Hero6조건은 동일 제품 bytes의GSAP40회 소진·복원을 검증했다. 모든폭·critical CSS·폰트·firstpaint 오류의 전체 조합을 검증했다고 하지 않는다.

### 실제 개선과 이관 경계

메뉴 로더5원인을 실제 원본 실패→최소 수정→기능 복구로 처리했다: FAQ 실패 script 슬롯(acda53e),5생산자의 CSS/JS 실패 기록과 shared 채택(3f4c76d),기존 메뉴 retry의 동일ref 유지(cb0c4d8),load후 외부 pending 결과 인계(8c4aa80),빈sheet 성공 추정 제거(b3768c4). 새 스타일시트 선언 정리나D02/D05 재수정은 없다. 각각 ed38a23/df54a04/bcc284b/d55ebb8/aa3c394의 별도 역커밋을 남겼다. 같은 함수의 선행/후속인4·5는 역변경5→4,복구4→5이고 다른1~3은 자기hunk다. 별도608434e 대조 작업본의 canonical역패치5원인 검출/복구와1px 검출·자기한줄복구후108/36통과는 현재 제품·대조 로직과 같지만 새 통합에 합산하지 않는다. baselinePNG·mask·100px·threshold0.2·expected failure는 보존했다.

최신 미적용 패키지는 **669fa762b87c80a425621906543d86bbbf924f9a**(정식5·staging 비Home4), **62ecac1b6a374ebdf339840093462f1ad5bcd32e**(staging Home 전용)다. 각74실제URL이200/Git blob 일치다. main 기준14제품 파일만 선택했고254blob은 그대로다. staging Home의17개 main대비 차이는 모두 신규수정이라는 뜻이 아니며 기존CCB bootstrap순서/cache·CSS·top-button·inspector/v3 등 보존분을 구분했다. snapshot용 root영상2제외는 원본 삭제가 아니고5페이지소비/입력에 참조가 없음을 확인했다. 두패키지 모두main/staging에 병합하지 않는다.

[파일별 이유·URL/SHA·실제 요청 소비자](evidence/adoption-package.json)는 요청과실행완료를 구분한다. staging Home pin의tree blob을 실제owner로 오인하지 않도록 actual shared a074 baseline을 별도로 기록했고, debug/legacy미사용파일을 live 소비자로 부풀리지 않았다. [6개 적용/역패치](proposals/adoption-20261119/manifest.json)는실제저장블록의 전후SHA와 source patch를 담는다.10개 최종candidate HTML이 실제공개HTML+정확한 제안snippet 교체만으로 일치했다. headfirstpaint와sitehead 및 snippet밖 코드는 불변이다. scopedselector26조건과cache4제어흐름도별도소스검토했지만 WebflowPublish원자성/다른페이지브라우저동작전체검증은 아니다.

### 완료를 막는 실제 조건과 보류 범위

- CDN: @46af337의page-time은같은URL에서200/Git일치/cacheHIT였고footer는403본문이50MB package제한이었다. 이전403원시헤더/본문이없어 과거원인까지소급단정하지않는다. 새stagingAbout의@a074 두CSS도명시적50MB제한403이었다. 같은실패재요청을멈추고다른ref/합성응답으로원본을대체하지않았다. 나머지3staging페이지에서직접403관측했다고하지않으며비Home4페이지12원본비교를보수적으로보류한다.
- 원복:6설정블록 forward/inverse는기계적으로정확하지만기존큰ref의운영원복도달성은미완료다. 실제도달가능한원복cohort를확보해야한다. 생산자5개+scopedshared는한적용단위이며부분적용은지원하지않는다.7195463과중간후보는최신배포본이아니다.
- 사이트수정:16:48KST main/staging·공개10HTML전체SHA/loader/pin·관련저장코드·게시시각은불변이다. 사이트lastUpdated만00:08:30.921Z→07:07:52.465Z로변했다. 이번작업Webflow쓰기0이며변경자/범위는미확인이다. 어떤미게시작업도되돌리지않고향후Publish전범위·다른진행자변경을확인해야한다.
- D04일반실행예외·구생산자혼합·다른mutable fallback/미래@main·native결과없는무한pending과D03다른firstpaint경계는잔여다. 정상실제파일오류와테스트용구문/실행/native오류를구분한다. 이번지원실제조합의정상/복구검사에서새실행오류가관측됐다는주장은아니다.
- 실제Safari/iOS/iPad회전,V0/U01승격,기존두Drive원격다운로드SHA는미검증/보류다. 기존아카이브중복업로드와신규raw외부업로드는없다. 새raw는로컬전용이며원격보존완료가아니다. 소스한정별도관점검토는같은실행자이고외부독립감사완료가아니다.

판정은 **3:자산부족으로특정검증보류**다. 추가미세리팩터링을시작하지않는다. 원본staging입력·운영원복·사이트수정범위를확보한뒤필요한최소후보와동결입력에서새연속검증및독립감사로이관한다. [최종판정/원시결과해시](evidence/adoption-final.json), [별도소스검토의15판단](evidence/adoption-source-review.json)을참조한다. main/staging병합·공개head/pin/설정·Publish·운영배포는하지않았고실제적용은별도승인대상이다. 아래‘진행중’과다른SHA는당시실행이력이다.

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

## 빈 CSSStyleSheet 판별 — 다섯 번째 국소 제품과 새 동결

위 첫 연속 실행 중 별도 관점의 CSS late-API 검사를 추가했다. 실제 후보 d63ed35에서 두 CSS native 실패 후 메뉴DOM/ready는 정상이어도 배경 wheel이0→600으로 움직였다. 두 번 재현한 뒤 원인 판별 기록에서 첫 pending link에는 `.sheet`가 없고, 실패 후 재사용한 link에는 비어 있는 `.sheet`가 남아 두 번째 native 결과 listener 등록이 생략됨을 확인했다. 태그·module guard·메뉴DOM만으로 성공을 선언하지 않았다.

제품 **b3768c43b60ef95b28c7139ca2ef7445bbbd274f**는 `global/bootstrap.js`의 외부 pending-owner 함수에서 `.sheet` 성공 추정 한 줄을 제거하고 이유만 주석으로 남긴다. 이미 성공한 외부 자산도 그대로 존중하며 native 관찰 자체가 재요청을 만들지는 않는다. 전역 timer/observer·retry 수·public head·CSS 선언을 추가하거나 변경하지 않았다. 로컬 후보 후 실제 새 immutable 후보 **669fa762b87c80a425621906543d86bbbf924f9a / 62ecac1b6a374ebdf339840093462f1ad5bcd32e**에서도 같은 JS/CSS late-API 경로가 각각3요청·메뉴/잠금/Escape/초점 정상으로 통과했다. 각 후보74URL은 모두 HTTP200/Git blob 일치이며 stage의 보존된 debug inspector는 별도1URL source-only200/Git 일치, 기능은 활성화하지 않았다.

정식 역커밋 **aa3c39406e60164192bcf6d3a064ba363fabb97f**는 b3768c4만 되돌린다.4번8c4aa80과5번b3768c4는 같은 pending-owner 함수의 선행/후속 수정이다. 따라서 최신 통합 작업본에서4번을 역변경하려면5번 역패치를 먼저 적용하고, 복구는4→5 순서로 한다. 이 의존성을 숨기거나 큰 reset으로 대신하지 않는다. 다른1~3제품은 각각 자기 hunk만 되돌린다. 새608434e 작업본에서5개 원인 모두 canonical 역패치 실패 검출과 자기 단위/명시적 의존순서 복구를 확인했다. 이 음성 대조는 새 연속 통합 성공과 별개다.

첫09291a0 연속 실행은 새 원본 기능 실패 발견에 따라 해당 프로세스 트리만 의도 종료했다. 당시5완료 단계와 부분Hero 원시 결과·PID/시각/이유를 보존하고 새 결과에 합산하지 않는다. 새 검사 커밋 **608434ef77c5167871b88b40912df800ce6777f4**는 실패 시도도 저장하고 JS/CSS late-API 둘 다 실제 기능을 요구한다. 별도 clean clone과 불변 입력v5에서 기존25단계와 전용 검사를 다시 한 번의 연속 실행으로 진행한다. v4 입력20개 manifest 해시는 그대로이며 추가Adobe5응답은 별도 실제GET으로 확보한 현재 입력이다. 기존 역사적 응답·PNG·허용 오차·expected failure를 바꾸지 않았다.

## 고장 주입·정적 이미지 조건 정합화 — 제품 변경 없음

608434e의 연속 실행은21단계를 통과한 뒤 `producer-pending`에서 삽입3≠2를 검출하고 멈췄다. 같은 검사에 최종 native 사건/요청을 추가 기록해 재진단했다. 원본은 pinned 첫URL 한 번만 실패하고 다른@main fallback이 성공했지만, 후보는 같은-ref retry여서 검사 `url===firstURL`가 두 번 실패시켰다. 후보는 native2실패→다른 역사적shared URL의3번째 요청에서 메뉴1/claim1로 복구했다. unexpected JS/네트워크 오류는0이었다. 중복 점유나 새 retry 증가가 아니라 고장 주입의 대상 범위와 기대값이 달랐다.

QA **d53fea3d55faf0387c5b7be44a6b7242f259ced2**는 최초 transfer 한 번 실패의 상한2/삽입2를 그대로 유지하며 고장 횟수를 직접 assert한다. 기존 exact-URL 지속 실패 입력은 없애지 않고 별도 `delay-url-errors`로 보존해 후보의 두 실패/정확히3요청·1claim/DOM을 요구한다. 이 조건은 pinned producer와 다른-ref shared를 사용하는 역사적 source overlay fixture다. 새 matched 실제 cohort의 같은URL 영구 실패는 별도 실제 자산 검사에서4요청/사용 불가로 남으며 복구 성공이 아니다. 기존8조건은 유지하고4조건을 추가한12조건 예비 검사가 통과했다.1회 실패의 기준을3으로 느슨하게 하지 않았다. 제품 코드는 불변이다.

실제 정식 About1440의 modal PNG 예비 비교에서 크기520×484와 본문은 같고 둥근 모서리 뒤210픽셀만 달랐다. 과거 form-label 검사와 달리 새 검사에서 배경 동영상을 다른 재생 시점에 캡처했다. 기존 `freeze` 함수 본문을 이름 외에 그대로 재사용한 QA **fb309245dda9e47eba96a010ae68e162a55db6a0**에서 양쪽 video0/paused·scrollY0와 PNG byte exact를 확인했다. d53의 부분 연속 실행은 새 검사 조건을 동결하기 전에 자기 프로세스 트리만 의도 중단했다.

이후 About390의27픽셀은 modal y423.90625를 감싸는 screenshot 첫 행의 배경이었다. 원본은 메뉴 전, 후보는 메뉴/휠 조작 후였으므로 같은 UI 상태가 아니었다. 별도 진단에서 같은 동작 이력의 원본/후보 PNG는 exact이며, 후보의 메뉴 전후 모든 modal 자손 계산 CSS·geometry도 exact였다. 해당 실패 이미지·픽셀 위치·전체 계산값을 보존했다. 검사 후보는 정상 정적 비교를 양쪽 같은 순서로 먼저 하고, snapshot에만 쓰던 미디어 상태를 복원한 뒤 원래 메뉴/폼/Hero 역전환 검사를 진행한다. 조작 후 폼의 모든 계산값·geometry 불변 검사도 추가했다. 정상 화면을 숨기는 mask·crop·허용 오차 조정이나 제품 CSS 수정은 없다. 본 작업의 원격전달용 raw에는 포함하지 않고 로컬 증거로만 보존한다.

최종 통합은 수정된 QA와 원시 입력을 다시 동결한 한 번의 실행으로 판단한다.608/d53의 부분 성공을 합산하지 않는다. 실제 자산 예비검사는 이 준비 과정의 도구/입력 확인이며 최종 통합을 대신하지 않는다. 신규 raw는 계속 로컬 전용이고 원본 staging4페이지/도달 가능한 운영 원복·실기기·V0/U01 차단은 유지한다.
