# HELIX 다음 잔여 구조 개선 실행

**최신 판정: 추가 구조 개선4단위의 소스 구현·격리 검증 완료, 전체 구조 안정화는 미완료.** 최종 검증 소스/검사 `b0fa5486116282fd623579362312912754d662e3`. 별도 작업본의 10단계 단일 연속 실행이 모두 통과했고, 개별 복구4커밋을 분리했다. [최종 판정·해시](evidence/next-final.json), [D04 최종 보완](evidence/next-css-owner-reuse.json), [복구](evidence/next-recovery.json)를 현재 기준으로 삼는다. 아래의 진행 중·초안·8단계 표기는 당시 이력이며 최신 판정은 마지막 절을 따른다.

2026-11-17 KST. 기준/원격 작업 HEAD `42d432705def71d5486472b4f94aa099ad8d8c31`, 작업 브랜치 `fix/helix-residual-structure-20261117`. 작업 전 clean이며 기존6단위·다른 작업자 소스 보존. main `3c4f78d4e75a06524b16a32e05e3185c48fbe800`, staging `a074f455a4adc3dd8515255f6d779dea0afeeb10`을 GitHub에서 다시 조회했고 직전과 동일하다. 루트AGENTS·관련CLAUDE LOCKED·09/HANDOFF·성능 전용 표준/최신 인계 본문을 확인했다. 오래된 Drive 우선순위보다 이번 사용자 실행 지시를 따른다. 기록은 GitHub에 이어 남기고 공개 설정/게시/병합은 하지 않는다.

## 실행 및 선행 조건

작업량 대, 예상 사용량 높음. 현재 모델 유지 권장(소유권·실제소비자·통제수정 대조가 필요); 모델 변경 없음. 이미 승인된 범위이므로 중간 재승인은 요구하지 않는다. 검사/제품 커밋을 분리한다. 한 원인 한 제품 커밋과 개별 복구자료를 남기며 큰 재작성·추가 덮어쓰기는 하지 않는다.

1. 최신 실제 자산을 읽기전용·외부 측정/제출 차단으로 확인한다. 과거 입력은 해시 검증한 고정 재생으로만 사용하고 현재 응답과 혼동하지 않는다.
2. D05: phone copy `gap`의 초기 flex 선언이 후행2/5/4px에 가려지는지 확인한다. 높이·form폭·장식은 보존하고 이 **한 속성**의 regular base/compact만 정리할 후보를 만든다.18폭×6variant108쌍 전체계산값/geometry/PNG와3폭×6variant×원본/후보36통제편집을 요구한다. bar/overlap/legacy 및 외부 phone정렬858바이트 보존. 재현 없으면 제품수정 안 함.
3. D02: 보존된 내과 모바일 목록/제목 밖의 실제 제목·폼·div-block-358 소비자를 먼저 조사한다. 게시 내용과 긴 한글/영문/URL/숫자×직접/자손을 분리해 원본 실패를 확인한 **한 root**만 수정한다. 전역 word-wrap·공개pin·내과예외를 변경하지 않는다.5페이지×3폭 비대상 배치/계산값 및 관련경계를 검사한다.
4. D05/D02 완료후 D03/D07 지그/hero → D04 다른loader 실패경로 → D06 실제엔진 순서로 이어간다. 원본실패·경합·비대상 보존을 입증한 단위만 수정한다. 실기기 없으면 D06 제품변경 보류.
5. 소스동결후 별도 작업본의 명시범위 단일연속 검사 및 오류주입/복구를 기록한다. 분할성공을 전체pass로 합치지 않는다. V0는 새판별근거 전 재실험하지 않으며 U01은 계속 보류한다.

현재 단계: 자산 조회 및 D05/D02 재현 조사. 최종 판정은 실행 결과를 덧붙여 갱신한다. 이전 성공6단위와 실패V0는09의 판정을 그대로 유지한다.

