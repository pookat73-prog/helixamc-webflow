# HELIX 구조 안정화 — 후속 실제 실행

2026-11-17 KST. 시작점 `dffc7405c96bfcf0549600aa5045c2e6dc82536f`, 작업 브랜치 `fix/helix-structure-20261117`. 사용자 지시에 따른 실제 개선 실행이며 계획 승인 대기 단계가 아니다. main/staging 병합·공개 설정 변경·운영 배포는 제외한다.

## 보존·범위·판정

- 시작 브랜치 HEAD와 GitHub07/HANDOFF/AGENTS, 관련CLAUDE LOCKED를 확인했다. main5b8827e/stagingac87f91은 이전 마지막 확인과 동일하다. 기존 메뉴/예약창 잠금·카드 전환 개선과 퀵액세스 외부 작업을 보존한다. 원본work 체크아웃은 유지한다.
- V0는 기존의 글꼴·좌표·합성 힌트·GPU/scroll/clock 실험을 반복하지 않는다. 새 가설: 같은 최종 layer에서 **paint 명령 자체가 달라지는지** 확인해 draw와 compositor 이후를 구분한다. CDP LayerTree snapshotCommandLog 읽기만 추가하며 제품 CSS·브라우저 설정·PNG·100px/threshold0.2를 바꾸지 않는다. 합리적인 범위에서 막히면 증거와 실패를 보존하고 독립 개선을 진행한다.
- U01은V0의 원래 조건(독립 로드 전체3회 무실패 등)이 충족될 때만 기존 hunk를 이관한다. 미충족이면 보류하며 새로 구현하지 않는다.
- D05는 폼 버튼 `min-height` 한 속성의 최종 소유권부터 정리한다. desktop/floating-mobile/mobile-bar/overlap/legacy를 합치지 않는다. D03은 실제 box-shadow 쓰기/제거/hold 시점을 계측한 뒤 중복 제어를 한 경로만 제거한다. D02는 실제 고정63812a 자산과 내과root 예외를 확인하고 다른 소비자 보존 및 실제 도달 조건을 갖춘다.
- 각 개선은 원본과 후보, 비대상 상태, 회귀 검사, 개별 커밋/복구점을 갖춘다. 한 번 통과한 전체 검사를 이유 없이 반복하지 않는다. V0 실패를 신규 구조 후보의 회귀로 합치거나 expected failure로 숨기지 않는다.
- 예상 작업량 대, 상대 사용량 높음. 현재 모델 유지/추론 높음 권장. 추가 모델·라이브러리·전면 재작성 없음. 기록은 사용자 지시대로 GitHub HANDOFF에만 남긴다. 과거 거절된 Drive 쓰기는 반복하지 않는다.

## V0

원본286 고정 응답·무 overlay·동일820px에서 3회 **0 / 1,109 / 0px**. JS/네트워크 오류0. 첫 카드의29개 paint 명령은 프로세스마다 달라지는 이미지 uniqueID만 제외하면 완전히 같았다. 이는 해당 카드의 명령 차이 가설을 지지하지 않지만 이미지 raster 내용·전체 푸터 compositor 동일성을 입증하지도 않는다. 원인을 확정하거나 처방을 채택할 근거가 부족해 이번 V0 조사를 여기서 중단한다. **V0 실패·U01 미적용**을 유지하고 독립적인 구조 개선으로 진행한다. 브라우저 설정·제품 CSS·기준 PNG33·100px/threshold0.2는 변경하지 않았다. [기계 판정](evidence/structure-20261117.json), 원시 paint/layer/PNG는 `/workspace/artifacts/helix-structure-20261117/`(로컬 보존 한계 있음).

## D05

진단: 폼 높이 하나가 같은 CSS의 과거34/44/38/36/28px 선언을 순서로 덮고 있다. 최종값은 보통38px,≤767px28px, mobile-bar44px이며 overlap-fix는 별도root 조건28px다. 최종값·기기별 DOM을 보존하면서 이 한 속성의 죽은 선언을 제거하고 기존 base/mobile/variant 블록에 책임을 남기는 후보를 검증한다.

