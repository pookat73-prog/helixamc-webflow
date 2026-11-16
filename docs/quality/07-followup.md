# HELIX 후속 안정화 — 실행 기록

2026-11-16 KST. 사용자 일괄 승인: 조사·격리 구현·검증·복구·문서화·작업 브랜치 전달. main/staging 병합, Webflow Publish, 공개 후보 교체는 제외한다. 기존 운영 및 다른 진행자의 작업을 보존한다. 전체 구조 안정화 완료를 선언하지 않는다.

## 0. 구현 전 실제 기준 확인

- 원격 main `307898486e80dc209ed7d1c5755c24c0875a3935`, staging `490a3133320d63b197d138498cffd7690bd1d074`, 감사 HEAD `02c92adaf65db1f63553c3f82ae5e419a65eb677` 재확인.
- 최신 staging 전체 blob과 root tree `4c7286390e856f47eb7d9789d344c913e7a5b1e2`, 원본 signed commit을 검증·복원했다. 기존 `/workspace/helixamc-webflow`의 clean work/c2041b4는 보존한다. 구현 기준은 별도 `/workspace/helix-followup`이다.
- Git HTTPS CONNECT403. GitHub 읽기 API와 immutable CDN의 실제 본문을 blob 해시로 검증했다. CDN 일부 SHA URL의403과 Git 통신403을 혼동하지 않으며 purge/설정 변경은 하지 않았다.
- 실제 브라우저에서 정식 home은 main3078984, staging home 본체는0011fc2323a69260f758f84bc13e0a289e78d9b4, 공통 보완 로더는 staging490a313. 양쪽 생성 CSS는73c0c0934다. 옛 corpus와 별도 입력으로 기록한다. 고정의 목적/담당은 미확인이고 변경하지 않는다.
- 공개 페이지 조회 전에 측정 제외와 호스트/메서드 차단을 설정했다. 실제 통화·예약 제출은 하지 않았다. 알려진 자산 HTTP오류0, 메뉴/폼 각1. 페이지별 `Network request failed` 1건은 미분류 상태로 보존하며 오류0으로 표현하지 않는다.
- 실제 응답/본문 해시·HTML 해시는 [적용 자산 기록](evidence/followup-assets.json). 원격 SHA만으로 실제 자산 선택을 추정하지 않았다.
- 감사 브랜치의 문서·검사·기준 이미지만 선별 이관한다. 오래된 구현을 merge하지 않는다. U01의 후보·PNG33·100px/threshold0.2·기존 LOCKED 보호는 보존한다.

## 실행 단위와 성공 기준

1. 시각 비교: 원본의 푸터/480홈 변동을 먼저 계측. 실제 폰트·geometry·모션/스크롤·캡처 준비를 원인별 대조한다. 실패 후 snapshot/mask/오차/expected failure를 바꾸지 않는다.
2. 메뉴와 예약창 배경 잠금, 폭 전환 카드 노출은 별도 수정·복구 단위다. 픽셀 검사 안정화와 독립인 실제 입력/노출 red→green은 대기시키지 않는다. 수정 영향은 실제 소비자·variant·경계와 정상 대조로 검증한다.
3. 잔여 D02/D03/D05/D04/D06/D07은 소유자·소비자·실제 적용 경로·검사·복구점이 있는 실행 계획으로 확정한다. 목록 작성은 구현 완료가 아니다.
4. 후보 도달·본문 해시·같은 SHA 검사·현재 생성 CSS를 검증한다. 공개 고정이 다른 동안 격리 후보 통과와 공개 staging 미검증을 구분한다.
5. 구현 후 새 브라우저/격리 환경에서 독립 재검수. 테스트 통과 외에 의도한 root/상태만 변하고 정상 대조 화면과 기능이 보존되는지 판정한다. 회귀 빈도·개발시간 감소를 소표본으로 수치화하지 않는다.

예상 작업량 대(약20–33 집중시간의 잠정치). GPT-6.1 Sol/추론 높음 추천, 사용량 높음. 모델 자동 변경 없음. 중간 승인 반복 없음. 재현이 두 번 남으면 보정을 쌓지 않고 재진단한다.

