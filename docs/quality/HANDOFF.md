# HELIX 홈페이지 안정화 — 인계

갱신일: 2026-11-13 (Asia/Seoul)

## 현재 인계 — STEP 03

### 1. 작업 개요

검증 기반 구축. [04-baseline.md](04-baseline.md), 실행 가능한 Playwright 설정·선택 실행기·고정 응답 보관/검사 도구, 검토용 PNG 33개를 작성했다. 구조 리팩터링·D01/D02 수정·AGENTS.md 통합·운영/staging merge·Webflow Publish는 수행하지 않았다.

### 2. 기술적 결정 사항

- 이전 STEP 02 최종 커밋 `316126611db7c39d78914920ea60d4f2c0d80476`을 원격에서 확인하고 원래 Git 객체 해시를 검증해 로컬에 복원했다. STEP 01/02 문서 네 개와 조상 이력이 실제 작업 브랜치에 포함됐다.
- 브랜치는 `test/helix-quality-step03-20261113`, 부모 `3161266`. 문서 브랜치의 사이트 구현 기준은 여전히 `c2041b4`다. 이 브랜치를 사이트 배포본으로 사용하지 않는다.
- 브라우저 대상은 정식 운영의 실제 HTML·자산 응답을 고정한 격리본이다. main `68aaaa4…`, staging `11daa6d…`와 별도로 페이지별 실제 ref·본문 해시를 `provenance.json`/`corpus-index.json`에 기록했다. 모든 페이지가 최신 main만 로드한다고 가정하지 않았다.
- 홈·소개·services·FAQ·내과 × 1440×900 / 820×1180 / 390×844. 첫 화면 외에 홈 메뉴/예약창/푸터, 소개 스크롤 화면, FAQ 목록, 내과 프로세스를 비교한다.
- 알려진 D01/D02는 별도 expected failure 6건으로 표시한다. PNG는 관찰 기준이며 전체 디자인 승인이 아니다. D03/D06·iOS·실기기·초기 로딩/모션 시간은 미검증이다.
- 고정 응답 재생은 외부 요청 전달 0, 분석 차단 사전 probe, 본문 해시·글꼴·화면 내 이미지·JS 오류를 검사한다. `test`는 없는 기준을 자동 생성하지 않는다. 선택 실행과 후보 파일 대입은 [04-baseline.md](04-baseline.md)의 절차를 따른다.

### 3. 현재 상태

**지정 범위의 검증 환경 구축 완료. 사이트 구조 수정·공개 배포·D01/D02 해결은 미착수.**

