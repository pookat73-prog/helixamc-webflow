# HELIX 잔여 구조 개선 및 전체 안정화 실행

2026-11-17 KST. 사용자 첨부 지시를 실행한다. 시작점4798317, 작업 브랜치 `fix/helix-residual-structure-20261117`, 별도 worktree `/workspace/helix-residual`. 기존 작업장/미커밋0/복구점4798317을 확인했고 변경하지 않는다.

## 기준 및 진행 경계

- GitHub main3c4f78d4/staginga074f455/기존작업4798317을 직접 조회했다. main/staging 실행코드는 동일하며 문서2개·측정검사1개만 다르다. 4798317과의 차이는 보존할 기존6개 runtime 경로뿐이다. 전체 감사 브랜치를 병합하지 않는다. 현재 기록과 관련root AGENTS/CLAUDE LOCKED,08의 실패/재개 근거를 읽었다.
- `helix-website-performance` 표준과 전용 Drive 최신 인계도 읽었다. 최신 사용자 지시에 따라 구조작업 기록은 GitHub HANDOFF/09에 남기며 거절 이력이 있는 Drive 쓰기·중단된 archive 업로드는 반복하지 않는다.
- 작업량 대·예상 사용량 높음, 현재 모델/높은 추론 유지 권장. 재현/책임 범위 확정→검사 도구 커밋→한 원인 제품 hunk 커밋→그 단위 결과/복구 인계를 분리한다. 변경마다 이전 기능을 전부 반복하지 않고 관련 검사와 비대상 대조를 수행한다. 최종 통합 실행은 단일 실행으로 판정하며 분할 성공을 전체 성공으로 합산하지 않는다.
- V0: 기존 paint 명령 비교 뒤의 미확인 단계인 **LayerTree picture를 replaySnapshot으로 실제 PNG raster로 읽기**를 추가한다. 원본286/820px 흐름·브라우저 설정·제품CSS는 그대로고 replay는 진단 산출물뿐이다. 3회만 수행해 visible capture 차이와 중간 raster 차이를 비교한다. 원인/처방이 확정되지 않으면 실패를 보존하고 중단. PNG33/100px/threshold0.2/mask/expected failure 불변, V0 전체3회 무실패+오류주입 거절 전U01 보류.
- D02: 기존 내과 목록 예외는 보존. `.div-block-358`의 실제 게시 제목과 긴 합성 입력/자손을 구분해 진단하고, 재현된 하나의 root 예외만 다룬다. Step 번호/다른5페이지/한글 보존.
- D05: 완료된 form 높이/장식은 건드리지 않는다. phone min-height의 후행 선언이 실제 편집을 가리는지 먼저 통제 수정한다. 최종 base/mobile/bar/overlap/legacy 값이 같아야만 한 속성 소유권을 정리한다.
- D03/D07: 숨은 복제의 실제 초기화·순번/이벤트 계측, 과거 누락Typekit 입력은 별도 획득/해시 고정 뒤 검사. 실패 재현 없이 노출/타이머 구조를 교체하지 않는다.
- D04: 실제 head→entry→module/동적자산 SHA, 중복/복구를 조사. D06: meta 원본·회전 경로를 조사하되 실제 엔진이 없으면 미검증으로 남긴다. 공개pin/설정은 변경하지 않는다.
- main/staging merge·Webflow Publish·운영배포 없음. 다른 작업자의 외부 CSS/JS/자산은 보존.

## 현재 상태

V0 새판별3회: 최종 화면625/0/881px, 첫 카드 replay raster400×440의 PNG SHA256은3회 동일했다. 중간 replay가 같아도 실제compositor tile이 같다는 증거가 아니어서 최종 원인/처방은 미확정이다. V0실패/U01보류를 유지하고 이번 조사는 닫는다. [판정](evidence/residual-v0.json). 최신 공개 home main3c4f78d4/staging고정ccb68a7c, 생성CSS46f7fbd5d를 실제 읽었다. 이는 제품 수정 전 V0 판정이다. 이후 제품6단위와 최종 판정은 아래에 기록한다. 통과/실패/미실행은 실행별로 구분한다.

