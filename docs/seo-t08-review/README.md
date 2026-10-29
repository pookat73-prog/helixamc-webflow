# SEO T08 검토 후보 — 2026-10-28 KST

**Draft / 적용 보류.** main 기준 코드 보완과 공개 HTML 기반 통합 후보를 준비했다.
최신 Webflow 저장 schema·head/footer의 재확인·백업과 공식 validator 재검사는 미완료다.
이 문서와 후보는 운영 적용 승인 요청이나 T08 완료 선언이 아니다.

## 기준과 백업

- main: `a306054cf3314a1c001a1ed9beeb9e1ffa6648e5`.
- staging: `8df94f048b014c01139d0993c726aa4c3114cc2b`.
- #1968은 staging에만 병합됨. 열린 PR 목록에 같은 T08 후속 PR은 없었다.
  기존 staging→main PR #1635는 사용하지 않는다.
- GitHub 비교는 diverged(ahead 405 / behind 184). staging 전체를 승격하지 않는다.
- 운영 `/`, `/seocho` 최초 HTML을 2026-10-28에 다시 수집했다. 각각 JSON-LD 블록 1개,
  동일한 `https://helix-amc.com/seocho#branch` 정적 정의 1개, 인증 3건이다.
- 원본 HTML·응답 헤더·head·HTML 꼬리 구간·JSON-LD, main 빌더/스니펫,
  staging 빌더/스니펫과 SHA-256 목록은 `/workspace/t08-evidence/`에 보관했다.
  전체 원본 HTML에 head/footer가 포함된다. 꼬리 구간 파일을 정확한 Webflow footer 필드로 간주하지 않는다.
- 저장소에는 공개 schema와 공개 SEO 로더 원본만 `*.live-before.*`로 넣었다.
  이것은 **최신 Webflow 저장본 백업이 아니다**.
- Webflow 페이지 메타데이터 조회는 성공했다. Home lastUpdated는
  `2026-10-27T05:50:44.348Z`, 서초는 `2026-10-23T06:27:18.112Z`.
  운영 도메인 lastPublished는 `2026-10-26T06:18:51.714Z`이며 Webflow 서브도메인은
  `2026-10-27T05:50:56.001Z`. 이 차이만으로 미게시 필드 내용을 확정하지 않는다.
  연결 도구의 schema/freeform code 읽기 요청이 스키마 검증에서 거부되어 최신 저장 필드를 확보하지 못했다.
  기존 미게시 변경의 정확한 목록·보존 여부는 미확인이다.

## 최소 변경과 정보 보존

배포 경로의 수정은 `scripts/build-seo.js`, `seo-snippets/seocho.html` 두 파일이다.
#1968과 같은 서초 지점 `@type` 보완만 main에서 별도로 적용했다.
`VeterinaryCare`에 `LocalBusiness`를 추가한다. 기존 단일 유형은 Organization 계열이며,
LocalBusiness가 Place 계열을 보완한다. 다른 SEO 속성은 수정하지 않았다.
나머지 파일은 검토 자료이며 기존 자동 로더가 가져오는 파일이 아니다.

| 항목 | 정적 원본 | 생성 그래프 | 서초 정적 후보 |
|---|---|---|---|
| 주소 | 신반포로 162 르본시티 2층 | 같은 주소, 쉼표·우편번호 06546 | 원본 주소 문구 보존 + 우편번호 |
| 시간 | 매일 00:00–23:59 | 같은 시간 + 외래/야간응급 설명 | 원본 요일/시간 보존 + 설명 |
| 인증 | AAHA-KVMA, VECCS Level 2, CFC GOLD | AAHA-KVMA 축약 1건 | 상세 인증 3건 그대로 보존 |
| 의료진 | 없음 | 26명: Physician 24 / Person 2 | employee 참조 26개; 상세 노드는 로더가 유지 |
| 추가 정보 | parentOrganization 등 | logo/image/email/sameAs/department/availableService 등 | 생성 지점 정보 포함 |
| alternateName | Helix Animal Medical Center | Helix Animal Medical Center Seocho Branch | 두 명칭을 배열로 보존 |

생성 그래프의 AAHA 축약 항목은 같은 인증을 나타내는 정적 상세 인증으로 대체한다.
인증 3건의 원본 객체·발급기관·URL·ID는 수정하지 않는다. medicalSpecialty,
department, availableService 및 내부 procedureType은 생성 그래프의 값을 그대로 포함한다.

홈 후보는 원본 schema의 `@type`만 바꾼다. 홈 자동 로더는 변경하지 않는다.
서초 후보는 정적 지점에 위 정보를 합치고 기존 SEO 로더 블록만 교체하는 안이다.
로더는 통합 정적 지점(LocalBusiness, employee, 인증 3개 ID)을 확인하면 가져온
`@graph`에서 같은 지점 정의만 제외한다. 의료진·BreadcrumbList·조직 노드는 그대로 주입한다.
이 로더를 head 전체 교체에 사용하지 않는다. 정적 지점이 없으면 생성 그래프를 그대로 주입한다.
구형 정적 schema와 새 로더만 조합하면 안전 조건이 성립하지 않아 중복이 남으므로
서초 schema와 로더는 반드시 같은 변경 단위로 다룬다.

