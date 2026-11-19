# HELIX — 실제 적용 검증 차단 요소 확인

2026-11-19 KST. 시작 `742fec2`, 제품 소스 `21acccb421aee305aed8941ee5a5da87407f94fa`. 작업 브랜치 `fix/helix-residual-structure-20261117`.

## 최종 판정: 1. 원복 계약의 실제 차단 확인

**원본 자산의 전달 가능성과 안전한 기능 원복은 다르다.** 원본 Git blob을 보존한 작은 CDN snapshot 세 개의 실제 응답 168건을 확보했다. 그러나 이 원본으로 구성한 About 1440 정상 경로에서 메뉴와 예약창의 배경 wheel이 각각 600px 움직였다. 오류를 주입하지 않은 실패다. 따라서 원복 패키지는 기능 검증을 통과하지 못했고 공개 적용 및 전체 독립 감사 승격은 차단한다.

이는 개선 후보에서 새로 발견한 회귀가 아니다. 원래 공개 코드에 남아 있던 잠금 문제가 정확한 원본 복원에도 돌아온다. 이번에는 새 제품 개선을 시작하지 않았다. 기존 D04 다섯 원인, D02/D05, Hero 및 다른 진행자의 코드는 그대로이며 제품 runtime은 `21acccb`와 동일하다. 새로 커밋한 코드는 격리 검사용 두 파일뿐이다. 기존 25단계와 80조건의 성공을 새 원복 경로의 성공으로 대신하지 않는다.

최종 대장: [판정·로컬 증거 SHA](evidence/application-blockers.json), [스테이징 12화면](evidence/staging-original12.json), [실제 URL·Git blob·SHA·소유자](evidence/source-restoration-assets.json).

## 1. 스테이징 비Home 원본 12화면

실제 게시 HTML을 다시 읽고 각 페이지의 실제 생산자/shared 선택과 고정 ref를 추적했다. 누락된 과거 응답을 최신 `@main`이나 후보 화면으로 채우지 않았다. CDN 용량 제한이 확인된 동일 실패 URL을 재요청하지 않았다. 그 대신 정확한 원본 Git blob과 Git SHA1/SHA256이 일치하는 body를 별도 로컬 입력에 연결했다. 해당 binding에는 `NOT AN HTTP200 OBSERVATION`, `actualCDNVerified:false`를 기록했다.

| 원본 페이지 | 390 | 820 | 1440 | 실제 과거 원본 CDN 도달성 |
|---|---|---|---|---|
| /discover-helix | Git 원본 비교 통과 | Git 원본 비교 통과 | Git 원본 비교 통과 | 보류 |
| /services | Git 원본 비교 통과 | Git 원본 비교 통과 | Git 원본 비교 통과 | 보류 |
| /faq | Git 원본 비교 통과 | Git 원본 비교 통과 | Git 원본 비교 통과 | 보류 |
| /internal-medicine | Git 원본 비교 통과 | Git 원본 비교 통과 | Git 원본 비교 통과 | 보류 |

`source12-v3`는 동결 QA `ae1d29b`에서 **한 번의 연속 실행으로 12/12**를 완료했다. 실제 게시 문구·타이포·높이·고정 CTA·링크·배치 계약과 예약창 PNG가 원본/후보에서 일치했다. 후보의 메뉴 및 폼 wheel 잠금/해제, Escape, 초점 복원, 개인정보 토글 및 입력 기능을 확인했다. 메뉴/폭 전환 이후 후보 예약창의 전체 하위 요소 계산 CSS·좌표도 보존됐다. 네트워크 전달 0, 미등록 응답 오류 0, page error 0이다. 전체 페이지와 열린 메뉴 화면은 캡처했지만 전체 페이지 PNG가 픽셀 단위로 동일하다고 주장하지 않는다.