## D05-P1 phone min-height

원본4798317에서 canonical phone 높이를58px로 바꿔도 후행56px가 이겨 편집이 무효였다(검사 exit1 보존). 실제 최종값은 desktop56 / floating-mobile54 / mobile-bar48 / overlap54이며 form 높이·장식은 이전 완료 계약 그대로다. 선택자 `.hx-fcta-shell .hx-fcta-phone-btn`의 min-height만8선언→base/compact2선언으로 정리한다. 별도 bar/overlap/legacy와 외부 phone 정렬858바이트는 보존한다. 도구692f1d1과 제품 변경은 별도 커밋이다.

## D02-P2 mobile process heading

최신 실제 게시 영어 제목5개는3크기에서 정상이다. 합성 긴 ClinicalReference는390px에서 제목이약2456px로 넓어져 allocated column175px 밖으로 벗어난다. 기존 anywhere가 body* important에 막히는 책임 간섭이며 직접텍스트/자손으로 재현했다. 기존 `.div-block-358 > :not(.text-span-3)` 예외만 important/자손 경계로 복구하고 grid/크기 규칙·Step번호nowrap·기존목록 예외는 보존한다. 전역정책/desktop은 바꾸지 않는다. 새 검사와 제품은 별도 커밋, full15쌍은 한 실행으로 판정한다.

D05-P1 결과: 한 실행108쌍의 모든 요소/가상요소 계산 CSS·geometry·PNG가 동일했고, 통제 수정36조건에서 base58px 편집이 desktop phone에만 적용됐다. form·인접 본문·mobile/bar/overlap/legacy는 유지됐다. 일반 selector의8높이 선언을2소유자로 줄였다. 기존 phone 정렬/크기/간격·완료된 form 계약은 그대로다. [대장](evidence/residual-phone.json). 통합 기능 검사는 최종 실행에서 수행한다.

## D07-P1 section-local pairing

숨은 기기 복제 section만 section2 앞으로 이동한 fixture에서 보이는 section geometry는 그대로였지만, 원본4798317의 bt2는3크기 모두opacity0/loopfalse/shadow쓰기0으로 남았다. 원인은 전역 heading NodeList의 idx0만bt2로 묶는 선택이었다. 각 heading의 같은section 안에bt2가 있는지를 기준으로 기존bt2/bt3 선택만 고쳤다. 타이밍·색·shadow·loop·카드·hero는 변경하지 않았다.

별도 도구282421f 이후 제품 hunk를 분리한다. 원본/후보6실행에서 원본은위실패, 후보는opacity1/looptrue/쓰기1이며 비대상 초기geometry동일, JS/네트워크오류·외부전달0. 숨은DOM의 조기초기화는 별도 문제로 남긴다. Typekit 추가 subset은검사밖획득7응답으로고정했고, 두 누락실패를정상으로세지않았다. [판정](evidence/residual-heading-order.json).

D02-P2 결과: `header-full-final` 단일 명령의5페이지×3크기15쌍이 모두 통과했다. 게시 내용/배치/타이포와 Step마커의 원본 계산값을 보존했고, 모바일 긴영문/URL/숫자/한글×직접/span/a12조건은 넘침→내부줄바꿈으로 개선됐다. 고정정책후행삽입/외부root/766·767·768 대조도 통과했다. 이전실패는 FAQ입력3개누락과 PC에도nowrap라고가정한신규검사오류였다. 원본PC에서도실패한가정을원본동등성검사로고쳤으며 모바일nowrap/기존기준은유지했다. 분할성공을합산하지않고 새단일15쌍만최종근거로쓴다. [판정](evidence/residual-process-heading.json).

## D03-P2 heading 첫 노출 초기화

원본7f4cb17은3크기 cold에서 숨은복제bt3를미리loop상태로만들었고 hot첫노출때visible shadow쓰기0이었다. headingpair만 별도 초기화경로로 분리해 실제layout rect가있는경우에등록하고, 아직시작하지않은hidden trigger는kill/재등록한다. 시작된pair는once계약을유지한다. 기존hero완료/loadfallback/resize에서같은idempotent경로를호출하며 다른initSectionsOnce·cardWeakSet·전화/복사·색/타이밍은그대로다. 정상값과최종4버튼표현을원본대조하고 최초노출/미진입후숨김/왕복을검사한다.

