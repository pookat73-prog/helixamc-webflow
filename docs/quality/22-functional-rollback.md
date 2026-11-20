# HELIX — 기능 보존형 원복 후보

2026-11-20 KST. 시작 `857356c`, 보호 제품 `21acccb`. **기능 보존형 복구 후보의 지정 계약을 새 동결 소스의 단일 연속v3에서 통과했다.** QA `b6685f0` / 보호 제품 `21acccb`이며 clean clone에서 기존25부터 추가9개 단위까지 끝까지 실행했다. v1·v2·예비 성공은 합산하지 않았다. 실제 운영 원복·공개 반영·외부 독립 감사 완료와는 다르다.

## 최종 검사 판정

- 기존25단계 모두 통과. 보호 작업 제품의 변경0이며 기존 D02/D05·Hero·다른 작업자 코드를 보존했다.
- 실제 자산 본문을 이용한 정식39/staging41조건: 정상30화면 계약, 기능 복구46조건, 영구불가 분류4조건.80조건 전체를 복구 성공으로 세지 않는다.
- JS/CSS native1회 실패20조건은2요청,2회 실패20조건은3요청. pending4조건1요청, 늦은API2조건3요청, 영구실패4조건4요청. 선택 immutable ref와 상한 유지.
- 두환경30화면의 메뉴/예약창 각각 실제 wheel 잠금, nonzero scrollY 정확 복원, Escape/초점, 닫은 뒤 wheel 해제 통과. About1440 두 owner의 해제 순서 두 가지도 통과.
- staging 비Home 원본12는 정확 Git 로컬 재현의 게시 문구·타이포·배치·예약창 PNG 및 하위 geometry 계약 통과. 과거 원본 CDN 도달성과 전체 페이지 픽셀 동일성을 주장하지 않는다.1px 오류 검출과 자기 속성 복구 통과.
- 실제 두 Home36조건 중30은 ready/done·ghost·fade·1.5초hold/loop 완료. GSAP 영구실패6조건은 미완료로 유지했다. 기존25의26쌍과 합산한 새 사례 수를 만들지 않는다.
- 메뉴/폼/로더 세 원인의 자기 inverse 실패 검출과 해당 변경만 복원한 기능 회복 통과. 별도 inverse/restore 커밋3쌍 보존.

최종 실행은 `continuous-v3`, QA `b6685f0`, clone `/workspace/helix-functional-verification-v2-20261120`다. 이름v2는 clone명이며 판정은 새 v3 출력만 사용한다. [최종 결과와 원시 SHA](evidence/functional-rollback-final.json).

v1은 geometry caller의target 누락으로 중단됐고 QA 한 줄만 교정했다. v2는 About820 예약창PNG exact에서 중단됐으며 문구·타이포·높이·배치 계약JSON은 완전히 같고 둥근 모서리421픽셀만 달랐다. 동일 입력 단독 진단은 exact였지만 원인은 미확정이다. 제품/CSS/브라우저 설정·기준·mask·허용 오차·expected failure를 바꾸지 않았다. 두 실패와 예비 성공은 보존하며 합산하지 않는다.

## 원인과 선택

메뉴는 body 클래스만 잠그던 원본에 `html` 상태 생산과 CSS 잠금을 함께 적용했다. 예약창은 기존 `#hxFctaModal.is-open`의 실제 상태를 CSS `:has()`로 참조해 문서 주체를 잠근다. 새 공통 상태나 timer를 만들지 않았다. 두 창은 각자 상태를 소유하며 하나를 닫아도 다른 상태가 남으면 문서 잠금이 유지된다. 기존 검증 소스를 그대로 재사용했다.

[원본/후보 다섯 파일의 실제 URL·Git blob·SHA와 원인 증거](evidence/functional-rollback-causes.json)를 별도로 기록했다. 원본 About producer는 실패한 script를 남기며, 공통 `present(path)`는 native 결과 확인 없이 태그 존재를 성공 자산으로 오인했다. JS2회 실패에서 producer의2요청이 끝난 뒤 shared 공급이 억제돼 메뉴0이 된 경로다.

