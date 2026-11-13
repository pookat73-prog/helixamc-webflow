# HELIX 홈페이지 안정화 — STEP 03 검증 기준선

작성일: 2026-11-13 (Asia/Seoul). 구조 리팩터링·사이트 코드 수정·배포 없이 검증 환경을 구축한다.

## 1. Git와 이전 단계 검증

- 시작: clean `work`, `c2041b471f52435c3f349b8f068488d358fc5af5`. 이 체크아웃에는 `docs/quality/`가 없었다.
- 원격 STEP 02: `docs/helix-quality-step02-20261113`, `316126611db7c39d78914920ea60d4f2c0d80476`. GitHub 읽기 API로 누락 commit/tree/blob을 받아 **각 Git 객체의 SHA를 검증**했다. STEP 01 `9e6d4d5…`→`7d3e616…`→STEP 02 `dd50834…`→`3161266…`을 원래 SHA로 복원했다.
- `3161266`에서 `test/helix-quality-step03-20261113`을 만들었다. `git merge-base --is-ancestor 7d3e616 HEAD`와 `…3161266 HEAD` 성공, 이전 문서 네 개의 실제 반영을 확인했다. [진단](01-diagnosis.md)·[설계](02-architecture.md)·[수칙](03-rules.md)·[인계](HANDOFF.md)를 읽었다.
- 이 브랜치는 **검증·문서 전달용**이다. 포함된 사이트 구현은 `c2041b4` 기반이며 최신 운영 코드가 아니다. 이번 브라우저 기준선은 이 로컬 구현을 실행한 결과가 아니라 아래 공개 운영 응답을 고정한 결과다. 이 브랜치를 배포본으로 사용하지 않는다. 후속 구현은 최신 대상 브랜치에 검증 도구·문서 커밋만 이관한다.
- 원격 재확인: main `68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d`, staging `11daa6d47a864d49dda835b7c208f726f275b629`. 운영·staging 병합이나 Webflow Publish는 하지 않는다.
- 복구점: 원본 `work/c2041b4`, 복원한 STEP 02 브랜치/`3161266`, 원격 main/staging. 테스트 변경은 독립 커밋으로 되돌린다. `reset --hard`, `clean`, force push는 사용하지 않는다.

## 2. 대상과 상태

자동 비교의 기본 대상은 **정식 공개본의 고정 응답을 재생하는 격리 시험본**이다. 주소는 원래 정식 도메인이지만 재생에서는 외부 요청을 전달하지 않는다. staging은 별도 target·별도 corpus·별도 이미지 경로를 사용한다. 이번 정식 캡처를 staging 통과로 사용하지 않는다.

| 페이지 | 보존할 캡처·선정 이유 |
| --- | --- |
| `/` 홈 | 첫 화면, 메뉴 열림, 예약창 열림, 하단 푸터. 첫 화면 준비·공통 fixed UI·스크롤·폼의 기준 |
| `/discover-helix` 소개 | 첫 화면, 1800px 스크롤 후 화면. 홈 overflow 변경 시 비교할 다른 문서와 subheader 주변 |
| `/services` 진료과목 | 첫 화면과 공통 CTA. 다른 bootstrap 소비자 |
| `/faq` FAQ | 첫 화면, 실제 `.faq-list` 영역까지 이동한 화면. 해결된 flow-root·공통 타이포의 대조 |
| `/internal-medicine` 내과 | 첫 화면, 실제 `.sj_step_list` 영역까지 이동한 화면. 줄바꿈 예외 소비자 |

공통 메뉴는 Escape 닫기·ARIA 상태를, 예약창은 Escape 닫기·ARIA/opacity/pointer-events·포커스 복원을 함께 검사한다. 전화는 href 존재만 확인한다. 실제 통화·예약 제출·외부 메시지는 수행하지 않는다. 다른 페이지의 모든 공통 UI 상태·모든 진료과·지도는 아직 범위 밖이다.

| 기준 | CSS viewport | 조건 |
| --- | --- | --- |
| PC | 1440×900 | Chromium, DPR 1 |
| 태블릿 | 820×1180 | Chromium, DPR 1, 크기 에뮬레이션 |
| 모바일 | 390×844 | Chromium, DPR 1, 크기 에뮬레이션 |

