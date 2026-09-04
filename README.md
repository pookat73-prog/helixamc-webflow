# Helix AMC Webflow

헬릭스동물메디컬센터 Webflow 사이트의 커스텀 CSS, JavaScript, JSON 데이터와 배포 로더를 관리하는 저장소입니다.

Webflow가 페이지 구조와 기본 스타일을 맡고, 이 저장소의 `bootstrap` 로더가 GitHub와 jsDelivr를 통해 페이지별 기능을 불러옵니다. 일반 변경은 먼저 Webflow 스테이징에서 확인한 뒤, 승인된 내용만 정식 사이트로 올립니다.

## 현재 운영 구조

```text
Webflow 페이지
  └─ head의 Bootstrap 진입점
       ├─ *.webflow.io      → staging 브랜치
       └─ www.helix-amc.com → main 브랜치
            └─ GitHub에서 해당 브랜치의 최신 커밋 번호(SHA) 확인
                 └─ jsDelivr @<SHA> 주소로 CSS·JS·JSON 로드
```

- 정식 사이트: `https://www.helix-amc.com/`
- Webflow 스테이징: `https://helixanimalmedicalcenter.webflow.io/`
- 홈 진입점: `home/bootstrap-v3.js`
- 홈 본체 로더: `home/bootstrap.js`
- 공용 로더: `global/bootstrap.js`
- 페이지별 로더: `about/bootstrap.js`, `services/bootstrap.js`, `specialty/bootstrap.js`, `emergency/bootstrap.js`, `faq/bootstrap.js`, `seocho/bootstrap.js`