## 현재 상태

**기능별 격리 후보 통과, 전체 안정화·시각 검증 안정화·U01 승격은 미완료.** 구현 전 기준 확인과 기능3단위의 원인 제거·소비자/경계 검증·새 디렉터리 독립 재실행을 완료했다. 푸터 픽셀 비교가 독립 재실행에서도 실패하므로 전체 green·배포 준비 완료를 선언하지 않는다. main/staging 병합·공개 반영 없음. 자세한 판정은 아래4~5절, [기능 결과](evidence/followup-interactions.json), [감사 재검수 결과](evidence/followup-verdict.json)를 따른다.

## 1. 시각 비교 원인 분리와 검증 운영

- 원본286응답/PNG33와 Playwright1.57.0·Chromium151.0.7922.173·Debian13·DPR1을 확인했다. 태블릿/PC 정상 선택 실행은 각각 한 번 통과했지만 반복 진단에서는820px 하단 차이가1206/1206/1097/708/0px로 변했다. 한 번의 통과를 안정화 완료로 보지 않는다.
- 차이는 '푸터' 캡처에 함께 들어간 첫 지점 카드 글자 주변에 집중된다. 실제 플랫폼 폰트(NotoSansKR-Thin·PeridotPEVariableRegular), 글자 좌표·문서 높이·scrollY가 같은 실행 사이에도0/1096px 차이가 났다. 고정 입력에서도 재현돼 외부 GoogleCSS 응답 변형만으로 설명할 수 없다. 정확한 Chromium 래스터 캐시/합성 내부 원인은 미확정이다.
- 단순 추가 대기/1px 왕복 스크롤, 카드 경유 스크롤, 합성 draw 플래그, GPU 비활성화, GSAP 정지, screencast flush는 모두 해결 근거를 만들지 못했다. Clock 주입은 결과를 크게 바꿔 폐기했다. 이들은 진단용이며 제품·기본 검사 설정에 적용하지 않았다.
- 원인 분리를 위해 카드 will-change만 auto로 바꾼 진단에서는4회2517px로 일정해졌다. 합성 상태가 결과에 영향을 준다는 근거지만 기존 기준과 불일치하므로 CSS 처방이나 마스크로 채택하지 않았다. 이 실험은 진단일 뿐 실제 사이트 오류 확정·해결이 아니다.
- 480×844 첫 화면은 이번 고정 원본3회에서 최초 캡처 대비0/0/0px였다. 과거 Work의221px 실패를 해결·무효화한 것으로 해석하지 않는다. 운영체제/입력/캡처 경로가 다르고 동일 원인을 확정하지 못했다. 480px의 기기별 메뉴 trigger 중 뒤의 헤더에 가린 요소가 'visible'로 검색되는 경우도 있어, 기능 검사는 실제 pointer를 받는 버튼을 선택한다. 강제 클릭으로 통과시키지 않는다.
- 개선한 안전장치: 검사 시작 전 PNG33 해시와286본문/index 검증, 실제 Chromium·OS·아키텍처 가드, extra fixture의 기존URL 덮어쓰기 금지/본문 해시 확인, 사용하지 않은 후보 파일 거절, 실제 휠의 닫힌 상태 대조·소비자 검사·원본/후보 독립 결과 보존. 틀린 Chromium을 거절했고 정상 환경은 통과했다.
- **실패는 그대로 차단한다.** PNG·100px·threshold0.2·mask·기존 expected failure를 바꾸지 않았다. 실패 후 재시도 성공만 골라 green으로 집계하지 않는다. 시각 비교가 안정되기 전 필수 CI 연결·U01 승격·추가 구조 변경 누적은 보류한다. 독립적으로 검증 가능한 기능 후보의 전달은 계속한다.

