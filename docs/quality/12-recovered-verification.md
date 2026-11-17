# HELIX 구조 안정화 — 환경 복구 및 잔여 검증 결과

2026-11-17 (Asia/Seoul). 작업 브랜치 `fix/helix-residual-structure-20261117`. **기존 환경과 미커밋 후보를 복구했고 D02를 완료했다. 추가 두 단위의 소스 개선과 격리 검증도 완료했으며, 전체 구조 안정화는 미완료다.**

최종 동결 소스와 검사 SHA는 `b2277bfad32db10ded5cb5372759b906b1ac1d98`이다. 이후 최종 인계 커밋은 문서·증거만 추가한다. [최종 대장](evidence/remaining-final.json)이 실행별 입력·소스·원시 증거304파일의 SHA와 결과를 보존한다. 분할 실행 성공을 합산하지 않았다.

## 실제 변경 단위

| 단위 | 제품 커밋 | 제거한 간섭 | 보존 범위 |
|---|---|---|---|
| D02 consent | db1c034 | 전역 keep-all/normal 정책이 consent의 긴 토큰과 자손을 강제하는 간섭을 consent body 한 root에서 제한 | 전역 정책, checkbox, 다른 폼, 기존 intro/내과 예외, 게시 문구·배치 |
| D03/D07 hook | a9626dd | Hero viewport 인접성 guard가 독립 section heading hook까지 막는 의존성을 제거 | viewport 속성/guard, Hero 이벤트, 폰트·glow·SVG 알고리즘, 정상 픽셀/배치 |
| D04 native JS | b2277bf | 소비자가 나중에 실행되면 실패 이력을 놓치는 시간 의존성을 생산자의 정확한 태그/URL 기록으로 제한 | 다른 loader 태그, pending/success, 기존 fallback과 retry 상한, 다른 module 정책 |

D05 b890736의 폼 border-color 단일 소유권과 이전 완료 단위는 재작성하지 않았다. b0fa548 이후 제품 diff는 네 파일, +28/-7줄이다. 다른 runtime Git blob과 CTA 외부 정렬 마지막858바이트는 보존했다.

## 회수와 입력

로컬 HEAD69d1c24/미커밋7줄 후보를 그대로 확인하고 docs-only54da5f8을 fast-forward했다. reset/clean/restore, 파일 통째 대체, 후보 재적용은 하지 않았다. 네 SHA256이 일치하고 기존 consent-full의 완전한15쌍, 모달 PNG/게시 JSON30세트, audit30개 및 원본 입력 manifest8개·body2130파일을 검증해 재사용했다. 부분 통과 합산은 없었다. 원본 실패와 실패한 검사 전제의 증거도 보존했다.

JS 성공 fallback의 역사적 branch 응답은 없다. 해당 경로는 보관된 동일 immutable body를 별도의 합성 URL alias로 제공했고 원시 응답과 구분했다. 최신 다운로드로 원본 입력을 채우지 않았다. 원시 body/PNG/전체로그는 로컬 전용이며 GitHub에는 소스·검사·판정·해시·복구 커밋을 보존한다.

## 최종 검증

별도 clone `/workspace/helix-recovered-final-20261117`에서 동결 소스/검사의 **단일 연속15단계가 모두 exit0**으로 끝났다. 같은 실행에서 기존10단계를 유지하고 새 단위를 추가했다.