- 최종 전체 재생: 2026-11-13 17:34:45~17:37:54 KST. 정상 시나리오 15개·PNG 33개 비교 통과, 알려진 D01/D02 expected failure 6개 재현. 예상 밖 실패/flaky/skipped 0. 재생 외부 전달·후보 대입·네트워크/JS/폰트/화면 내 이미지 오류 0.
- 선택 실행 `home/pc` 통과. 예약 버튼 배경만 바꾼 임시 후보는 4,798 픽셀 차이로 종료 코드 1. 기준 PNG 해시 33개 불변 확인. 복구 선택 실행도 정상 1건·알려진 실패 1건이 약 17.4초에 예상대로 통과했다. 최종 전달 결과는 아래 완료 기록에 남긴다.
- `tests/visual/baselines/production/`의 PNG 9,798,512 B와 작은 `review.json`, `run-summary.json`, `provenance.json`, `corpus-index.json`만 저장소에 둔다. 큰 입력·actual/diff/trace는 제외했다.
- corpus 로컬 압축본: `/workspace/artifacts/HELIX-STEP03-Production-Corpus-20261113.tar.gz`, 30,429,721 B, SHA-256 `1fc6c81ad6c4d627eb8ff6c1e9a1913b503ba4b4f6fe22119b5845ca0c768d56`. 원격 보관 완료: 최초 자동 승인 검토 거절 후 사용자 명시 승인으로 [Drive 압축본](https://drive.google.com/file/d/1ug3U3MkiS1ozuir4axB8ynAXS3X53tX0/view?usp=drivesdk)과 [체크섬 파일](https://drive.google.com/file/d/1sXl5g4kclfyeuP4TkCyD3yq7YZYY5rcd/view?usp=drivesdk) 업로드 성공. 파일ID·크기·소속 폴더·체크섬 파일 내용 readback 확인. 원격 본문 해시는 도구가 반환하지 않았으므로 다운로드 시 SHA 검증한다.
- 초기 CA·lazy image·모달 가시성·media range·IP 조회·CSS ref 선택·GSAP 시간 고정·완료 전 캡처 실험의 실패 근거는 선별 JSON/PNG 압축본 및 `/tmp/helix-step03/runs/` 원시 trace로 구분 보존한다. 캡처 성공과 비교 통과를 혼동하지 않았다.

### 4. 다음 단계

1. 같은 기준의 검사를 실행하려면 완료 기록의 corpus 압축본을 복원하고 `corpus.cjs verify` 후 `run.cjs test`를 실행한다. corpus가 없으면 검증 불가이며 새 라이브 화면을 자동 정답으로 사용하지 않는다.
2. 후속 구현은 최신 대상 main/staging에서 별도 브랜치를 만들고 **검증 도구·문서 변경만 이관**한다. 이 오래된 문서 브랜치 전체를 병합해 최신 구현을 덮지 않는다.
3. U01 overflow 한 건을 진행할 때 home+about 비교, 관련 경계, 실제 fixed/sticky geometry·빠른 스크롤을 추가한다. D01 expected failure를 후보의 정방향 검사로 전환한다. 현재 PNG 통과만으로 U01 완료를 판정하지 않는다.
4. 공개 staging 홈 고정 후보 `0011fc…`의 목적/담당 작업은 아직 미확인이다. 이를 해제하지 않는다. 실제 후보 자산이 공개 staging에 도달한 검사와 격리 대입 검사는 별개다.
5. D02 긴 문자열 실제 증상, D03 모션 경쟁, D06 iPad/iOS 회전, CTA legacy/전체 focus trap/모의 제출·전체 FAQ 흐름은 해당 후속 변경 시 보완한다. 이번 단계는 전 사이트 안정화나 성능 개선 완료가 아니다.

### 5. 참고 파일·복구점

- [기준선·실행·범위·보관 정책](04-baseline.md)
- [Playwright 설정](../../playwright.config.cjs), [실행기](../../scripts/visual/run.cjs), [검사](../../tests/visual/baseline.spec.cjs), [알려진 문제 계약](../../tests/visual/contracts.spec.cjs)
- [기준 PNG·index·버전 자료](../../tests/visual/baselines/production/)
- 원본 `work/c2041b4`, STEP 02 브랜치/`3161266`는 보존했다. 테스트 커밋만 revert하면 사이트 소스에 영향을 주지 않는다.

### STEP 03 초기 전달 확인 — 2026-11-13 KST (Drive 승인 전 기록)

- 검증 기준 커밋: `6f0123a78fbe87f4a7dd70b73473946953458e37`, 부모 `316126611db7c39d78914920ea60d4f2c0d80476`, tree `97c4f242a37235462586a1812275b7e1fe90db8c`.
- 원격 `test/helix-quality-step03-20261113` 생성 및 ref 일치 확인. 일반 Git HTTPS는 403, CLI 인증은 401이어서 연결 GitHub 도구로 전달했다. PNG blob 33개를 SHA로 대조하고 나머지 텍스트를 포함한 전체 tree가 로컬과 동일함을 확인했다.
- 초기 로컬 커밋 `0d13e551b34793a48a5c926016ddd7a7b3558396`과 위 전달 커밋은 **tree가 같고 커밋 메타데이터가 다르다**. 연결 도구가 만든 전달 커밋의 원본 객체를 다시 받아 SHA를 검증해 로컬에도 동일 SHA로 반영했다. 초기 커밋은 `recovery/helix-step03-local-0d13e55`에 보존했다. 원본 `work`, STEP02 이력은 유지했다.
- 최종 전체 재생과 복구 선택 실행의 결과는 위 현재 상태 및 `run-summary.json`을 따른다. 예약 버튼 임시 색상 변경은 거절됐고, 기준 PNG는 변경되지 않았다. 최종 기존 품질 검사 8개/추적 JS·CJS 94개 문법, JSON/링크/공백·범위 검사 통과. 사이트 소스·AGENTS·CLAUDE·기존 STEP01/02 설계·workflow 변경 없음.
- 선별 실행 근거: `/workspace/artifacts/HELIX-STEP03-Selected-Evidence-20261113.tar.gz`, **21,829,925 B**, SHA-256 `f137b65ae5ec5ca0788e667c6c7cd376fae2995681175263dd49a078386c631f`. 실패·성공 JSON/PNG/요약을 보관하고 중복 대형 원시 trace는 별도 로컬 보존했다.
- corpus와 선별 근거의 `.sha256` 파일도 같은 디렉터리에 있다. 로컬 파일의 장기 보존은 보장되지 않는다. 복원 절차는 `04-baseline.md` 6~7절. 새 환경에서는 먼저 corpus를 내려받아 복원·검증한다.
- **외부 Drive 작업 2건 미완료**: 약30MB corpus를 [전용 폴더](https://drive.google.com/drive/folders/1tKIoee51xS8Pbe5BDbGdhAwfXhsqtkzV)에 업로드하는 작업, [공통 인계서](https://docs.google.com/document/d/1babP7FWxd7zDF0hnyo3SV294iJ46k_b9yE5idGi0CoM/edit)에 내부 작업 상태·경로·해시를 기록하는 작업은 자동 승인 검토가 자료/목적지에 대한 구체적 승인 부족을 이유로 각각 거절했다. 두 작업 모두 우회·재시도하지 않았고 Drive 업로드·문서 갱신을 완료했다고 주장하지 않는다. 저장소 인계서 갱신·작업 브랜치 전달은 완료했다. 외부 보관/기록은 사용자 구체적 승인 후 재개한다.
- 이 마감 기록은 별도 문서 커밋으로 전달한다. 최종 전달 SHA는 작업 브랜치 HEAD로 확인한다. main/staging merge·Webflow Publish는 수행하지 않는다.

### STEP 03 사용자 승인 후 원격 보관·공통 기록 마감

- 사용자 “내가 승인할게 다시 시도해줘”에 따라 위에서 거절된 두 작업만 재시도했다. **corpus 업로드와 공통 Drive 인계서 갱신 모두 완료**했다. 앞의 미완료 표기는 승인 전 이력이다.
- [기준 응답 압축본](https://drive.google.com/file/d/1ug3U3MkiS1ozuir4axB8ynAXS3X53tX0/view?usp=drivesdk): 파일ID `1ug3U3MkiS1ozuir4axB8ynAXS3X53tX0`, 30,429,721 B, 전용 폴더 `1tKIoee51xS8Pbe5BDbGdhAwfXhsqtkzV` 확인. [체크섬 파일](https://drive.google.com/file/d/1sXl5g4kclfyeuP4TkCyD3yq7YZYY5rcd/view?usp=drivesdk) 113 B와 내용 SHA-256도 로컬 값과 일치했다. 메타데이터 도구는 원격 바이너리 해시를 반환하지 않아 크기/위치/체크섬 파일 검증과 원격 본문 재다운로드 검증을 구분한다.
- [공통 성능 인계서](https://docs.google.com/document/d/1babP7FWxd7zDF0hnyo3SV294iJ46k_b9yE5idGi0CoM/edit)에 STEP03 현재 요약·검증 대장·다음 단계와 날짜별 기록을 추가했다. revision guard로 편집 후 readback했으며 기존 모든 비어 있지 않은 문단이 원래 순서로 보존됨을 확인했다. 서초 기존 상태·보류 항목·이력은 유지했다.
- 로컬과 GitHub의 검증 도구·기준 화면은 동일하며 브라우저 검사 결과는 바뀌지 않았다. 초기 전달 커밋 `6f0123a…`, 승인 전 문서 마감 `c4bf8e89d36136bf9e0d6d6d86078f8e8f908f05`를 보존하고 이 승인 후 상태는 후속 문서/결과 메타데이터 커밋으로 fast-forward 전달한다. 최종 SHA는 작업 브랜치 HEAD로 확인한다.
- 사이트 구조·운영/staging·Webflow 변경 없음. 남은 것은 후속 U01 구현에 필요한 추가 sticky/경계/빠른 스크롤 검사와 명시한 실기기·모션·전체 소비자 범위이며, 이번 요청의 검증 기반 구축·기록·작업 브랜치 전달은 완료 상태다.

## STEP 02 인계 원문 — 이력 보존

아래는 `3161266`에서 받은 이전 기록이다. 다음 단계로 overflow 구현을 제안한 내용은 **당시 제안**이며 이번 사용자 요청은 검증 기반 구축까지만이다.

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

### 최종 전달 확인 기록 — 2026-11-13 (KST)

- 설계 커밋: `dd50834294de788ffbd7b77ec94071dea201279d` — `docs(quality): design HELIX architecture and development rules`, 부모 `7d3e61604c585fc41d4bb4f2aada763ddcdfa385`.
- GitHub API로 동일 commit SHA·tree `68f86ba192a4ac6a81fb8888f888995f887cfae6`를 전달하고 `docs/helix-quality-step02-20261113` 브랜치를 생성했다. 원격 HEAD와 변경 파일 세 개를 확인했다.
- 원격 브랜치에서 세 문서를 다시 읽어 로컬 전체 내용·blob SHA와 대조했다. 모두 일치했다. 진단서·AGENTS.md·구현·workflow에는 STEP 02 변경이 없다.
- 문서 링크·표 열 수·공백·요구사항/진단 ID·구현 단위 대응·변경 범위 검사가 통과했다. 코드·화면 검사 생략 이유는 현재 상태 표에 명시했다.
- 이 전달 확인 기록은 별도 문서 인계 커밋으로 남긴다. 최종 HEAD는 위 `git log` 또는 원격 브랜치에서 확인한다. 이 후속 커밋도 같은 API 경로로 force 없이 전달하고 재확인한다. 이력은 최초 진단→STEP 01 전달 갱신→STEP 02 설계→이 확인 기록 순서다.

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