locale `ko-KR`, timezone `Asia/Seoul`, light scheme, reduced-motion `no-preference`, 새 context, service worker 차단. touch/iOS/Safari 실기기 결과가 아니다. viewport meta·실제 innerWidth·글꼴 목록·문서 overflow·CSS URL·실제 자산 ref는 실행별 JSON에 남긴다. 조건 b를 바꾸는 후속 작업에서는 b−1/b/b+1 프로젝트를 추가한다. 이 세 크기가 모든 breakpoint 검증을 대체하지 않는다.

## 3. 정상 보존과 알려진 문제의 구분

**PNG는 관찰·검토한 회귀 비교 자료이며 화면 전체의 사용자 디자인 승인이 아니다.** 현재 화면을 모두 정답으로 확정하지 않는다. 기존 보호 계약(지정 글꼴·사진·크롭·기기별 DOM·글로우·메뉴·폼·FAQ flow-root)은 유지한다. 사용자 전체 승인본/디자인 원본과의 픽셀 대조는 제공된 근거가 없어 미확인이다.

| 분류 | 상태와 사용 방법 |
| --- | --- |
| 기존 승인·보호 계약 | CLAUDE.md의 폰트·글로우·반응형/DOM 보호와 Drive 인계의 홈 최종 화면 보존. 이번 캡처는 해당 계약을 새로 변경하지 않는다 |
| 현재 관찰 기준 | 첫 화면·메뉴·예약창·푸터·지정 콘텐츠. 참조 PNG와 자산 해시를 함께 검토한다. 작은 차이라도 의도·원인을 확인한 뒤 갱신 |
| D01 확인된 충돌 | home sections CSS가 문서 clip을 hidden으로 덮음. 목표 clip을 별도 `test.fail` 계약으로 기록. 현재 hidden을 정상 assertion으로 강제하지 않음. sticky 장애 인과는 미확정 |
| D02 확인된 충돌 | 고정 word-wrap의 전역 important가 지역 anywhere를 덮음. 지역 예외를 가진 작은 DOM에서 목표 계약을 expected failure로 기록. 실제 긴 문자열 사용자 장애는 여전히 미확정 |
| D03/D06 가설·미검증 | 글로우 인계 경쟁, iPad meta/회전은 정적 PNG 통과로 정상 처리하지 않음 |
| D04 환경 차이 | staging 홈 고정 `0011fc…`와 정식·staging 생성 CSS 차이. 후보 목적은 미확인, 기존 고정을 변경하지 않음 |

D01/D02의 expected failure는 해결 완료나 정상 통과가 아니다. 원인 고립용 작은 DOM 재현이며, 실제 페이지 전체 장애 재현으로 확대하지 않는다. 해결 후보에서는 이 표시를 제거해 정방향 회귀 검사로 전환한다. expected failure 상태에서 예상과 달리 통과해도 suite가 실패하므로 조용히 사라지지 않는다.

## 4. 실행과 결정성

도구: 개발 전용 Playwright **1.57.0**, 제공된 `/usr/bin/chromium` **151.0.7922.173**, Linux. 앱 프레임워크나 Webflow 로더에는 추가하지 않는다. 설정은 [playwright.config.cjs](../../playwright.config.cjs), 실행기는 [run.cjs](../../scripts/visual/run.cjs)다.

Cloud 제공 패키지 사용:

```bash
export HELIX_PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright
export HELIX_CHROMIUM_PATH=/usr/bin/chromium
# Cloud Chromium이 프록시 CA를 신뢰하지 못할 때만, 제공된 해당 CA의 SPKI를 지정한다.
export HELIX_PROXY_SPKI="$(openssl x509 -in /usr/local/share/ca-certificates/environment-proxy-ca.crt -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | openssl base64 -A)"
node scripts/visual/run.cjs list
node scripts/visual/run.cjs test
```

