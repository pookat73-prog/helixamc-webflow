# HELIX 홈페이지 안정화 — 인계

갱신일: 2026-11-13 (Asia/Seoul)

## 현재 인계 — STEP 02

### 1. 작업 개요

- **STEP 02 구조·개발 수칙 설계 완료. 구현·배포·AGENTS.md 통합은 미착수.**
- 산출물: [02-architecture.md](02-architecture.md), [03-rules.md](03-rules.md), 이 인계서 갱신. STEP 01 진단서는 입력 원본을 유지한다.
- AGENTS.md·CLAUDE.md·홈페이지 구현·workflow·Webflow 설정 변경 없음. 문서 작업 브랜치만 전달하며 main/staging merge·Publish는 하지 않는다.
- 사용자 요청대로 안전한 조사·설계·자체 검토·커밋·전달을 중간 승인 없이 진행한다.

### 2. 기술적 결정 사항

- 파일 분리보다 선택자·속성·상태 소유권을 먼저 정했다. 전역 문서 정책, 공통 UI, 페이지/섹션, 초기 화면 head, 로더·측정의 경계를 구분한다.
- 공통 CSS 소비자·variant·실제 로드 SHA를 확인한 뒤 변경한다. global 파일 안의 이미 한정된 페이지 규칙은 자동 이관하지 않는다.
- D01~D08을 구현 단위 U00~U07과 연결했다. 각 단위에 영향 범위·위험도·최소 검증·복구를 정의했으며 첫 경로는 **U00 기준선 확보→U01 overflow 충돌 한 건**이다.
- 낮음/중간/높음 위험도별 최소 검증을 정했다. 문서/사소한 국소 수정에 전체 사이트 검사를 요구하지 않으며 고위험도 자동 승인 대기 사유로 삼지 않는다.
- 정상 화면 보존, 관련 viewport/상태 검증, 원문 정리와 임시 덮어쓰기 금지, 두 번 연속 실패 시 재진단, 안전한 국소 복구, 후보/staging/정식 완료 구분을 수칙에 담았다.
- AGENTS.md 통합은 별도 문서 단위로 남겼다. 기존 우선순위·LOCKED·staging 우선/측정 예외를 보존하고 핵심 수칙과 링크만 통합하는 안이다. 이번 문서가 자동으로 전역 지침에 설치됐다고 보지 않는다.

### 3. 현재 상태와 증거

| 항목 | STEP 02 확인 결과 |
| --- | --- |
| 최초 입력 | 사용자가 제공한 format-patch를 clean 별도 브랜치에서 `git am`으로 적용, 문서 두 개만 반영. 적용 SHA `2686276646bf821e9e3be636353812b4c6fb4b6a` |
| 최신 입력 보정 | 사용자의 원격 전달 안내 후 `7d3e61604c585fc41d4bb4f2aada763ddcdfa385`의 두 문서를 다시 읽음. 후속 API 전달 기록 외 진단 결론 변경 없음 |
| 원본 이력 검증 | 허용된 GitHub 읽기 API로 누락 Git 객체를 받아 내용 해시를 검사. 최초 `9e6d4d5a494fffeb94b625511b13993bf6a92ddc`와 후속 `7d3e616…`을 **동일 SHA**로 복원. 구현 기준 `c2041b4…`에서 문서 두 파일만 달라짐 |
| 작업 브랜치 / 부모 | `docs/helix-quality-step02-20261113` / `7d3e61604c585fc41d4bb4f2aada763ddcdfa385`. 초기 patch 적용 브랜치는 `docs/helix-quality-step02-patch-import-20261113`로 별도 보존 |
| main / staging 재확인 | GitHub 연결 도구로 main `68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d`, staging `11daa6d47a864d49dda835b7c208f726f275b629` 확인. STEP 01 분석 버전과 같음 |
| 공개 HTML 재조회 | 2026-11-13 16:49 KST 정식·staging 모두 HTTP 200. staging 도메인 분기의 홈 고정 `0011fc…`, word-wrap `63812a31…`, 정식/staging 생성 CSS 차이 유지. HTML 정적 조회만 했으며 JS 실행·최종 로드 SHA·새 시각 검증으로 확대하지 않음 |
| STEP 01 증거 | 아래 보존 기록과 진단서의 검사 결과는 **이전 단계 결과**다. `/tmp/helix-quality-evidence/`는 현재 환경에 없음. 이전 캡처를 현재 기준선으로 재사용하지 않음 |
| 이번 단계 검증 | 요구사항·D01~D08/구현 단위 대응·지침 충돌 자체 검토, Markdown 내부 링크·표 구조·공백·변경 파일 범위 검사. 구현 불변·진단 입력 불변 대조. 상세 최종 결과와 전송 SHA는 아래 전달 기록으로 식별 |
| 브라우저/구현 검사 | 이번 변경은 Markdown뿐이므로 코드 테스트·전후 화면 검사를 새로 실행하지 않음. 홈페이지 정상화·성능 개선·운영 반영 완료를 주장하지 않음 |

