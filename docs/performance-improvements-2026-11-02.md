# 성능 개선 1차 · 2026-11-02

## 1. 작업 개요

사용자가 속도 측정은 직접 진행하고 확인된 저하 요인의 개선을 승인했다. staging 우선이며 정식 main 반영은 별도 검토 대상이다. 최신 staging의 다른 내과 작업 및 의료진 데이터는 보존한다.

## 2. 기술적 결정 사항

- 원본 이력·이름·사진 데이터는 수정하지 않는다. 사진 URL에 임의의 `?w=`를 붙이는 대신 실제 존재하는 Webflow 반응형 파일을 사용한다.
- `photo-widths.json`은 Webflow API 또는 HTTP 200으로 확인한 26개 공개 사진의 크기 목록이다. 이름·이력의 별도 원본이 아니다. 새로운 사진은 확인 후 이 목록에 등록하고 `node scripts/doctor-photo-sources.cjs --write`로 기존 두 런타임 파일의 작은 함수를 재생성한다. 브라우저에서 새 파일을 요청하지 않는다.
- 26개 상세 페이지는 최초 HTML에 `srcset`과 `sizes`를 제공한다. JS 실행 뒤에 원본을 작은 파일로 교체하는 방식이 아니다. 모달·목록 카드에도 같은 선택 함수를 적용한다. 외부·알 수 없는·이미 크기 지정된 주소는 그대로 보존한다.
- 폰트·애니메이션·헤더·스크롤·의료진 측정은 변경하지 않는다. Webflow 내과의 3.15.0 GSAP는 자체 인터랙션 의존성을 확인하지 않았으므로 이번에 제거하지 않는다.

## 3. 변경 및 검증

| 대상 | 변경 | 파일 크기 근거 |
|---|---|---|
| 의료진 26명 | 상세 HTML, 목록 카드, 모달에 확인된 500/800 및 일부 1080px 후보 제공 | 26개 원본 합계 48,485,531바이트 → 500px 파일 합계 370,389바이트. 전체 26개 작은 파일 HTTP 200 |
| 일산 시설 슬라이드 4개 | Webflow 원본 자산을 WebP로 압축 | 14,315,783 → 395,076바이트, 4개 성공·실패 0 |
| 서초·일산·진료과목·특화진료·FAQ | 페이지 head의 GSAP 중복 태그 제거 | 기존 공통 site head의 GSAP는 유지 |
| 응급 증상 | 본문 embed의 GSAP 제거, 등록된 `emergencybootstrapfix` 중복 로더 해제 | SEO 등록 스크립트와 기존 branch-aware embed 로더 유지 |

이 숫자는 파일 크기의 비교다. 한 페이지의 초기 전송량이나 실제 속도 개선율이 아니며 카드에서 큰 후보를 고르면 전송 크기는 달라진다.

검증: 생성 함수 동기화·원본/미등록 주소 보존·26명 정적 HTML 검사, 1440/390px에서 전체 상세 페이지와 24명 모달의 열기/닫기/포커스/이동/뒤로·앞으로 및 이벤트 중복 회귀 검사를 수행한다. 실제 속도 점수 측정은 사용자 담당이다. 게시 후 실제 응답·CSS·이미지 요청은 별도로 확인한다.

## 4. 반영 및 다음 단계

GitHub 변경은 현재 staging을 부모로 하는 PR로 반영한다. Webflow 저장 변경은 페이지 head 5곳, 응급 본문 embed 1곳·등록 로더 1개, 의료진 26개 footer의 사진 속성과 일산 자산 4개다. 의료진 footer의 사진 태그 이외 문자열과 head는 유지한다. 공통 site head/footer 및 분석 설정은 수정하지 않는다.

Webflow는 `customDomains: []`, `publishToWebflowSubdomain: true`로 staging에만 게시한다. main/staging이 달라 전체 staging을 정식으로 병합하면 안 된다. 정식 승인 시 현재 main 위에 이번 성능 변경만 옮기고 기존 의료진 측정·OG 등 main 전용 변경을 보존한다. Webflow 저장 변경은 이후 정식 Publish에 포함될 수 있으므로, 다른 정식 게시 전에 이번 자산·본문 변경도 함께 검토해야 한다.

## 5. 참고

- `scripts/doctor-photo-sources.cjs`: 빌드용 공통 함수와 런타임 생성 검사
- `scripts/test-doctor-photo-sources.mjs`: 원본 보존·반응형 선택 회귀 검사
- `scripts/build-doctor-pages.mjs`: 정적 상세 HTML 생성 원본
- `seocho/doctors/modal.js`, `card-render.js`: 기존 런타임 수정 위치
- Webflow 압축 작업: `36df48bd-3120-4cc5-b7ee-395813fc61d1`
- 작업 시 Webflow 원문 백업·실제 파일 크기·HTTP 검사는 `/workspace/performance-resume/`에 보관했다. 이 경로는 다음 환경에서 유지된다고 가정하지 않는다.
