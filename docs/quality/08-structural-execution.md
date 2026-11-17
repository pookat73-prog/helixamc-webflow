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