일반 환경은 `npm install --prefix tests/visual --ignore-scripts --no-package-lock`로 정확히 지정한 Playwright를 설치한다. 시스템 Chromium 경로를 지정하고 원본과 같은 Chromium/OS를 사용한다. 이 환경에서는 설치 대신 사전 제공 패키지를 사용했다. 오프라인 npm 메타데이터 조회는 캐시 부재로 실패했다. 잠금 파일이나 신규 설치 성공을 주장하지 않는다.

- `capture`: 실제 허용된 URL 응답을 최대 동시 2개로 받아, 본문 SHA-256별 외부 corpus에 보관한다. 기존 corpus의 응답은 그대로 재사용한다. **새 공개본을 수집할 때는 기존 corpus와 PNG를 먼저 보존하고 별도 corpus 디렉터리에서 시작한다.** 이것은 기준 갱신 작업이다.
- `test`: corpus와 추적한 index를 대조한 뒤 재생만 한다. 없는 요청·깨진 본문 해시·필수 자산 HTTP 오류·모르는 외부 호스트·깨진 화면 내 이미지·미처리 JS 오류는 실패한다. 누락 corpus를 자동으로 라이브 캡처하거나 PNG를 자동 생성하지 않는다.
- `corpus.cjs pin`: 캡처·화면 검토 후 응답 index를 고정한다. `verify`는 실제 본문 전체 해시와 index를 대조한다. SHA와 네트워크 오류 검사를 통과한 화면만 비교 근거로 쓴다.
- HTML·생성 CSS·고정/가변 jsDelivr 진입점·Google/Adobe 글꼴 CSS/바이너리·동적 JSON·이미지를 함께 고정한다. 같은 Google Fonts URL이 다른 본문을 반환하는 과거 오탐을 페이지 코드 수정 없이 분리한다. 콘텐츠 갱신은 별도 기준 갱신으로 검토한다.
- 분석/광고·IP 조회·Typekit 수집·Firebase·지도·비GET 전송은 라우팅 단계에서 외부 전달 전에 차단한다. 매 시나리오에서 합성 collector 요청을 먼저 보내 실제 차단을 확인한다. `__helixNoMeasure` 표식만 믿지 않는다. 재생의 forwarded=0도 검사한다.
- 폰트 준비·현재 viewport 이미지 decode·세 번 연속 geometry 안정을 확인한다. 초기 hero/hold는 자연 실행시킨 후 정적 캡처한다. 화면 내 지점 카드의 GSAP 유한 트윈 종료를 기다리고, PC/태블릿 내과 프로세스는 실제 `data-hx-im-motion="complete"` 신호까지 기다린다. 연속 CSS 모션만 같은 위상에 멈추고, finite CSS transition은 캡처 시 종료한다. 동영상은 첫 프레임에 고정한다. 영상은 range 조각 대신 전체 본문을 보관한다.
- 픽셀 비교: 변경 전 설정 `threshold=0.2`, **maxDiffPixels=100**, CSS pixel/DPR 1. 전체 비율로 큰 결함을 허용하지 않는다. 실패를 통과시키려고 이 값을 늘리거나 광범위 mask를 추가하지 않았다.
- 초기 프레임·fade/hold/loop의 정확한 시간·지연/실패 복구·실방문 성능은 이 정적 모드의 통과 범위가 아니다. 관련 변경 때는 모션을 끄지 않는 별도 시나리오가 필요하다.

```bash
# 명시적인 새 기준 후보 수집 → 검토 → index 고정
node scripts/visual/run.cjs capture
node scripts/visual/corpus.cjs pin
node scripts/visual/run.cjs test

# 독립적인 대상 선택
node scripts/visual/run.cjs test --pages=home,about --project=pc

# 변경 영향 선택 + 해당 로컬 CSS/JS/JSON만 고정 응답에 대입
node scripts/visual/run.cjs test --changed-from=<구현-기준-SHA>
```

`capture`는 기존 참조 PNG를 바꾼다. 일반 검증은 반드시 `test`다. 캡처 성공만으로 완료하지 않고 고정 응답 재생 비교와 눈으로 보는 검토를 수행한다. `HELIX_VISUAL_TARGET=staging`은 별도 경로를 사용하지만 이번 정식 자료를 복사해 채우지 않는다.

