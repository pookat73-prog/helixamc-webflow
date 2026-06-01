# Helix AMC 의료진 상세 모달

서초본원 페이지의 의료진 카드에서 "상세보기" 버튼을 누르면 뜨는 모달.

## 파일 구성

| 파일 / 폴더 | 역할 |
|---|---|
| `modal.css` | 모달 스타일 (다크 #0d1117 + 메인 블루 #0075d6) |
| `modal.js` | 클릭 감지 → JSON fetch → 모달 렌더 |
| `schema.json` | 데이터 JSON Schema (IDE 자동완성·검증) |
| `data/<group>/<slug>.json` | **한 명 = 한 파일**. 그 사람의 상세 데이터 |
| `data/_TEMPLATE.json` | 신규 의료진 추가 시 복사할 템플릿 |

## 그룹 ID (현재 11개)

| 그룹 | 의미 |
|---|---|
| `im-1`, `im-2` | 내과 (1) / (2) |
| `sr-1`, `sr-2` | 외과 (1) / (2) |
| `di-1`, `di-2`, `di-3` | 영상의학과 (1~3) |
| `op` | 안과 |
| `gp-2` | 일반진료 |
| `em-1` | 응급의학과 |
| `is-1` | 인터벤션 |

> 그룹 명 규칙: 영문 소문자 + 숫자 + 하이픈. JSON 폴더명·data-doctor-group 값과 동일.

## Webflow 측 설정 (이미 완료 — 참고용)

의료진 카드 컴포넌트 안 "상세보기" 버튼에 Custom Attribute:
- `data-doctor-open` = `<slug>` (Profile Card 컴포넌트의 Doctor Slug prop 에서 자동 바인딩)
- `data-doctor-group` = `<group>` (Doctor Group prop, 각 인스턴스마다 직접 입력)

## 의료진 추가 / 수정 / 삭제

### ✅ 추가 (신규 입사자)

1. GitHub 웹에서 `seocho/doctors/data/<group>/` 폴더로 이동
2. **Add file → Create new file** 클릭
3. 파일명: `<slug>.json` (영문 소문자 + 하이픈, 예: `gimcheolsu.json`)
4. `_TEMPLATE.json` 내용 복사·붙여넣기 → 값 채우기
5. **Commit changes** → **Create a new branch** → **Propose changes** → base 를 `staging` 으로 → PR 생성

Webflow 측 작업도 필요:
- Designer 에서 그 그룹의 Profile Card 인스턴스가 CMS Item 으로 자동 렌더되도록, CMS 컬렉션에 해당 사람 추가 (또는 CMS 안 쓰는 그룹이라면 카드 수동 추가)
- 새 인스턴스의 Doctor Slug = CMS slug 필드, Doctor Group = 그룹 ID (기존 인스턴스와 동일하게 자동 적용됨)

### ✅ 수정 (학력/경력/논문 등 추가·변경)

1. GitHub 웹에서 `seocho/doctors/data/<group>/<slug>.json` 열기
2. 연필 아이콘 → 수정 → Commit → PR (base: `staging`)

### ✅ 삭제 (퇴사)

1. GitHub 웹에서 해당 `<slug>.json` 파일 → **Delete file**
2. Commit → PR (base: `staging`)
3. Webflow CMS 에서도 해당 의료진 Item 삭제 (Designer 또는 Editor 에서)

## 필드별 동작

- `slug` (필수): 영문 소문자 + 숫자 + 하이픈. 파일명과 같아야 함. 버튼 attribute 와 일치해야 매칭됨.
- `name` (필수): 모달 헤더의 큰 이름.
- `title` (선택): 직책. 비우면 헤더 위쪽 작은 글씨 자동 숨김.
- `order` (선택): 정보용. 카드 표시 순서는 CMS 가 관리.
- `photo` (선택): 비우면 사진 영역 자체가 숨겨지고 텍스트만 정렬됨. 서초본원 카드에 사진이 이미 박혀 있어서 모달엔 사진 굳이 안 넣어도 OK.
- `intro` (선택): 한 줄 소개. 비우면 자동 숨김.
- `education` / `career` / `specialty` / `memberships` / `activities` / `publications` (선택): 모두 배열. **빈 배열이거나 키 자체가 없으면 모달에서 그 섹션이 안 나옴**.

## 로컬에서 작업 (선택)

VSCode 같은 에디터로 더 편하게 작업하고 싶을 때:

```bash
git clone <repo>
cd helixamc-webflow
# 작업 브랜치
git checkout -b claude/doctor-update-XX
# seocho/doctors/data/<group>/<slug>.json 편집
git add seocho/doctors/data
git commit -m "doctors: <이름> 상세 정보 추가"
git push -u origin claude/doctor-update-XX
# GitHub 에서 PR 생성 (base: staging)
```

VSCode 가 schema.json 을 자동 인식해서 키 자동완성·오타 표시·필수 누락 경고를 띄워줘서 편함.

## 디버그

서초본원 페이지 URL 에 `?debug-doctors=1` 추가:
- 콘솔에 `[doctor-modal]` 로그 출력
- 슬러그 fetch / 매칭 실패 시 워닝
- 예: `[doctor-modal] click open im-1/gimtaeseong` / `[doctor-modal] loaded im-1/gimtaeseong 김태성`

## ⚠️ 캐시 stale 시

새 파일 추가했는데 모달에 안 뜨면, jsDelivr edge 캐시가 stale 일 수 있음. 콘솔에 다음 한 줄:

```js
fetch('https://purge.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/seocho/doctors/data/<group>/<slug>.json').then(r=>r.json()).then(console.log)
```

`<group>` / `<slug>` 부분을 실제 값으로 바꿔서 실행. `finished` 응답 → 새로고침. (CLAUDE.md "jsDelivr edge 캐시 stale" LOCKED 항목 참고)