로더는 실패한 태그의 소유권을 철회하고 native 결과를 소비자에게 인계한다. 메뉴 CSS/JS의 producer retry와 shared 공급이 같은 immutable ref를 유지하며, 기존 1회 실패2요청·2회 실패3요청 계약을 보존한다. pending 결과는 실제 load/error가 결정하고 태그·빈 sheet·초기화 claim만으로 완료 처리하지 않는다. 기존 원인별 D04 제품을 재사용했고 새 범용 retry·timeout·observer를 추가하지 않았다.

`__helixHamburgerInit`는 중복 실행 방지용 점유이고 완료 보증이 아니다. 실제 성공은 `__helixHamburgerReady`, 메뉴 DOM 및 열기·닫기·Escape/초점·wheel 동작으로 확인한다. GSAP가 준비되지 않은 상태는 기존 E1의 native dependency load 경로가 소유하며, shared가 guard를 해제하거나 다른 메뉴를 중복 생성하지 않는다. 임의 HTTP200 실행 예외나 영구 미응답까지 복구한다고 주장하지 않는다.

원본 mirror 세 개는 보존했다. 복구 후보와 현재 작업 후보는 별도 ref/목적으로 관리한다. [선별 파일·근거](evidence/functional-rollback-package.json)와 [전달 자산175URL·Git blob·SHA 대장](evidence/functional-rollback-assets.json)가 대장이다.

| 역할 | 기능 보존형 복구 ref | 선별 범위 |
|---|---|---|
| 정식 기본 / staging 비Home의 기본 경로 | `61c465152f26c5820ef30e7c8b166ba37829008a` | 원본 main mirror + 검증된14파일 |
| staging Home 전용 | `76f9a10c59ecb696dd349fd1f9344939ddafab4a` | 관측 Home 원본 + 필요한 검증 파일, 전용 loader/CSS 보존 |
| Services의 producer 및 scoped shared | `91140bf351dc6afbdfb57bb99e5c17c6bd794c09` | 실제 ba91 원본 mirror + 필요한6파일 |

main과 staging Home의 최종 runtime tree는 각각 기존 `669fa762…`와 `62ecac1b…`와 같다. 검증된 정상 상태를 고정하는 복구 대상이며 별도 대체 구현이 아니다. 이들과 공유하는 코드 자체의 결함까지 해결하는 원복이라고 주장하지 않는다. Services는 기존 Services 고유 CSS·dept-nav·SEO·coming-soon 자산을 보존했다. 이 경로의 모든 내비게이션/SEO 의미를 main 후보와 동등하다고 새로 인증하지 않는다.

선별 작업을 메뉴 잠금·예약창 잠금·메뉴 소유권 프로토콜·D02/D05 보존·Hero/반응형 보존 커밋으로 나눴다. 보호 작업 브랜치의 제품은 바꾸지 않았다. staging Home에 정식 파일을 그대로 복사한 초기 `216fd92` 구성은 loader 순서/CSS 범위 대조에서 제외했고, 기존 검증된 staging 두 파일을 보존한 최종 ref만 사용한다. 초기 구성의 CDN 성공을 최종 기능 검증으로 합산하지 않는다.

## 판정 경계와 다음 작업

**남은 게이트:** 미게시 Designer/CMS·공통 스타일/컴포넌트의 작성자/전체diff는 미확인이다. 과거 실패 원본CDN 도달성을 정확 Git 로컬 비교나 새 recovery URL의200으로 대체하지 않는다. 실 Safari/iOS/iPad·V0/U01·일반 HTTP200 실행 예외/영구무응답/미래mutable 호환성은 별도 미해결·미검증이다. v2의 About820 둥근 모서리421픽셀 차이는 원인 미확정이며 진단/실패 증거를 유지한다. 동일 입력 단독 PNG 진단과 v3 결과를 그 원인 규명으로 승격하지 않는다. 두Drive 백업의 원격 다운로드SHA도 미검증이다.

**종료 판정:** 기능 보존형 복구 후보의 지정 격리 검증은 완료했다. 소스·자산·계약에 대한 별도 검토 자료는 준비됐지만 전체 독립 감사와 운영 원복 실행은 완료하지 않았다.

실제 공개 적용·운영 원복은 별도 승인과 최신 공개/저장 코드SHA 및 미게시 영향 확인이 필요하다. 원본 mirror는 기능 복구 대상으로 사용하면 안 된다. main/Home recovery tree는 현재 검증 후보와 같아 공유 코드 결함에 대한 독립 대체 구현이 아니다. 세 ref/여섯 설정은 하나의 지원 적용 단위이고 부분 적용은 지원하지 않는다. 이 patch는 미적용 현재 후보의 after에서 recovery로 가는 안이며 현재 저장 원본에 직접 적용하는 patch가 아니다. 여섯 결과SHA/producer/shared 일치 전 Publish를 금지한다.