V0 다음 실험은 지점 카드의 합성 레이어 생성/해제와 첫 raster 시점을 실제 LayerTree/트레이스로 짝대조하는 한 단위다. 재현 입력·스크롤/모션 완료·실제 폰트·고정 결과를 함께 보존한다. 브라우저 내부 문제와 캡처 준비 조건 중 인과관계가 확인된 경로만 수정한다. 정상 코드의 will-change 제거, 폰트 교체, PNG 갱신을 우선 처방으로 삼지 않는다. 원인 대조와 원래 기준의 전체3회 무실패가 없으면 V0 미완료를 유지한다.

추가 [LayerTree 대조](evidence/followup-layer-diagnosis.json):820px4회가21/2202/2202/0px였고, 통과/실패 모두 두 카드의 최종 layer transform/offset/크기와 합성 이유(`WillChangeTransform`/`WillChangeOpacity`)가 같았다.310px/282px 실패 실행의 Typekit30요청도 URL/본문 해시/순서가 모두 같았다. 부분 raster 비활성화는881/0/310px로 불안정했다. 힌트를 잠깐 내려 정확한 inline 원문으로 복원하는 진단은4회661px로 일정했지만 기존100px를 넘었다. 이를 정상화 코드나 기준 교체로 채택하지 않았다. 최종 좌표/자산/레이어 동일성만으로 PNG 동등성을 보장할 수 없다는 근거를 추가했으며 브라우저 내부 raster 원인 확정은 여전히 남는다. 다음은 첫 paint의 실제 draw 기록·raster 좌표/캐시와 기준 생성 당시 조건을 대조하는 범위로 좁힌다.

## 2. 기능별 원인·독립 수정

### 끝 버전 직접 대조에 따른 정정

GitHub compare의 changed-files 목록은 공통 조상 이후 변경이며 두 tip의 직접 차이가 아니다. 조사 초기 이 목록으로 `global/floating-cta.js` 등에 tip 차이가 있다고 해석한 부분을 정정한다. main3078984/staging490a313의 전체 blob을 직접 대조하니 실행 코드 전체가 동일하고 `docs/eomharim-restore-2026-11-16.md` 한 문서만 다르다. 실제 정식에서 받은 floating-cta.js 본문도 staging 원본과 동일했다. `ahead25/behind5` 이력 분기는 남지만 이를 실행 코드 차이로 확대하지 않는다. 최초 로컬 복원은 staging의 tree/commit 해시를 검증했고, 이 직접 대조는 이후 확인임을 구분한다. 다른 진행자의 의료진 기록과 공개 고정을 보존한다.

### 메뉴 — `0b03f71`

원본의 `body.hx-menu-open {overflow:hidden}`만으로는 root viewport 스크롤이 잠기지 않는다. 현재 홈의 root/body hidden/auto 및 실제 휠 이동으로 확인했다. 같은 open/close 담당 함수가 html 상태도 제어하고 기존 스크롤 잠금 선언에 해당 root를 포함한다. 닫힌 상태의 문서 정책은 바꾸지 않는다. 메뉴 전용 overlay에서 배경300→900이300→300으로 바뀌고 예약창/태블릿 카드의 원본 실패는 그대로 남아 수정 경계를 확인했다.

### 폭 전환 카드 — `ba80e91`

초기 `initSectionsOnce`는 숨은 기기별 카드 section을 건너뛰고, 이후 resize는 지그 라인만 재생성했다. 카드의 기존 초기화 블록만 별도 함수로 옮겨 처음 표시되는 section을 WeakSet으로 한 번 초기화한다. resize에서 그 함수만 호출하며 헤딩·글로우·복사/전화 바인딩 전체를 재실행하지 않는다. 기존 모션 값·DOM·breakpoint는 유지한다. 카드 전용 overlay에서 메뉴/예약창 실패는 유지되고1440→820→1440→390→820→1440의 카드/SVICC 노출만 해결됐다.

### 예약창 — `37b0c7d`

기존 모달 `is-open`이 유일한 상태 소유자다. `global/floating-cta.css`에서 `html:has(#hxFctaModal.is-open)`의 viewport 스크롤만 잠근다. JavaScript·Firebase endpoint·payload·동의·측정은 원본과 바이트 단위 동일하다. 현재 지원 전제(iOS16+/현대 Chrome)의 :has 지원을 사용하며 실제 Safari/touch 검증은 별도 미검증이다.