## 미완료 대장

U01·D02·D03·D04/D06/D07과 D05 나머지 속성은 아직 해결 완료가 아니다. 실기기/Safari·공개 후보 도달·실제 방문자 회귀율 개선은 미검증이다. 최종 보고는 실제 개선/보류/미검증을 구분한다.

### D05-U04 실제 결과

폼 `min-height` 동일 선택자의 선언을9개에서 base/mobile **2개**로 줄였다(7개 제거). 마지막에 덮어쓰던28px를 기존 모바일 상태 블록으로 이동했다. mobile-bar44px·overlap28px·legacy는 별도 소유자로 그대로 유지한다. 다른 속성을 함께 정리하지 않았다.

`scripts/visual/cta-height.cjs`: 실제 현재 CTA DOM을 오프라인 추출해18폭×6상태=**108쌍**에서 전체 요소/가상요소의 모든 계산 CSS·geometry·PNG가 전후 동일했다. 360/479/767/991/1279 경계와 양옆을 포함한다. 최종38/28/44 값과 base/mobile 각1개 소유자도 정방향 검사한다. 포커스15·모의 제출6 통과. 통합 후보(D03 포함)의 기존 홈 메뉴/폼/카드 상호작용3크기 통과. 첫 도구 실행은 잘못된 기본Playwright 경로로 버전 가드가 차단했고, 이후 고정1.57.0에서만 검사했다. 검사 코드의 SVG className/CSS nesting rule 순회 오류를 수정했으며 제품 기준을 바꾸지 않았다.

이 개선의 성공은 **높이 변경 위치를 상태별로 예측 가능하게 만들고 이전 최종 디자인을 그대로 보존한 것**이다. D05 전체 CSS 중복 해소나 전체 시각 검사 통과를 의미하지 않는다. 복구는 이 D05 커밋만 revert. 원시 결과 `/workspace/artifacts/helix-structure-20261117/d05/`.

## D03-U03 실제 결과

실제 현재 입력의1440px에서 동일한 보이는 bt3에 `sections-animations.js`와 `buttons.js`가 각각 set/remove/loop를 실행했다. section fadeComplete 약11,373ms 뒤 buttons 타이머는12,329ms에 먼저 inline을 제거했고 section 타이머는12,873ms에 다시 제거했다. 단순 경쟁 가설이 아니라 **1.5초 hold를 약0.96초로 줄이는 실행 결함**을 재현했다. 숨은 모바일/PC 복제 DOM의 이벤트도 구분해 계측했다.

수정은 buttons.js의 glow 대상에서 `.bt-box-3`만 제외(주석 포함3줄 변경)한다. bt3의 fade/hold/loop는 기존 sections-animations.js가 소유하며 bt1/2/4와 소개는 기존 담당자가 유지된다. 색·shadow값·5초 loop·fade duration·hold 값·측정 핸들러는 변경하지 않았다. 사용자 실행 지시와 LOCKED의 의도적 bt3 제외 계약에 부합한다.

`scripts/visual/glow-ownership.cjs`: 보존한 기존 기능 패치를 양쪽에 동일 적용한 뒤 buttons.js만 전후 비교했다. **3크기×2시나리오=6쌍** 모두 원본 set/remove/loop 각2회→후보 각1회, fade 후hold 약940–960ms→1500–1501ms. 실제 CSSStyleDeclaration 쓰기/제거 call stack·GSAP fade 완료·loop 전환을 기록했다. cold 일반 진입, warm 왕복(추가 쓰기0), 빠른 이탈/재진입, reduced-motion+CSS/font1200ms 지연을 포함했다. 모든 보이는 bt1/2/3/4의 최종 크기·텍스트·opacity·shadow·곡률·loop가 동일하고 hero 완료 이벤트 유지, JS/네트워크 오류·외부 전달0. 소비 로더는 home/bootstrap(.v2)이며 소개는 about.js의 별도 클래스/제어를 쓴다.