## 실제 실행한 검증

- SEO 전체 재생성 성공. 변경 전후 JSON 비교: 서초 지점 `@type` 외 전 노드/값 동일.
  의료진 26명, employee 참조 26개, 주소·시간·생성 인증 보존.
- 저장소 기존 품질 검사 8개, 빌더 JS 문법, `git diff --check` 통과.
- `python scripts/test-seo-t08.py /workspace/t08-evidence/render-tests`:
  설치된 Playwright/Chromium으로 격리된 빈 테스트 탭에 후보 HTML을 넣어 실행.
  fetch 응답을 고정하고 외부 요청을 차단했으며 운영 페이지를 수정하지 않았다.
  최초 HTML과 렌더링 HTML/JSON-LD를 각각 저장했다.
- 두 페이지 × 정상/통신 실패/HTTP 실패/빈 응답/잘못된 JSON = 10개 시나리오 통과.
  정상: 각 페이지 지점 정의 1개, 서초 의료진 상세 노드 26개와 나머지 생성 노드 동일.
  실패: 지점 정의 1개, 주소·시간·인증 3건 유지. 서초 employee 참조는 남지만
  **동적 의료진 상세 노드는 로더 실패 시 0개**다. 완전한 의료진 오프라인 폴백은 제공하지 않는다.
- 잘못된 JSON 응답에서는 기존 홈 로더가 invalid JSON-LD 블록을 추가하는 기존 동작이 재현된다.
  정적 정보는 유지된다. 이 입력 검증 개선은 T08에 섞지 않았다.
- 공개 HTML 기반 격리 테스트다. 실제 Webflow 저장 상태·운영 CDN·페이지 전체의
  다른 스크립트와 함께 동작한 최종 검증은 아니다. 의료진 변경 시 정적 employee 참조도 동기화해야 한다.

## 공식 validator와 별도 후속 이슈

`home-validator-input.html`, `seocho-validator-input.html`은 정상 렌더링 후의
**전체 후보 JSON-LD 블록**을 포함한 검사 입력이다. 페이지 전체 HTML 검사와 구분한다.
공식 `https://validator.schema.org/`는 환경 허용 목록에 없어 CONNECT 403으로 차단됐다.
두 입력을 공식 검사기에 제출하지 못했으므로 이번 결과의 오류·경고 수는 **미측정**이다.
`openingHoursSpecification` 경고 해소도 공식 재검사 확정 전이다.

이전 사용자 제공 결과: 홈 후보 오류 0/경고 0; 서초 통합 후보에서 진료시간 경고 없음,
다른 오류 21/경고 7. 이전 후보 스니펫의 결과이며 이번 후보나 운영 페이지 전체 결과로 재사용하지 않는다.
medicalSpecialty / department / procedureType / availableService의 타입·값 오류는
별도 후속 항목으로 남긴다. T08에서 삭제·임의 수정하지 않았다.

## 적용 전 남은 순서

1. 최신 Webflow 저장 schema·페이지/site head/footer를 실제로 읽고 백업한다.
   공개 원본과 다른 필드는 전부 비교해 기존 미게시 변경을 보존하며 후보를 다시 생성한다.
2. 공식 validator 접근을 허용한 후 두 전체 입력을 검사한다. 진료시간 항목과 나머지
   오류·경고를 별도 집계하고 검사 입력 해시·일시·결과를 남긴다.
3. 최신 저장본을 바탕으로 실제 최초 HTML과 렌더 후 JSON-LD 검증을 다시 한다.
   정적/자동 지점 수, 인증 3건, 의료진과 다른 미게시 변경을 확인한다.
4. 위 검증 결과를 보고한 뒤 **main 병합과 Webflow 운영 Publish를 별도로 승인**받는다.
   승인 전 merge/publish하지 않는다. 이 draft는 승인 가능한 최종안이 아직 아니다.
5. 승인 시 서초 통합 schema+필터 로더를 함께 적용하고 홈 schema를 보완한다.
   현재 main 스니펫의 구형 branch도 필터 대상이므로 Webflow 변경을 먼저 검증할 수 있다.
   관련 없는 미게시 변경을 공개하지 않는 페이지 격리 게시 경로부터 확정한다.
   해당 사이트의 단일 페이지 게시 지원 여부는 아직 확인하지 않았다. 전체 Publish로 대체하지 않는다.
6. 검증된 두 파일만 main에 선별 반영한다. staging 전체 승격은 하지 않는다.
   main merge만으로도 운영 로더 응답이 바뀌므로 이 단계 자체를 운영 변경으로 취급한다.
7. 운영 최초 HTML과 실제 렌더 결과·CDN 응답을 재검사한다. 문제 시 백업한 두 페이지
   schema와 해당 SEO 로더를 함께 복원하고, 필요한 경우 T08 두 파일만 되돌린다.

main 병합·직접 수정, staging 병합, Webflow 저장 필드 쓰기/Publish, 강제 색인 요청은 실행하지 않았다.
