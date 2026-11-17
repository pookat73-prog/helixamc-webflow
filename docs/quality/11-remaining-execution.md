# HELIX 다음 잔여 개선 실행 — 18541d2 이후

## D04 단위 완료 / 최종 동결 준비

제품b2277bf는services `injectJs`의메뉴JS native오류URL기록과shared `present()`의해당실패tag판정만추가했다. 새모듈/전역timer/다른loader태그교체없음. 32조건에서실제첫native오류가shared진입보다앞서는것을assert하고원본2실패/메뉴0→후보3요청/메뉴1,영구4요청상한,정상1/폴백성공2/중복진입무추가/메뉴열기닫기를확인했다. 실제pinned ba91의injectJs정확한hunk와현재tip생산자를분리했다. [판정·역커밋](evidence/remaining-js-owner.json).

성공한역사적branch JS원시는누락돼있다. 최초검사는해당미기록요청에서정지했으며최신응답으로대체하지않았다. 이후그경로만기존보관immutable바이트를복제한별도합성alias와출처SHA를명시해검사했다. 정상/두native오류/영구실패경로는기존고정원시기반이다. 첫mixed예상요청수오류도보존하고fresh4조건에서producer-only/shared-only의2요청/메뉴0을미해결로판정했다. 공개pin/설정변경없이두자산채택조건만문서화한다.

무응답의별도관측은실제menuJS응답만10초보류했다(가짜error/entrygate없음). readyState interactive/shared未진입/menu0/pending tag가남고원래보관응답을해제하면동일1요청/menu1로회복했다. 제품timeout은추측하지않았다. D06 WebKit실행파일없음으로실제기기검증보류,제품미수정. 최신main/staging은기존SHA와같고10공개HTML도중단전SHA와같다. 현재소스의별도clone 단일15단계통합과오류주입·복구는다음실행이며이전결과로대신하지않는다.

## 환경 복구 및 D02 결과 회수 (2026-11-17)

후속 D03/D07 제품a9626dd: 무관한 invisible sibling이끼면 Hero adjacency guard가 제목3개hook까지생략해지그가없어지는원본을재현했다. 기존마킹순서만 guard앞으로이동해12회단일검사통과. 정상6실행의PNG/geometry/type exact, fixture삽입자체 visible geometry불변, 후보3폭모두hooks3/line1/실제hero event·fade/1.5s뒤loop·PC→mobile→tablet→PC타깃을보존했다. 최초검사2회는공개HTML기존viewport속성존재를잘못가정한검사실패라원시증거를보존하고재진단했다. 제품보정은쌓지않았다. 정확한공개속성보존계약으로원본red→후보green을확인했다. [단위결과·복구](evidence/remaining-hero.json). 모든hero/firstpaint문제가해결된것은아니다.

기존 작업장 HEAD69d1c24/CSS 미커밋7줄이 그대로 복구됐다. shell 실제 실행을 확인했다. Git CLI network403/remote origin 없음은 GitHub connector의 exact blob/tree/commit hash 검증으로 우회해 docs-only54da5f8에 fast-forward했으며 기존 CSS는 byte 동일하다. 원본·후보·patch·checker4 SHA가 기록과 일치하고 후보 중복적용/reset/clean/restore는 없었다.

기존 consent-full 결과는 실제로 단일15/15 완료다. 5페이지×3크기의30개 network audit/게시 JSON/모달 PNG를 대조했고 게시 배치·타이포·비대상 wrap은 exact다. home3크기의72 합성입력은 원본 전부 overflow/후보 전부 contain, 직접텍스트·기존label·span/a 및4문자종류를 확인했다. 동의 상세 토글/늦은 pinned policy/9경계도 각 assert 뒤 기록된 성공이다. intro-composed390도 현재 CSS391a0297에서 통과했다. 이전 입력 manifest8개와 body2130파일의 길이/SHA를 확인했으며 최신응답으로 대체하지 않았다. raw/log/PNG는 로컬에만 보존한다. [전수 회수 대장](evidence/remaining-consent-recovered.json).