D05 신규 검사 첫 실행은 CSSOM 열거에 gap shorthand가 있다고 가정해 undefined에서 중단됐다. 제품 실패가 아닌 새 검사 오류다. 계산CSS row-gap을 확인하도록 고쳤으며 첫 로그를 보존한다. 기존 검사 기준은 바꾸지 않는다.

## D05-P4 결과 — phone copy gap

원본42d4327의 canonical flex rule gap을6px로 바꿔도 최종4px가 남았다. 올바른 새 검사에서820/floating의4≠6으로 실패를 보존했다. 제품21bccd6은 gap 한속성만 regular5선언→base/compact2소유자(4/4px)로 정리한다. bar는8px, overlap은compact4, legacy는원래대로다. `gap-fixed` 단일108쌍 전체계산CSS/geometry/PNG동일,36통제편집에서desktop copy에만6px도달·form전체계산값/geometry·phonebox·인접배치보존을확인했다. 높이/폼폭/장식/외부858바이트는변경없다. [판정](evidence/next-cta-gap.json). 각제품커밋의역hunk는최종복구자료로분리한다.

D02 사전조사:3폭의실제내과 div-block-358 게시제목5개와폼문구를확인했다. 긴합성입력은폼title/sub/label/consent에넘침을재현했다. 이번수정은이미min-width0/flex1인 **form intro 한root**로한정하고, 다른label/consent와desktop내과등은잔여로구분한다. 폼게시문구와긴테스트입력은다르다. 새도구첫실행의잘못된modal panel selector는현재DOM의modal__box로고쳤고, 무한대기를막는15초기본timeout을추가했다. 제품문제를고친것으로세지않는다.

D02첫 full 실행: home1440은 게시표현/긴입력을통과했지만 소개1440 modalPNG가212px달랐다. 자연계산값/배치hash는같았고 x0..519/y0..19의차이는둥근위모서리뒤의배경영상뿐이었다. 제품CSS를추가하지않고 새paired도구에서원본영상을pause/시각0seek한뒤촬영한다. 실패로그/두PNG/좌표를보존하고새단일full로판정한다. 기존PNG/mask/100px/threshold/expected failure불변.

## D02-P3 결과 — form intro 한 root

제품fe86354는 `.hx-fcta-form .hx-fcta-form__intro`와자손의overflow-wrap한속성만명시소유한다. 원본21bccd6에서새검사는390영문직접입력넘침으로exit1이었다. `form-wrap-full-media-fixed` 단일15쌍은게시문구/배치/글자rect/타이포/비대상wrap와모달PNG가완전히같았고,3폭×title/sub×4입력×3태그72조건에서원본넘침→후보내부wrap을확인했다. keep-all·늦은고정정책·외부root·label/consent/input및478/479/480·766/767/768대조를통과했다. 내과목록/제목기존예외와전역정책/공개pin은원문유지다. [대장](evidence/next-form-wrap.json). 폼의실제게시문구는원래정상이며긴합성입력의구조문제를개선한것이다.

## D03/D07 다음 단위 — 지그의 section3 탐색

D05/D02제품커밋과각양성검사를마친뒤착수한다. 지그는전역 `.section2-heading` NodeList의두번째와부모display:none을놓치는isVisible에의존한다. 실제숨은section을hero앞에놓되hero→section2인접·실제coming-soon의3heading마킹·hero완료event를보존해재현한다. visiblegeometry가같고원본선만없어지는경우에만section3안의실제렌더된heading선택으로한정한다. Draw/Hold/Erase기하학·모션·버튼/카드·hero준비로직은변경하지않는다.3크기normal/adversarial원본·후보및hot왕복으로동등성/원본실패/후보복구를검사한다.

지그 새 검사 첫진단은 desktop선굵기도1px라는잘못된가정으로중단됐다. 실제원문은desktop1.3/mobile1이며그대로검사하도록고쳤다. 기존제품값을문서가정에맞추려고바꾸지않았고첫로그를보존한다.