## D04-P1 shared loader 실패 복구

실제영상의학과소비자에서 공통메뉴CSS를1회실패시키면원본은7500ms뒤에도메뉴position static, JS를실패시키면메뉴DOM absent였다. loader guard가재실행을막고onerror는태그만지워별도재방문전복구하지못했다. 공통loader자신이만든실패요청만같은immutable URL로500ms후1회재시도하는후보를검사한다. 재시도전present/기능guard를다시봐다른loader의성공을존중하고,영구실패는최대2요청으로끝낸다. API재조회/pin변경/측정handler/페이지loader의선택권은건드리지않는다. CSS와JS를각각실패·경합·영구실패·정상으로분리해검사중이다.

## D06 조사 — 제품 변경 없음

현재WebKit binary/실기기가없다. 단순화한VM소유권추적에서home교정값width991이후globalfix의ORIGINAL로보관돼가로복원때그교정값을되돌리는경로를확인했다. 이는실제Safari회전실패검증이아니다. [추적](evidence/residual-viewport.json). 첫진단snippet종료구분자오류로home writer가실행되지않은산출물은폐기하고,실제writer호출assertion으로검사도구를고쳤다. meta/breakpoint/측정767/기기DOM은수정하지않는다. 재개조건은실제엔진에서원래meta/두writer/회전왕복을계측해같은복원실패를확인하는것이다.

D03-P2 결과: `lifecycle-final` 단일6실행에서 원본은숨은복제loop=true/첫visible쓰기0, 후보는숨은복제loop=false/첫visible쓰기1이었다. 두복제의첫노출·미진입후숨김/복원·왕복추가쓰기0, fade완료후1.5초hold, 최종4버튼표현/geometry동일과hero완료를검증했다. pending hidden trigger와onEnter경합도kill해퇴역시킨다. JS/네트워크오류·외부전달0. 모션감소표본은820시작에포함했다. 실기기회전/Safari 검증을대신하지않는다. [대장](evidence/residual-heading-lifecycle.json).

## D05-P3 form/phone width 소유권 분리

추가 조사에서 form canonical width90% 편집도 뒤의 phone/form 공용width100%에가려무효였다. 높이/장식은재수정하지않고 width 한속성만 분리했다. phone은기존위치에서자기width100%를유지하고 form은기존canonical width100%를단독소유한다. 공용box-sizing과모든variant는그대로다. 도구47418bd와제품커밋을분리한다.

`form-width-fixed` 한실행108쌍의전체계산CSS/geometry/PNG가동일했고36통제수정에서form만폭을바꿀수있으며phone/인접본문/높이/장식/bar/overlap/legacy는보존됐다. 외부phone정렬858바이트는원문그대로다. [대장](evidence/residual-form-width.json). 신규라이브러리·파일구조재편없이두action사이width강제결합을제거했다.

D04-P1 최종 결과: `shared-final` 단일48조건에서 메뉴CSS/JS의 일시 실패는 원본static/absent→후보fixed로 복구되고click/Escape도 동작했다. 영구 실패는 복구 성공이 아니라2요청에서 멈추는 계약이며, 다른loader가 먼저 제공하면 추가retry가 없고 중복entry도 재초기화하지 않았다. 대상은**메뉴2자산만**이다. viewport-control은 기존대로1요청이며 미검증인 다른module/viewport 복구정책을 넓히지 않았다. 같은immutable URL만 사용하고API재조회/공개pin변경은 없다. [대장](evidence/residual-shared-recovery.json)· [실제 자산 연결](evidence/residual-assets.json)

D04의 잔여: 다른loader가남긴실패tag를present로간주하는경로·error없이정지한요청·기존mixedpin정책은미해결이다. 이한정복구로전체로더구조완료라하지않는다.


## 최종 판정 — 소스 동결과 연속 재검수