검증된 consent root 소유권만 제품db1c034로 분리했다. 전역 keep-all/word-wrap, 기존 intro/내과, checkbox/다른 폼은 불변이다. 최종 새소스 통합·의도오류주입/복구는 다음 단계이며 이전b0fa548 결과로 대체하지 않는다. 아래 중단 판정은 당시 이력이다.

**현재 판정: 실행환경 중단으로 이번 작업은 미완료다.** D05 폼 border-color 제품 b890736은 단일108쌍/36통제수정 검증을 통과했다. D02 consent 후보는 로컬 미커밋 상태이고 전체15쌍 결과를 회수하지 못해 승격하지 않았다. [중단 판정·SHA·재개 조건](evidence/remaining-interrupted.json), [미검증 후보 패치](evidence/remaining-consent-candidate.patch)를 따른다. 아래는 진행 이력이며 이전 b0fa548의10단계 통과를 이번 소스의 통과로 사용하지 않는다.

2026-11-17 KST. 작업 브랜치 `fix/helix-residual-structure-20261117`, 시작 HEAD18541d233ede4e7b57a3ecfcf2ad503d827a3d99 및 검증 runtime b0fa548 보존. root AGENTS/HANDOFF/10 실행기록과 관련 CLAUDE LOCKED를 읽었다. 작업 전 clean, 원격HEAD 일치. main3c4f78d4/staginga074f455는 직전과 동일하다. 기존 작업 공간·원본 PNG/corpus·다른 작업자 코드를 보존한다.

## 승인 범위와 실행 순서

작업량 대·예상 사용량 높음. 현재 모델 유지 권장(원인/소유자·입력/기기·통제 편집을 대조해야 함), 모델 변경 없음. 사용자가 요청한 격리 조사·구현·검증·복구·문서화·작업 브랜치 전달을 연속 수행한다. 중간 승인 반복 없음. 제품/검사는 별도 커밋, 한 원인 한 제품 단위다.

1. 최신 공개자산을 측정/제출 차단하에 읽기전용 확인한다. SHA/실제로드/고정입력을 구분한다.
2. D05: 보조문구 font-size의 canonical 편집이 후행선언에 가려지는지 재현. base10/compact9/narrow8 및 bar/overlap/legacy의 최종값을 확인하고 한속성만 정리한다. 18폭×6variant108쌍 계산CSS·geometry·PNG exact +3폭×6variant×원본/후보36통제편집. 전화높이/폼폭/장식/copy gap/외부정렬858바이트는 보존한다.
3. D02: consent body 한root의 직접/label·span/a 자손의 긴한글/영문/URL/숫자를 실제문구와 분리한다. 재현시 해당root의 줄바꿈책임만 수정한다.5페이지×3크기의 게시배치/타이포/기존내과·intro예외·고정전역정책·관련경계를 보존한다. D05와 CSS파일이 겹쳐 제품수정은 순차진행.
4. D03/D07: hero 준비함수의 인접성guard가 heading class 마킹까지 묶는지 실제원본실패/비대상geometry/heroevent로 확인한 한경로만 개선. 지그알고리즘·폰트준비·glow계약은 보존.
5. D04: 다른loader JS의 첫native오류가sharedentry보다앞서는 기존조사결과를 활용한다. 소유page-loader의 사실성있는상태/URL과공통소비자의경계만 다루고 실제고정자산 도달조건을 명시한다. 무응답/혼합자산은근거없이timeout/pin교체하지않는다.
6. D06은 실제WebKit/실기기부재시 제품수정없음. V0는새판별근거전재실험없음/U01승격조건유지.
7. 기존10단계통합수준을 유지하고 필요한 새root 단위검사를 추가해 최종소스/검사동결·별도작업본 단일연속실행으로 판정한다. 분할성공 합산금지. 실제오류주입/한파일복구 및단위별역커밋을보존한다.

