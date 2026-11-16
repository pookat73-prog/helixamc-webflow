# HELIX 홈페이지 안정화 — STEP 04 구조 개선

작성일: 2026-11-16 (Asia/Seoul). 범위: **U01/D01 문서 overflow 소유권 한 건의 후보 구현과 지정 검증 완료**. 기존 회귀 기준 실패1건으로 전체 green·공개 배포·전체 STEP04 완료는 보류다.

## 1. 시작 조건과 버전

- STEP01 진단, STEP02 구조/개발 수칙, STEP03 기준선, HANDOFF 및 기준 PNG의 review/provenance/run-summary를 읽었다. AGENTS·관련 CLAUDE LOCKED·반응형 인계·Drive 표준/최신 공통 인계를 대조했다.
- 시작은 clean `work/c2041b471f52435c3f349b8f068488d358fc5af5`. 다른 작업자의 미커밋 변경은 없었다. 일반 Git HTTPS fetch는 CONNECT 403으로 실패했다. 연결 GitHub 읽기와 immutable CDN으로 staging `11daa6d47a864d49dda835b7c208f726f275b629`의 누락 blob 41개를 검증·복원했다.
- 전체 source tree `48b07ea3947dbd92e4bd7b937bde44c99cddbd3a`를 검증했다. 로컬 이력을 보존하기 위해 snapshot 커밋 `280f14ad69ecf959dfa26091d5f0da7a3ccfd67a`를 만들었다. **이 커밋은 upstream staging과 tree만 같으며 같은 commit SHA가 아니다.** 원래 work는 그대로 보존했다. 작업 브랜치: `claude/helix-quality-step04-20261116`.
- 선행 도구·문서·기준 PNG만 복원한 커밋: `4057b71`. STEP03의 오래된 구현 브랜치 전체를 merge하지 않았다. 원본 PNG 33개와 index는 유지했다.
- Drive corpus를 내려받아 압축본 SHA-256 `1fc6c81ad6c4d627eb8ff6c1e9a1913b503ba4b4f6fe22119b5845ca0c768d56` 및 286개 응답의 본문 해시/index를 확인했다. Playwright 1.57.0 / Chromium 151.0.7922.173 / Debian 13, DPR1, ko-KR, Asia/Seoul, 새 context, service worker 차단이다.
- 이번 정식 홈 HTML 재조회 46,600B SHA-256 `335c90a798e2b66a057e9463573a0709562ea4228ab9d574488a8537a9f6dae5`는 corpus와 같다. 생성 CSS 정식 `3c2f00975`, staging `73c0c0934`, staging 홈 고정 `0011fc…`는 유지돼 있다. 공개 HTML 조회와 실제 후보 자산 도달 검증을 구분했다.

## 2. 해결한 구조와 영향 범위

| 대상 | 수정 전 | 수정 후 |
| --- | --- | --- |
| 문서 overflow 소유자 | global CSS의 clip을 홈 섹션 CSS의 동일 `html, body` 선택자가 hidden으로 덮음 | 기존 global CSS만 문서 정책 소유. 섹션 CSS의 충돌 원문 블록 삭제 |
| 계산 결과 | 문서 X hidden / Y auto | 후보 X clip / Y visible |
| 섹션 CSS 단독 적용 | 문서 전체 스크롤 정책을 바꿈 | 문서 기본 overflow를 바꾸지 않음 |

실제 사이트 코드는 `home/global/sections-animations.css` 한 파일의 문서 선택자 블록과 관련 주석만 바꿨다. 새 덮어쓰기·important·페이지 root·컴포넌트 추상화·새 런타임 파일을 추가하지 않았다. global의 clip/fixed/transform 보호, 섹션의 기존 클리핑·미디어쿼리·모션·글로우·초기 노출·로더·측정은 그대로다.

현재 로더 검색에서 이 CSS를 등록한 곳은 홈 bootstrap과 과거 bootstrap-v2뿐이다. 고정 응답 실제 홈에서만 해당 stylesheet를 확인했다. 소개는 이 파일을 로드하지 않는 정상 대조이며 실제 sticky geometry를 별도로 검사한다. 전 사이트 global 정책을 새로 바꾼 작업이 아니다. 이 변경으로 과거 sticky 장애 전부의 원인을 확정하거나 방문자 성능 개선을 주장하지 않는다.

## 3. 실제 검증 결과와 실패 보존

