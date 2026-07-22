# Helix AMC Webflow — Claude 작업 가이드

## 🗣 용어 순화해서 표현하기 (LOCKED v1)

사용자에게 답할 때 **전문 용어를 그대로 던지지 말 것**. 코드 안에서는 정확한 명칭 그대로 써도 되지만, 사용자 대화·요약·진단 설명에서는 한 번에 들어오게 풀어 써야 함.

### 규칙

1. **영어 약어/전문어는 괄호로 한국어 풀이를 붙이거나 풀어쓰기**
   - ❌ "Hero FOUC 가드가 prepaint 단계에서 clip-path:inset 으로 마스킹"
   - ✅ "첫 화면 깜빡임을 막으려고, CSS 가 도착하기 전엔 슬로건/버튼을 잠깐 가려 둠"
2. **라운드트립, 게이트, 직렬, 핸드오프, 스태거, 트리거, 페이로드 같은 단어는 풀어쓰기**
   - "라운드트립 1회" → "서버에 한 번 다녀옴"
   - "3중 게이트" → "세 가지 조건이 다 통과해야 시작"
3. **파일 경로·셀렉터·CSS 속성명은 그대로 두되**, 그게 무슨 역할인지 한 줄 설명 붙이기
4. **원인·결과를 한 문장으로 먼저 말하고**, 디테일은 그 다음에. 사용자가 첫 줄만 읽어도 핵심 잡히게.
5. **bullet 안에서도 "왜 느린가 → 어떻게 고치나" 순서**. 기술 설명 먼저 늘어놓고 결론 맨 끝에 두지 말 것.

### 예시

❌ 나쁜 답:
> Webflow IX2 가 인라인 transform 을 박아서 fixed containing block 이 viewport 가 아닌 ancestor 기준이 되어 sticky 가 무력화됨

✅ 좋은 답:
> 헤더가 스크롤 따라 어긋나는 이유는, Webflow 가 본문에 살짝 변형을 걸어서 "고정" 기준점이 화면이 아니라 본문이 돼버렸기 때문. 본문의 그 변형을 꺼주면 됨.

## 🔌 Webflow MCP — data_* 는 헤드리스(캔버스 불필요), designer_* 만 캔버스 필요 (LOCKED v2, MCP v2.0.1 실증)

**갱신 배경**: 예전엔 "MCP 도구 = Designer 캔버스 열어둬야 동작"으로 알고 매번 캔버스 켜라고 안내했음. **MCP v2.0.1 에서 실제 테스트(디자이너 완전히 닫은 상태에서 `data_element_tool > set_attributes` 성공·검증)로 확인**: `data_*` 도구는 REST API 라 캔버스 안 열려 있어도 됨.

### 도구 두 종류 (핵심)

1. **`data_*` 도구 = REST API → 캔버스 불필요 (헤드리스 OK)**
   - `data_element_tool`(요소 트리 읽기·텍스트/스타일/속성/링크 수정·이동/생성/삭제), `data_pages_tool`, `data_component_tool`, `data_style_tool`, `data_cms_tool` 등.
   - **필요한 것은 `siteId` + `pageId` 뿐** (pageId 는 `data_pages_tool > list_pages` 또는 `designer_tool > get_current_page` 로).
   - Site ID: `69d090ea69d828e27d16ea29`. FAQ pageId 예: `6a4f46aa5c5fd95c7b128df3`.
2. **`designer_tool` = 라이브 UI 도구 → 캔버스 열려 있어야 함**
   - `select_element`(캔버스에서 선택해 보여주기), `get_selected_element`(현재 선택 읽기), `open_canvas`/`switch_page`(캔버스 이동). 사용자 화면에 실시간 반영하는 편의 기능.

### 운영 규칙

1. **요소/스타일/속성/텍스트 수정, 구조 읽기**는 `data_*` 로 **캔버스 없이** 처리 — 더는 "캔버스 켜주세요" 선요청 안 함.
2. **"이 요소 화면에서 선택해줘 / 지금 뭐 선택돼 있어?" 같은 라이브 편의**가 필요할 때만 Designer 열기 안내: `https://webflow.com/design/helix-amc` (Apps 패널에서 MCP/Companion 활성화).
3. **연결(인증)은 1회** — MCP 계정 연결은 로그인처럼 한 번 해두면 유지. (연결 자체는 예나 지금이나 필요. 바뀐 건 "매번 캔버스 열어두기"가 사라진 것.)
4. ⚠️ **충돌 주의**: `data_*` REST 로 수정하는 동안 Designer 를 동시에 열어두면 열린 캔버스가 덮어쓸 수 있음 → REST 작업 시엔 사용자에게 디자이너 닫아두길 권장.
5. **반영은 Publish 필요**: `data_*` 로 고친 디자인 변경은 Webflow **Publish** 해야 사이트 DOM 에 나타남 (`data_sites_tool > publish_site`, 스테이징은 `publishToWebflowSubdomain:true`). Publish 는 outward-facing → 실행 전 확인 1회.
6. MCP 없이도 가능한 대안(repo CSS/JS 직접 수정 등)이 있으면 함께 제시해 고르게 함.

## 🚫 사용자에게 커스텀 코드 붙여넣기 요구 금지 — Claude 가 API 로 처리 (LOCKED v1, 사용자 확정)

**사용자 확정 지시**: "커스텀 코드 절대 안 쓸거야." → 사용자는 Webflow 커스텀 코드(head/footer freeform)를 **직접 붙여넣거나 수정하지 않는다.** "이 두 줄 head 에 붙여주세요" 식 안내는 **금지.**

### 규칙

1. **페이지 로더가 필요하거나 잘못돼 있으면 Claude 가 직접 고친다.**
   - 도구: Webflow MCP `data_scripts_tool > get_page_freeform_code` (읽기) / `set_page_freeform_code` (쓰기).
   - 페이지 head freeform 을 GitHub/jsDelivr bootstrap 을 가리키도록 Claude 가 써 넣는다. 사용자는 손대지 않음.