## 초기 근거

D05 regular subtext font-size는 현재8선언(10/9/8 반복), 실제소유값10/9/8이다. 이전완료속성은검사/통제대조만하고재작성하지않는다. D02는이전 `helix-next-20261117/wrap-probe.json`의consent body 직접긴입력넘침을활용하고이번에는기존label및중첩자손까지확장해검증한다. 실게시문구가깨졌다고혼동하지않는다.

현재단계: 공개자산확인 및D05 원본실패검사. main/staging병합·공개설정변경·WebflowPublish·운영배포없음. 원시body/PNG/로그는이번artifact경로 `/workspace/artifacts/helix-remaining-20261117`와기존immutable입력에로컬보존하며원격archive완료라고보고하지않는다.

D05 최초font후보는실제DOM/현constructor에서 `.hx-fcta-phone-btn__subtext`가없어신규prototype의소비자전제에서멈췄다.8선언은남아있지만현재영향을입증하지못했으므로제품변경하지않는다. prototype/로그는로컬에보존한다. 다음실제소비자는form 버튼 border-color로정한다. 초기폼전용색상과뒤의border shorthand가같은색상을제어하는지통제한다. width/style·모바일bar의전용border·legacy·기완료높이/폭/장식/copy gap는변경하지않는다.

D05 원본은form border-color를통제색으로바꿔도최종blue에가려져exit1로재현했다. 초기후보의첫양성실행은mobile-bar가별도border-color를갖는다는새검사가정때문에중단됐다. 실제소스확인결과bar는폭/높이만소유하고border-color는기본form스킨을공유한다. 제품보정을추가하지않고검사의소유자정의를정정했다:모든존재하는form variant에만색편집이도달하고phone·width/style·geometry·legacy는보존해야한다. 기본디자인exact108쌍기준은완화하지않는다.

검사 간 소유권도 분리한다. 기존intro 검사는before를오래된21bccd6 전체CSS로두고consent를영구normal로가정해, 다른root의정당한수정도intro회귀로오인할결합이있다. 현재CSS에서 **intro제품fe863의정확한hunk만역적용**한대조군을생성하도록도구를분리한다(독립baseline경로,patch fuzz0,원본파일불변,현재/before/patch SHA기록). intro의원본긴입력실패→후보복구/게시PNG exact/전체비대상glyph·geometry·wrap동등성은유지하며, consent는제외하지않고현재값을양쪽에서엄격비교한다. 실제다른input/label normal정책도명시적으로assert한다. 옛실행복원을위한historical mode0는남긴다. 기준PNG/mask/허용오차/expected failure 변경이아니다.

## D05 최종 결과 — 폼 border-color

제품b890736은폼전용border-color의2중소유(색상선언+후행shorthand)를1개로줄였다. 뒤geometry규칙은width1px/style solid만소유하며기본색blue는그대로다. `border-full` 단일108쌍의전체계산CSS/geometry/PNG가동일하고36통제편집에서form색만바뀌고phone전체CSS·배치/기존copy gap/폼테두리폭·스타일·배치/인접흐름을보존했다. form스킨은base/desktop/floating-mobile/bar/overlap에서같은색소유자를공유하는의도며legacy는대상없음이다. 높이/폼폭/장식/copy gap/외부정렬은원문보존. [판정](evidence/remaining-cta-border.json). 보조문구font는현재소비자없음으로미수정이다.


## 실행환경 중단 인계

