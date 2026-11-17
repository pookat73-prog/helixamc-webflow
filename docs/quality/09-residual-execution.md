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

V0 새판별3회: 최종 화면625/0/881px, 첫 카드 replay raster400×440의 PNG SHA256은3회 동일했다. 중간 replay가 같아도 실제compositor tile이 같다는 증거가 아니어서 최종 원인/처방은 미확정이다. V0실패/U01보류를 유지하고 이번 조사는 닫는다. [판정](evidence/residual-v0.json). 최신 공개 home main3c4f78d4/staging고정ccb68a7c, 생성CSS46f7fbd5d를 실제 읽었다. 제품 수정은 아직 없다. 통과/실패/미실행은 실행별로 기록한다.