| 검증 | 실제 범위와 결과 |
|---|---|
| 기준 보존 | 원본 PNG33개 / response286개 해시 통과. 100px·threshold0.2·mask·expected failure 변경 없음 |
| 비대상 화면 | 5페이지×3크기15쌍의 닫힌 화면 배치·문구·타이포·스크롤 정책·UI 개수 동일 |
| 기능·모션 | 홈 cold3크기, 1440 시작11전환의 카드/메뉴·폼 실제 휠 잠금/복구·겹친 잠금·초점 복원, 제목 lifecycle6실행 통과 |
| CTA 소유권 | 간격·테두리 각각108쌍 계산CSS/geometry/PNG exact와36조건 통제 수정 통과 |
| D02 | 기존 intro 홈3쌍/72조건과 consent 게시 화면15쌍/모달 PNG exact 통과. consent 합성72조건은 홈3폭의 body/실제label×한글·영문·URL·숫자×직접/span/a이며 원본 overflow→후보 contain. 개인정보 상세 토글·늦은 전역 정책·9경계 보존 |
| Hero/지그 | 정상/숨은 인접요소×3폭×원본/후보12실행. 원본hook0/line0→후보hook3/line1, 정상 픽셀/geometry/type exact, hero event·heading fade/loop·hot3전환 보존 |
| 기존 CSS 로더 | 실제 FAQ의 성공 fallback 소유권4조건과 동일 URL 재사용4조건 보존 |
| JS 로더 | 두 생산자×두 폭×네 경로×원본/후보32조건. 정상1요청/성공 fallback2요청 유지, native 두 오류 뒤 후보3요청/메뉴1, 영구 오류는4요청 상한. **영구 실패는 메뉴 복구 성공이 아니다.** |
| 혼합 자산 | 생산자만/공통 로더만 신버전인4조건은 여전히 메뉴 없음. 검사 exit0은 미해결 경계를 확인했다는 뜻이며 기능 통과로 세지 않는다 |
| 마감 검사 | 품질9그룹과 홈 로딩6그룹 통과. 재생 unexpected JS/네트워크 오류 및 외부 전달0 |

추가로 **같은 동결 소스의 별도15조건**에서 실제 동의 label 포인터 클릭·checkbox Space 키·상세 버튼 독립 동작·늦은 전역 정책 뒤 토글을 확인했다. 이는15단계에 합산한 결과가 아니다. [재현 검사 원문](evidence/remaining-consent-native-check.cjs.txt)과 SHA는 대장에 기록했다.

별도 negative clone에 compact gap4→5px 오류 한 줄을 주입했을 때320px의 전체 계산CSS/배치 비교가 exit1로 검출했다. 자기 한 줄만 역수정한 뒤 clean 및 네 runtime SHA 일치를 확인했다. GitHub의 실제 복구 커밋 diff도 각각 이 동결 clone에 적용/역적용해 해당 파일만 변하고 다른 개선이 남는지 확인했다. reset/clean/restore나 전체 snapshot 교체는 사용하지 않았다. 별도 clone의 자동 재검증이며 독립된 사람의 감사는 아니다.