미해결 조건: staging 후보 고정의 목적/담당 작업, Webflow head와 자산의 완전한 대응표, D03 실행 경쟁 재현, D06 회전/iOS 검증, 원래 각 회귀의 전후 연결. **설계 완료를 막지는 않지만 해당 구현·공개 검증의 선행 조건**이다. D01의 sticky 장애 인과와 D02의 실제 긴 문자열 장애는 여전히 미확정이다.

### 4. STEP 03 입력 조건과 시작점

1. 이 인계의 현재 절, [01-diagnosis.md](01-diagnosis.md), [02-architecture.md](02-architecture.md), [03-rules.md](03-rules.md)를 읽는다. 기존 AGENTS.md/CLAUDE.md와 후속 사용자 요청도 대조한다.
2. 문서 브랜치를 구현 배포본으로 사용하지 않는다. 구현 기준은 여전히 `c2041b4…`이므로, 후속 요청이 승인한 대상의 최신 staging/main과 실제 공개 자산을 먼저 확인한 별도 작업 브랜치를 쓴다. 문서만 이관하고 최신 구현 파일을 이 오래된 작업본으로 덮지 않는다.
3. U00: 대상 선택자·소비 페이지·상태·실제 head/자산/생성 CSS·정상 대조 화면을 새로 고정한다. STEP 01 검사 통과를 새 후보의 통과로 승계하지 않는다. 조회 시점 이후 버전이 달라졌다면 관련 진단만 재확인한다.
4. 첫 구현은 U01 한 건을 권장한다. 기존 홈 sections CSS의 문서 overflow 충돌만 최소 후보로 만들고 격리 재현→홈 PC/태블릿/모바일·관련 경계→소개 sticky 등 정상 대조 순서로 검증한다. global 보호·글로우·로더·breakpoint 일괄 변경을 묶지 않는다.
5. 공개 staging의 홈 고정 후보가 다른 작업이면 바꾸지 않는다. 기존 기록에서 목적을 확인하고, 독립 격리본의 후보 검증은 계속할 수 있다. 공개 화면의 SHA가 후보와 다르면 staging 검증은 미완료로 남긴다.
6. 구현·배포·AGENTS.md 통합은 후속 요청의 범위에서 수행한다. 안전한 자체 검증은 자율 진행하되, 실제 차단된 대상/의사결정만 확인한다. 정상 대조가 없거나 필수 검증에 실패하면 완료 처리하지 않는다.

### 5. 커밋 식별과 전달

- STEP 01 원격 기준: `docs/helix-quality-step01-20261113` / `7d3e61604c585fc41d4bb4f2aada763ddcdfa385`.
- STEP 02 전달 대상: `docs/helix-quality-step02-20261113`만. 일반 Git HTTPS는 CONNECT 403이므로 허용된 GitHub API로 정확한 Git 객체를 전달하고 SHA·문서 blob·ref를 대조한다. force 갱신은 하지 않는다.
- 설계 커밋과 최종 전달 확인은 아래 조회로 식별한다. 같은 커밋 안에 자기 SHA를 쓰는 대신, 확인된 설계 커밋 SHA는 후속 인계 기록에 적고 최종 인계 커밋은 브랜치 HEAD로 확인한다.

