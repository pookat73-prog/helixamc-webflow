# HELIX — 기능 보존형 원복 후보

2026-11-20 KST. 시작 `857356c`, 보호 제품 `21acccb`. 이 문서의 현재 상태는 **구현·예비 재현 완료 / 동결 연속 검사 진행 중**이다. 운영 원복 가능·공개 적용·감사 완료로 승격하지 않는다.

## 원인과 선택

메뉴는 body 클래스만 잠그던 원본에 `html` 상태 생산과 CSS 잠금을 함께 적용했다. 예약창은 기존 `#hxFctaModal.is-open`의 실제 상태를 CSS `:has()`로 참조해 문서 주체를 잠근다. 새 공통 상태나 timer를 만들지 않았다. 두 창은 각자 상태를 소유하며 하나를 닫아도 다른 상태가 남으면 문서 잠금이 유지된다. 기존 검증 소스를 그대로 재사용했다.

로더는 실패한 태그의 소유권을 철회하고 native 결과를 소비자에게 인계한다. 메뉴 CSS/JS의 producer retry와 shared 공급이 같은 immutable ref를 유지하며, 기존 1회 실패2요청·2회 실패3요청 계약을 보존한다. pending 결과는 실제 load/error가 결정하고 태그·빈 sheet·초기화 claim만으로 완료 처리하지 않는다. 기존 원인별 D04 제품을 재사용했고 새 범용 retry·timeout·observer를 추가하지 않았다.

원본 mirror 세 개는 보존했다. 복구 후보와 현재 작업 후보는 별도 ref/목적으로 관리한다. [파일·실제 URL·SHA·선별 근거](evidence/functional-rollback-package.json)가 대장이다.

| 역할 | 기능 보존형 복구 ref | 선별 범위 |
|---|---|---|
| 정식 기본 / staging 비Home의 기본 경로 | `61c465152f26c5820ef30e7c8b166ba37829008a` | 원본 main mirror + 검증된14파일 |
| staging Home 전용 | `76f9a10c59ecb696dd349fd1f9344939ddafab4a` | 관측 Home 원본 + 필요한 검증 파일, 전용 loader/CSS 보존 |
| Services의 producer 및 scoped shared | `91140bf351dc6afbdfb57bb99e5c17c6bd794c09` | 실제 ba91 원본 mirror + 필요한6파일 |

main과 staging Home의 최종 runtime tree는 각각 기존 `669fa762…`와 `62ecac1b…`와 같다. 검증된 정상 상태를 고정하는 복구 대상이며 별도 대체 구현이 아니다. 이들과 공유하는 코드 자체의 결함까지 해결하는 원복이라고 주장하지 않는다. Services는 기존 Services 고유 CSS·dept-nav·SEO·coming-soon 자산을 보존했다. 이 경로의 모든 내비게이션/SEO 의미를 main 후보와 동등하다고 새로 인증하지 않는다.

선별 작업을 메뉴 잠금·예약창 잠금·메뉴 소유권 프로토콜·D02/D05 보존·Hero/반응형 보존 커밋으로 나눴다. 보호 작업 브랜치의 제품은 바꾸지 않았다. staging Home에 정식 파일을 그대로 복사한 초기 `216fd92` 구성은 loader 순서/CSS 범위 대조에서 제외했고, 기존 검증된 staging 두 파일을 보존한 최종 ref만 사용한다. 초기 구성의 CDN 성공을 최종 기능 검증으로 합산하지 않는다.

## 현재 확보한 증거

새 연속 실행의 [기존25단계 체크포인트](evidence/functional-rollback-checkpoint.json)가 통과했다. 동일 부모PID가 실제 recovery snapshot의 정식·staging 검증으로 이어졌으며 전체 실행은 아직 진행 중이다. 과거 결과를 재인용한 통과가 아니다.

- 최종 세 ref의 실제 HTTP200/Git blob 일치 응답175건 확보. 과거 원본의 실패 URL을 재요청하거나 최신 응답으로 대체하지 않았다.
- About3폭 예비 검사: 메뉴·예약창 각각 실제 wheel 잠금, nonzero scrollY의 정확한 복원, Escape/초점·잠금 해제 통과. About1440에서는 두 상태의 해제 순서 두 가지도 확인했다.
- Services3폭 예비 비교: 기존 원본의 문구·타이포·배치 계약, 예약창 PNG와 후보 기능 통과.
- 실제 패키지 Hero 예비 검사: 정식1440 정상/40회 소진 뒤 GSAP 복구, staging390 정상/firstpaint 공개 뒤 GSAP 복구의 실제 ready/done·ghost·hold/loop 통과.
- 메뉴 잠금·예약창 잠금·About producer/shared 소유권 역패치의 실제 실패를 검출했고, 해당 주입만 제거한 새 동일 자산 문맥에서 잠금과3요청 복구가 돌아왔다.