## 5. 선택 검사와 전체 검사

| 변경 범위 | 최소 선택 / 확대 조건 |
| --- | --- |
| 문서만 | diff·링크 검사. 선택기에 문서만 들어오면 브라우저 0개로 명시 종료 |
| 홈 섹션 | home, 해당 이웃. overflow는 about 대조와 관련 경계도 명시 추가 |
| about/faq/services/internal-medicine | 해당 페이지의 3크기와 변경 상태. 필요한 경계는 별도 프로젝트 추가 |
| global, home/global 공통 UI, 로더, 검사 도구, 소비자 불명 | 현재 등록한 5페이지 전체. 5페이지 밖 소비자가 있으면 추가하기 전 해당 변경 검증 완료로 보지 않음 |

`--changed-from`은 비교 ref와 working tree 사이 diff를 사용한다. 후보 소스에만 적용할 파일을 명시하며 파일명·원래 ref·대입 본문 해시를 기록한다. 참조 PNG·기준 corpus는 바꾸지 않는다. 요청되지 않아 후보 파일이 한 번도 실행되지 않으면 전체 명령이 실패한다. 아직 등록하지 않은 페이지의 CSS/JS/JSON/HTML 변경도 검증 완료를 주장하지 않도록 중단한다. 새로운 FILES/새 URL·새 의존성이 생기면 기존 corpus에 없으므로 실패하며, 먼저 동등한 입력/목적을 확인한 새 fixture가 필요하다.

고정 word-wrap 자산처럼 여러 ref가 있으면 어떤 원래 ref를 대입했는지 감사한다. 이 격리 대입의 통과는 CDN 도달·실제 staging 적용의 증거가 아니다. 현재 검사 브랜치의 오래된 구현 전체를 overlay로 사용하지 않는다.

## 6. 실행 결과·증거

최종 전체 재생: **2026-11-13 17:34:45~17:37:54 KST, 약 189.1초**. 정상 시각/동작 시나리오 15개·PNG 33개 비교 통과, 알려진 D01/D02 expected failure 6개 예상대로 재현. 예상 밖 실패 0, flaky 0, skipped 0. 재생 외부 전달 0, 후보 overlay 0, 네트워크 오류/미처리 JS 오류/글꼴 오류/화면 내 깨진 이미지 0. 15개의 상태 JSON을 남겼다.

선택 검사 `home/pc`도 통과했다. 임시 후보에서 예약 버튼 배경만 magenta로 바꾼 양성 대조는 **4,798 픽셀 차이로 종료 코드 1**을 냈다. 임시 후보를 빼고 같은 선택 검사를 재실행해 정상 1건과 알려진 실패 1건이 약 17.4초에 예상대로 통과했다. 기준 PNG 33개의 해시가 양성 대조 전후 동일함을 확인했다. 후보 대입·픽셀 비교가 실제로 동작하며, `test`가 차이를 자동 승인하지 않는 근거다.

소스 검사: 기존 로컬 품질 계약 8개(추적 JS/CJS 94개 포함), 새 CJS/설정 문법, JSON 파싱, 문서 상대 링크, diff 공백·변경 범위 검사 통과. 이 로컬 계약 검사를 최신 운영 JS 전체의 새 검증으로 확대하지 않는다.

기준 PNG는 **9,798,512 B**(약 9.35 MiB), 15 MiB 예산 안이다. [run-summary.json](../../tests/visual/baselines/production/run-summary.json), [review.json](../../tests/visual/baselines/production/review.json), [provenance.json](../../tests/visual/baselines/production/provenance.json), [corpus-index.json](../../tests/visual/baselines/production/corpus-index.json)에 결과·검토·실제 입력 버전·286개 응답 해시를 분리했다.

고정 corpus: `/workspace/artifacts/HELIX-STEP03-Production-Corpus-20261113.tar.gz`, **30,429,721 B**, SHA-256 `1fc6c81ad6c4d627eb8ff6c1e9a1913b503ba4b4f6fe22119b5845ca0c768d56`. 저장소 루트에서 `tar -xzf <압축본>`으로 복원한 뒤 `node scripts/visual/corpus.cjs verify`를 실행한다. 같은 이름의 `.sha256`도 보존한다. Drive 업로드는 자동 승인 검토 거절로 미완료다.