warm은 동일 문서 재진입이며 디스크 cache 검증은 아니다. 지연 검사는 임의 로더 실패나 Safari/실기기 모션 판정을 대신하지 않는다. D03의 bt3 중복 제어만 격리 후보 통과이며 hero 준비/viewport 연동 등은 미완료다. 복구는 이 D03 커밋만 revert. 원시 계측 `/workspace/artifacts/helix-structure-20261117/d03/results.json`.

## D02-U02a 실제 결과

실제 고정 `@63812a31…/global/word-wrap.css`의 모든 자손 `overflow-wrap:normal!important`가 내과 목록의 기존 anywhere를 무력화했다. 공백 없는 긴 문자열로 목록 flex item 자체가3,527–3,990px까지 늘어 섹션/화면 밖으로 벗어나는 실패를 재현했다. 글자와 자기 요소만 비교하면 이 실패를 놓치므로 **섹션/viewport 경계도 검사**한다. 재현은 합성 긴 문자열이며 현재 게시 문구 자체의 넘침 장애를 확정한 것은 아니다.

공개 head의 고정 참조를 바꿀 수 없으므로 전역 정책의 일괄 철회·정책 파일만 바꾼 미도달 후보를 피했다. **기존 모바일 page-ID/#hx-im-process/.sj_step_list 규칙의 anywhere만 명시적인 important 예외로 복원하고 그 자손을 같은 경계에 포함**했다. max-width는 원래 목록 요소에만 남긴다. 새 후행 override를 쌓지 않았고 word-break/hyphens/글꼴/767 경계/desktop은 그대로다. 이는 한 컴포넌트의 예외 소유권 복구이며 전역 important 구조를 없앤 것은 아니다.

`scripts/visual/wrap-boundary.cjs`: 실제 현재 입력5페이지×3크기 **15쌍**에서 게시 문구·링크·요소 geometry·글꼴/줄높이·word-break/hyphens와 비대상 overflow-wrap가 동일했다. 모바일의 의도한 overflow-wrap 속성만 자연 화면 hash에서 제외하고, 별도 정방향 검사로 anywhere와 실제 넘침 해소를 확인했다. 긴 영문/URL/숫자/한글×직접텍스트/span/a **12조건**이 원본 overflow→후보 내부 줄바꿈으로 바뀌었다(후보 목록287.625px). 1440/820에서는 원본 정책과 실패가 그대로이며 이번 해결 범위가 아니다. 766/767/768, 같은 클래스의 root 밖 대조, 실제 고정 정책의 늦은 재삽입도 확인했다. 원래 고정 정책과 실제 global.css overlay 도달을 매번 확인하고 JS/네트워크 오류·외부 전달0을 요구했다.

입력 누락은 정상으로 세지 않았다. 최신10/40자SHA의 CSS/JS·동영상·SEO·반응형 PNG 등60응답을 검사 밖에서 실제 GET200/본문 hash로 고정했고, 원본URL 덮어쓰기·묵시적 최신 대체 없이 재실행했다. 단축 floating JS의 첫GET403도 보존했고 표준 browser User-Agent GET200은 알려진 기존 동일본문이었다. 파일을 수정하거나 업로드하지 않았다. [추가 입력목록](evidence/structure-inputs-20261117.json)의 본문은 로컬뿐이다. 이전 current 입력 복구 ZIP의 미업로드 한계도 그대로다.

원본286/PNG33 기반 비홈 검사도 **정상 시각12개 PASS + 기존 일반 D02 예상 실패3개**다. 일반 전역 정책 문제의 예상 실패를 새 root 개선의 통과로 세지 않는다. 전체15쌍은 완료된 폭/소비자를 반복하지 않도록 여러 실행 결과를 조합했으며 각 실행명과 hash를 기계 판정에 남겼다. 복구는 이 D02 source hunk만 역적용하고 최신 인계 이력은 유지한다.