지그원본6실행에서normal3폭은선1개, hidden-first1440/820은선0개,390은선1개로재현했다. section3선택만고친첫후보는선이돌아왔지만1440 hidden-first의시작X가319.148→0이어서정확한기하학검사에서거절됐다. 같은전역첫요소문제로btn1도숨은section3의 `.discover-helix_button`을잡고있었다. 실제DOM의4개해당anchor가각각bt1/2/3/3안에있음을확인하고기존btn1탐색원문을 `.bt-box-1 .discover-helix_button`으로한정한다. selector두끝의책임만고치고선알고리즘/타이밍은그대로다. 첫후보실패를보존하고새단일12실행으로다시판정한다.

두번째후보실행은hot390선0에서멈춰추가제품패치를중단하고, 같은후보의600/1500/3000ms좌표를계측했다. 이동한mobile복제가390에서실제노출돼titleY350/btn2Y1685로H가음수였다. 대기부족이나hero복구실패증거가아니고새fixture가보이는섹션순서를바꾼검사오류였다. cold숨은순서대조는유지하고, 아직숨겨진동안원래DOM위치로복구해visiblegeometry동일을assert한뒤hot390/820/1440을검사하도록도구만정정한다. 기존기준/선경로exact대조는완화하지않는다. 제품후보는같은scoped selector그대로새단일full을수행한다.

## D03/D07-P3 결과 — 지그 두 끝의 소유권

제품34f093c는지그시작점을bt1안의anchor,도착점을실제렌더된section3 heading으로한정했다. `zig-full-preserved-order` 단일12실행에서normal3폭의원본/후보경로·색·굵기·geometry가exact동일하고,hidden-first1440/820의원본선누락→후보정상경로복구를확인했다.390대조와hot390/820/1440의선1개·두trigger의보이는section3도착·실제스크롤draw를검사했다. 실제heading3개마킹/hero완료event와visiblegeometry보존도assert했다. 첫경로후보실패와잘못된hotfixture실패를정상으로합산하지않으며최종단일12실행만근거다. [판정](evidence/next-zig-boundary.json). hero/coming-soon전체초기화책임은그대로남는다.

## D04 다음 단위 — 다른loader가남긴실패tag

D03단위검증/제품커밋뒤실제services소비자를재생한다. 페이지loader가메뉴CSS/JS의immutable/branch fallback모두실패했을때남는tag때문에공통present가복구를막는지관측한다. 오류는실제route실패로주고sharedentry준비후load전발생을명시한다. 관측된실패와성공/pending소유자를구분하는근거가확보돼야만공통메뉴2자산의경계만고친다. 타loader tag삭제/pin교체/viewport복구범위확대는금지한다. 원본실패가없으면제품수정하지않는다.

D04첫원본은다른loader menuCSS2요청실패/잔존tag2/menu static과unexpected오류0을확인했다. 의도적으로실패시킨CSS도overlay성공을요구한신규assert오류로중단됐다. 실패대상미소비는실패증거로유지하고나머지성공자산모두의실제소비를assert하도록고쳤다. 정상/복구시에는대상포함전체소비를요구한다.

D04첫32조건실행은CSS8조건과JS정상2조건뒤JS실패경로의대기중TargetClosed로중단됐다. JS오류를sharedentry관측뒤로미루는시험선행조건이확립되지않았고제품복구성공으로세지않는다. 실행을보존하고JS위상만별도5초상한계측한다. 제품후보의새실패관측대상은 **다른loader의메뉴CSS 한경로**로축소한다. 기존공통loader자신의CSS/JS1회재시도는변경없다. 새검사의최종범위도CSS16조건을새단일실행으로판정하며, 중단32실행의통과를합산하지않는다. 다른loader JS실패tag는미해결로남긴다.

## D04-P2 결과 — 관측된 다른loader 메뉴CSS 실패

제품db92c09는 **메뉴CSS 한경로**의load전오류tag만WeakSet으로기억하고공통present판정에서구분한다. document error관측은boot에서즉시해제한다. 다른loader의tag를삭제/수정하지않으며성공/pending은기존소유권을존중한다. `foreign-css-full` 단일16조건(2폭×4상황×원본/후보)에서정상1/1·페이지fallback성공2/2·다른loader실패2/3·영구실패2/4요청을확인했다. 다른loader실패는원본static→후보fixed·메뉴click/Escape정상,tag2개보존·중복entry추가요청0·자기immutable URL재시도상한2를검사했다. **영구실패는가용성복구성공이아니다.** [판정](evidence/next-foreign-css.json).