현재 홈의 정식·스테이징 HTML에서 확인되는 진입점은 다음과 같습니다.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/home/bootstrap-v3.js"></script>
```

`bootstrap-v3.js`가 접속 도메인으로 대상 브랜치를 고르므로 두 환경의 head 코드는 같습니다. 이후 최신 커밋 번호를 확인하고, 내용이 바뀌지 않는 `@<SHA>` 주소로 실제 로더와 자산을 가져옵니다.

일부 과거 문서와 GitHub Actions의 참고용 head code에는 `home/bootstrap.js` 직접 연결이 남아 있습니다. 실제 Webflow 연결은 현재 `home/bootstrap-v3.js`가 기준이며, 참고 문구를 그대로 복사하지 말고 실제 freeform code를 먼저 확인합니다.

페이지별 SHA 결정 방식은 조금씩 다르지만, 최종 자산을 `@<SHA>`로 불러온다는 원칙은 같습니다.

| 대상 | 현재 방식 |
|---|---|
| 홈 | `home/bootstrap-v3.js`가 도메인으로 브랜치를 고르고 SHA를 확인한 뒤 `home/bootstrap.js`를 불러옴 |
| Discover Helix·응급증상·서초본원 | `about`, `emergency`, `seocho` 로더가 스테이징 도메인에서 `@staging` 자기 자신으로 전환한 뒤 SHA를 확인 |
| 진료과목·공용 로더 | `services`, `global` 로더가 도메인으로 브랜치를 고른 뒤 SHA를 확인 |
| FAQ·특화진료 | Webflow head 로더가 먼저 SHA를 정하고, `faq`, `specialty` 로더가 자신을 불러온 주소의 SHA를 이어받음 |

> Webflow head 코드는 초기 연결점일 뿐입니다. CSS·JavaScript를 head에 직접 붙여 넣거나 사용자가 수동으로 관리하지 않습니다. 변경이 필요하면 담당 AI/개발자가 현재 freeform code를 확인하고 수정한 뒤 Webflow Publish까지 검증합니다.

## 브랜치와 반영 원칙

| 브랜치 | 역할 | 연결 환경 |
|---|---|---|
| `main` | 정식 배포본 | `www.helix-amc.com` 등 정식 도메인 |
| `staging` | 사전 확인본 | `*.webflow.io` |
| `claude/*` | 기능별 작업 브랜치 | 직접 연결하지 않음 |

### 일반 코드·디자인 변경

1. `origin/staging`에서 `claude/<작업명>` 브랜치를 만듭니다.
2. 요청 범위만 수정하고 로컬 검사를 수행합니다.
3. 커밋·푸시한 뒤 PR의 base를 `staging`으로 만듭니다.
4. PR을 squash merge해 스테이징에 반영합니다.
5. 스테이징에서 화면과 실제 로드 자산을 확인합니다.
6. 사용자가 해당 작업의 `main` 반영을 명시적으로 승인한 뒤에만 `staging → main` PR을 만듭니다.

```bash
git fetch origin
git switch -c claude/<작업명> origin/staging

# 파일 수정 후
git diff --check
git add <변경한 파일>
git commit -m "type(scope): summary"
git push -u origin claude/<작업명>

gh pr create --base staging --head claude/<작업명>
gh pr merge <PR번호> --squash
```

### GA4·측정 변경 예외

GA4 이벤트, 측정 차단, 측정 점검 도구처럼 측정만 바꾸는 작업은 `origin/main`에서 작업 브랜치를 만들고, `staging`을 거치지 않고 `main`으로 직접 PR을 만듭니다. 스테이징 도메인에서는 측정이 꺼지므로 그곳에서 검증할 수 없기 때문입니다.

- 측정 코드 자체는 `main`과 `staging`에 같은 형태로 둡니다.
- `*.webflow.io`에서는 도메인 판정으로 실행을 막습니다.
- 측정과 화면 변경이 섞인 작업은 분리해서 커밋·PR 합니다.
- 이 예외로 `main`이 `staging`보다 앞설 수 있습니다. 이후 일반 변경을 승격할 때 충돌이 나면 `main`의 측정 코드를 보존합니다.
- 측정이 아닌 변경은 이 예외를 적용하지 않습니다.

## Bootstrap과 CDN 원칙

### 자산은 커밋 번호로 불러오기

페이지 로더는 브랜치 이름이 아니라 최신 커밋 번호가 들어간 jsDelivr 주소로 CSS·JavaScript·JSON을 불러옵니다.

```text
권장:  https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@<SHA>/path/file.js
금지:  https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@latest/path/file.js
```

- `@latest`는 GitHub의 최신 커밋이 아니라 Release 기준으로 동작하므로 사용하지 않습니다.
- `@main` 또는 `@staging`으로 콘텐츠 파일을 직접 불러오지 않습니다.
- Webflow가 처음 불러오는 Bootstrap 진입점과 장애 시 안전망만 브랜치 주소를 사용할 수 있습니다.
- 지원하는 로더는 최신 커밋 번호를 브라우저에 잠시 보관합니다. 배포 직후 강제 확인이 필요하면 URL에 `?fresh=1`을 붙여 보관값을 건너뜁니다.

### 새 CSS·JavaScript 파일은 신중하게 추가

기존 페이지 수정은 가능하면 이미 Bootstrap 파일 목록에 등록된 CSS·JavaScript에 이어서 작업합니다. 새 파일을 추가하면 아래 항목을 모두 확인합니다.

1. 페이지 `bootstrap.js`의 `FILES` 목록
2. 새 폴더라면 `.github/workflows/webflow-deploy.yml`의 `on.push.paths`
3. 같은 워크플로우의 jsDelivr purge 파일 목록
4. 같은 워크플로우의 jsDelivr warm-up 파일 목록

하나라도 빠지면 GitHub에는 코드가 있어도 실제 브라우저에 도달하지 않을 수 있습니다.

## 자동 배포

`.github/workflows/webflow-deploy.yml`은 `main` 또는 `staging`에 아래 경로가 푸시될 때 실행됩니다.

- `home/**`
- `about/**`
- `global/**`
- `seocho/**`
- `emergency/**`
- `services/**`
- `faq/**`
- `specialty/**`
- `seo-snippets/**`

워크플로우는 다음 작업을 수행합니다.

1. 의료진 개별 데이터를 `seocho/doctors/data/_all.json`으로 다시 묶습니다.
2. 의료진·응급증상·FAQ 데이터를 읽어 `seo-snippets/*.html`을 다시 만듭니다.
3. 푸시된 브랜치의 Bootstrap과 주요 자산 캐시를 비웁니다.
4. 새 커밋 번호의 jsDelivr 자산을 미리 불러와 첫 접속 지연을 줄입니다.

`README.md`, `CLAUDE.md` 같은 문서만 바뀐 커밋은 위 경로에 포함되지 않으므로 사이트 배포를 실행하지 않습니다.

현재 확인된 워크플로우 점검 과제:

- `global/top-button.css`, `global/top-button.js`는 Bootstrap에서 로드하지만 purge·warm-up 목록에 없습니다.
- `emergency/branch-cta.css`, `emergency/branch-cta.js`는 purge 목록에는 있지만 warm-up 목록에는 없습니다.
- 이 문서 갱신에서는 워크플로우를 수정하지 않습니다. 해당 파일을 바꿀 때는 `@<SHA>` 실제 로드 여부를 별도로 확인하고 배포 설정을 함께 보완합니다.

## 저장소 구조

```text
home/                 홈 화면 로더, 섹션 애니메이션, 공용 메뉴·푸터
about/                Discover Helix 화면과 인증 카드 모달
global/               전역 스타일, 반응형 판정, CTA, 팝업, GA4·측정
services/             진료과목 화면
specialty/            특화진료 화면
emergency/            응급 증상 안내 화면과 증상 데이터
faq/                  FAQ 화면, 필터, 보호장치와 데이터
seocho/               서초본원 화면과 의료진 카드·상세 데이터
seo-snippets/         자동 생성되는 페이지별 구조화 데이터
scripts/              의료진·SEO 빌드와 측정 시트용 스크립트
.github/workflows/    GitHub Actions 배포 설정
```

주요 운영 문서:

- `CLAUDE.md`: 변경 금지 항목, 배포 규칙, 장애 이력과 재발 방지 기준
- `MEASUREMENT-PLAN.md`: GA4·시트 측정 구조와 점검 기준
- `HANDOVER-반응형-2026-08-17.md`: 반응형 작업 인수인계
- `HANDOVER-측정로그-2026-08-28.md`: 측정 로그 구조 개편 인수인계
- `home/INTERACTIONS.md`: 홈 인터랙션 구조
- `seocho/doctors/README.md`: 의료진 데이터 작성 규칙

## 작업 전 확인

1. `git status --short --branch`로 기존 변경사항이 있는지 확인합니다.
2. `CLAUDE.md`에서 대상 기능의 `LOCKED`, 배포, 검증 규칙을 찾습니다.
3. 현재 브랜치와 `origin/staging`, `origin/main`의 차이를 확인합니다.
4. 요청 범위 밖의 파일과 기존 사용자 변경사항은 건드리지 않습니다.
5. 새 폴더·파일이라면 배포 워크플로우의 경로와 파일 목록을 먼저 확인합니다.

## 완료 전 검증

변경한 코드가 맞는 것과 사이트에 실제 도달한 것은 별개입니다. 작업 범위에 맞춰 아래를 확인합니다.

### 로컬·저장소

- `git diff --check`: 공백 오류 확인
- `node --check <파일.js>`: 수정한 JavaScript 문법 확인
- JSON 파싱 또는 해당 빌드 스크립트 실행
- `git diff --cached --name-only`: 커밋 대상이 요청 범위와 일치하는지 확인
- PR base가 일반 작업은 `staging`, 측정 전용 작업은 `main`인지 확인

### GitHub Actions

- `node scripts/check-site-quality.mjs`: 전체 JavaScript 문법과 제목 구조·메뉴 ARIA·이미지 대체 텍스트 보정 규칙 확인
- `main` 또는 `staging` 대상 PR과 두 브랜치의 push에서는 `.github/workflows/site-quality.yml`이 위 검사를 자동 실행
- 자동 품질 검사가 실패하면 출력에 표시된 파일이나 누락 규칙을 수정한 뒤 다시 실행
- 변경 경로가 자동 배포 대상인지 확인
- 워크플로우의 성공 여부와 최종 커밋 번호 확인
- 자동 생성 파일이 추가 커밋을 만들었는지 확인

### 실제 화면

- 개발자 도구 Network에서 자산 주소가 `@<SHA>/...` 형태인지 확인
- Console 오류와 중복 실행 여부 확인
- 수정한 스타일의 실제 계산값과 클릭 동작 확인
- 데스크톱과 모바일에서 각각 확인
- 일반 변경은 스테이징 확인 전에는 정식 반영 완료라고 말하지 않기
- 측정 전용 변경은 정식 도메인에서 이벤트 발생, 중복 전송, 이벤트 값과 페이지·기기 정보를 확인하기

## 금지 사항

- `@latest` 사용
- Bootstrap을 거치지 않고 콘텐츠 CSS·JavaScript를 `@main` 또는 `@staging`에서 직접 로드
- 사용자에게 Webflow custom code를 직접 붙여 넣도록 요청
- 일반 변경을 스테이징 검증 없이 `main`으로 바로 반영
- 사용자 승인 없이 `staging → main` 승격
- `CLAUDE.md`의 `LOCKED` 동작을 확인하지 않고 수정
- GitHub Actions 성공만 보고 실제 사이트 반영까지 확인했다고 판단

## 참고

- 저장소의 기존 CSS·JavaScript·JSON만 바꾸는 작업은 GitHub 배포로 반영됩니다. Webflow Publish는 필요하지 않습니다.
- Bootstrap 진입점, Webflow head/freeform code, 페이지 요소나 스타일을 Webflow에서 바꾸는 작업은 별도 Webflow Publish가 필요합니다.
- jsDelivr 캐시를 수동으로 비우는 것은 예외 대응입니다. 정상 경로에서는 새 커밋 번호가 곧 새 주소이므로 브라우저 캐시를 임의의 시간값으로 계속 우회하지 않습니다.
- 운영 규칙이 서로 충돌하면 최신 사용자 지시, 저장소 작업 지침, `CLAUDE.md` 순서로 판단합니다.