처음 시험한 JavaScript root class2줄 후보는 파일 전체 업로드의 기존 Firebase payload를 새 전송으로 판정한 자동 승인 검토에서2회 거절됐다. 두 줄을 제거하면 원본과 완전히 같은 바이트라는 확인 후 재검토도 거절됐다. 우회 전송하지 않고 해당 JS 변경을 폐기, 기존 DOM 상태를 읽는 CSS만으로 축소했다. 실제 예약 제출/사용자 자료 전송은 하지 않았다. CSS 대안의3크기 배경 잠금·내부 스크롤·교차 잠금 재검증 통과.

### 검증 범위

원본은3크기 모두 메뉴/예약창 배경 잠금 실패, PC→태블릿 전환 카드 실패를 재현했다. 메뉴만·예약창만·카드만 대입한 결과는 비대상 실패를 유지한다. 최종 CSS 상태 후보는3크기에서 열기/닫기·닫은 뒤 실제 휠·포커스·내부 스크롤(넘침 있을 때)·두 UI의 잠금 소유권을 통과했다. 입력은 STEP03 고정286응답+별도60응답, 외부 전달0이다.

현재 공개 홈 HTML/생성CSS73c0c0934/실제 자산을 별도 고정한 검사에서도3크기 및990/991/992,766/767/768,478/479/480 전환·왕복 노출을 통과했다. 이는 격리된 현재 입력에 후보를 대입한 결과이며 공개 staging/정식 후보 도달을 뜻하지 않는다. 과거의 JS 상태 후보 결과와 최종 CSS 후보 결과는 구분 보존한다.

다른 공통 UI 소비자(소개/services/FAQ/내과)의 검사를 진행한다. 첫 시도 중 짧은 문서 끝에 도달해 닫은 뒤 하향 휠 대조가 성립하지 않은 결과는 보존했다. 각 검사 전 정상 스크롤 여유를 검증하고 시작 위치를0으로 고정한 검사를 별도로 실행한다. assertion·오차를 완화하지 않는다.

## 3. 잔여 구조 문제의 후속 실행 계획

아래는 **미해결 대장**이다. 이번 기능 수정·목록 작성·PNG 통과가 D02/D03/D05 등 전체 구조 개선 완료를 뜻하지 않는다. 다음 구현은 한 원인·한 root/variant·한 복구 커밋으로 제한한다. 위험/소비자가 확인되지 않으면 조사만 진행하고 다른 독립 단위를 이어간다.