JS별도위상계측은첫오류때sharedentry가아직없고두번째부터존재함을확인했다. 이미놓친첫tag를실패로단정할근거가없으므로새제품실패관측을JS로확대하지않았다. 기존공통loader자신의메뉴CSS/JS1회복구는그대로다. 다른loader JS/관측시점밖CSS/무응답/혼합pin은미해결이다. 중단32실행의10개완료결과를16조건성공에합산하지않는다.

## D06 및 소스 동결

로더단위를마친뒤viewport진행조건을판정한다. WebKit2227실행파일없음과실제Safari/iOS/iPad검증도구부재를확인했다. 기존소유권VM기록만보존하고같은실험이나Chromium폭변경으로실기기정상판정을대신하지않는다. viewport제품변경없음·회전미검증, [재개조건](evidence/next-viewport.json). V0새판별근거없어재실험없음/U01보류유지.

현재제품4단위동결db92c09: CTA gap21bccd6, form introfe86354, 지그34f093c, 관측외부menuCSSdb92c09. 실제수정runtime는floating-cta.css/sections-animations.js/global bootstrap.js3파일이며기존6단위와global.css·buttons·menu·hero/coming-soon·viewport원문은보존했다. 최종검사도구커밋뒤같은runtime의별도작업본에서8단계선택통합(corpus→5페이지15쌍→home3cold/1440시작11전환→heading모션→CTA108/36→home폼3쌍→품질→로딩)을한번연속실행한다. form15/지그12/외부CSS16개별단위검사는각각의독립전체결과이며이선택통합을전체V0suite로승격하지않는다. 과거인계의‘각11전환’표현은정정한다:도구는1440시작에서11전환,820/390은cold대조다.

## 최종검토에서 발견한 D04 추가 회귀 — 판정 보류

동결166e9d8의별도작업본8단계선택통합은모두통과했다. 그러나실제FAQ loader는CSS fallback때새태그대신같은link의href를재사용한다는소스대조에서추가경계가발견됐다. `faq-reuse-before`에서이전42원본은2요청으로정상종료, db92후보는성공한같은tag에도실패WeakSet이남아3요청/중복CSS를만들어새원인대조검사가exit1로거절했다. **정적정상8단계성공을전체구조안정화로승격하지않는다.** 앞8단계는이전소스의선택결과로보존하고최종판정은다시동결한소스에서한다.

D04 보완단위: 실패기록을node+URL로구분하고같은node의native load성공때해제한다. 다른loader의성공/pending을존중하는동일책임경계이며메뉴CSS한경로만해당한다. 서비스새tag/FAQ재사용tag×2폭×4상황×원본166/후보32조건의새단일검사를요구한다. 기존ownretry/JS/viewport/공개pin은건드리지않는다. 보완은별도제품커밋으로남기고D04전체역변경복구커밋을새버전으로추가한다. 앞recovery브랜치는강제로바꾸지않는다.

보완후검증은실제services(새tag)·FAQ(재사용tag)32조건과,실제영상의학과페이지에분명히표시한controlled owner가동일tag/동일URL을native error→재시도→load성공하는4조건을각단일실행으로분리한다. 후자는게시된페이지loader라고주장하지않고브라우저native자원lifecycle의합성경계로명시한다. URL변경만아니라동일URL성공표식해제를검증한다. 최종별도작업본선택통합은기존8단계에FAQ성공소유권4조건/동일URL소유권4조건을추가한 **10단계**로고정한다. 이전8단계성공은166소스의과거결과이며최종10단계로합산하지않는다.