| 단위 | 별도 복구 커밋 |
|---|---|
| 보존한 D05 | [83a1f46](https://github.com/pookat73-prog/helixamc-webflow/commit/83a1f464eeeeb65fef6da9220d65a0c4caae9f23) |
| D02 | [a799b62](https://github.com/pookat73-prog/helixamc-webflow/commit/a799b62ace158eb616b75d77f8defefcf57eaffd) |
| D03/D07 | [f3a9f72](https://github.com/pookat73-prog/helixamc-webflow/commit/f3a9f72b14c7dfdbe9ca4cb118079ea66b697280) |
| D04 | [16d85dc](https://github.com/pookat73-prog/helixamc-webflow/commit/16d85dc2b29a7ff2907b496330097e2374d6c3b5) |

복구는 **그 커밋의 diff만** 새 격리 작업본에 적용한다. 과거 recovery 브랜치 전체 snapshot을 최신 소스로 대체하지 않는다. 작업/main/staging에는 복구를 적용하지 않았다.

main `3c4f78d4` / staging `a074f455`는 시작·마감 API 재조회에서 같았다. merge base 기준의 비교 대신 두 tip의 전체 blob을 직접 비교해 실행 자산 동일, 문서/검사3파일 차이만 확인했다. 새로 읽은 정식·스테이징10HTML은 중단 전 SHA와 같고 생성CSS46f7fbd5d/홈 고정pin ccb68a7c도 보존됐다. 이는 후보의 공개 도달을 의미하지 않는다.

## 동일 실행 재현

동결 SHA의 새 격리 작업본에서 실행한다. 원본 `.visual-corpus/production`과 대장에 기록된8개 입력 root의 manifest/body를 먼저 복원·해시 확인한다. 원시 입력이 없으면 멈추며 최신 응답으로 채우지 않는다. Playwright1.57.0 / Chromium151.0.7922.173 / Debian13 x64 검사를 유지한다. 출력 경로는 새 경로를 사용한다.

```bash
export HELIX_PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright
export HELIX_INTERACTION_INPUT=/workspace/artifacts/helix-residual-20261117/inputs/home
export HELIX_STRUCTURE_PAGE_INPUTS=/workspace/artifacts/helix-residual-20261117/inputs
export HELIX_INTERACTION_EXTRAS=/workspace/artifacts/helix-residual-20261117/resource-extra,/workspace/artifacts/helix-residual-20261117/order-fonts-v2
export HELIX_INTEGRATION_OUTPUT=/workspace/artifacts/helix-recovered-replay-001
test ! -e "$HELIX_INTEGRATION_OUTPUT" && node scripts/visual/next-integration.cjs
```

## 검증 한계와 다음 실행 단위

| 우선순위/위험 | 남은 단위 | 다음 최소 실행과 선행 조건 | 통과 기준/중단 기준 | 작업량 |
|---|---|---|---|---|
| 1 / 높음 | D04 혼합 자산·실제 도달 | 생산자/소비자 한쪽만 새 버전인4조건의 메뉴 부재를 출발점으로, 두 자산 채택 경로와 정확한 URL 상태를 한 단위로 검증한다. 공개 pin 교체는 이번 범위 밖으로 보존한다. | 정상/성공 fallback 무추가요청, 실패 뒤 메뉴1개, 중복 init0, 두 자산 실제 도달 증거. 배포되지 않은 후보를 운영 개선으로 승격하지 않는다. | 중 |
| 2 / 높음 | D04 오류 없는 무응답 | 실제 JS 응답 보류10초의 interactive/shared 미진입/menu0와 원본 응답 해제 뒤 복구를 활용해 page-owner의 pending 수명과 load gating만 조사한다. | native pending을 실패로 오판하지 않고 지연 성공/영구 오류/정상 순서 보존. 근거 없는 timeout 또는 중복 초기화 위험이 남으면 제품 보류. | 중~대 |
| 3 / 높음 | D03/D07 다른 초기화·first paint | 인접성 hook 단위와 분리해 class writer, actual first exposure, 폰트/측정 순서를 한 경로씩 통제한다. | 원본 실패→후보 통과, 정상 배치/타이포/hero event/glow 지연 및 cold·hot 경계 유지. 재현 없는 범용 초기화 재작성 금지. | 중 |
| 4 / 중 | D02 다른 root / D05 다른 속성 | 게시 문자열/실제 DOM 소비자와 합성 stress를 분리한다. 살아 있는 root 하나 또는 후행 선언이 편집을 가리는 속성 하나만 선택한다. | D02 5페이지×3크기, 원본 overflow→후보 containment와 비대상 exact. D05108쌍/36통제 편집. 실제 소비자 없으면 수정하지 않는다. | 소~중 |
| 조건부 / 높음 | D06 Safari/iOS/iPad 회전 | 실제 WebKit 실행파일 또는 실기기 확보 후 확인한다. 현재 webkit2227 실행파일 없음. | 실기기/실제 엔진의 cold·portrait→landscape→portrait와 fixed/sticky/메뉴·폼/스크롤·카드 노출 검증. Chromium 폭 변경으로 대신하지 않는다. | 환경 확보 후 중 |
| 보류 | V0/U01 | 새로운 원인 판별 근거가 생길 때만 제한 조사 재개. 기존 승격 조건 충족 전 U01 미적용. | 원본 PNG·mask·허용 오차·expected failure를 유지한다. | 조건부 |

D04 완료 범위는 services 메뉴 JS의 native resource error다. FAQ 등 다른 생산자와 HTTP200 뒤 실행 예외/부분 초기화 실패는 별도 미검증 단위로 남는다.

성공 수준은 테스트된 root/속성/초기화 경계에서 영향이 좁아진 격리 후보다. 전체 구조 안정화, 모든 로더 복구, 실제 기기 정상, 공개 사이트 개선 완료를 의미하지 않는다. main/staging 병합, 공개 설정/pin 변경, Webflow Publish, 운영 배포는 하지 않았다.