새 미세 리팩터링을 시작하지 않는다. 지정 계약 통과와 실제 운영 원복 가능성은 구분한다. 별도 검토자는 소스/자산 소유권·검사 누락·실패 분류와 위 게이트를 검토해야 하며 구현자의 자동검사만으로 외부 독립 감사를 완료하지 않는다.

## 적용 및 보존 경계

세 ref는 하나의 지원 cohort이며 부분 적용은 지원하지 않는다. [여섯 설정 블록의 정확한 변경/역변경 자료](proposals/functional-rollback-20261120/manifest.json)를 준비했고 모두 정·역변환 SHA가 일치했다. 출발점은 미적용 현재 후보의 after 코드이며 지금 저장된 원본 코드가 아니다. 이번에는 적용하지 않는다. 원본 mirror의 기계적 역패치와 기능 보존형 복구 후보를 혼동하지 않는다. Webflow 저장은 원자적 트랜잭션이 아니므로 향후 승인된 작업에서도 여섯 결과 SHA와 생산자/shared 조합을 확인하기 전 Publish를 보류해야 한다.

정상 runtime에서 관측된 자산 URL300건을 새로 읽어 모두 HTTP200을 확인했다.298건은 동결 body SHA와 같고 두GitHub ref 응답만 compact/pretty JSON 표현이 달랐다. 파싱한 객체 전체가 같고 main/staging SHA도 그대로임을 확인했다. 동결 입력을 최신 응답으로 교체하지 않았다. 이 관측에는 코드·CSS·폰트·영상·SVG 등 간접 자산이 포함되며 실제 최종 연속 실행의 요청 목록과 대조 여부는 최종 판정JSON을 따른다.175 snapshot 응답과300 URL은 겹치므로475개 고유 자산으로 합산하지 않는다.

별도 진단 브랜치의 원인별 inverse/정확한 tree 복구 커밋도 보존했다. 이 inverse들은 적용 대상이 아니다.

| 진단 원인 | inverse | 전체 복구 tree로 복원 |
|---|---|---|
| 메뉴 잠금 | `02642863ae83a10b09efa94a14267f658861f99e` | `143ebe6dcde025624d3cd58e489266fe664845c6` |
| 예약창 잠금 | `26cc50f9b649e1b0776357f5a86322b65f375bc7` | `f39d1219c3ea4373555fd01c136288497a7da2b7` |
| loader 소유권 cohort | `39e075a6b6993ebfed42f361643033b8e5593957` | `9f938b26afdd6474cb458857445bc44566d22077` |

복원 커밋의 tree는 모두 `9cefb4d47bf9517f01cba11569a2f7c328f89dab`와 같다. 메뉴/폼 inverse는 다른 검증된 hunk를 보존하고, loader inverse는 해당7파일의 프로토콜을 되돌리되 D02/D05와 Hero를 보존한다. 실제 runtime의 About 진단은 그 페이지가 요청하는 producer/shared의 실패 인계를 검사한다.

새 raw는 `/workspace/artifacts/helix-functional-rollback-20261120` 로컬 전용이다. [전체 파일·입력 본문 SHA 검증 영수증](evidence/functional-rollback-raw-receipt.json)을 인계한다. 본문·PNG·로그를 외부 업로드하지 않는다. 기존 두Drive 아카이브도 중복 업로드하지 않고 원격 다운로드 SHA 미검증을 유지한다. 새 제품·검사 결과가 이전 성공으로 대체되지 않도록 입력·소스 SHA를 고정했다. 기존 PNG/mask/100px/threshold0.2/expected failure는 바꾸지 않았다.

main/staging·작업 제품 소스·공개 head/pin/설정·Publish·운영 배포는 변경하지 않는다. V0/U01, 실 Safari/iOS/iPad, 임의 HTTP200 실행 예외·영구 무응답 등 기존 미해결 경계도 이번 지원 계약으로 승격하지 않는다. 최종 공개 적용은 미게시 Designer/CMS 변경 범위 확인과 별도 승인이 필요하다.
