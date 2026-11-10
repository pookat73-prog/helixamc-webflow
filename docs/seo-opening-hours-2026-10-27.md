# 진료시간 구조화 정보 재점검 — 2026-10-27

운영 홈과 /seocho의 최초 HTML에서 `VeterinaryCare` 단일 유형에 `openingHoursSpecification`이 연결된 것을 다시 확인했다. [VeterinaryCare](https://schema.org/VeterinaryCare)는 MedicalOrganization을 상속하고, [openingHoursSpecification](https://schema.org/openingHoursSpecification)의 적용 대상은 Place다. JSON 문법 오류가 아니라 속성의 적용 대상 문제다.

`buildSeocho`의 실제 지점 노드에 `LocalBusiness` 유형을 함께 선언한다. LocalBusiness는 Place를 상속한다. 병원의 VeterinaryCare 식별과 기존 @id를 유지한다. 재생성된 seocho 스니펫을 JSON으로 비교해 유형 외 전체 값이 같은 것을 확인했다. 시간·주소·전화·의료진·설명·링크와 화면 코드는 변경하지 않았다. 일산 진료시간은 확인되지 않았으므로 추가하지 않는다.

이 변경은 staging의 스니펫 생성 경로 보완이다. 운영 main 반영이나 Webflow 게시 완료를 의미하지 않는다. 운영 최초 HTML에는 별도로 저장된 같은 지점의 JSON-LD가 있고, 홈은 이 코드 변경만으로 보완되지 않는다. 공개 HTML을 바탕으로 만든 홈·서초 유형 변경 후보는 실행 폴더의 `evidence/home-schema-candidate.json`, `evidence/seocho-schema-candidate.json`에 있다. 최신 Webflow 저장본의 원본 위치를 확인하고 동일한 유형만 수정한 뒤, 관련 없는 미게시 변경을 함께 공개하지 않는 게시 절차가 필요하다.

검증: 전체 SEO 스니펫 생성 성공; 변경 전후 JSON 비교에서 유형만 차이; git diff --check; 사이트 품질 검사. 공식 온라인 validator의 최종 검사와 운영 렌더링 후 검증은 아직 남아 있다. 구조 수정으로 검색 노출·색인 완료·성과 향상을 주장하지 않는다.