| 순서·단위 | 실제 개선 범위·착수 조건 | 보존/완료 계약·복구 | 예상 작업량 |
| --- | --- | --- | --- |
| V0 시각 입력/캡처 | 푸터·480홈의 반복 실패를 원본부터 분리. 원본PNG/100px/threshold0.2 유지 | 원인 대조·외부전달0·독립 전체3회 무실패·오류 대조 거절. 실패하면U01/CI 승격 보류 | 대, 진행중 |
| U01 기존 후보 이관 | V0와 현재 소비자 확인 뒤, `sections-animations.css`의 검증된 hunk만 이관. 새 구현 금지 | D01 정방향, 홈/소개 geometry·fixed/sticky·빠른스크롤·관련 경계, 독립 로드 보존. runtime hunk만 revert | 중,2–4시간 |
| U04/D05 CTA 한 속성 | V0 후 `floating-cta.css`/mobile-fix의 실제 base/desktop/mobile-bar/legacy 계산값 확보. 첫 대상은 폼 버튼 높이의 중복 선언 한 속성. 동일값을 상태별 원문으로 정리할 수 있을 때만 구현 | 최종 높이·줄수·화살표·세 variant·관련 경계±1·포커스/모의제출 동등. legacy fixture 확인 불가면 삭제 보류. 한 커밋 revert | 중,3–5시간 |
| U02/D02 줄바꿈 예외 | 실제 고정 `@63812a31…/global/word-wrap.css` 소비자를 확인. 첫 대상 내과 `.sj_step_list`/`#hx-im-process`의 긴 문자열 예외 한 root. 전역 한글 정책 일괄 철회 금지 | 한글 단어 보존, URL/공백없는영문/숫자의 넘침 방지 red→green. word-wrap 소비 페이지 표본의 폭/줄수/높이 동일. 정책과 필요한 참조를 같은 복구 단위로 취급. 현재 expected failure3개는 여전히 미해결 | 대,4–8시간 |
| U03/D03 bt3 단일 제어 | `buttons.js`와 `sections-animations.js` observer/hold/inline 제거 시점 계측부터. 중복 실행이 실제 재현되고 LOCKED 의도와 맞는 경우 bt3 경로 하나만 제거 | cold/warm·왕복/빠른스크롤·CSS/폰트지연·reduced-motion에서 fade→1.5초 hold→loop, bt1/2/4·소개·hero 이벤트 보존. 계측과 구현은 별도 커밋 | 대,4–8시간 |
| D04/D07 로더/head 결합 | 혼재SHA·누락보완·중복 바인딩을 실제 소비 경로로 대조. 고정 후보의 목적/담당이 불명인 동안 공개 설정 변경 금지. 재현된 중복 한 경로만 조정 | 메뉴/폼/top-button 각1·이벤트1회·기존 고정본/실패복구 보존. 로더·등록·참조는 한 복구 단위 | 대,4–8시간 |
| U05/D06 viewport | meta 원본 보관·회전 복구의 중복을 계측. 이번 카드 노출 수정과 분리. 실제 실패와 해당 엔진/기기 확보 후 한 교정 주체만 조정 | 991/992·1032세로·교정상하한·세로→가로→세로, meta/innerWidth/복제DOM 일관성. Chromium 폭 변경만으로 iOS 통과 금지 | 대,4–8시간+기기검증 |
| U07 CI 연결 | V0·corpus 복원·동일 실행 환경 확보 후 별도 workflow 커밋. 현재에는 연결하지 않음 | 원본 오류 대조 exit1/정상 exit0·해시불일치/후보미실행 거절. 보호 브랜치 강제는 별도 권한 확인. 검사 실패를 숨기지 않음 | 중,2–4시간 |

D02 긴 문자열의 실제 사용자 장애가 먼저 재현되면 U04보다 앞선다. D03의 제어 중복 확인을 곧 타이밍 결함 확정으로 취급하지 않는다. U04의 호환 variant를 합치거나 D06의 기기별 DOM을 통합하지 않는다. 새 라이브러리·전역 breakpoint 체계·폴더 재편·선택자 일괄 개명·CSS layer 전환은 이 계획에 없다.

실질적 개선은 수정 root/상태의 예측과 정상 대조 보존으로 판단한다. 각 단위에 '예상 소비자→실제 변경된 계산값/배치/이벤트→비대상 보존→복구 결과'를 붙인다. 단순 테스트 개수·파일 줄 수 감소를 회귀 감소로 보고하지 않는다. 배포하지 않은 후보의 실제 방문자 회귀율 감소는 아직 측정할 수 없다.

## 4. 실제 적용과 변경 영향 확인

최종 runtime 변경은 메뉴2파일·카드1파일·예약창 CSS1파일이다. 새 runtime 파일/로드 등록/로더/생성 CSS/기기별 DOM/폰트/측정/예약 제출 경로/viewport 정책을 바꾸지 않았다. `global/floating-cta.js`와 U01 대상 CSS는 원본 그대로다. 작업 브랜치는 최신 staging490a313에서 이어졌고 감사 브랜치 전체를 merge하지 않았다. 문서·기준 이미지·검사만 선별 이관했다.

관련 소비자 검증: 소개/services/FAQ/내과 ×1440/390의8조건은 실제 메뉴·예약창 입력·닫힌 상태 대조·포커스·중첩 잠금 통과. 현재 홈의1440/820/390은 열기/닫기·내부 스크롤·폭 경계11회 왕복에서 통과했다. 원본의 같은 검사 실패와 후보의 결과를 [기능 결과](evidence/followup-interactions.json)에서 구분한다.