**제품6단위 구현·격리 검증 완료, 전체 구조 안정화는 미완료다.** 동결 소스는 `65227e4eb9062388e4eb76e0dab8015458508ca3`이며 이후 최종 인계 커밋은 문서/증거만 추가한다. [최종 대장](evidence/residual-final.json)에 runtime4파일 SHA256, 입력 manifest 해시, 현재 자산, 오류대조와 범위별 판정을 고정했다. 기존4798317 작업장과 다른 작업자 코드는 보존했다.

| 실제 제거한 간섭 | 제품 커밋 / 개별 복구점 | 개선을 입증한 대조 | 남은 경계 |
| --- | --- | --- | --- |
| phone 높이 후행 덮어쓰기8→2소유자 | `67c3c75` | 108쌍 계산CSS·geometry·PNG 동일 +36통제 수정에서 phone만 도달 | 다른 속성 전체를 정리한 것은 아님 |
| 내과 모바일 process 제목의 전역 줄바꿈 간섭 | `aaad432` | 게시 내용 보존, 긴 입력12조건 넘침→내부 줄바꿈, 단일15쌍 및766/767/768 | 실제 게시 제목은 원래 정상; desktop·다른root·폼은 미개선 |
| 숨은 복제 순번이 다른section 버튼을 결정 | `7f4cb17` | 숨은section 위치 변경 전후 보이는geometry동일, 원본bt2누락→후보1회동작, 6실행 | 지그 등 다른전역collection은 별도 |
| 숨은 heading을 조기에 시작해 첫 노출을 소비 | `34ecaa9` | 6실행과 최종연속실행에서 hidden미시작/첫visible1회/왕복0추가/hold1500ms/4버튼보존 | firstpaint/hero전체 수명주기 교체는 안 함 |
| form폭을 phone공용규칙이 강제 | `fccbcf6` | 108쌍 동일 +36통제 수정에서 form만 도달 | 완료된 높이·장식은 그대로 |
| 공통메뉴 실패 후 entryguard 때문에 복구 없음 | `65227e4` | 실제영상의학과 소비자48조건, 일시실패복구·영구실패2요청종료·다른loader존중 | 타loader실패tag/무응답/혼합pin 미해결 |

각 제품 커밋에는 검사 도구를 섞지 않았다. 복구가 필요하면 허용된 작업 브랜치에서 **그 제품 커밋의 hunk만** 역적용하고 해당 단위·이웃·연속선택검사를 수행한다. 같은 파일의 나머지 변경은 보존한다. heading 두 단위를 함께 되돌릴 때는 수명주기 `34ecaa9` 다음 순번 `7f4cb17` 역순으로 처리한다. main/staging에는 적용·복구 작업 모두 하지 않았다.

### 독립 작업본 단일 연속 실행

`/workspace/helix-residual-review`에 같은SHA와 검사 코드를 고정하고 `scripts/visual/residual-integration.cjs`를 **한 번 연속 실행**했다. 첫 실패에 중단하는 도구이며 이번 실행은6단계 모두 exit0이다. 과거 분할 통과를 합친 결과가 아니다. 별도 작업본 재실행이며 독립된 사람의 감사는 아니다.

1. 원본 PNG33·응답286 해시 검증.
2. home/소개/서비스/FAQ/내과 ×1440/820/390의15쌍: 콘텐츠·문서높이·타이포·주요geometry·문서정책·UI중복수 동등. 실제 overlay 소비를 전부 확인.
3. home3크기 메뉴/예약 배경휠잠금·닫은뒤 대조·카드노출, 각11경계전환(990/991/992/766/767/768/478/479/480/820/1440).
4. 제목모션 원본/후보3쌍: 첫 노출·숨김/복원·왕복·최종표현 보존.
5. 저장소 품질9그룹.
6. 기존 home-loading6그룹.

재생 중 예상하지 않은 JS/네트워크오류와 외부전달은0이다. 이 결과는 **선택한 구조 영향·기능 통합 검사 통과**다. V0 원본 스크린샷 전체suite 통과나 사이트전체·Safari정상으로 확대하지 않는다. 기존100px/threshold0.2/mask/expected failure는 그대로이며 V0는여전히실패다.