별도 `modal-geometry12` 단위는 QA `f032512`에서 **원본/후보 예약창의 모든 하위 요소 절대 좌표·크기 12쌍**을 확인했다. About 390에서 실제 modal DOM을 1px 이동시키면 차이가 검출됐고, 주입한 단일 속성만 제거한 뒤 전체 좌표가 복구됐다. 이는 별도 검사이며 기존 25/80이나 `source12-v3`에 합산한 새 통합검사 결과가 아니다.

### 실패한 검사와 원인 보존

- v1: 짧은 Services 페이지에서 기존 메뉴의 배경 wheel이 이미 페이지 끝까지 이동했다. 닫은 뒤 wheel 이동 0을 잠금 미해제로 오인했다. 원본 진단에서 scrollTo(0) 후 정상 이동을 확인하고, 해제 검사 직전에 시작 위치를 맞췄다. 잠금 기대값이나 제품 코드는 바꾸지 않았다.
- v2: Services 390에서 예약창 열기 버튼과 submit 위치가 겹쳐 포인터가 submit hover를 만들었다. 배경색만 `#626e88`/`#7683a0`으로 달랐다. 포인터 이동·명시적 hover·이탈로 실제 CSS 상태 전환을 입증했다. v3는 포인터를 중립 좌표로 옮기고 실제 transition 완료와 두 RAF를 기다린 뒤 전체 계산 CSS·좌표를 그대로 비교한다. 속성 제외나 허용 오차 확대는 없다.
- 기존 부분 결과는 보존하고 최종 통과 수에 합산하지 않았다. 진단 중 새로 관측한 `@staging/global/cta-done.svg`, `cta-mascot.svg`는 각각 한 번 실제 HTTP200 body를 수집해 별도 입력에 기록했다. 이를 과거 immutable 응답으로 취급하지 않는다.

## 2. 실제 원본 소유자와 전달 snapshot

동일한 branch 이름만 보고 모든 페이지의 원본을 main으로 취급하지 않았다. Git 대조로 원본 immutable URL/body binding 208건이 일치함을 확인했고 mutable 8건은 별도 관측으로 남겼다. 이는 입력 증거 대조 수이지 새 기능 테스트 216건의 통과가 아니다.

| 실제 원본 소비 경로 | 생산자 | shared |
|---|---|---|
| 정식 Home/About/FAQ/내과 | main `3c4f78d4…` 계열 | `3c4f78d4…` |
| 정식 Services | `ba91d70d93f8a1b54ca499b0ca942c0710d025e7` | `3c4f78d4…` |
| staging Home | `ccb68a7c4523d83539afc5de20e309ff145547dd` 관측 Home 경로 | `a074f455…` |
| staging About/FAQ/내과 | `a074f455…` 계열 | `a074f455…` |
| staging Services | `ba91d70d…` | `a074f455…` |

core/word-wrap/내과 등 다른 고정 ref와 mutable 자산은 실제 선택 그대로 유지했다. 전체 URL/파일 SHA 및 역할은 자산 대장을 기준으로 한다.

| 새 전달 전용 ref | 원본과의 관계 | tree bytes | 실제 HTTP200/Git 일치 |
|---|---|---:|---:|
| `78e75c48a4c3a3806bdd24bf3fbffde8599ba5dc` | main `3c4f78d4…` 원본, root 영상 2개만 제외 | 15,422,844 | 74 |
| `60e50fe9938055bfb5da5261bbf7f588401aabb0` | main 바탕에 실제 CCB Home 관측 경로와 legacy/inspector를 보존한 Home 전용 원본 | 15,405,929 | 74 |
| `35b12071803646aef2ec93029afea062012711ce` | 실제 Services 생산자 `ba91d70d…` 원본, root 영상 2개만 제외 | 15,294,911 | 20 |

branch는 각각 `package/helix-rollback-main-20261119`, `package/helix-rollback-staging-home-20261119`, `package/helix-rollback-services-20261119`다. 원본 main/staging/work 파일은 삭제하지 않았다. 새 ref도 제품 수정본이나 배포본이 아니며 병합 금지다. 메뉴 CSS/JS의 원본 Git blob은 세 역할에서 같지만 진입 ref와 legacy mutable fallback까지 단일 버전이라는 뜻은 아니다. Services 생산자용 옛 global bootstrap을 현재 shared인 것처럼 대체하지 않는다.