현재 홈 입력의 원본/후보 독립 로드3쌍은 닫힌 상태의 문서 높이·가로폭·overflow/transform 정책·제목·링크·주요 요소 좌표·글꼴·공통 UI 개수가 **정확히 동일**했다. 의도한 개선은 열린 상태의 배경 잠금과 전환 뒤 처음 표시되는 카드에 한정된다. 실제 자산의 경로/해시와 대입 로그로 후보가 실행됐는지 확인했다. 공개 사이트를 바꾸지 않았으므로 이 결과를 운영 회귀율 개선이나 공개 staging 통과로 표현하지 않는다.

## 5. 독립 재실행과 최종 판정

코드·검사 동결 `933d5c025057fb0e0311e1d845cf22099a405b8c`의 git archive를 새 디렉터리 `/workspace/helix-review-final`에 풀고 별도 브라우저/context로 재실행했다. 같은 작성 에이전트의 독립 실행이며 별도 사람/제3자 코드 리뷰로 과장하지 않는다. 별도 `/workspace/helix-review`의 비홈 검사와 범위를 구분한다.

| 검사 | 결과 | 판정 경계 |
| --- | --- | --- |
| 현재 홈 기능·경계 재실행 |3크기 통과, 외부전달/네트워크/JS오류0 | 메뉴·예약창·PC→태블릿 등11회 전환. 실제 iOS/touch 아님 |
| 현재 홈 원본/후보 닫힌 상태3쌍 | geometry·콘텐츠·문서 정책·글꼴 정확히 동일 | 픽셀 기준의 불안정성 해결을 대신하지 않음 |
| 소개/services/FAQ/내과 고정 시각 검사 | 정상12·기존D02 예상실패3, 예상밖실패/미실행/flaky0, exit0 | D02 해결 통과가 아님. 후보 파일은 실제 소비하는 메뉴/예약창 CSS만 선택 |
| 첫 전체 후보 suite | 태블릿 하단310px 실패,13개 중단 | PC 정상5와 기존 계약2만 먼저 완료. 분할 성공을 전체green으로 합치지 않음 |
| 새 디렉터리 태블릿 홈 시각 재검수 | 하단282px 실패, 뒤 계약1개 미실행 | 독립 비교 안정화 실패 유지 |
| 오류 대조 | 임시 예약 버튼 배경 변경4548px, exit1 | 임시 외부 overlay만 사용. 제품 CSS·기준PNG 불변. 실제 오류 탐지 유지 |
| 기존 소스·폼·푸터·홈 로더 | Site Quality·CTA focus15/모의제출6·푸터28·홈로딩6출력그룹 통과 | 실제 예약/통화/분석 전달 없음 |
| 입력/기준 보호 |286응답/index·PNG33 해시 불변. 틀린 Chromium 거절 | 오차/mask/기존expected failure 변경 없음 |

**최종 판정: 기능3단위의 격리 개선과 영향 경계 보존은 인정. 전체 홈페이지 안정화·시각 검증 안정화·U01 배포 준비는 미완료.** 원인/소유 경로가 좁아지고 비대상 화면 보존을 실제 확인했지만, 공개 환경의 장기 회귀 빈도·개발시간 감소는 아직 실증되지 않았다. D02·D03·D05 등 구조 문제는3절의 순서와 조건에 따라 계속 미해결로 관리한다.

다음 재개는V0의 합성/래스터 인과관계 규명이다. 독립인 D03 계측·D05 variant 계약 수집·D02 소비자 지도는 병행 가능하나 미검증 구조 패치를 이번 후보 위에 쌓지 않는다. V0와 소비자 조건을 충족한 뒤 U01 최소hunk 검증, 다음 제한 구현은U04 한 속성으로 진행하고 실제 D02 사용자 장애가 재현되면 우선순위를 올린다. 검사 기준 변경이 필요해 보이더라도 이번 범위에서 조용히 바꾸지 않는다.

## 6. 재현·전달·복구