커밋·원격 전달 식별자는 [HANDOFF.md](HANDOFF.md)의 완료 기록과 작업 브랜치 HEAD로 확인한다. 초기 실행 실패(Cloud CA, 화면 밖 lazy image 대기, opacity 기반 모달 가시성 오판, 영상 range, IP 조회 분류, 여러 실제 CSS ref를 하나로 가정한 fixture 조회, 시간 고정이 GSAP를 멈춘 실험, 홈 카드/내과 프로세스 완료 전 캡처)는 별도 로그로 보존한다. 시간 고정은 제거했으며 애니메이션 완료 신호를 관찰한다. 이를 사이트 회귀나 성공 표본으로 바꾸어 보고하지 않는다.

## 7. 보관·복원 정책

- 저장소에는 검토한 기준 PNG, 작은 corpus index·검토/결과 요약, 테스트·설정·문서만 둔다. 기준 PNG 전체 예산은 15 MiB다. 초과하면 범위를 재검토하고 외부 보관한다.
- `.visual-corpus/`, `.visual-results/`, traces/actual/diff·보고서는 `.gitignore`로 제외한다. 대용량 글꼴·사진·영상·매 실행 결과를 커밋하지 않는다.
- 최종 corpus와 선별한 실패 근거(JSON/PNG)는 저장소 밖 `/workspace/artifacts/` 압축본에 SHA-256과 함께 보관한다. 같은 기준의 재검사에 필요한 corpus를 먼저 복원하고 `verify`한다. corpus가 없으면 검증 불가로 실패하며 새 공개본을 옛 기준처럼 사용하지 않는다.
- 기준 corpus는 그 기준이 사용되는 동안, 직전 기준과 실패 원자료는 최소 30일 보관하는 정책이다. Cloud 로컬 파일의 실제 30일 보존은 보장되지 않는다. 환경 종료 전 인계의 압축본을 내려받거나 승인된 팀 영구 아티팩트 저장소로 옮겨야 한다. 원시 trace는 `/tmp/helix-step03/runs/`에 따로 남기며 모두 압축본/저장소에 중복 보관하지 않는다. 자동 CI 연결은 이번에 구성하지 않았다. 전용 Drive 폴더로 30,429,721 B corpus를 업로드하려 했으나 자동 승인 검토가 자료/목적지에 대한 구체적 승인 부족을 이유로 거절했다. 우회하거나 재시도하지 않았고 로컬 압축본을 보존했다. 공통 Drive 인계서에 내부 작업 상태·경로·해시를 적는 작업도 같은 이유로 자동 승인 검토에서 거절되어 문서는 변경하지 않았다. 두 외부 작업은 구체적 승인이 있어야 재개한다.
- CI에 연결할 때도 동일 Playwright·Chromium/OS·검증된 corpus를 복원한 후 `node scripts/visual/run.cjs test`를 실행한다. corpus 없이 라이브 캡처로 CI를 통과시키지 않는다.

## 8. 다음 단계 준비와 한계

U00의 지정 5페이지 정적 비교 환경을 제공한다. U01 overflow의 첫 후보는 후속 요청에서 최신 구현 브랜치에 최소 변경으로 작성한다. 홈·소개 비교와 D01 expected failure의 정방향 전환, 가로 overflow·fixed/sticky geometry·빠른 스크롤·관련 경계 검사를 보완해야 한다. D01/D02 자체는 아직 해결하지 않았다.

미검증: 공개 staging 후보 목적/전체 화면·실제 후보 도달, Safari/iOS/iPad·회전·touch·모든 경계, 모든 진료과·서초/일산·지도·FAQ 모든 필터/페이지/펼침, CTA legacy variant/전체 키보드 trap/실제 제출, 초기 로딩/실패/모션 타이밍, 실방문 CWV, 디자인 전체 승인. 정적 5페이지 통과를 전 사이트 정상화나 성능 개선으로 표현하지 않는다.