동일URL첫fixture는DCL에서늦게생성돼원본요청2/foreign tag1/shared tag1이었고,3요청을가정한새assert는실패했다. native요청은같은URL로합류할수있어태그중복과요청횟수는동일하지않다. 이결과를회귀재현으로세지않는다. 판별조건을원본해시검증한영상의학과HTML의head에명시적인controlled owner하나를추가하는독립파생fixture로정확히한다. 원본corpus/PNG는불변이며파생SHA를따로기록한다. 생성loading/error·load가complete이전이라는전제를assert한다. 성공소유자가있는데원본의shared tag1이추가되고후보는0인지를주계약으로검사하고후보요청은정확히2를요구한다. 기존검사기준/이미지허용오차는바꾸지않는다.

## D04 최종 보완 결과 — 성공 소유권 회복

제품b0fa548은db92의실패기록을node+URL로바꾸고동일node의native load성공때해제한다. URL이바뀐새요청/pending은기존소유권으로보고실패라고단정하지않는다. document error/load관측은모두boot에서해제한다. 메뉴CSS한경로만대상이며태그삭제·pin교체·ownCSS/JS재시도정책변경없다.

`css-owner-full` 단일32조건(services새tag/FAQ재사용tag×2폭×4상황×원본166/후보)에서FAQ성공fallback의3→2요청/중복shared tag해소와다른정상·일시실패·영구실패상한보존을확인했다. `same-url-owner-early`는별도단일4조건으로합성owner의생성loading/error·load interactive를입증해동일node/URL성공에도원본shared tag1→후보0/foreign tag1/후보요청2를확인했다. 두실행을36조건전체성공으로합산하지않는다. [최종대장](evidence/next-css-owner-reuse.json).

최종제품runtime는b0fa548이다. 새동결소스의최종별도작업본10단계통합을진행하며166의정상8단계는과거선택범위결과로남긴다. 이사례는정상화면테스트통과만으로구조적간섭완료라고판정할수없는실제근거다.

## 개별 복구 커밋

[복구대장](evidence/next-recovery.json)의D05 a79b52c, D02 7eaf567, 지그85a46dc, D04최종d5db1fa를각recovery브랜치에분리했다. 정상작업/main/staging에는적용하지않았다. 각각대상파일1개만바꾸며역/정방향roundtrip과GitHub tree SHA일치를검증했다. 복구는최신격리작업본에 **선택한역커밋의diff만** cherry-pick/적용하며recovery브랜치전체스냅샷으로프로젝트를대체하지않는다. 앞세커밋은166부모지만해당파일bytes는최종과같고후속D04를건드리지않는다. D04역커밋은초기db92와보완b0fa를함께되돌리고기존65227ownretry를보존한다. 오래된e840c46은첫초안용으로이력보존만하며최종복구로사용하지않는다.


## 최종 재검수와 실제 안정화 수준

별도 clone `/workspace/helix-next-review-final`의 정확한 `b0fa548`과 같은 SHA의 검사로 `next-integration.cjs`를 처음부터 끝까지 **한 번 연속 실행**했다. 10단계 모두 exit0이다. 앞선166의8단계 성공·분할 실행·초안 CSS16조건을 합산하지 않았다. 별도 작업본 재실행이며 독립된 사람의 감사는 아니다. 이후 전달 커밋은 문서/증거만 변경하고 runtime는 그대로다.

| 연속 단계 | 실제 범위와 결과 |
| --- | --- |
| integrity | 원본 PNG33·corpus286 해시 불변 |
| scope | 홈/소개/서비스/FAQ/내과×1440/820/390의15쌍 콘텐츠·타이포·주요geometry·문서정책 동등, 주장한 overlay 소비 전부 확인 |
| interactions | cold3크기 메뉴·예약창 배경휠잠금/닫은 뒤 대조/카드 노출; **1440시작** 11경계 전환.820/390에서 각11번을 수행한 것은 아님 |
| heading-motion | 원본/후보3쌍, 실제 첫 노출·왕복·최종4버튼 표현/hero event 보존 |
| CTA gap | 108쌍 전체계산CSS·geometry·PNG 동일 +36조건 통제 편집의 한정 영향 |
| form intro | 홈3쌍 게시표현/PNG 동일 +긴 입력72조건 원본 넘침→후보 내부wrap |
| foreign CSS owner | 실제 FAQ의 성공한 재사용tag fallback4조건; 원본 추가요청3→후보2 |
| same URL owner | 원본해시를 검증한 영상의학과 HTML의 **별도 파생fixture**에 controlled owner를 둔4조건; native error/load 이전·이후의 중복shared tag1→0, 소유자1개·후보요청2. 공개페이지loader라고 주장하지 않음 |
| quality | 기존 저장소 품질9그룹 |
| home-loading | 기존 로딩6그룹 |