```bash
export HELIX_PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright
export HELIX_CHROMIUM_PATH=/usr/bin/chromium
node scripts/visual/corpus.cjs verify
node scripts/visual/run.cjs test
# 위 전체 명령은 현재 푸터 불안정성 때문에 실패할 수 있다. 실패를 유지한다.
HELIX_VISUAL_OVERLAY=home/global/hamburger.css,home/global/hamburger.js,global/floating-cta.css,home/global/sections-animations.js \
  HELIX_INTERACTION_EXTRAS=/absolute/path/to/supplemental-v5 \
  node scripts/visual/interactions.cjs
# 현재 입력은 동일 실행 당시 manifest+본문을 명시한다. 없으면 현재 결과 재현은 미검증이다.
HELIX_INTERACTION_INPUT=/absolute/path/to/current-input \
  HELIX_INTERACTION_EXTRAS=/absolute/path/to/current-extra \
  node scripts/visual/scope.cjs
```

원본 corpus와 보충60응답은 [감사](06-audit.md)의 Drive 원본·해시로 복원한다. `current-extra`는 현재 입력에 이미 존재하는 URL을 제외한 원본/보충 응답이며 같은URL을 덮어쓰지 않는다. 최신 홈 고정 입력은 로컬 `/workspace/artifacts/helix-followup/current-input`과 `current-extra`에 보존했고, manifest 해시는 결과 대장에 적는다. 로컬 장기 보존은 보장되지 않는다. 원본/현재 입력을 섞거나 최신 HTML을 옛PNG의 입력으로 바꾸지 않는다.

대표 실패 그림: [원본 태블릿](evidence/followup/original-tablet-diff.png), [독립 재검수](evidence/followup/independent-tablet-diff.png). 원시 JSON/PNG/trace·진단 실패·폐기 실험은 `/workspace/artifacts/helix-followup/`에 있다. 작은 결과 대장과 대표 실패는 GitHub에 영구 기록한다. 자료 없는 전체 STEP04 Git 객체 동일성·branch protection·Work/Safari/iOS/실기기/초기 모션·방문자 성과는 완료로 전환하지 않는다.

복구는 메뉴 `0b03f71`, 카드 `ba80e91`, 예약창 CSS `37b0c7d` 각각 한 커밋만 revert한다. 검사는 별도 커밋이다. 공개 배포가 없으므로 운영 rollback은 필요하지 않다. 다른 진행자의 의료진 기록·공개 고정·기존 work 체크아웃에는 reset/clean/force/전체 덮어쓰기를 하지 않았다. 최종 전달 SHA는 작업 브랜치 HEAD로 식별하며 main/staging merge·Publish는 없다.

## 7. 작업 중 외부 진행 발견·최신 기준으로 최소 이관

마감 조회에서 다른 진행으로 main이 `5b8827e9a7b0430683354f1f1b3dcff45626e68d`, staging이 `ac87f91b91469311ddf627041504f52e35bcfceb`로 진행됐다. 변경5파일은 `home/global/coming-soon.css/js`, `home/global/scroll-hint.css`, `scripts/test-quickbar-measurement.mjs`, `docs/home-quickbar-measurement.md`이다. 퀵액세스/스크롤 안내 변경이며 이번 수정4파일과 직접 겹치지 않는다. 서로의 최신 tip 실행 코드가 동일하고 의료진 기록 한 문서만 다르다는 직접 대조도 유지한다.

기존 작업 브랜치 `fix/helix-followup-20261116`/0685a30은 보존했다. 새 작업 브랜치 **`fix/helix-followup-current-20261116`**를 최신 staging ac87f91에서 만들고, 이미 검증한 자신의8단위만 개별 재적용했다. merge/force/감사 브랜치 전체 병합은 없다. 각 tree를 로컬 Git hash와 대조했고 새 parent를 제외한 자기 변경 blob은 동일하다. 외부5파일은 최신 원문/해시 그대로 보존한다. 재적용 이력과 최신 검증은 [최신 기준 이관 기록](evidence/followup-latest.json)을 따른다.