2. **로직·자산은 항상 GitHub 리포 + jsDelivr (bootstrap 패턴) 로 관리.**
   - Webflow 호스팅 registered script (`website-files.com`) 로 로직을 옮기지 말 것. 코드는 GitHub 에 두고, 페이지 head 의 로더가 jsDelivr 로 불러오게만 함.
   - "GitHub 왜 안 쓰냐" = 이미 씀. 리포에 파일 올리고 staging 머지 → 페이지 head 로더가 그 파일을 로드. 페이지 head 로더 교정만 API 로.
3. **페이지 복제로 생긴 잘못된 로더 주의.**
   - 새 페이지를 기존 페이지 복제로 만들면 head 에 **원본 페이지의 로더가 그대로 복사**된다. 예: FAQ 페이지 head 가 `services/bootstrap.js` 를 가리키고 있었음 → faq 자산이 영영 안 뜸. Claude 가 `set_page_freeform_code` 로 `faq/bootstrap.js` 로 교정.
4. **라이브 쓰기·Publish 는 outward-facing** → 실행 전 사용자 확인 1회. freeform 교정 후에는 반드시 **Webflow Publish** 필요 (`data_sites_tool > publish_site`, staging 은 `publishToWebflowSubdomain:true`).

### 새 페이지 배포 체크 (개정)

- ❌ "head 에 붙여주세요" 안내
- ✅ (1) 리포에 `{page}/bootstrap.js` + 자산 push → staging 머지 (2) 워크플로우 paths/FILES 에 `{page}/**` 추가 (3) `get_page_freeform_code` 로 현재 로더 확인 → 잘못됐거나 없으면 `set_page_freeform_code` 로 교정 (4) `publish_site` 로 Publish (5) 사용자는 확인만.

## 🔥 새 폴더/페이지 작업 시 — 워크플로우 paths 필터 점검 (LOCKED v1, PR #621~#630 교훈)

**증상**: 코드 푸시 → PR 머지했는데 사이트에 반영 안 됨. "캐시 기다려 주세요" 만 반복하게 됨.

**원인**: `.github/workflows/webflow-deploy.yml` 의 `on.push.paths` 와 퍼지 대상 `FILES` 목록에 해당 폴더가 빠져 있으면, 푸시가 워크플로우를 **아예 트리거 안 함** → jsDelivr `@main`/`@staging` 캐시가 옛 bootstrap 그대로 → 사용자 브라우저에 영영 새 코드 도달 안 함.

### 새 작업 시작 전 BLOCKING CHECK

`{newdir}/` 폴더에서 작업을 시작하기 전, **반드시 먼저** `.github/workflows/webflow-deploy.yml` 을 열어 두 가지를 확인:

1. `on.push.paths` 에 `'{newdir}/**'` 포함되어 있는가?
2. `Purge jsDelivr cache` 단계의 `FILES=()` 배열에 `{newdir}/bootstrap.js` (또는 그 폴더의 동적 로더 파일) 포함되어 있는가?

둘 중 하나라도 누락이면, **콘텐츠 작업 PR 과 별개로** 먼저 워크플로우 패치 PR 을 만들거나 같은 PR 에 함께 넣어야 함.

### ⚠️ 함정 — 워크플로우 자체 변경은 paths 필터에 안 걸림

`.github/workflows/webflow-deploy.yml` 만 수정한 PR 은 그 자체로 워크플로우를 트리거 안 함 (paths 필터에 `.github/**` 없음). 따라서:

- 워크플로우 paths 를 늘리는 PR 머지 **직후**, 그 폴더 안 파일에 사소한 변경 (예: 헤더 주석의 버전 번호 bump) 을 추가 푸시해서 워크플로우를 실제로 한 번 돌려야 함
- 혹은 워크플로우 패치와 콘텐츠 변경을 같은 PR 에 넣어 한 번에 처리

### 진단 코맨드

새 폴더 작업 들어가기 전 무조건:
```bash
grep -E "paths:|FILES=\(" -A20 .github/workflows/webflow-deploy.yml | head -40
```
해당 폴더 보이면 OK, 안 보이면 먼저 워크플로우 패치.

### 실패 사례 (재발 금지)

PR #621 (네이버 SDK 키 파라미터 수정) 머지했는데 사이트 반영 안 됨 → "캐시 기다리세요" 안내 → 사용자 시크릿 창 새로고침 수회 → PR #622 (workflow paths 추가) 머지했는데 그 PR 자체도 트리거 안 됨 → PR #623 (seocho/bootstrap 헤더 bump) 으로 강제 트리거 → 그제서야 반영. 사용자가 "하루종일 뺑이쳤다" 분노. 첫 PR 만들기 전 본 체크 1분만 하면 됐던 일.

---

## 🔥 jsDelivr edge 캐시 stale — bootstrap.js FILES 배열 변경 시 (LOCKED v1, PR #703~#713 교훈)

**증상**: 새 폴더 (예: `seocho/doctors/`) 만들고 bootstrap.js 의 `FILES` 배열에 `'seocho/doctors/modal.js'` 등 추가. PR 머지 → 워크플로우 그린 → 사용자 시크릿 창에서도 모달 안 뜸. Network 탭에 modal.js 자체가 안 잡힘.

**원인**: 워크플로우의 `Purge jsDelivr cache for bootstrap.js` 단계가 성공해도, jsDelivr 의 **edge 노드 일부가 여전히 옛 bootstrap.js 를 캐시** 중. 그 옛 bootstrap.js 의 FILES 배열엔 새 modal 등록이 없어, 사용자 브라우저가 modal.js 를 영영 inject 받지 못함.

### 진단 (사용자 콘솔에서)

서초본원 페이지에서 F12 → Console:

```js
// 1. Webflow Publish OK 인지 (attribute 박혔는지)
document.querySelectorAll('[data-doctor-open]').length
// 0 → Publish 안 함 / 1+ → Publish OK

// 2. modal.js 가 init 됐는지
window.__helixDoctorModalInit
// undefined → modal.js 미실행 (이게 stale 캐시 신호)

// 3. bootstrap.js 가 stale 캐시인지 확정
fetch(document.querySelector('script[src*="seocho/bootstrap"]').src + '?cb=' + Date.now())
  .then(r=>r.text())
  .then(t=>console.log('modal:', t.includes('seocho/doctors/modal.js'), '| v최신?', t.includes('v1.4')))
// false false → stale 확정
```

### 처방 — 강제 퍼지 콘솔 명령 (사용자에게 그대로 안내)