| 검사 | 결과 | 해석 |
| --- | --- | --- |
| corpus 286응답 / PNG33 원본 해시 | 통과 | 기준 입력 불변 |
| 기존 Site Quality | 최종 9개 통과, 추적 JS/CJS101개 포함 | 기존 소스 계약 검사 |
| 홈 로딩 / CTA focus / CTA 모의 제출 | 6출력그룹 / 15 / 6 시나리오 통과 | 실제 예약·통화 없음 |
| D01 정방향 회귀 | 원본 overlay 실패 → 후보 PC/태블릿/모바일 3개 통과 | 원인 제거 확인. 후보에서는 expected failure를 사용하지 않음 |
| 후보 독립 로드 전체 검사 | 정상14/15 통과, D01 3개 통과, D02 예상 실패3개 재현. 예상 밖 실패1 / skipped0 / flaky0 | PNG32/33 비교 통과. 전체 green 아님 |
| U01 반응형·실제 geometry·전후 시각 검사 | 홈/소개 ×14폭 =28조건, PNG112쌍 통과 | 문서 폭·좌표·크기·모션 값·링크/제목 보존, fixed/sticky·위로가기 클릭 통과. 외부 전달/네트워크/JS/폰트/화면 내 이미지 오류0 |

**남은 실패: `tablet/home-footer.png`.** 코드 수정 전 첫 실행 618픽셀, 같은 원본 재시도 1,206픽셀, 후보 전체 실행 283픽셀 차이였다. 모두 기존 100픽셀 한도를 넘었으므로 실패로 보존했다. 차이는 지점 카드 글자 주변에 집중됐다. 고정 입력·버전이 같고 외부 전달/HTTP/JS 오류는 없었으나, 이력 PNG와 현재 렌더링 차이의 최종 원인은 미확정이다. 추가 진단에서 실제 Peridot 웹폰트와 안정된 geometry를 확인했고 같은 context의 반복 캡처 차이는 유지됐다. 단순히 폰트 실패나 CSS 회귀로 단정하지 않는다. 기준 PNG 갱신, 허용 오차 확대, mask, expected failure로 숨기기를 하지 않았다.

전후 검사 도구 `scripts/visual/overflow.cjs`는 고정 원본 페이지에서 기존 모션·1.5초 글로우 인계를 기다린 다음 **같은 stylesheet 순서에서 해당 CSS만 대입**한다. 첫 화면/뒤 섹션/푸터/빠른 스크롤의 PNG, 계산값, 문서 폭, header/CTA/top-button geometry, 링크·제목, 소개 sticky 위치를 비교하고 실제 위로가기 클릭을 검사한다. 이 검사는 같은 문서의 CSS 영향 분리이며 초기 로드 검사를 대체하지 않는다. 독립 로드 검사는 위 전체 suite 결과로 별도 남긴다. 기준과 동일 threshold0.2/maxDiffPixels100을 사용한다.

실행 폭은 320/390/478/479/480/766/767/768/820/990/991/992/1440/1920px. 479/767/991의 ±1 경계와 작은/큰 화면을 포함한다. 820px 높이는1180px, 다른 모바일은844px, 나머지는900px이다. 최종 집계는 v2의 완료된320/390/478/479 8조건과 추가 fixture를 적용한 v3의480~1920 20조건만 사용한다. v2의 미완료480조건·초기 실패·820×900 파일럿은 최종 통과 수에 합치지 않았다. [실제 결과 요약](evidence/step04-results.json)에 버전·SHA·조건별 결과를 보존했다.

추가 도구 초기 실패도 보존했다. 글로우 인계 전 캡처 차이는 모션 완료 대기로 수정했다. 과도한 assertion Buffer 출력 중 프로세스 종료137은 짧은 오류 출력으로 수정했다. 320px의 숨은 데스크톱 섹션 선택은 실제 표시 heading의 section으로 수정했다. 소개3800px 및 이후480px에서 미보관 자산 요청을 검출한 실행은 통과로 쓰지 않는다. 소개는 기존 기준이 포함하는 0~1800px 안에서 빠른 왕복과 sticky를 검사한다. 이 범위도 다른 폭에서 추가 자산을 노출해, 실제 요청된 `Plus.svg`와 immutable ref의 연혁 SVG 두 응답을 별도 [추가 fixture](../../tests/visual/fixtures/overflow-extra-responses.json)에 고정했다. 연혁 SVG는 저장소 blob `e437e4158be9ed9f95c10346c0951d404e0bcd4d`와도 일치한다. 기존 index를 덮지 못하도록 검사하며 외부 전달 없이 본문 해시를 검사한다. 기존 corpus/PNG 갱신으로 실패를 숨긴 것이 아니다. 홈의 빠른 스크롤 범위는 별도다.