예상하지 않은 JS/네트워크오류와 외부 전달은0이다. 의도한 자산 실패·원본 결함 재현은 따로 기록했다. 이 결과는 명시한 **선택 통합** 통과다. V0 원본 전체 시각 suite, 모든 페이지/실패/기기, 공개 staging 도달 또는 운영 개선으로 확대하지 않는다. 100px/threshold0.2/기존mask/expected failure·PNG/corpus index는 그대로다.

최종소스의 별도 음성대조 clone에서 compact copy gap4→5px 하나만 바꿔 첫320px 전체계산/배치 비교의 exit1 거절을 확인했다. 그 clone의 CSS 한 파일만 자기HEAD로 복구했고 clean 및 source/review/negative 세 runtime 해시 일치를 확인했다. 이전166의 오류주입 결과를 최종소스 결과로 대신하지 않았다.

최신 main3c4f78d4/staginga074f455는 마감 읽기전용 조회에서도 그대로다. 현재 공개5페이지의정식HTML은 검증입력과 SHA256이 같고, 정식홈3c4f78d4/스테이징홈고정ccb68a7c/공통staginga074/생성CSS46f7fbd5d 및 기존고정을 보존했다. 공개브라우저capture의 Network request failed는 여전히 별도 기록이며 live오류0을 주장하지 않는다. [현재 자산](evidence/next-assets.json).

42d4327 이후 runtime 변경은 CTA CSS·sections-animations.js·global bootstrap.js **3파일,4작업단위**다. D04는 최종검토에서 발견한 회귀 보완 때문에 제품커밋2개이며, 전체 제품커밋은5개다. 이전6개 개선, phone/form높이·form폭·장식 표시, 내과목록/제목 예외, bt3 단일제어, 메뉴/예약창/카드, hero/coming-soon/viewport 및 다른작업자의정렬858바이트·외부자산을 보존했다. rootAGENTS/CLAUDE와 배포workflow도 변경하지 않았다. main/staging병합·공개설정/pin변경·WebflowPublish·운영배포없음.

### 상태 구분

| 상태 | 현재 판정 |
| --- | --- |
| 실제 개선 완료 | 작업 브랜치 소스의 CTA gap 소유권, form intro wrap 경계, 지그 양끝 소유권, 관측된 타loader 메뉴CSS 실패/성공 상태4단위 |
| 개선 후보 검증 완료 | 개별 CTA108/36·폼15쌍/72입력·지그12실행·실제owner32조건·native합성경계4조건 및 최종10단계 선택 통합. 공개 적용 완료가 아님 |
| 조사 결과 확보·추가 재현 대기 | hero 준비함수의 인접성/heading class writer 결합. 정상3크기 마킹·hero완료는 보존했고 넓은 초기화 교체는 하지 않음 |
| 미해결 | D05 다른속성, D02 다른폼/제목/desktop root, D03/D07 다른hero/firstpaint 의존, D04 관측창밖CSS/다른loader JS/무응답/혼합pin, V0 및 U01 선행조건 |
| 환경 부족 미검증 | 실제 Safari/iOS/iPad/WebKit의 viewport 복원·회전. Chromium폭변경으로 대체하지 않음. 별도사람감사·공개후보 도달도 미실시 |

검증한 경계에서는 한속성 통제편집이 자기요소만 바꾸고, 숨은복제의 순서가 다른섹션 선을 결정하지 않으며, 타loader의 성공한 소유권을 보존하도록 개선됐다. 정상8단계를 통과하고도 FAQ 회귀를 추가로 검출·수정한 사례를 남겼다. 실제 운영의 연쇄오류 감소율이나 전체코드의 독립성을 수치로 입증한 것은 아니다.