```bash
git log --format='%H %s' 7d3e61604c585fc41d4bb4f2aada763ddcdfa385..docs/helix-quality-step02-20261113
git diff --name-status 7d3e61604c585fc41d4bb4f2aada763ddcdfa385 docs/helix-quality-step02-20261113
```

원격 반영 후 다른 환경에서 받을 때:

```bash
git fetch origin docs/helix-quality-step02-20261113
git show FETCH_HEAD:docs/quality/HANDOFF.md
git show FETCH_HEAD:docs/quality/02-architecture.md
git show FETCH_HEAD:docs/quality/03-rules.md
```

현재 단계의 정적 조회 증거는 `/tmp/helix-quality-step02/public-html.json`과 HTML 두 개에 있다. 임시 파일이며 보존을 보장하지 않는다. 핵심 조건·버전·미검증 범위는 위에 기록했다.

## STEP 01 인계 원문 — 이력 보존

아래는 `7d3e616…`에서 받은 이전 인계다. 'STEP 02 미착수' 등은 **이전 시점 상태**이며 현재 상태는 위 STEP 02 절을 따른다. 기존 진단·검증·실패·전달 기록은 삭제하지 않는다.

## 1. 작업 개요

- 현재 단계: **STEP 01 정밀진단 완료. STEP 02는 미착수.**
- 목표: 수정 영향 범위를 작고 예측 가능하게 만들기 위한 원인·소유 경계 파악.
- 이번 변경: [01-diagnosis.md](01-diagnosis.md), 이 파일 두 개만 작성.
- 구현 코드·AGENTS.md·기존 인계 문서·Webflow 설정·배포 설정 변경 없음. reset/clean/force push/기존 변경 덮어쓰기 없음.
- 시작 시 미커밋·staged·untracked 변경이 없었으며 문서 전용 브랜치로 작업했다.
- 기존 `docs/quality/HANDOFF.md`는 없었다. 루트의 반응형·측정로그 `HANDOVER-*.md`는 그대로 보존했다.
- 후속 전달 상태: **문서 브랜치를 GitHub에 생성하고 최초 진단 커밋의 동일 SHA를 확인했다.** 일반 Git push는 프록시에서 차단되지만, 인증된 GitHub API 쓰기 경로는 정상이다. 이 후속 변경도 문서 두 파일의 전달 상태 기록만 갱신한다.

## 2. 기술적 결정 사항

- 전면 재작성·기계적 파일 분리·추상화 확대·breakpoint 일괄 통일을 해결책으로 채택하지 않았다.
- 확인 사실 / 유력 가설 / 추가 검증 / 유지 대상을 진단서에서 구분했다.
- 로컬 체크아웃이 최신 main보다 오래되어, **별도 임시 스냅샷에서 최신 원격 변경 41개의 Git blob 해시를 검증**한 후 대조했다. 원본 구현 파일을 최신 원격 파일로 덮어쓰지 않았다.
- 소스 근거는 `68aaaa4…` 고정 GitHub 링크, 실행 근거는 실제 정식·staging 관찰로 구분했다. 문서 브랜치의 부모와 진단한 최신 원격 SHA는 다르다.
- 알려진 보호장치(clip·flow-root·폰트/글로우 게이트·초기화 가드), 기기별 복제 마크업, 정상 공통 UI는 유지 대상으로 분류했다.

## 3. 현재 상태

### 완료 사항과 핵심 발견