`시퀀스 01_1.mp4`, `헬릭스 작품 (저용량).mp4`만 전달 tree에서 제외했다. 실제 10 HTML과 검증된 원본 runtime 텍스트 binding 총 214건에서 literal/encoded 참조가 없음을 재확인했다. 이 근거를 사이트의 알 수 없는 외부 소비자 전체로 확대하지 않는다. CSS url·동적 SVG·폰트·동영상 query 등 실제 관측 참조를 대조했고 새 snapshot의 필요한 경로는 실제 HTTP 응답과 Git blob을 맞췄다. 알 수 없는 모든 미래 동적 경로가 완결됐다고 주장하지 않는다.

기존 main 기반 후보 `669fa762b87c80a425621906543d86bbbf924f9a`와 staging Home 후보 `62ecac1b6a374ebdf339840093462f1ad5bcd32e` 및 해당 수집 입력은 변경하지 않았다.

## 3. 원복 기능 판정 — 도달성 통과, 기능 실패

`rollback-diagnostic`은 실제 새 CDN mirror body를 고정해 로컬 게시 HTML에서 실행했다. 원래 응답을 최신 응답으로 바꾸거나 제품 overlay를 추가하지 않았다. 정상 공통 자산의 About 1440에서 차단을 확인했으므로 전체 5페이지×3폭 원복 기능 인증과 나머지 고장 조합 확대는 보류했다.

| 조건 | 실제 관측 | 판정 |
|---|---|---|
| 정상, 오류 주입 없음 | 메뉴 1개/claim 1회, Escape·초점 복원 정상. 메뉴·폼 열린 상태의 wheel 각각 600px, 닫은 뒤 600px | 잠금 기능 원복 실패 |
| JS native 1회 실패 주입 | 2요청, 메뉴 1개/claim 1회, 배경 wheel 600px | 기능 복구 성공 아님 |
| JS native 2회 실패 주입 | 2요청 뒤 메뉴 0개/claim 0회 | 메뉴 복구 실패 |
| CSS native 1회 실패 주입 | 2요청, 메뉴 1개/claim 1회, 배경 wheel 600px | 기능 복구 성공 아님 |
| CSS native 2회 실패 주입 | 2요청, 메뉴 1개/claim 1회, 배경 wheel 600px | 기능 복구 성공 아님 |

JS/CSS 실패 행은 통제 주입이며 실제 운영에서 네트워크 장애를 관측했다는 뜻이 아니다. 기존 fallback의 `@main?...`은 기존 동결 입력의 query 정규화 응답이고 이번에 같은 query로 새 HTTP 응답을 받았다는 뜻도 아니다. 정상 wheel 실패는 인위적 주입이 아니다. 원본 코드의 body 클래스만으로는 documentElement 스크롤을 잠그지 못하는 기존 경로를 확인했으며 현재 제품에는 이미 관련 수정이 있다. 이를 되살리는 원복을 안전하다고 부르지 않는다.

결과 `diagnosticComplete:true`, `functionalRollbackQualified:false`, `pass:false`; 종료코드 2를 그대로 보존한다. HTTP200, 태그 존재, guard 점유나 실패 분류 성공을 기능 원복으로 승격하지 않았다. 임의 retry 확대·새 timeout·복구 계층을 추가하지 않았다.

## 4. 정확한 설정 변경과 원복안의 상태

현재 저장 코드 → 미적용 후보의 **5개 page head + site footer** 변경/정확한 역패치는 기존 [적용안](proposals/adoption-20261119/manifest.json)에 그대로 있다. 각 patch와 before/after SHA는 변경하지 않았다. site footer는 다섯 경로에만 후보 shared를 선택하며 다른 경로 선택은 보존한다. 공개 설정을 하나도 변경하지 않았다.