## 4. 실행·원자료

```bash
export HELIX_PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright
node scripts/visual/corpus.cjs verify

# 후보 독립 로드 비교. 현재 알려진 tablet/home-footer 차이로 exit 1 예상.
HELIX_VISUAL_OVERLAY=home/global/sections-animations.css \
  node /opt/codex/cua_node/lib/node_modules/playwright/cli.js test \
  --config playwright.config.cjs --max-failures=0

# 해당 후보의 정방향 계약만 선택
HELIX_VISUAL_OVERLAY=home/global/sections-animations.css \
  node /opt/codex/cua_node/lib/node_modules/playwright/cli.js test \
  --config playwright.config.cjs --grep=D01

# 원본/후보 같은 문서 비교. 외부 전달 0, 저장소 기준 PNG 불변.
node scripts/visual/overflow.cjs
```

기본 `run.cjs test`는 여전히 **배포된 원본 corpus 재생**이다. 원본의 D01은 expected failure, 명시적인 로컬 후보 overlay의 D01은 정방향 검사다. `--changed-from=4057b71`도 사이트 파일 한 개만 대입한다. 원본 production fixture를 몰래 후보로 바꾸지 않는다.

현재 원자료는 `/workspace/artifacts/helix-step04/`에 있다. `candidate-full/`의 결과 JSON·state/network·PNG/trace, `baseline-initial-failure/`, `baseline-repeat-failure/`, `footer-diagnosis/`, `d01-original-red.log`, `d01-after.log`, 경계 실행별 summary/states/network/전후 PNG를 구분했다. 선택 증거·체크섬·최종 커밋은 인계서의 마감 기록을 따른다. 로컬 장기 보존은 보장되지 않는다.

추가 두 응답 복원본은 `/workspace/artifacts/HELIX-STEP04-Corpus-Extras-20261116.tar.gz`, 512,563B, SHA-256 `e68333394e76ede716cc4e3f67b331f67203c1204fea44aa2bf933dbca993510`다. 원래 STEP03 corpus를 복원한 저장소 루트에서 이 압축본도 `tar -xzf`로 푼다. 기본 286응답 index는 그대로고 추가 fixture의 두 본문만 보완한다. 외부 업로드는 하지 않았다.

## 5. 보류·미검증과 다음 단계

1. 전체 회귀 green 및 공개 staging/운영 적용은 보류다. 먼저 원본의 태블릿 푸터 캡처 차이를 재현·원인 분리하고, 후보 독립 로드 검사를 통과시킨다. 이 실패를 없애기 위한 새 사이트 스타일 덮어쓰기는 추가하지 않는다.
2. 공개 staging 홈은 다른 고정 후보를 사용한다. 목적·담당이 확인되기 전 바꾸지 않는다. 향후 최신 대상 브랜치에 **U01 사이트 커밋만** 이관하고 실제 후보 SHA·생성 CSS·화면/기능을 확인한다. 로컬 snapshot이나 과거 도구 브랜치 전체를 staging/main에 병합하지 않는다.
3. D02 전역 word-wrap은 고정 자산 소비자와 실제 긴 문자열 장애·예외 계약부터, D03은 타이머 경쟁 재현부터, CTA 중복은 legacy variant까지, viewport는 iOS/회전까지 확인한 다음 독립 단위로 진행한다. 확인된 보호 장치를 일괄 제거하지 않는다. 첫 단위의 미완료 검증 위에 이 변경들을 쌓지 않았다.
4. Safari/iOS/iPad/실기기·회전, 초기/장애 프레임·모션 시간, 모든 페이지/legacy/지도·실예약/전화, 방문자 CWV는 미검증이다. 이번 Chromium 화면폭 검사를 해당 기기 검증으로 쓰지 않는다.

## 6. 커밋과 안전한 복구

도구 `6b49ff2`와 사이트 수정 `e68ea46`은 별도 작은 커밋이다. U01 사이트 커밋만 `git revert e68ea46`하면 문서 overflow 원문을 복구할 수 있다. 이 커밋은 단일 CSS +3/-5(주석 포함)다. 전송/복구용 runtime 전용 패치는 `/workspace/artifacts/HELIX-STEP04-U01-20261116.patch`에 있다. 다른 사용자 변경과 충돌하면 해당 hunk만 확인한다. 원본 work·snapshot·기준 PNG·corpus는 보존한다. reset/clean/force push는 사용하지 않았다. 공개 배포가 없으므로 운영 롤백은 필요하지 않다. 문서/실행 결과의 최종 커밋은 HANDOFF 마감과 `git log`에서 확인한다.