| ID | 발견 | 상태 / 위험 |
| --- | --- | --- |
| D01 | 홈 섹션 CSS가 공통 `overflow-x: clip`을 `hidden`으로 덮고 body Y를 auto로 바꿈 | 실제 홈 4조건·격리 재현 확인 / 높음. 개별 sticky 장애 인과는 미확정. |
| D02 | `body * !important` 줄바꿈 규칙이 내과의 `overflow-wrap:anywhere`를 무력화 | 최신 소스·격리 재현 확인 / 높음. 실제 긴 문자열 장애는 추가 검증. |
| D03 | `.bt-box-3` shadow·hold·loop를 두 JS 모듈이 제어; LOCKED 설명과 현재 선택자 불일치 | 제어 중복 확인, 타이밍 회귀 가설 / 높음. |
| D04 | staging 홈은 최신 branch가 아닌 고정 후보 `0011fc…`; 공통 UI는 다른 SHA | 공개 HTML·브라우저 확인 / 높음. 후보 고정의 의도는 확인 필요. |
| D05 | CTA CSS의 동일 선택자·상태별 덮어쓰기 누적 | 확인 / 중간. mobile-bar에서 제외되는 레거시 규칙을 현재 버그로 오진하지 않음. |
| D06 | 레이아웃·측정·viewport meta 교정 기준이 여러 곳에 있음 | 확인 / 중간. 목적 차이 자체는 결함이 아님. 회전·실기기 미검증. |
| D07 | 공통 파일에 페이지 배치·호환·초기 화면 제어 책임이 섞임 | 확인 / 중간. page ID·section root로 한정된 규칙은 유지. |
| D08 | 기존 테스트는 있으나 CSS 계산값·전후 화면 차이를 CI가 포괄하지 못함 | workflow 확인 / 중간. branch protection 미확인. |

역사적 body font-variation 상속 사고와 FAQ margin collapse 사고는 Git diff로 확인했으며 **현재 해결 상태**로 분류했다. Codex의 불필요한 광범위 수정 여부는 원 요청·PR 맥락이 부족해 확정하지 않았다.

검증 완료: 로컬 품질 8개·loader 9개, 최신 main 스냅샷의 홈 로딩 6개 출력 그룹·예약 포커스 15시나리오·모의 제출 6시나리오. 실제 staging 공통 UI는 4페이지×2폭=8조건 PASS. 정식·staging 홈의 별도 4조건 스크린샷·계산값 확인, 페이지 오류·실패 요청 0. Chromium의 프록시 CA 오류는 해당 환경 인증서 SPKI를 지정해 재실행했다. 실제 예약·측정 전송 없음.

### 미해결·검증 한계

- 원래 회귀 각각의 화면·재현 순서·발생 전후 커밋 연결이 아직 없다.
- staging 홈 후보 고정의 목적과 다른 진행 작업을 확인해야 한다. 이번 작업에서 후보 고정을 해제하지 않았다.
- Safari/iOS 실기기, 모든 breakpoint ±1px, 회전 왕복, 긴 영문·URL·입력값, slow-network 전체 상태 전이는 미검증.
- Webflow head의 첫 화면 스타일·함수와 저장소 코드의 완전한 버전 대응표가 없다.
- 최신 main 스냅샷 검증과 실제 staging 검증은 서로 다른 실행 대상을 검사했다. 서로의 결과를 대체하지 않는다.
- 일반 Git HTTPS 경로는 `CONNECT tunnel failed, response 403`으로 계속 차단된다. 다만 후속 조사에서 GitHub CLI 인증과 저장소 API 쓰기 권한을 확인했고, Git Database API 전달에 성공했다. 초기의 "원격 반영 불가" 판단은 일반 Git 경로에만 해당하는 것으로 정정한다.

### 브랜치와 커밋