모두 예비 검사이며 최종 연속 성공에 합산하지 않는다. 새 QA `a75d818`의 별도 clean clone `/workspace/helix-functional-verification-20261120`에서 `functional-rollback-integration.cjs`를 한 번 연속 실행 중이다. 기존25단계 → 실제 producer/shared30화면·고장/지연 → 엄격 요청/ref 영수증 → 두 환경30 scroll-lock → 원본12 geometry/1px → 실제 두 Home36 Hero조건 → 개별 역주입/복구 순서다. 검사 실패 시 중단하고 원인·입력부터 재진단한다.

## 적용 및 보존 경계

세 ref는 하나의 지원 cohort이며 부분 적용은 지원하지 않는다. [여섯 설정 블록의 정확한 변경/역변경 자료](proposals/functional-rollback-20261120/manifest.json)를 준비했고 모두 정·역변환 SHA가 일치했다. 출발점은 미적용 현재 후보의 after 코드이며 지금 저장된 원본 코드가 아니다. 이번에는 적용하지 않는다. 원본 mirror의 기계적 역패치와 기능 보존형 복구 후보를 혼동하지 않는다. Webflow 저장은 원자적 트랜잭션이 아니므로 향후 승인된 작업에서도 여섯 결과 SHA와 생산자/shared 조합을 확인하기 전 Publish를 보류해야 한다.

정상 runtime에서 관측된 자산 URL300건을 새로 읽어 모두 HTTP200을 확인했다.298건은 동결 body SHA와 같고 두GitHub ref 응답만 compact/pretty JSON 표현이 달랐다. 파싱한 객체 전체가 같고 main/staging SHA도 그대로임을 확인했다. 동결 입력을 최신 응답으로 교체하지 않았다. 이 관측에는 코드·CSS·폰트·영상·SVG 등 간접 자산이 포함되며 실제 최종 연속 실행의 요청 목록과 대조는 완료 후 판정한다.175 snapshot 응답과300 URL은 겹치므로475개 고유 자산으로 합산하지 않는다.

별도 진단 브랜치의 원인별 inverse/정확한 tree 복구 커밋도 보존했다. 이 inverse들은 적용 대상이 아니다.

| 진단 원인 | inverse | 전체 복구 tree로 복원 |
|---|---|---|
| 메뉴 잠금 | `02642863ae83a10b09efa94a14267f658861f99e` | `143ebe6dcde025624d3cd58e489266fe664845c6` |
| 예약창 잠금 | `26cc50f9b649e1b0776357f5a86322b65f375bc7` | `f39d1219c3ea4373555fd01c136288497a7da2b7` |
| loader 소유권 cohort | `39e075a6b6993ebfed42f361643033b8e5593957` | `9f938b26afdd6474cb458857445bc44566d22077` |

복원 커밋의 tree는 모두 `9cefb4d47bf9517f01cba11569a2f7c328f89dab`와 같다. 메뉴/폼 inverse는 다른 검증된 hunk를 보존하고, loader inverse는 해당7파일의 프로토콜을 되돌리되 D02/D05와 Hero를 보존한다. 실제 runtime의 About 진단은 그 페이지가 요청하는 producer/shared의 실패 인계를 검사한다.

새 raw는 `/workspace/artifacts/helix-functional-rollback-20261120` 로컬 전용이다. 본문·PNG·로그를 외부 업로드하지 않는다. 기존 두Drive 아카이브도 중복 업로드하지 않고 원격 다운로드 SHA 미검증을 유지한다. 새 제품·검사 결과가 이전 성공으로 대체되지 않도록 입력·소스 SHA를 고정했다. 기존 PNG/mask/100px/threshold0.2/expected failure는 바꾸지 않았다.

main/staging·작업 제품 소스·공개 head/pin/설정·Publish·운영 배포는 변경하지 않는다. V0/U01, 실 Safari/iOS/iPad, 임의 HTTP200 실행 예외·영구 무응답 등 기존 미해결 경계도 이번 지원 계약으로 승격하지 않는다. 최종 공개 적용은 미게시 Designer/CMS 변경 범위 확인과 별도 승인이 필요하다.