### 변경 영향 예측 검사 보강

D05는 기존108쌍 보존뿐 아니라 **36개 통제 수정**을 추가했다. canonical base38→40px 수정은 원본에서 뒤 선언에 가려 무효였고, 후보에서는 PC 폼에만 도달한다. 모바일 변형/legacy/인접 본문은 유지된다. 같은 화면이 우연히 같다는 것보다 수정 위치와 영향 범위를 예측할 수 있다는 증거다.

### D05-U04b 장식 표시 소유권

높이와 독립인 두 번째 원인은 form `::after`의 표시 제어다. canonical 블록은 화살표를 켜고 후행 동일 선택자2개가 content/display로 다시 끄고 있었다. 현재 숨김 디자인·모든 variant/기하값을 보존하며 **기존 canonical 블록에서 content:none/display:none!important를 소유**하게 하고 후행 동일 두 블록만 제거했다. content3→1, display2→1이며 다른 속성/비활성 호환 규칙은 그대로다.

기존 dffc740 대비108쌍의 전체 계산값/geometry/PNG가 동일하다. CSSOM 통제 수정36조건에서는 원본의 뒤 선언 때문에 무효였던 canonical content/display 편집이 후보의 form에만 도달했고 legacy/인접 본문은 보존됐다. 실제 디자인에서 장식을 다시 켠 것은 아니다. 전체 기능 통합·동결 소스 독립 재실행은 다음 마감 검증으로 수행한다. 이 단위의 runtime diff만 역적용하면 높이 개선·D03·D02를 유지할 수 있다.

## 최신 기준 이관과 최종 동결

작업 도중 다른 진행자가 main/staging와 공개 생성CSS를 갱신했다. 이전 결과를 최신 검증으로 바꾸어 쓰지 않았다. 새 기준은 staging **3d11dd7**, 확인한 main **d337d1a**다. 이전 ac87 기준과 최신 staging의 실행코드 직접 차이는 `home/global/coming-soon.css` 하나(퀵액세스 곡률)이며, 이 파일은 다른 진행자 원문 그대로 보존했다. main/staging tip은 두 문서와 영상의학과 검사 파일도 달라 실행코드 차이와 구분한다.

새 브랜치 **`fix/helix-structure-current-20261117`**는 최신 staging에서 분기했다. 기존 감사 브랜치를 병합하지 않고 문서/검증74개 경로만 기존 blob으로 선별 전달한 뒤 기존 기능3개와 이번 구조4개를 각각7개 runtime 복구 단위로 재적용했다. 원본 브랜치/dffc740/이번 최초 branch도 보존했다. 최종 트리와 이전 후보의 직접 차이가 외부 coming-soon.css 하나뿐임을 확인했고 최신 staging과의 runtime 차이는6경로뿐이다. 복구 SHA 대응은 [기계 판정](evidence/structure-20261117.json)에 있다. 문서 이력을 지우지 않도록 runtime hunk만 역적용하는 복구를 우선하며 main/staging/공개 설정은 건드리지 않는다.

2026-11-17 10:17 KST 실제 읽기에서 정식 home은d337d1a, 공개 staging home은**454dacce… 고정**, 생성CSS는 양쪽46f7fbd5d였다. 과거b8d8248/73c0c0934를 되살리지 않았다. 차단한 외부 요청으로 두 live probe에 Network request failed가 있어 이 캡처 자체를 오류0 통과로 세지 않는다. 새 응답을 고정한 오프라인 검사를 별도로 수행한다. 기존 PNG33/286응답/100px 기준은 그대로고 새로운 공개CSS로 조용히 기준선을 승격하지 않는다.

## 잔여 실행 순서 — 미완료를 실제 개선으로 잇는 단위

아래는 완료 목록이 아니라 다음 실행 계약이다. 이미 승인된 조사/격리 수정은 각 조건이 갖춰지면 추가 중간 승인 없이 수행하되 공개 설정/병합/배포는 이번 권한에 없다. 전역 파일 분할·모든 breakpoint 통일·한 번에 CSS layer 전환은 하지 않는다.