D05 실제 개선/개별후보 검증은 완료했지만 이번 전체 범위는 미완료다. D05 별도 역커밋 [83a1f46](https://github.com/pookat73-prog/helixamc-webflow/commit/83a1f464eeeeb65fef6da9220d65a0c4caae9f23)을 recovery/helix-remaining-d05-border-20261117에 남겼다. 서버 commit diff로 대상CSS 한파일/정확한 b890736 역변경을 확인했고 작업/main/staging에는 적용하지 않았다. 실행환경이 없어 실제 복구 적용을 실행한 것은 아니다.

D02는 실제문구를 보존하며 consent root 및 실제label의 직접/span/a 긴입력 원본 넘침을 재현했다. 로컬 CSS에7줄 예외를 적용한 뒤 consent-full을 단일15쌍으로 실행했다. 마지막 회수 로그는1440 홈/소개/서비스/FAQ4쌍의 exact 계산·배치/PNG 통과다. 이후 실행 서버가 연결 해제돼 완료결과는 알 수 없다. **4쌍을전체15성공으로합산하지않으며, 실패했다고도단정하지않는다.** 테스트가백엔드에서계속됐을수있으므로환경복구후결과부터읽는다. intro-composed-check도기동했지만결과미회수다.

D02 런타임 변경은 GitHub 작업브랜치에 넣지 않았다. [후보patch](evidence/remaining-consent-candidate.patch)는 문서/증거 위치에만 보존한다. 기준CSS Git blob 0b21ba47ccedce49c14eedc2f4bbd3cd29b67c42, SHA256 462004913f99b038e66f1a3c4f864e4f082c6aefc30813f0cb1325b096c8d825; 예상후보CSS SHA256 391a0297ec23cc6778d4e0445b6999b1d50f1c630c5137be7cf1b662afb9f1c8; patch SHA256 dd80ad7170a9a20eef5913c74735fbab4acffab5c881b7dc212b3e627d555779; 검사 Git blob 45e2eba6092c4f57690ab5990ba6bf56b870abd2, SHA256 fa5aea11500eebb4285f74a6eea3d5169973609c5ca7d598023205bf8bbe5583. 이는원격기준에서재구성한예상값이며연결중단후디스크내용을다시읽었다는의미가아니다.

환경은 task context unavailable, shell은 exec-server transport disconnected 뒤 No usable execution environment를 반환했다. 환경상태API의동일ID running/connected는shell재접속성공의증거가아니다. 노출된대체실행/desktop NodeREPL/viewer경로와연결터미널이없고GitHub connector만동작한다. 원인확정이나설정변경은하지않았다. 이중단은프로젝트검사기준이나승인대기로대체하지않는다.

재개순서:

1. 기존작업장과 git status, consent-full/results.json 및로그를먼저확인한다. 환경중단전로컬HEAD는69d1c24이며CSS미커밋hunk를보존한다. 이후원격은문서/증거만전진한다. 같은작업브랜치를fast-forward하되 reset/clean/CTA파일통째복구금지. 차이가있으면내용부터대조한다.
2. 로컬CSS/검사SHA와기록된입력·overlay를대조한다. 이미후보hunk가있으면patch를중복적용하지않는다. raw증거/입력이없으면로컬보존성공으로간주하지않는다.
3. 동일소스의기존run이완전한15/15이면그결과를검증해활용한다. 불완전/실패면원시증거를보존하고새단일15쌍검사를한다. 분할성공합산금지. 기존intro/내과예외·privacy toggle·late고정정책·경계도검사한다.
4. 검증된D02만별도제품커밋/복구자료로남긴뒤hero/지그→다른loader JS/무응답/혼합자산→실제기기조건순서로진행한다. 이후단위의이번제품변경은없다.
5. 소스/검사동결후기존10단계이상의선택통합을단일연속실행하고새소스의의도오류주입/복구를확인한다. 이전18541d2/b0fa548의통과와음성대조를이번전체완료로대신하지않는다.

V0 재실험/U01 적용, main/staging 병합·공개설정/pin변경·WebflowPublish·운영배포는없다. 원시응답/PNG/전체로그는로컬뿐이며현재접근불가다. GitHub에는확인된소스/검사/결과대장·해시·미검증patch·역커밋을보존한다.
