# Helix AMC 의료진 상세 모달

서초본원 페이지의 의료진 카드에서 "상세보기" 버튼을 누르면 뜨는 모달.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `modal.css` | 모달 스타일 (다크 #0d1117 + 메인 블루 #0075d6) |
| `modal.js` | 클릭 감지 → JSON fetch → 모달 렌더 |
| `schema.json` | 데이터 JSON Schema (IDE 자동완성·검증) |
| `data/<group>.json` (= `seocho/doctors/data/<group>.json`) | 그룹별 의료진 상세 데이터 배열 (12개 + gp-1 빈 배열) |
| `data/_template.json` | 신규 그룹 생성 시 복사용 템플릿 |

## Webflow 측 설정

의료진 카드 컴포넌트 안 "상세보기" 버튼에 Custom Attribute 추가:

- `data-doctor-open` = `<slug>` (필수, 사람마다 다름. CMS Item slug 와 동일하게 권장)
- `data-doctor-group` = `<group>` — 카드 부모 컨테이너 (예: Collection List Wrapper) 에 박아두면 버튼엔 생략 가능

또는 결합형 (컴포넌트 Property 하나로 처리 가능):

- `data-doctor-open` = `<group>/<slug>` (예: `im-1/gimtaeseong`)

## 그룹 ID

현재 12개 진료과 컬렉션:

| 그룹 | 의미 |
|---|---|
| `im-1`, `im-2` | 내과 (1) / (2) |
| `sr-1`, `sr-2` | 외과 (1) / (2) |
| `di-1`, `di-2`, `di-3` | 영상의학과 (1~3) |
| `op` | 안과 |
| `gp-1`, `gp-2` | 일반진료 (1) / (2) |
| `em-1` | 응급의학과 (1) |
| `is-1` | 내과세부 (1) |

> 그룹 명 규칙: 영문 소문자 + 숫자 + 하이픈. JSON 파일명·data-doctor-group 값과 동일.

## 데이터 추가/수정 (사용자 워크플로우)

1. GitHub 웹에서 `seocho/doctors/data/<group>.json` 열기 → 연필 아이콘
2. 객체 추가/수정 (스키마는 `schema.json` 또는 `_template.json` 참고, 또는 기존 항목 복사해서 수정)
3. 우측 하단 **Commit changes** → **Create a new branch** 체크 → **Propose changes**
4. PR 생성 페이지에서 base 를 **`staging`** 으로 변경 → **Create pull request**
5. Claude 가 머지 → 스테이징 사이트 (`*.webflow.io`) 에서 확인
6. OK 면 **"main 으로 올려"** 라고 지시 → 정식 사이트 반영

## 필드별 동작

- `slug` (필수): 영문 소문자 + 숫자 + 하이픈. 그룹 내 유일. 버튼 attribute 와 일치해야 매칭됨.
- `name` (필수): 모달 헤더의 큰 이름.
- `photo`: 빈 문자열 / 누락이면 사진 영역 자체가 숨겨지고 텍스트만 자연스럽게 정렬됨. 서초본원 카드에 사진이 이미 크게 박혀 있어서 모달엔 사진 굳이 안 넣어도 OK (단, 현 데이터는 CMS 사진 URL 그대로 유지).
- `intro`: 한 줄 소개. 비우면 자동 숨김.
- `education` / `career` / `specialty` / `memberships` / `activities` / `publications`: 모두 배열. **빈 배열이면 해당 섹션 자체가 모달에 안 나옴**. 채워진 섹션만 자동 표시.

## 디버그

서초본원 페이지 URL 에 `?debug-doctors=1` 추가:
- 콘솔에 `[doctor-modal]` 로그 출력
- 그룹 fetch / slug 매칭 실패 시 워닝