최신 공개 브라우저 확인에서는 정식 home이5b8827e…를 실행했고, 공개 staging home 고정도 다른 진행으로 **b8d8248c727aa01e985f1c8f24e2e540ebdf0fea**로 바뀌었다. 이전0011fc…를 복원하거나 새 고정을 교체하지 않았다. 현재 관찰된 고정을 유지한다. 생성 CSS73c0c0934, 페이지별 `Network request failed` 1건은 유지해0으로 표현하지 않는다. 이 변경을 이번 작업이 배포한 것으로 기록하지 않는다.

새 입력은 origin별 manifest와 본문을 분리해 같은URL의 외부 응답 변형이 서로 덮이지 않게 했다. `current-input-final/main`과 `current-extra-final`을 사용한다. 첫 재생은 Adobe subset2응답이 없어 차단됐으며, 보충 후 다음 incremental state의2응답도 필요했다. 정확한4주소를 별도 GET해200/본문 해시를 확보한 뒤 기존URL 덮어쓰기 없이 보충했다. 실패 실행은 보존한다. 미기록 응답을 허용하거나 라이브 요청을 검사 중 통과시키지 않았다. 최신 quickbar의8개 측정 계약·홈로더 검사는 통과했다.

이 절은 최초 구현 전490a313 기준과933d5c0 독립 검사 이력을 덮어쓰지 않는다. 최신 외부 변경을 포함한 추가 기능/영향 검사 결과는 별도 최신 대장에 기록하며, 푸터 안정화·U01/D02/D03/D05 미완료 판정과 배포 금지는 계속 유지한다.

**최신 재검수 완료:**48fe888의 새 디렉터리에서 main5b8827e의 origin별 고정 입력으로 기능1440/820/390과 경계11회 전환·왕복, 원본/후보 닫힌 상태3쌍을 통과했다. 최종 재생 외부 전달/네트워크/JS오류0. 문서 높이·가로폭·정책·제목/링크·주요 좌표·글꼴이 정확히 동일하다. 새 퀵액세스의 의도한112px 변경을 옛PNG와 비교해 회귀로 판정하지 않았다. 과거 고정 하단 실패는 그대로 남고, 최신 코드 위의 전체 시각 안정화/운영 통과를 선언하지 않는다.

현재 복구 커밋은 메뉴 **b1e74dc**, 카드 **a115b03**, 예약창 CSS **fabc7c0**이다. 이전 커밋과의 대응은 최신 대장에 보존한다. 최종 작업 브랜치는 `fix/helix-followup-current-20261116`이며 위6절의 최초 브랜치는 보존 이력이다.

Drive 공통 인계서 갱신은 HELIX 웹 성능 개선 스킬의 공통 기록 갱신 지침에 따라 시도했으나, 자동 승인 검토가 이번 승인을 GitHub 작업 브랜치 기록으로 한정해 외부 문서 기록을 거절했다. Drive 변경은 없고 재시도/우회하지 않았다. 요청된 단계별 GitHub 기록과 이 HANDOFF는 전달했다. 예약창 JS 전달 거절은2절의 CSS 대안으로 해결했으며 서로 다른 승인 검토 결과를 혼동하지 않는다.

최신 입력 부분 복원 묶음은 로컬 `/workspace/artifacts/HELIX-Followup-Current-Inputs-20261116.zip`으로 준비했다. 추가 묶음 전달 도구가 중단되어 GitHub에는 올라가지 않았으며, 원격 전달 완료로 표시하지 않는다. origin별 manifest와 변할 수 있는 HTML/CSS/API JSON 본문만 포함한다. 저장소 JS와 글꼴/미디어 바이너리는 복제하지 않았으므로 **완전한 오프라인 corpus가 아니다**. 기존 STEP03/Work 보관본 또는 정확한 immutable URL에서 누락 본문을 가져와 모든 SHA256을 검증한 후 사용한다. 누락/불일치를 라이브 폴백으로 숨기지 않는다. 크기·SHA·생략 목록은 최신 대장과 묶음 README/OMITTED를 따른다.