### 다음 독립 실행 단위

| 순서 / 위험 / 작업량 | 실제 다음 단위와 선행 조건 | 검증·중단·복구 기준 |
| --- | --- | --- |
| D05 / 중 / 중 | 다음 **한 속성**의 통제편집이 후행선언 때문에 무효인지 먼저 재현. 최신 외부정렬858바이트를 단순 중복으로 취급하지 않음 |18폭×6variant108쌍/36통제편집 수준 유지. 의도한variant/요소만 변하고 다른계산/PNG동일. 재현 없으면 제품변경 안 함. 한제품역커밋만 복구 |
| D02 / 중 / 중 | 사전probe에서 합성넘침이 있던 **consent body 등 한 root**를 선택. 현재게시문구와 합성입력 구분, 기존intro/내과예외 보존 |4종입력×직접/자손,5페이지×3크기 실제타이포/높이/normalKorean 보존. 전역정책철회·일괄예외 금지. 한root역커밋 |
| D03/D07 / 높음 / 중~대 | `prepareHomeViewport`의 hero→specialty 인접성 guard와 heading class 마킹의 책임을 분리할 필요가 있는지, 실제초기화/DOM복원/폰트준비 사건으로 원본실패와guard의기존보호목적을 확정 | 실패 없는 정상hero를 재작성하지 않음. 새마킹/복구 한경로만 다루고bt1~4/.7/.4/.15/1500ms/5s loop·hero완료·처음열기/폭왕복·준비실패를 대조. 인과근거 없으면 보류 |
| D04 / 높음 / 중~대 | 첫오류가sharedentry보다 앞선JS·관측창밖CSS는 소유page-loader의 사실성 있는 failed/pending/success 기록과 **실제고정자산 도달경로**가 먼저 필요 | 태그 존재/stylesheet null만으로 실패를 추측하지 않음. 동일node/URL·경합·영구실패·중복listener/요청상한까지 검사. 공개pin교체는 별도범위이며 자동변경 금지 |
| D06 / 높음 / 환경확보 뒤 중~대 | 실제 Safari/iPad/WebKit에서 초기meta·두writer·세로↔가로 및복제노출을 계측해 복원실패 재현 | 원본meta 책임 하나만 수정하고fixed/sticky/휠/전체관련반응형 보존. 환경부재면 제품수정 보류 |
| V0/U01 / 높음 / 제한조사 | 기존raster·paint·폰트·GPU·좌표·스크롤과 구별되는 **새 판별근거**가 있을 때만 V0재개 | 기존기준 그대로 독립전체3회무실패+오류주입거절 전V0완료/U01이관 금지 |

두번 실패하면 추가덮어쓰기를 멈추고 원인·관측조건을 다시 확인한다. 원본실패·책임범위·비대상보존이 충족된 단위만 구현하고, 각제품/도구 커밋을 분리한다. 이미 승인된 독립범위의 중간승인은 반복하지 않는다. 위험도는 검증 강도와 미충족 선행조건을 관리하기 위한 것이며 일괄 재작성이나 불필요한 대기의 근거가 아니다.

### 증거와 재실행

GitHub에는 소스/검사/판정JSON/입력manifest·로그SHA/복구커밋을 보존한다. 응답body·전체로그·PNG는 `/workspace/artifacts/helix-next-20261117` 및 이전immutable입력경로에 **로컬만** 있다. 원격archive/다른클린환경에서완전복원 완료가 아니다. 최종대장의8개입력root bodySHA를 다시 검증했고 원본286/PNG33 해시도 불변이다. 같은환경의재실행은09의입력변수를사용하되 `HELIX_INTEGRATION_OUTPUT`을새경로로정하고 `node scripts/visual/next-integration.cjs`를실행한다. 파생동일URLfixture는검사자체가별도생성하고원본응답을덮어쓰지않는다.