추가 [원본 mirror 전환안](proposals/source-mirror-20261119/manifest.json)은 **미적용 후보 after 블록 → 도달 가능한 원본 mirror 블록**의 여섯 patch와 양방향 정확 왕복 SHA를 제공한다. 출발점은 현재 저장 코드가 아니다. main mirror/shared, Services 별도 생산자 mirror, staging Home 전용 mirror의 역할을 나눴다. 이 안의 표제는 `UNQUALIFIED`, `MUST NOT APPLY OR PUBLISH`다. 정확한 문자열 역변환과 자산 도달성만 확보했으므로 운영 원복 실행안으로 사용하면 안 된다.

이 전환안의 staging 비Home 선택도 main mirror를 사용하므로 모든 `a074` 원본 byte를 재현하는 staging 원복안은 아니다. 정확한 staging 원본 12비교는 앞 절의 별도 Git 재현 입력으로 수행했다. 기계적 patch 왕복 일치를 모든 환경의 원본 복원 일치로 해석하지 않는다.

부분 적용은 지원하지 않는다. 향후 승인된 실행에서도 전체 여섯 블록과 생산자/shared의 정확한 SHA를 대조하기 전에는 Publish를 하면 안 된다. 서로 다른 패키지를 섞거나 과거 `7195463`을 최신 개선 전체로 취급하지 않는다. 이번에는 Webflow head/pin/설정, main/staging, Publish 및 운영 배포를 변경하지 않았다.

## 5. 후보 범위 검토에서 남은 Services 차이

현재 Services 생산자가 main이 아닌 `ba91d70d…`임을 확인했다. 그 생산자가 실제 소비하는 파일 중 main과 다른 것은 bootstrap, global CSS, CTA CSS, coming-soon CSS/JS, services CSS, dept-nav JS, SEO snippet 총 8개다. 기존 14개 제품 수정 파일 밖의 네 파일도 무시하지 않고 최종 대장에 기록했다.

현재 게시 콘텐츠의 자연스러운 최대 스크롤에서 3폭×원본/후보 6조건을 관측했다. 공통 위로 버튼은 원본 `display:none`, 후보 `display:block`이지만 두 쪽 모두 `opacity:0`, `visibility:hidden`이며 실제 노출 차이는 재현되지 않았다. 따라서 기존 다른 작업자의 services CSS를 과거 버전으로 되돌리지 않았다. 전체 비대상 계산 CSS가 동일하다고도 주장하지 않는다. 이 차이는 독립 검토의 적용 범위 확인 사항이며 새 공개 장애로 확대하지 않는다. 길이를 인위적으로 늘려 디자인 결함을 만들거나 추가 후보를 생성하지 않았다. 실제 소스 기준의 링크/구조와 요청 경로 확인을 모든 내비게이션·SEO 의미의 완전 동등성 검증으로 확대하지 않는다.

## 6. 사이트 변경자·미게시 변경 범위

18:52 KST 최종 읽기에서 main `3c4f78d4e75a06524b16a32e05e3185c48fbe800`, staging `a074f455a4adc3dd8515255f6d779dea0afeeb10`, 10개 공개 HTML 전체 SHA·pin, 저장 코드 6개 조회 결과, site 게시 메타데이터가 시작과 같았다. 작업 브랜치만 QA 커밋으로 진행했다.

site `lastUpdated`는 11월19일 16:07:52.465 KST이며 수정자나 전체 Designer diff는 확인되지 않았다. 42페이지를 전부 읽었고 최종 정식 게시 이후 timestamp가 바뀐 `/dentistry`, `/ophthalmology`는 둘 다 draft다. 전체 draft는 3개다. 나머지 non-draft/non-archived 39페이지는 향후 전체 Publish의 잠재 범위이며 **39개 모두 미게시 변경이라는 뜻이 아니다**. 대상 5페이지 metadata가 오래됐다는 사실도 공통 스타일·컴포넌트·CMS 변경이 없다는 증거는 아니다.