| 용도 | 값 |
| --- | --- |
| 저장소 | `https://github.com/pookat73-prog/helixamc-webflow.git` |
| 문서 브랜치 | `docs/helix-quality-step01-20261113` |
| 최초 진단 커밋 | `9e6d4d5a494fffeb94b625511b13993bf6a92ddc` — 동일 SHA로 원격 전달 확인 |
| 최초 진단 커밋 부모 | `c2041b471f52435c3f349b8f068488d358fc5af5` (`work` 시작점, #2014) |
| 분석한 원격 main | `68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d` (#2068) |
| 확인한 원격 staging | `11daa6d47a864d49dda835b7c208f726f275b629` (#2067) |
| 실제 staging 홈 본체 | `0011fc2323a69260f758f84bc13e0a289e78d9b4` |
| 문서 커밋 식별 | 아래 `git log`로 이 두 파일을 작성한 커밋의 전체 SHA 확인. 같은 커밋 안에 자기 SHA를 기입하지 않는다. 최종 작업 응답과 인계 patch에도 식별자가 남는다. |
| 원격 반영 | GitHub API로 `docs/helix-quality-step01-20261113` 브랜치 생성·커밋 SHA 검증 완료. 후속 전달 상태 갱신은 같은 브랜치에 fast-forward로 전달한다. main/staging 병합·Publish 없음. |

```bash
git log -1 --format='%H %s' -- docs/quality/01-diagnosis.md docs/quality/HANDOFF.md
git show --stat docs/helix-quality-step01-20261113
```

## 4. 다음 단계

**STEP 02 입력 문서: [01-diagnosis.md](01-diagnosis.md) 전체와 이 파일. 설계 착수 준비는 되었고 구현 계획은 아직 확정하지 않았다.**

1. 최신 저장소 상태·실제 로드 SHA·staging 후보 목적을 다시 확인한다. 기존 진행자의 변경을 보존한다.
2. D01/D02부터 정상 대조 화면과 재현 경로를 고정한다. D03은 observer·타이머 발사 시각을 계측해 경쟁 여부를 판정한다.
3. 선택자·속성·상태별 소유자 / 영향 페이지 / 유지할 계산값·배치·기능 / 필요한 검사 / 되돌릴 단위를 표로 만든다.
4. 충돌 하나를 해결하는 최소 후보를 설계한다. 전체 CSS 정리·breakpoint 변경·로더 교체를 동시에 묶지 않는다.
5. 실제 구현은 후속 요청 범위에서 별도로 진행한다. 이번 진단 완료는 사이트 안정화 구현 완료나 정식 반영 완료가 아니다.

### 원격 접속이 가능한 환경으로 인계

현재는 원격 브랜치에서 받는 방법을 우선한다. 기존 작업 공간에 미커밋 변경이 있으면 별도 worktree를 사용한다.

```bash
git fetch origin docs/helix-quality-step01-20261113
git show FETCH_HEAD:docs/quality/HANDOFF.md
git show FETCH_HEAD:docs/quality/01-diagnosis.md
```

초기 Git push 실패 때 만든 `/workspace/helix-step01-diagnosis.patch`는 **최초 진단 커밋 `9e6d4d5…` 한 개의 format-patch**다. 원격 전달 전의 상태 기록을 담고 있으므로 현재 전달 상태는 원격 브랜치의 이 파일을 기준으로 한다. patch에는 두 Markdown 파일과 커밋 메타데이터만 있으며 구현 코드를 포함하지 않는다. patch를 이용해야 한다면 원격 접속 가능한 최신 저장소에서 기존 변경을 보존한 별도 브랜치를 만든 뒤 적용한다.

```bash
# 원격 접속 가능한 환경의 clean checkout 또는 별도 worktree에서 수행
git fetch origin
git switch -c docs/helix-quality-step01-import origin/main
git am /path/to/helix-step01-diagnosis.patch
git show --stat HEAD
git diff HEAD^ HEAD --check
git push -u origin docs/helix-quality-step01-import
```

로컬 문서 브랜치에 접근할 수 있다면 patch 대신 문서 커밋 SHA 하나만 cherry-pick해도 된다. 최신 저장소에 같은 경로의 새 문서가 생겼다면 덮어쓰지 말고 내용을 보존하며 충돌을 검토한다. 이 전송 절차는 main/staging에 merge하거나 홈페이지를 배포하는 절차가 아니다.

## 5. 참고 파일과 증거

- [진단서](01-diagnosis.md): 소스 고정 링크, 역사적 diff, 검증 결과·한계, 재현용 read-only 명령.
- [AGENTS.md](../../AGENTS.md), [CLAUDE.md](../../CLAUDE.md), [README.md](../../README.md).
- [반응형 인계](../../HANDOVER-반응형-2026-08-17.md), [측정로그 인계](../../HANDOVER-측정로그-2026-08-28.md): 보존한 기존 기록. 과거 상태를 현재 사실로 자동 승계하지 않는다.
- 이번 환경의 임시 증거: `/tmp/helix-quality-evidence/`. 공개 HTML·GitHub API 응답·해시 검증 스냅샷·스크린샷·브라우저 결과 JSON. 환경 종료 후 보존을 보장하지 않으며, 핵심 결과는 진단서에 기록했다.
- 홈페이지: `https://www.helix-amc.com/`, staging: `https://helixanimalmedicalcenter.webflow.io/`.