```js
['seocho/bootstrap.js','seocho/doctors/modal.js','seocho/doctors/modal.css']
  .forEach(f=>fetch('https://purge.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/'+f)
    .then(r=>r.json())
    .then(j=>console.log(f, j.status||j)))
```

각 파일별 `finished` 응답 → 30초 후 Ctrl+Shift+R. main 배포 시엔 URL 의 `@staging` 을 `@main` 으로.

### 예방 — 새 폴더/파일 추가 시 즉시 자동 안내

새 모듈 추가하는 PR 직후 사용자가 검증 못 하는 환경이면, **이 콘솔 명령을 PR 머지 시점에 미리 안내**. 워크플로우의 자동 퍼지만 믿지 말 것.

### 실패 사례 (재발 금지)

`seocho/doctors/` 의료진 모달 인프라 추가 (PR #703~#711) 후 사용자가 스테이징에서 검증 — Webflow Publish OK, attribute 84개 다 박힘, 그러나 모달 안 뜸. 콘솔에 `__helixDoctorModalInit=undefined`. PR #713 으로 bootstrap.js v1.3→v1.4 버전 bump 푸시 — 워크플로우 그린이지만 여전히 jsDelivr edge 캐시 stale. 결국 사용자가 콘솔에서 직접 `purge.jsdelivr.net` 강제 호출 후에야 동작. 사용자 "어휴 진짜". 본 처방 콘솔 명령 한 줄을 처음부터 안내했으면 30초였을 일.

---

## 🔎 SEO 구조화데이터 — **자동 로더 방식** (LOCKED v1, 사용자 확정)

**방침**: 페이지별 JSON-LD(구조화데이터)는 Webflow head 에 **정적으로 붙여넣지 않고**, 각 페이지 head 에 심어둔 **작은 자동 로더**가 런타임에 `seo-snippets/<page>.html` 을 fetch 해서 `<script type="application/ld+json">` 만 뽑아 head 에 주입한다. → 슬러그·내용이 바뀌어도 **Webflow 에 다시 붙여넣을 필요 없음** (코드만 고치면 됨).

### 메커니즘

각 페이지 head freeform code 에 (기존 gsap/bootstrap 뒤에) 이 로더 한 덩어리:
```html
<script>
(function(){
  var b=/\.webflow\.io$/i.test(location.hostname)?"staging":"main";
  fetch("https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@"+b+"/seo-snippets/<page>.html")
    .then(function(r){return r.ok?r.text():"";})
    .then(function(h){ if(!h)return;
      var d=document.createElement("div"); d.innerHTML=h;
      var n=d.querySelectorAll('script[type="application/ld+json"]');
      for(var i=0;i<n.length;i++){var s=document.createElement("script");s.type="application/ld+json";s.textContent=n[i].textContent;document.head.appendChild(s);}
    }).catch(function(){});
})();
</script>
```
- bootstrap 과 동일한 **도메인 게이트**: 정식→`@main`, 스테이징(`*.webflow.io`)→`@staging`
- `innerHTML` 로 파싱된 `<script>` 는 실행 안 됨 → textContent 만 복사해 새 script 노드로 주입 (Google 은 렌더링 시 읽음)

### 적용 현황 (4개 SEO 페이지 전부)

| 페이지 | Webflow page slug | fetch 대상 |
|---|---|---|
| 홈 | `/` | `seo-snippets/home.html` |
| about | `/discover-helix` | `seo-snippets/discover-helix.html` |
| 서초 본원 | `/seocho` | `seo-snippets/seocho.html` |
| 응급증상 | `/symptoms` | `seo-snippets/symptoms.html` |

### 새 SEO 페이지 추가 시

1. `scripts/build-seo.js` 에 빌더 추가 → `node scripts/build-seo.js` → `seo-snippets/<page>.html` 생성
2. **워크플로우** (`webflow-deploy.yml`) 의 퍼지 FILES + 워밍업 FILES 배열에 `seo-snippets/<page>.html` 추가 (안 하면 jsDelivr 캐시가 옛날 것 → 로더가 stale SEO 주입)
3. Webflow 해당 페이지 head 에 위 로더(page 이름만 교체) 붙여넣기 → Publish

### 변경하면 안 되는 것

- ❌ 정적 JSON-LD 를 head 에 다시 하드코딩 (슬러그 바뀔 때마다 재붙여넣기 지옥 재발 — 이걸 없애려고 로더로 전환함)
- ❌ 도메인 게이트를 브랜치 분기로 바꾸기 (bootstrap 과 동일하게 hostname 기준 유지)
- ❌ 새 SEO 페이지 추가하면서 워크플로우 FILES 배열 누락 (캐시 stale → 로더가 옛 데이터 주입)

---

## 워크플로우 — **staging 우선 배포** (LOCKED v1, PR #546)

### 브랜치 전략
- `main` = 정식 사이트 (`helixamc.com` 등)
- `staging` = Webflow 스테이징 사이트 (`*.webflow.io`)
- `claude/*` = 작업 브랜치

### 배포 흐름
1. 작업 완료 → 커밋·푸시 → PR 생성. **PR base 는 항상 `staging`**.
2. **PR 생성 직후 Claude 가 즉시 머지** (squash) → `staging` 브랜치 갱신 → 워크플로우가 `@staging` 캐시 퍼지 → 스테이징 사이트에만 반영 (정식 무영향)
3. 사용자가 스테이징에서 검증 후 OK 라고 하면, 그 때 `staging → main` PR 생성·머지 → 정식 반영

### 머지 자동화 — 사용자 별도 지시 없어도 기본값 (LOCKED)
- `claude/* → staging` PR 은 **사용자 확인 대기 없이 즉시 머지**. 머지하지 않으면 스테이징 사이트에 반영이 안 돼 사용자가 검증할 수 없음.
- 도구: `mcp__github__merge_pull_request` (`merge_method: "squash"`).
- 머지 실패 (CI 실패, 충돌 등) 시에만 사용자에게 보고. 성공 시 PR 번호·머지 SHA 만 짧게 알림.
- `staging → main` PR 은 **사용자가 명시적으로 "main 으로 올려" 라고 지시할 때만** 생성·머지. 자동 머지 금지.

### 절대 금지
- ❌ PR base 를 `main` 으로 직접 만들기 (긴급 hotfix 외)
- ❌ `staging` 검증 없이 main 직진
- ❌ 워크플로우에 staging↔main 자동 동기화 재도입 (분리 의미 소실)
- ❌ `claude/* → staging` PR 을 만들어 놓고 머지 안 하기 — 사용자 검증 불가

### 메커니즘
- `home/bootstrap.js` + `about/bootstrap.js`: `var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';`
- `*.webflow.io` 도메인 → `@staging` 브랜치 콘텐츠 로드
- 정식 도메인 → `@main` 브랜치 콘텐츠 로드
- 워크플로우 (`.github/workflows/webflow-deploy.yml`): `main` / `staging` 푸시 둘 다 트리거, **푸시된 ref 의 캐시만** 퍼지/워밍업

## 📊 GA4 측정은 정식(main)에서만 — 스테이징 도메인 게이트 (LOCKED v1)

**방침**: 측정(GA4)은 **정식 사이트에서만** 동작. 스테이징(`*.webflow.io`)은 실사용 사이트가 아니므로, 여기서 측정을 쏘면 정식 GA4 속성(`G-PWCB5MVC32`)에 테스트 트래픽이 섞여 데이터가 오염됨.

### 확정 메커니즘 — 도메인 게이트 (브랜치 분기 아님)

측정 코드는 **양쪽 브랜치(main/staging)에 동일하게** 두되, 런타임에 `location.hostname` 으로 걸러 스테이징에선 no-op:

| 파일 | 스테이징(`*.webflow.io`) 동작 |
|---|---|
| `global/ga4-base.js` | gtag.js inject / config skip. no-op `gtag` stub 만 정의 후 return → 모든 모듈의 `gtag('event', ...)` 조용히 무시 |
| `global/scroll-depth.js` | 페이지뷰·스크롤 깊이 측정 안 함 (즉시 return) |
| `global/ga-inspector.js` | `?ga-inspect=1` 이어도 테두리·배지·실시간 로그 미표시 |

게이트 판정: `/\.webflow\.io$/i.test(location.hostname)`

### 왜 브랜치 분기가 아니라 도메인 게이트인가

브랜치별로 측정 코드를 다르게 두면 (staging 엔 삭제, main 엔 유지) main↔staging 머지 때마다 충돌·드리프트. 도메인 게이트는 **코드는 하나**, 판정만 런타임 → staging 승격(staging→main) 시 그대로 따라가도 정식 도메인에선 게이트가 안 걸려 측정 정상 동작.

### 변경하면 안 되는 것

- ❌ 새 측정 모듈 추가 시 이 게이트 누락 (staging 에서 측정 새어나감)
- ❌ 게이트를 브랜치 분기(`BRANCH === 'staging'`)로 바꾸기 — 도메인 기준 유지 (로컬/프리뷰 도메인 대응)
- ❌ 측정 코드를 staging 브랜치에서만 삭제 (드리프트 유발)

### 새 측정 붙일 때 체크

측정(gtag 이벤트)을 새로 붙이는 모듈은, 위 세 파일의 게이트에 편승(대개 `ga4-base.js` 의 no-op stub 이 알아서 무시)하므로 별도 조치 불필요. 단 **자체적으로 gtag.js 를 직접 로드하는 새 진입점**을 만들면 반드시 같은 도메인 게이트를 넣을 것.

### 🚩 측정 변경은 스테이징 안 거치고 main 으로 직행 (LOCKED v1, 사용자 지시)

**방침 (사용자 확정)**: 측정(GA4) 관련 변경은 **staging 을 거치지 않고 PR base 를 `main` 으로 직접** 만들어 정식에 바로 반영. 스테이징 사이트는 실사용이 아니고 도메인 게이트로 어차피 측정이 꺼져 있어, staging 에서 검증할 것이 없음 → staging 라운드트립은 무의미.

- ✅ 측정 PR: `claude/* → main` 직접 (일반 `→ staging` 규칙의 예외)
- ✅ 측정과 무관한 일반 작업은 기존대로 `→ staging` 우선
- ⚠️ 이 때문에 측정 코드를 품은 파일(예: `seocho.js`, `floating-cta.js`, `sections-animations.js`)은 main 이 staging 보다 앞설 수 있음. 나중에 그 파일의 **비측정** 변경을 staging 으로 올려 `staging → main` 승격할 때 충돌 나면, **측정 코드는 main 쪽을 살리고** 병합.
- ❌ 측정 변경을 staging 에 올려두고 "검증해 달라" 하지 말 것 (사용자가 명시적으로 지침 반복함: "스테이징엔 측정 관련한건 안 붙이기로 했잖아")

> 도메인 게이트(위)는 그대로 유지 — 혹시 측정 코드가 feature 파일 편승으로 staging 에 섞여 들어가도 실제 발사는 정식에서만 되도록 하는 안전장치.

## ⚠️ 모바일 viewport 격리 — 건드리지 말 것 (LOCKED v1, PR #586/#587/#588)

**대상 파일**: `global/global.css`

### 확정 규칙

```css
html, body {
  overflow-x: clip;          /* ⚠️ hidden 절대 금지 */
  max-width: 100vw;
}
body,
body > .page-wrapper,
body > main,
body > .main-wrapper {
  transform: none !important;
  filter: none !important;
  perspective: none !important;
}
header.header {
  position: fixed !important;
  top: 0 !important;
  transform: none !important;
  transition: none !important;
}
```

### 왜 필요한가

모바일 about 에서 (1) 헤더가 스크롤 따라 위로 사라지고 (2) 서브헤더가 헤더 밑에 안 붙고 (3) 가로 스크롤이 생기며 (4) fixed 위로가기 버튼이 옆으로 밀리는 회귀가 반복 발생.

**원인 두 가지**:
1. 어떤 자손이 100vw 초과 → 가로 스크롤 가능
2. 어떤 ancestor (body / page wrapper / IX2 가 박은 transform) 에 `transform`/`filter`/`perspective` 가 걸려 새 containing block 생성 → 자식의 `position: fixed` 가 viewport 가 아닌 그 ancestor 기준으로 잡혀 함께 스크롤됨

### ⚠️ overflow-x: hidden 절대 금지 (재시도 금지)

`overflow-x: hidden` 을 쓰면 브라우저가 `overflow-y` 를 `auto` 로 묵시 승격시킴 → **body 가 스크롤 컨테이너로 승격** → 자손의 `position: sticky` 가 viewport 가 아닌 body 기준이 되어 무력화됨 (서브헤더가 헤더 밑에 안 붙는 직접 원인).

`overflow-x: clip` 은 overflow-y 에 영향을 주지 않아 sticky 가 정상 동작. 가로 스크롤 차단 효과는 동일. 현대 브라우저 (iOS Safari 16+ / Chrome 90+ / Firefox 81+) 모두 지원.

### 변경하면 안 되는 것

- ❌ `overflow-x: clip` → `hidden` 으로 회귀 (sticky 즉시 깨짐)
- ❌ `html, body` 의 `overflow-x` 규칙 제거 (가로 스크롤 회귀)
- ❌ `body / .page-wrapper / main wrapper` 의 `transform: none !important` 제거 (IX2 가 박는 transform 으로 fixed 어긋남 재발)
- ❌ `header.header { position: fixed !important; top: 0 !important; transform: none !important }` 의 어느 한 줄도 약화 (모바일 hide-on-scroll 회귀)
- ❌ `section.subheader { position: sticky !important; top: var(--header-h, 56px) !important }` (about.css) 의 sticky 모드 변경

### 시도했다가 실패한 방식 (재시도 금지)

- PR #586: `overflow-x: hidden !important` → 가로 스크롤은 막혔으나 서브헤더 sticky 동시 파괴 (이 LOCKED 의 핵심 교훈)
- header 만 fixed 처리, body transform 무력화 누락 → IX2 의 wrapper transform 으로 fixed 어긋남 재발

### 디버그

모바일에서 회귀 의심 시:
```js
// DevTools console — body 의 스크롤 컨테이너 여부 확인
getComputedStyle(document.body).overflowY  // 'visible' 이어야 함. 'auto' 면 sticky 깨짐
// transform 박힌 ancestor 확인
[...document.querySelectorAll('body *')].filter(el => getComputedStyle(el).transform !== 'none').slice(0, 5)
```

---

## 프로젝트 개요
Webflow로 만든 Helix 동물병원(helix-amc) 사이트의 커스텀 CSS/JS를
GitHub에서 관리하고 jsDelivr CDN으로 자동 배포하는 구조.

## 핵심 아키텍처 — **Bootstrap 패턴**

Webflow Page Settings의 `<head>`에 **딱 두 줄**만 붙여져 있음:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/home/bootstrap.js"></script>
```

`home/bootstrap.js`가 런타임에 GitHub API로 `main` 브랜치 최신 커밋 SHA를
조회해서, 그 SHA의 immutable jsDelivr URL로 CSS/JS를 동적 로드함.
이 덕분에 **jsDelivr `@main` 캐시 꼬임 문제를 원천 회피**.

## 배포 플로우
1. `home/**` 아래 파일 수정 → 커밋 → `main` 푸시
2. `.github/workflows/webflow-deploy.yml` 자동 실행 → bootstrap.js의 jsDelivr 캐시 퍼지
3. 사용자 사이트 새로고침 시 bootstrap이 최신 SHA 조회 → 즉시 반영
4. **Webflow 건드릴 일 없음** (최초 1회 붙여넣기 외)

## 파일 구조
```
home/
├── bootstrap.js              # 동적 로더 — 거의 건드리지 않음
├── section1/
│   ├── section1.css          # Hero 섹션 스타일
│   └── section1.js           # GSAP 타임라인 (슬로건/배경/버튼 순차 등장)
├── section-divider/
│   ├── divider.css           # S1→S2 연결선 (1px #0075d6)
│   └── divider.js            # 스크롤 연동 draw/erase 애니메이션
└── global/
    ├── buttons.css           # .bt-box-1~4 글로우
    └── buttons.js            # IntersectionObserver 트리거
```

## 주요 CSS 클래스 참조
- `.discover-helix_button` — Hero 메인 버튼 (알맹이)
- `.bt-box-1` ~ `.bt-box-4` — 버튼 래퍼 (글로우 효과 대상, `.bt-box-4`만 퍼플)
- `.flex-block-23 .cta-style` — 섹션별 CTA
- `.home_slogan`, `.div-block-150`, `.home_background` — Hero 영역 요소
- `.section2-heading` — (선택) 섹션 2 헤딩 명시용. 없으면 divider.js가 DOM 자동 탐지

## 색상 규약
- 메인 블루: `#0075d6`
- SVIC 퍼플: `#5528aa`
- 배경: `#0d1117`

## ⚠️ 버튼 글로우 — 건드리지 말 것 (LOCKED v4)

**모든 페이지 / 모든 버튼 통일 사양** (홈 + about 일괄 적용)

### 글로우 값 (단일 그림자 + α 변동)

| 종류 | 셀렉터 | box-shadow |
|---|---|---|
| 블루 | `.bt-box-1/2/3` (홈) / `.cta_seocho_button`, `.cta-style` (about) | `0 0 0.85vw 0.3vw rgba(0,117,214,α)` |
| 퍼플 (SVIC) | `.bt-box-4` (홈) / `.link-block` (about) | `0 0 1.05vw 0.5vw rgba(85,40,170,α)` |

- α 피크 (0%/100%): **1.0**
- α 밸리 (50%): **0.55**
- 주기: **5.0s**, 이징: **`cubic-bezier(0.445, 0.05, 0.55, 0.95)`** (easeInOutSine)
- blur/spread는 피크-밸리 동일, **α만 변동**

### 시퀀스 (모든 버튼 공통)

1. 초기화 시 maxGlow inline `!important` 설정 (피크 α=1.0)
2. 버튼 opacity 0→1 페이드인 (글로우도 opacity에 편승해 같이 등장)
3. 페이드인 완료 후 **1.5초 홀드** (피크 유지)
4. inline `box-shadow` 제거 + `is-looping` 클래스 추가 → CSS keyframe shimmer 핸드오프

### 통제 주체

| 버튼 | 페이드인 통제 | 키프레임 |
|---|---|---|
| `.bt-box-1` | `home/section1/section1.js` (Hero 시퀀스) | `glowShimmerBlue` @ `home/global/buttons.css` |
| `.bt-box-2` | `home/global/sections-animations.js` (sec2 ScrollTrigger) | `glowShimmerBlue` |
| `.bt-box-3` | `home/global/sections-animations.js` (sec3 ScrollTrigger) | `glowShimmerBlue` |
| `.bt-box-4` | `home/global/buttons.js` (IntersectionObserver) | `glowShimmerPurple` |
| `.cta_seocho_button`, `.cta-style` | `about/about.js` (IntersectionObserver) | `aboutGlowShimmerBlue` |
| `.link-block` | `about/about.js` (IntersectionObserver) | `aboutGlowShimmerPurple` |

### 핵심 포인트

- 베이스 `transition: box-shadow 0.6s` 가 is-looping 전환에 개입하지 않도록 `.is-looping` 에 `transition: none !important` 필수
- 글로우 페이드인은 **별도 GSAP 트윈을 하지 않고** 버튼 자체의 opacity 페이드인에 편승 (안 그러면 v1, v2 처럼 어두운 상태에서 밝아지는 느낌이 남)
- `home/global/buttons.js` 셀렉터에 `.bt-box-1`, `.bt-box-2`, `.bt-box-3` 의도적 제외 — 각각 section1.js / sections-animations.js 가 통제 (race 방지)
- 페이드인 maxGlow 인라인 값과 키프레임 0%/100% 값은 **반드시 동일** — 핸드오프 시 점프 방지
- 새 페이지/버튼 추가 시: 위 표의 값 그대로 사용 + 동일 시퀀스 (페이드인 → 1.5s 홀드 → is-looping)

### 이전에 시도했다가 실패한 방식들 (재시도 금지)
- `is-holding` CSS 클래스 (`box-shadow !important`) → CSS animation 충돌로 shimmer 불가
- GSAP multi-shadow 트위닝 fromVars → 파싱 오류로 툭 꺼짐
- GSAP 0.5~0.6s 글로우 페이드인 트윈 → 덜 밝은 상태에서 밝아지는 느낌 (v1, v2)
- `is-looping`만 단독 추가 → 툭! 튀는 현상 (글로우가 nothing → max로 점프)

## 하면 안 되는 것
- Webflow API로 head code 직접 수정 시도 ❌
  → Site API 토큰으로는 `PUT /v2/sites/{id}/custom_code`가 `invalid_auth_version` 403 반환. OAuth App 아니면 불가.
- jsDelivr `@main` 직접 참조 (bootstrap.js는 예외) ❌
  → 캐시 꼬임. 항상 bootstrap 패턴 통해서 commit SHA로 로드.
- `@latest` 사용 ❌ → GitHub Release에 바인딩되며 업데이트 안 됨.
- 버튼 글로우 로직 수정 ❌ → 위 LOCKED v4 섹션 참조 (홈 + about 통일 사양).

## 디버그 팁
- 라인 애니메이션: URL에 `?debug-line=1` 추가 → 콘솔 로그
- 배포 확인: 시크릿 창으로 사이트 열고 DevTools Network에서 파일이 `cdn.jsdelivr.net/gh/.../@<sha>/...` 형태로 로드되는지 확인
- Actions Summary에서 붙여넣을 head code 다시 볼 수 있음

## ⚠️ About 섹션 1 Hero 폰트 swap 깜빡임 차단 — 건드리지 말 것 (LOCKED v1)

**커밋**: PR #450 (`about/section1: width-metric ground-truth 게이트`)

### 문제 (해결됨)

`.about-heading` 페이드인 중간에 폴백 폰트 → 지정 폰트로 swap 되며 깜빡이던 현상.

### 확정 메커니즘 — `whenHeroFontReady` + `waitFontByMetric` (about/about.js)

페이드인 시작 게이트는 **3중 직렬**:

1. **`whenHeroFontReady()`** — `document.fonts.load()` 다중 호출
   - hard-coded `HERO_FONT='ds-endendend'` weight 400/700
   - `.about-heading` / `.about_contents_sub-title` 의 **computed** font-family/weight/style 도 동적 추출해 명시 load (텍스트 인자 포함)
   - `document.fonts.ready` 까지 대기
   - `document.fonts.check()` 폴링 (~0.5s 상한)
   - 2x rAF layout/paint 동기화

2. **`document.fonts.ready`** — 페이지 내 모든 in-use 폰트 대기

3. **`waitFontByMetric()`** — width-metric ground-truth (FontFaceObserver 기법)
   - `'BESbswy'` 텍스트를 두 off-screen span 에 렌더 (monospace fallback / target+monospace)
   - 두 span 의 `offsetWidth` 가 달라지는 순간 = target 폰트 실제 적용
   - `.about-heading` 의 computed family/weight/style 로 측정
   - 4s 폴링 상한

폴백 타임아웃: **6초** (3중 게이트 모두 실패 시 강제 시작)

### 시도했다가 실패한 방식 (재시도 금지)

- `document.fonts.load('1em "ds-endendend"')` 두 weight 만 트리거 → 헤딩 weight 가 다르면 무용 (PR #447)
- `document.fonts.ready` 만 추가 → API 자체가 일찍 resolve (PR #447 만으론 부족)
- `document.fonts.check()` 폴링 추가 → 여전히 false positive 케이스 (PR #448 만으론 부족)
- computed font-family 동적 추출 → 그래도 swap 잔존 (PR #449 만으론 부족)
- 폴백 타임아웃을 너무 짧게 (2s 등) → 폰트 로드 느린 환경에서 게이트 무효화

### 변경하면 안 되는 것

- 3중 게이트 중 하나라도 제거 ❌ (각 게이트가 서로의 false positive 를 방어)
- width-metric 의 'BESbswy' 텍스트 / monospace 폴백 변경 ❌ (FontFaceObserver 정석값)
- 폴백 타임아웃 6s 단축 ❌
- `runTextTimeline()` 의 GSAP `gsap.set(allText, { opacity: 0 })` 순서 변경 ❌

### 디버그

`?debug-about=1` 콘솔 로그:
- `font metric: loaded <family> (<ms>ms)` — 정상
- `font metric: TIMEOUT <family>` — 4s 안에 swap 감지 못함 → preload `<link>` 처방 검토

---

## ⚠️ About 핵심 장비 섹션 (캐논 알페닉스) — 건드리지 말 것 (LOCKED v1)

**커밋**: `d7af70a` (about/equipment: 알페닉스만 페이드 + 나머지 IX2 무력화 #445)

### 확정 사양

대상 페이지: **about** (홈 아님)

DOM 구조:
```
section.blackframe_image-he             ← 배경 (인터랙션 없음)
└── section.clearframe
    └── div
        ├── h2.parag_title-w            "핵심 장비"          (인터랙션 없음)
        ├── div.div-block-130
        │   └── div.about_title-a-b
        │       ├── h1.official-font_title     "캐논 알페닉스"  ← 유일한 인터랙션
        │       └── h1.official-font_title_en  "Canon Alphenix" (인터랙션 없음)
        └── p.nomalparag-w_left-spacing  "병변을 3D 영상으로..." (인터랙션 없음)
```

### 유일한 인터랙션: 한글 캐논 알페닉스

| 항목 | 값 |
|---|---|
| 트리거 | IO `rootMargin: '0px 0px -25% 0px'`, `threshold: 0` |
| 페이드 | opacity 0→1, 1.6s, `cubic-bezier(0.87, 0, 0.13, 1)` |
| sweep 시작 | 페이드 fire 시점 +1700ms |
| sweep 파라미터 | `peakColor: '0,117,214'`, `peakAlpha: 0.85`, `bandWidth: 14`, `duration: 1700` |
| sweep 메커니즘 | `helixShineSweep` (About Mini Title LOCKED v1 과 동일) |

### 핵심 메커니즘 — IX2 무력화

`about.js > initClearframeAlphenixReveal()` 가:
1. `section.blackframe_image-he` (없으면 `section.clearframe`) 안 모든 노드 순회
2. 알페닉스 h1 **제외** 한 모든 노드에서:
   - `data-w-id` 제거 → Webflow IX2 바인딩 차단
   - 인라인 `opacity` / `transform` / `visibility` 제거
   - `opacity:1` / `visibility:visible` / `transform:none` **!important 인라인** 강제
3. 다중 시점(즉시 / +300ms / +1200ms) — IX2 늦은 바인딩 커버

### 시도했다가 실패한 방식 (재시도 금지)

- `section.clearframe` 전체 opacity 0→1 페이드 → 헤드/영문/본문이 모두 같이 페이드돼 사용자 사양 위반 (PR #443/#444 이전 상태)
- 홈 페이지에 `home/equipment/equipment.js` 등록 → 핵심 장비 섹션은 about 페이지에만 있어 home 에선 무동작 (#443/#444). 현재 무해하지만 정리 보류 — 추후 home 에 같은 섹션 생기면 활용
- CSS `!important` 만으로 IX2 인라인 덮기 시도 → IX2 가 바인딩되면 매 프레임 opacity 갱신 가능성 → 인라인 !important + `data-w-id` 제거 둘 다 필요

### 변경하면 안 되는 것

- 캐논 알페닉스 외 다른 요소에 fade / scale / 인터랙션 추가 ❌
- 섹션 전체 페이드로 회귀 ❌
- sweep 파라미터 (peakAlpha 0.85, bandWidth 14, duration 1700) 변경 ❌
- 다중 시점 무력화 줄이기 ❌ (IX2 타이밍 race 재발)

---

## ⚠️ About Mini Title 빛반사 — 건드리지 말 것 (LOCKED v1)

**커밋**: `6d65738` (about: 빛반사 bg-clip 모드 영구 유지로 어긋남 제거)

### 확정 사양

대상: `about/about.js` 의 `.about_mini_title` 중 **텍스트 정확 매칭 4개**
- "일년 365일", "하루 24시간", "특화", "응급 케어"

| 항목 | 값 |
|---|---|
| peakColor | `0,117,214` (메인 블루) |
| peakAlpha | `0.6` |
| bandWidth | `28` (피크 ±28% gradient stop) |
| duration | `1500ms` |
| start delay | `150ms` (그룹 진입 후 첫 sweep 까지) |
| gap | `200ms` (sweep 종료 후 다음 sweep 까지) |
| bg-size | `500% 100%` (양 끝 모두 tint 가시 영역 밖) |
| keyframes | `helix-shine-sweep`: bg-position 100% → 0% |
| timing | `cubic-bezier(0.7, 0, 1, 1)` (급격한 ease-in) |
| trigger | 가장 가까운 안정적 부모 (section/main) IntersectionObserver, 카드덱 transform 회피 |
| 그룹 발사 | 같은 트리거 안의 mini title 들은 한 그룹으로 **순차** 재생 |

### 핵심 메커니즘 (재발 방지)

1. **`helixShinePrime`**: 페이지 로드 시점에 4개 mini title 모두 `bg-clip:text` + 단색 그라데이션 + `color:transparent` 영구 적용. 모드 전환 자체를 없앰.
2. **`helixShineSweep`**: bg-image 만 sweep 그라데이션으로 swap → 애니메이션 → 종료 후 단색 그라데이션으로 다시 swap. 렌더링 모드는 항상 동일.
3. base 색은 `getComputedStyle().color` 에서 RGBA 모두 파싱 (알파 보존). peakRGB 는 base 색과 peakColor 를 peakAlpha 로 미리 믹스해 stop 모두 동일 알파.
4. tint stop (`lo% ~ hi%`) 이 시작/종료 visible window 밖에 위치 → 잔여 틴트 없이 자연 종료.

### 시도했다가 실패한 방식 (재시도 금지)

- 오버레이 span 방식 (absolute position) → 1~2px 어긋난 안티앨리어스 가장자리가 흰 띠로 보임
- bg-clip:text 모드를 sweep 시점에만 적용/해제 → 모드 전환마다 글리프 렌더링이 바뀌어 "툭" 어긋남
- `mix-blend-mode: screen` → 부모 stacking context 와 충돌해 sweep 자체가 안 보임
- `background-size: 200%` + position `-25%` 오버슈트 → 좌측 25% 영역이 bg 커버 밖으로 빠져 와이퍼 재발
- 단일 sentinel 로 4개 동시 발사 → 카드덱 아래쪽 카드의 sweep 이 사용자 도달 전에 이미 끝남
- 엘리먼트 자체에 IntersectionObserver → 카드덱 transform 으로 intersect 가 안 잡혀 영영 발사 안 됨
- `transition` + RAF 더블 트릭 → 시작점 페인트를 건너뛰고 종료점만 보여주는 케이스 발생

## 📌 Version Backup 1 (섹션 1 버튼까지 확정)

**커밋**: `828e698` (divider: BTN1_CLASS .discover-helix_button으로 복원)

**안정적 상태**:
- ✅ 섹션 1 Hero: 슬로건/버튼/배경 페이드인 애니메이션
- ✅ 버튼 1 글로우: LOCKED (절대 수정 금지)
- ⚠️ 섹션 1-2 헬릭스 라인: 위치 조정 중

**복원 방법**: `git revert d94c9d4` (현재) → `828e698`로 돌아옴

---

---

## ⚠️ About 본문 박스 (.about_three_contents-box) — 건드리지 말 것 (LOCKED v1)

**커밋**: PR #553 → #554 → #555 (staging) → 본 PR 로 정식

### 확정 사양

대상: `.about_three_contents-box` (about 페이지 섹션 2 본문 박스 3개)

**인터랙션 전면 제거 — 항상 처음부터 그대로 표시.** 슬라이드 X, 페이드인 X, blur X.

### 확정 메커니즘

`about/about.css`:
```css
.about_three_contents-box,
.about_three_contents-box.is-visible {
  opacity: 1 !important;
  transform: none !important;
  filter: none !important;
  transition: none !important;
}
```

`about/bootstrap.js` FOUC 가드: `.about_three_contents-box` **제외**
(초기 `opacity:0` 박지 않음. 안 그러면 FOUC 가드 0 이 잠깐 보임).

### 시도했다가 실패한 방식 (재시도 금지)

- CSS 의 `translateX(-40px)` + `blur(4px)` 만 제거하고 opacity 페이드 유지 (PR #553) → 슬라이드 자체는 Webflow IX2 인라인 transform 이 박혀서 여전히 좌→우 이동
- `transform: none !important` 추가하되 opacity 페이드 유지 (PR #554) → 슬라이드는 멎었으나 페이드인 깜빡임이 남음
- about.js 에서 `.is-visible` 토글 코드를 건드리는 방식 → `initViewport60FadeIn` 이 `.about_contents-title` 등 다른 요소와 같은 셀렉터 묶음으로 처리해서 분리 어려움. CSS 측 `!important` 무력화가 더 깔끔.

### 변경하면 안 되는 것

- `.about_three_contents-box` 에 다시 페이드/슬라이드/blur 추가 ❌
- bootstrap FOUC 가드에 `.about_three_contents-box` 다시 포함 ❌
- 인터랙션 추가 요구가 와도, **사용자가 명시적으로 LOCKED v1 해제 지시** 하기 전까지 절대 손대지 말 것
- 다른 about 인터랙션 (헥사, history, 알페닉스 등) 수정 중에 이 박스의 `!important` 들을 약화시키지 말 것

### 참고 — Webflow IX2 인라인 transform

이 박스는 Webflow Designer 에서 `data-w-id` 인터랙션이 걸려 있어 페이지 진입 시 IX2 가 인라인 `transform: translateX(...)` 를 박음. CSS `!important` 가 IX2 인라인을 이기는 패턴 — IX2 가 인라인 `!important` 까지 박는 회귀가 발생하면 `about.js` 에서 박스의 `data-w-id` 를 제거하는 방식으로 에스컬레이션 (알페닉스 LOCKED v1 패턴).

---

## ⚠️ 헬릭스 라인 — 건드리지 말 것 (LOCKED v14)

**커밋**: `9f83866` (divider: erase end 25%→40%)

**확정 동작**:
- Draw: 버튼 바텀이 뷰포트 center 도달 시 그리기 시작 → 섹션2 헤딩 top 75% 도달 시 완성
- Hold: 버튼이 헤더에 완전히 가려질 때까지 풀 라인 유지
- Erase: 버튼 바텀이 헤더 하단에 닿는 순간 꼬리 출발 → 섹션2 헤딩 top 40% 도달 시 소멸
- SVG z-index: 헤더 z-index -1 (런타임 감지) → 헤더 아래에 위치

**핵심 교훈 (재시도 금지)**:
- erase `start: 'top bottom'` → scrollY<0 발사, 페이지 로드 시 44% 진행 → 라인 섹션 경계에서 출현
- navbar 변수 스코프 오류 (createSVGLine 지역변수를 initAnimationOnce에서 참조) → ReferenceError → 라인 미생성

---

## 📌 Version Current (섹션 2-4 애니메이션 작동 확인)

**주요 파일**:
- 📄 `home/global/sections-animations.js`: 섹션 2-4 애니메이션
  - 섹션 2, 3 헤딩 fade-in (`.section2-heading` × 2)
  - 섹션 4 카드 스태거 + 그림자 + SVICC 슬라이드 인
  - 복사 버튼 / 전화 링크 핸들러
- 🎨 `home/global/sections-animations.css`: 초기 숨김 상태

**핵심 수정사항**:
- 실제 Webflow DOM 클래스명으로 선택자 교체 (`.section2-heading`, `.home_branch-card`, `.home_background_svicc`, `.copy-text-button`)
- `helix-s1-done` 이벤트 수신 → `ScrollTrigger.refresh()` 호출
  - section1.js가 bt-box-1을 detach/restore하는 동안 측정된 위치는 stale
  - refresh 없으면 트리거가 "이미 지나감"으로 잘못 판단하여 애니메이션 발사 안 됨
- 1.5초 load 폴백 refresh 추가
- 카드 컨테이너 폴백: `.flex-block-23` → `#animal-medical-center` → 첫 카드 부모

**디버그**: URL에 `?debug-sections=1` 추가하면 `[Sections]` 로그 출력

## 컨텍스트
- Webflow Site ID: `69d090ea69d828e27d16ea29`
- GitHub 리포: `pookat73-prog/helixamc-webflow`
- 기본 브랜치: `main`
- 사용자 소통 언어: **한국어**
