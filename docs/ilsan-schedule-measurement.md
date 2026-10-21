# 일산 진료 소식 링크 클릭 측정

## 대상과 의미

- 일산 `/ilsan` 또는 `/ilsan/` 페이지에서만 실행한다.
- Webflow 요소 조회로 확인한 `#intro`의 링크(의료진 & 진료 일정)와
  `#vets a.vets-cta-button`(인스타그램 바로가기)만 대상으로 한다.
- 두 링크의 목적지는 `https://www.instagram.com/helixamc_ilsan/`이다.
- 공개 운영 HTML에서도 두 문구와 목적지를 확인했다. Webflow 편집 구조 조회는
  운영 화면의 데스크톱/390px 표시, target, 실제 새 창 동작을 검증한 것이 아니다.
- 외부 진료 소식 계정으로 이동하려는 클릭이다. 의료진 프로필 열람 완료,
  일정 확인 완료, 상담 전환으로 해석하지 않는다.

## 기존 기록에서 구분하지 못했던 이유

기존 푸터 `sns_click_instagram_*`는 대표 계정 `helix_amc`을 가리킨다.
일산 버튼의 이용량으로 대신 사용할 수 없다. 다만 기존 기록이 전혀 없던 것은 아니다.
연결된 GA4 속성 538482327의 2026-10-01~2026-10-21 조회에서
`event_name=click`, `page_path=/ilsan`,
`link_url=https://www.instagram.com/helixamc_ilsan/` 조합을 확인했다.
이 자동 외부 링크 기록에는 hero/doctors 위치 구분이 없어 특정 버튼의
위치별 이용량으로 해석하지 않는다. 이 조회는 Windsor.ai의 기존 데이터이며,
요금제 제한으로 강제 갱신할 수 없어 배포 직후 수신 검증을 대신하지 못한다.

## 전송과 조회

이벤트명은 `ilsan_schedule_link_click_desktop` 또는
`ilsan_schedule_link_click_mobile`이다. 기기는 기존 HelixVP 판정을 우선한다.

| 매개변수 | 값 |
| --- | --- |
| item_type | schedule_link_click |
| branch | 일산 |
| page | ilsan |
| section | 첫 화면 hero / 의료진 영역 doctors |
| device | 기존 기기 판정값 |
| value | 클릭 시 링크의 실제 절대 URL(쿼리·해시 포함) |
| transport_type | beacon |

기존 `gtag`를 한 번 호출한다. 기존 session 및 sheet-log 래퍼를 거쳐
GA4와 원본 로그로 전송하며 별도 원본 로그 요청이나 새 라이브러리는 추가하지 않는다.
초기화 가드와 단일 위임 핸들러로 중복 부착을 막는다.
링크 속성, 스타일, 문구, 이동 동작을 수정하지 않는다.

버튼 이용량은 위 전용 이벤트만 집계한다. 공용 푸터의
`sns_click_instagram_*`와 GA4 자동 외부 링크 `click`을 더하지 않는다.
자동 외부 클릭 동시 발생 여부는 운영 브라우저에서 확인해야 한다.
GA4 사용자 정의 측정기준 등록 현황도 아직 확인하지 않았다.

## QA

기존 프로젝트 관례에 따라 `?ilsan-schedule-qa=desktop` 또는
`?ilsan-schedule-qa=mobile`이면 해당 전용 이벤트에만
`qa_test=desktop|mobile`, `debug_mode=true`를 붙인다.
QA 표시는 자동 제외 기능이 아니다. 운영 분석에서는 `qa_test`가 있는
이벤트를 제외해야 하며 실제 GA4/원본 로그 집계의 제외 설정은 미확인이다.
디버그 표시만으로 수신, 저장, 분석 제외를 확인했다고 보고하지 않는다.

기존 스테이징(`*.webflow.io`) 및 운영자 제외 스위치를 우회하지 않는다.
스테이징에서는 GA4·원본 로그 전송이 꺼지므로 실제 수신·저장 검증을 대신할 수 없다.

## 현재 검증 및 게시 상태

- `node scripts/test-ilsan-schedule-measurement.mjs`: 모의 GA/전송 환경에서
  4개 검사 통과. 1280/390 폭 판정, 위치·URL, 클릭 1회당 각 전송 경로 1회,
  반복 초기화, 푸터/다른 페이지/다른 목적지 제외, QA 및 차단 확인.
- 이 테스트는 실제 원본 sheet-log 코드를 실행하지만 전송은 모의 처리한다.
- JavaScript 문법 검사와 `git diff --check` 통과.
- `node scripts/check-site-quality.mjs`: 초기 EPERM 후 실행 권한을 보완해
  재실행, 8개 검사 통과. PR 및 main의 GitHub Site Quality Checks도 통과.
- 실제 데스크톱/390px 화면 및 새 창 이동, 운영 GA4 수신, 원본 로그 저장,
  QA 집계 제외, 자동 외부 클릭 동시 발생은 미확인.
- PR #1872를 main에 squash merge. 운영 반영 커밋은
  `364b2414945d1e7fcc35972d374ed3d9cc8e8013`이며 병합 시각은
  2026-10-21 11:28:56 KST다. 스테이징은 사용자 지시로 생략했다.
- 운영 커밋의 짧은 SHA 및 @main CDN 파일을 직접 내려받아 수정본과
  SHA-256이 일치함을 확인했다. 해시:
  `45d6faa0381c1defe72ea7ef993c0501dee41160f528e85a71c4181345852a2d`.
- 운영 페이지 직접 접근은 네트워크 정책에 차단됐다. 실제 방문자의 코드 로드 및
  첫 전용 이벤트 발생 시각은 미확인이다. 병합 시각과 실제 계측 시작을 혼동하지 않는다.
- 원본 로그의 최근 1,000행 조회 및 GA4의 당일 전용 이벤트 조회에서 표본은
  아직 확인되지 않았다. GA4 조회는 캐시 갱신 제한이 있어 실시간 수신 판정에 쓰지 않는다.
- CDN 자동 배포 1차 시도는 변경과 무관한 home/global/buttons.css 요청의
  TLS 오류(curl 35)로 중단되어 실패 작업을 재실행했다.
- CDN 배포 재시도는 2026-10-21 11:34:05 KST에 성공했다.
  실행 기록: https://github.com/pookat73-prog/helixamc-webflow/actions/runs/39533255088
- 계측 이전의 미측정 클릭 수는 소급 복원하거나 추정해 채우지 않는다.

최신 사용자 지시: “계측은 정한대로 운영으로 ㄱㄱ. 스테이징은 필요없어.”
이에 따라 이번 계측 변경은 스테이징 없이 main 대상 PR로 운영 반영한다.
위의 로컬 검증 상태와 실제 수신·저장·화면 검증의 미확인 사항은 구분한다.