| 순서/단위 | 위험·예상 작업량 | 착수 조건과 한정할 실제 변경 | 완료/복구 기준 |
|---|---|---|---|
| V0/U01 | 높음·원인에 따라 대 | 기존 paint 명령은 원인을 가르지 못했다. 다음은 동일 이미지 raster 내용·합성 후 캡처 준비를 구분하는 새 근거가 있을 때만 실험. 기존 조건 미충족이면U01 계속 보류 | 원본 전체 독립3회 무실패·오류 대조 거절 후 보존된U01 hunk만 이관. 새 공개CSS와 원본 기준의 관계는 별도 명시, 기준을 실패 통과용으로 교체하지 않음 |
| D05 다음 한 속성 | 중간·2–4시간/단위 | 후행 선언에 실제 편집이 가려지는 속성 하나를 먼저 입증. phone min-height 또는 gap 등 한 속성만 base/mobile-bar/overlap/legacy 최종 소유자에 정리 | 108쌍 계약+통제 수정의 영향 예측, 다른 액션/인접 문서 보존. 그 속성 hunk만 복구. 파일 전체 정리 금지 |
| D03/D07 숨은 heading 복제 lifecycle/순번 | 높음·4–6시간 | 0×0 복제 DOM의 선행 glow는 관찰됐다. 순번 의존 제거는 실제 DOM 순서 변경/왕복에서 원본 사용자 실패→후보 통과를 먼저 갖춘 뒤 section 내부 페어링 한 경로만 수정 | bt1/2/3/4·hero·카드 정상 계약과 hot transition·숨은 복제 순서 대조. 이번 순서 fixture prototype은 추가 Typekit5 URL 누락으로 완전 검증 실패해 제품 변경 없이 보존/보류 |
| D02 다음 한 예외 root | 높음·3–5시간 | 이번 목록 외의 `.div-block-358` 제목/폼 등에서 실제 긴 토큰 실패를 재현한 root 하나만 대상으로 한다. 일괄 important 철회는 금지 | 한글/URL/영문/숫자·자손·후행 정책·경계, 소비5페이지 전후 보존. root hunk만 복구 |
| D04 고정/실제 자산 경계 | 높음·4–8시간 | 한 페이지의 entry·module·생성CSS·불변 SHA를 표로 고정하고 loader 실패/구버전 경로부터 검증. word-wrap63812a 고정 해제와 타 진행자 공개 pin 교체는 이번 범위에서 실행 불가 | candidate 소스와 실제 소비 URL/hash가 이어져야 도달 판정. 공개 참조 교체는 별도 권한 단계이며 현재 운영은 유지 |
| D06 viewport 소유자 | 높음·4–8시간+기기 | iOS/iPad Safari/WebKit 실기기/해당 엔진과 실패 재현 필요. 현재 WebKit binary 없음. 원래 meta를 누가 언제 보관하는지 먼저 계측하고 중복 교정 한 경로만 제거 | 991/992·1032세로·교정상하한·회전 왕복 meta/innerWidth/DOM/측정767 일관성. Chromium 폭 변경으로 완료 판정 금지. meta 변경 단위만 복구 |
| D07 기타 firstpaint/coming-soon 결합 | 높음·4–6시간/경로 | 토스트 이외 hero 복구 의존이 있어 무작정 추출하지 않는다. 한 함수의 정상/늦은CSS/로드실패 call graph를 먼저 확정 | 준비 전 첫 프레임·실패 복구·hero 완료·뒤 섹션 위치 보존 후 해당 함수만 정리. 임의 신규파일/로더 등록을 묶지 않음 |

최종 성공은 영향을 예측하는 정방향 계약과 비대상 보존이다. 일부 독립 후보 통과는 전체 구조 안정화나 공개 운영의 연쇄 오류 감소율 실증을 뜻하지 않는다.