최종 조합에서 phone108쌍/36통제 수정도 한 실행으로 통과한 뒤, 별도 음성대조 작업본에서 compact min-height54→55px만 바꿨다.320px 첫쌍에서 component높이103→104px/top781→780px를 잡아 exit1로 거절했다. 이후 **그 작업본 CSS 한 파일만 자기HEAD로 복구**했고 clean 및 실제runtime4해시가 source/review와동일함을확인했다. 이것은선택검사탐지증거이며 V0의3회전체실행완료조건을대신하지않는다.

추가로 숨은heading에전용class를붙이면다른fallback을중단할것이라는가설을1440에서시험했다. 실제bt2는opacity1/looptrue/visible쓰기1로정상이었고, 원본실패를예상한신규prototype assert가실패했다. 초기화전타이밍을입증하지못했으므로재현된결함으로세지않고제품변경/전체selector합집합을채택하지않았다. prototype·실패로그는로컬증거에보존했다. 이실험을후보실패나해결로섞지않는다.

### 다섯 상태의 구분

- **실제 개선 완료:** 작업 브랜치 소스의 위6단위. 통제 편집이 자기범위만 바꾸고 숨은복제변경이 다른section을 결정하지 않게 된 사실을 검사했다. 공개 운영에서의 효과를 주장하지 않는다.
- **개선 후보 검증 완료:** 각 단위의 기재된검사와 동결소스의 단일 연속 선택통합. staging공개도달 검증은 실행하지 않았다.
- **조사 상태:** V0의새raster판별은인과관계미확정으로제한조사종료. D06은소유권VM추적만확보. mixed-class추가가설은미재현.
- **미해결:** V0/U01, 전역줄바꿈다른root·폼, CTA다른속성/variant결합, firstpaint/hero/지그의다른collection의존, 타loader실패tag·무응답·혼합pin. 목록의D02/D03/D05전체를완료로표시하지않는다.
- **환경 부족 미검증:** 실제Safari/iOS/iPad/WebKit의회전·meta복원. Chromium폭변경은대체증거가아니다. 독립된사람검토도미실시다.

## 확정 후속 실행 단위와 통과·중단 조건

아래는 무조건적인 재작성 계획이 아니다. 각 줄의 원본실패와책임경계가확정된때에만 **그 한 단위**를 구현한다. 새 문제의 재현이 없으면 조사결과만 남기고 다음 독립단위로 이동한다. 작업량은 검증환경확보시간을제외한상대치다.

| 순서 / 위험 / 작업량 | 다음 독립 단위 | 구현 선행 조건 | 통과 및 중단 조건 |
| --- | --- | --- | --- |
| A / 중 / 중 | D05 남은 한 속성의 소유권 | base/desktop/floating-mobile/bar/overlap/legacy에서 후행선언이 통제편집을 무효화하는 속성1개를 먼저 특정 | 최소108쌍 최종계산값·PNG동등 +36통제편집에서 목표만변경. 무효화가없으면제품변경하지않음. phone/form높이·장식·이번width를재작성하지않음 |
| B / 중 / 중 | D02 폼 또는 제목의 **한 root** | 최신폼/제목의실제DOM·게시문구와긴입력영문/URL/숫자/한글/자손을각각재현. 현재15쌍에서게시화면회귀는없음 | 원본넘침→후보내부wrap 및다른root/5페이지높이보존. 실제/합성구분, 전역정책철회금지. 제목예외를모든폼에복제하지않음 |
| C / 높음 / 중~대 | D03/D07 지그의 heading collection 또는 hero복구 **한 경로** | 실제初期化순서·DOM복원·observer/timer를계측해원본실패확인. class혼재는이번prototype으로재현되지않았으므로초기화전fixture·section내중복heading우선순위증명이먼저 | 숨은/보이는복제위치·노출변화에도해당section만반응. bt1~4 .7/.4/.15/1500ms/loop·heroevent보존, 최소3크기모션전후대조. 전역union이나숨은DOM제거를선처방하지않음 |
| D / 높음 / 중 | D04 **타loader가남긴실패tag** | 실패tag소유자·success/failed/pending구분및경합을실제소비자에서재현 | 한module의필요자산만복구, 요청상한/중복listener0/다른loader성공존중. 무응답timeout과혼합pin은별도단위. viewport재시도범위확대금지 |
| E / 높음 / 중~대 | D06 원본meta보관책임 | 실제Safari/iPad/WebKit환경확보, cold·세로↔가로·브레이크포인트왕복에서두writer와meta복원실패재현 | 한writer소유권만변경후실기기와PC/태블릿/모바일의fixed/sticky/스크롤/복제노출보존. 환경부재면제품수정계속보류 |
| V / 높음 / 별도제한조사 | V0 실제compositor결과와capture차이의원인 | 이번equal replay와구별되는새판별근거·관측수단, 실험상한부터기록 | 기존기준그대로독립전체3회무실패+의도오류거절전완료금지. 같은폰트/GPU/좌표/스크롤실험반복금지. 막히면증거보존후닫기 |
| U / 높음 / 중 | U01 기존hunk최소이관 | 오직V완료후, 최신자산/소비자재확인 | 문서overflow·주변geometry·fixed/sticky·실제휠·전체관련페이지보존. 현재는착수하지않음 |