asset metadata 178/178건을 읽었고 최종 게시 이후 자산 갱신을 관측하지 않았다. CMS/release 조회는 현재 커넥터 schema가 요청 동작을 제공하지 않아 거절됐으며, 이를 서비스 권한 403이나 CMS 변경 없음으로 분류하지 않는다. 연결 브라우저의 이력 조회 도구도 없다. 사용자에게 변경자/대상에 대한 사실 확인만 요청했으며 현재까지 확인되지 않은 범위는 미확인으로 보존한다. 다른 진행자의 미게시 변경을 되돌리거나 덮어쓰지 않았다. 향후 Publish 전 권한 있는 검토자가 실제 Designer/CMS 변경과 게시 범위를 확인해야 한다.

## 7. 검증·보존·독립 감사 게이트

- 새 제품 변경 0. 기존 25단계/80조건 코드, 원래 PNG·mask·100px·threshold 0.2·expected failure 및 적용 patch 불변. 새 source12 연속 성공과 별도 geometry 성공을 합친 새 통합 성공을 만들지 않는다.
- 신규 검사 파일은 `scripts/visual/adoption-blockers.cjs`, `adoption-blocker-geometry.cjs`. 1px 실제 DOM 주입과 그 속성만의 복구를 확인했다. 이번에는 새 제품 원인이 없어 제품/복구 커밋을 만들지 않았다.
- 원본 v1/v2 실패, 포인터/스크롤 진단, source12-v3 전체 결과, geometry12, 원복 정상 실패 및 고장 주입 결과를 모두 보존한다. QA 입력 manifest/body hash와 로컬 증거 SHA를 남겼다. 기존 20개 동결 입력 manifest와 이전 clean clone도 보존했다.
- 새 raw는 `/workspace/artifacts/helix-adoption-blockers-20261119`의 **로컬 전용**이다. GitHub에는 파생 대장·SHA·설정 patch·검사 도구만 전달한다. 대량 body·HTML·PNG·로그는 업로드하지 않았다. 기존 Drive 두 아카이브도 중복 업로드하지 않았고 원격 다운로드 SHA는 여전히 미검증이다.
- 실제 Safari/iOS/iPad/회전, V0/U01, D03 다른 firstpaint 경계, D04 일반 실행 예외·다른 조합·미래 mutable 자산·무응답은 기존 보류/미해결 범위를 유지한다. 이번 결과로 해결했다고 처리하지 않는다.
- 파일/소유자/소비자 대장과 실패 분류는 별도 검토자가 검토할 수 있지만 외부 독립 감사는 아직 수행하지 않았다. 실제 적용 호환성 전체·운영 원복·안정화 전체 완료도 선언하지 않는다.

### 다음에 필요한 최소 작업

1. **원복 목표 계약 확정:** 이미 검증된 필수 잠금/복구 개선을 보존하는 원복 대상이 필요한지, 기존 결함을 포함한 원본 복원만 허용할지 명시해야 한다. 현재 요구된 기능 기준으로 원본 mirror는 부적격이다. 새 기능을 무작정 추가하지 말고 필요한 경우 이 경로만 별도 최소 패키지로 구성·검증한다. 이번 verification-only 작업에서는 수행하지 않았다.
2. **게시 범위 확인:** 수정자·미게시 Designer/CMS 변경을 확인할 수 있는 환경/담당 검토가 필요하다. 현 공개 상태를 보존한다.
3. 위 차단이 해소되면 최종 선택한 패키지의 정상/지원 실패/지연/복구와 5페이지×3폭·기존 25단계를 새 소스 기준 단일 연속 실행으로 확인하고, 구현 검증을 재인용하지 않는 별도 검토자에게 넘긴다. 이번에 통과한 입력을 새 패키지의 성공으로 대신하지 않는다.

추가 미세 CSS 정리나 전면 초기화 재작성은 다음 작업이 아니다. 이번 작업은 원본 비교와 실제 전달성의 공백을 줄였고, 안전한 원복이라는 남은 차단을 실제 기능으로 확인한 상태에서 종료한다.
