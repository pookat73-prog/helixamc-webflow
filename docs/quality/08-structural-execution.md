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