A/B는root/속성이겹치지않을때독립적으로진행할수있고, C/D는실제공유파일변경을동시에하지않는다. V/E의부족한조건이안전한A/B/D조사를대기시키지않는다. 각완료후소스동결·선택범위단일연속검사를다시판정하고실패시그단위만복구한다. 대규모일괄리팩터링·새라이브러리/레이어·공개pin교체는이계획에포함하지않는다.

## 실제 자산·보존·재현 입력

마지막 읽기전용조회에서도 main `3c4f78d4e75a06524b16a32e05e3185c48fbe800`, staging `a074f455a4adc3dd8515255f6d779dea0afeeb10`은그대로다. 두tip의runtime은같고비실행문서2/측정검사1만다르다. 공개home main3c4f78d4, staginghome고정ccb68a7c…/shareda074f455, generatedCSS46f7fbd5d 및기존word-wrap/measurement고정을보존했다. 공개capture의일부Network request failed는보존하며live오류0으로보고하지않는다.

4798317→최종 제품변경은 `global/bootstrap.js`, `global/floating-cta.css`, `global/global.css`, `home/global/sections-animations.js` **4파일의6단위**뿐이다. 외부phone정렬마지막858바이트는원문동일하고다른진행자의coming-soon/scroll-hint등은건드리지않았다. 기존메뉴/예약창배경잠금·카드노출·form높이/장식·bt3단일제어·모바일목록예외는보존했다. 기준PNG/corpus/수치/expected failure/workflow/공개설정불변, main/staging병합·WebflowPublish·운영배포없음.

GitHub에는소스·검사·판정JSON·입력manifest해시를보존한다. 현재응답body/PNG/전체실행로그는 `/workspace/artifacts/helix-residual-20261117`에만있으며원격archive보존완료가아니다. 원본corpus는기존04/08의복원자료를따른다. 이번current입력763응답×5root,imaging777,FAQ보충3,Typekit7은manifest/bodySHA256검증했지만별도클린환경에는이body들이필요하다. 자동재획득/기준갱신을정상검사에섞지않는다.

현재환경재실행예(응답body가보존된경우):

```bash
export HELIX_PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright
export HELIX_INTERACTION_INPUT=/workspace/artifacts/helix-residual-20261117/inputs/home
export HELIX_STRUCTURE_PAGE_INPUTS=/workspace/artifacts/helix-residual-20261117/inputs
export HELIX_INTERACTION_EXTRAS=/workspace/artifacts/helix-residual-20261117/resource-extra,/workspace/artifacts/helix-residual-20261117/order-fonts-v2
export HELIX_INTEGRATION_OUTPUT=/tmp/helix-residual-review-new
node scripts/visual/residual-integration.cjs
```

이는현재체크아웃SHA를기록한다. 이번실측65227e4와비교할때runtime4해시와입력을함께대조한다. 다음작업전공개자산과main/staging을다시읽되기존실패와완료작업을되풀이하지않는다.
