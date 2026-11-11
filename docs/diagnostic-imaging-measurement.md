# 영상의학과 클릭 측정

- 범위: `/diagnostic-imaging`의 링크, 버튼, 본문 이동 메뉴, 지점 선택,
  헤더·햄버거 메뉴, 푸터 로고·이메일·SNS·FAQ, 상담창의 클릭 요소, 맨 위로.
- `diagnostic_imaging_click`: 한 번의 클릭에 한 건. 영상의학과의 전체 클릭
  합계는 이 이벤트만 집계한다. 기존 `ui_click` 및 상세 이벤트와 합산하지 않는다.
- `page=diagnostic_imaging`, `source_page=/diagnostic-imaging`, `section_key`,
  `control_label`, `control_id`, `control_key`, `item_type`, `branch`, `target_key`,
  `link_url`로 위치와 대상을 구분한다. 세션·유입 정보는 기존 경로에서 붙는다.
- 본문 이동 메뉴의 `target_key`에는 네 개의 공개 섹션 ID만 허용한다.
  링크의 쿼리·임의 해시, 전화번호, 사용자가 입력한 폼 값은 추가 수집하지 않는다.
- `conv=0`: 클릭을 실제 예약 완료·통화 완료로 집계하지 않는다.
- 기존 운영자 제외와 스테이징 제외를 유지한다. 로그 수신기는 변경하지 않는다.
- 기존 공통 로더에 연결하므로 동작 줄이기 설정이나 영상의학과 애니메이션
  로딩 여부와 관계없이 작동한다.
- `?ga-inspect=1` 또는 `?debug-ga=1`에서만 측정 테두리·배지·로그를 표시한다.
  기존 상세 이벤트 배지가 우선하고, 나머지 클릭 요소는 영상의학과 배지로 표시한다.
  표시 자체는 수신 완료를 증명하지 않는다. 운영자 제외 시 실제 전송은 하지 않는다.
- 현재 서초·일산 본문 링크는 게시 HTML의 `href="#"` 그대로다.
  클릭 의향을 지점별로 구분하되 이동 목적지는 이 작업에서 바꾸지 않는다.

검증: `node scripts/test-imaging-measurement.cjs` (Playwright 및 Chromium 필요).
실제 페이지에서 후보 코드를 대신 로드하고 데스크톱·모바일 모든 클릭 요소의
단일 발사, 페이지 구분, 민감 쿼리 제외, 운영자 제외, 점검 배지를 검사한다.
네트워크 분석 전송과 비콘은 차단하고 실제 예약을 제출하지 않는다.
기존 회귀 검사: `node scripts/test-measurement-coverage.mjs`,
`node scripts/test-tools-bridge.cjs`.
