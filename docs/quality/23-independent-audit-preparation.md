# HELIX — 최종 독립 감사 준비 및 잔여 확인

2026-11-20 KST. 기준 HEAD81da752, 보호 제품21acccb, QA b6685f0. **최종 판정은 3: 자산·권한·환경 때문에 일부 검증 보류다.** 읽기 전용 소스·계약 검토 자료는 준비했지만 외부 검토자는 미배정이며 이번 조사는 같은 구현자의 자료 준비/증거 확인이다. 전체 외부 감사·구조 안정화 완료·운영 적용 가능으로 승격하지 않는다.

## 수행 범위와 보존

세 기능 복구 ref61c46515/76f9a10c/91140bf3 및 기존21제품·D02/D05·Hero·D04를 보존했다. 새 CSS/JS·QA·기준PNG/mask/100px/threshold0.2/expected failure 변경0, main/staging 병합·공개 head/pin·권한 변경·Publish·배포0이다. 기존 단일v3 검사를 재실행하거나 진단3쌍을 합산한 새 전체 통과를 만들지 않았다. 기존 raw11,916파일 전체 SHA를 읽기 재검증했고 불일치0이다.

[외부 검토자 시작점](review/independent-20261120/README.md), [미기입 검토표](review/independent-20261120/checklist.md), [고정 문서/34검사 코드/입력/결과/9위험 대장](review/independent-20261120/manifest.json), [33파일 전후 비교](review/independent-20261120/file-differences.json), [10페이지/환경 producer/shared 관계](review/independent-20261120/producer-consumers.json)를 인계한다. 원시 본문·새 PNG·trace는 로컬 전용이며 업로드하지 않는다.

## 감사 준비 결과

| 자료 | 확인 결과 | 외부 검토에서 구분할 점 |
|---|---|---|
| 원본→복구 source | 기본14/Home13/Services6, 전후 Git blob/SHA와 GitHub 비교 집합 일치 | Services global/bootstrap의 mirror tree 기준과 실제 원본 shared main3c 기준은 다름 |
| 전달 자산 | 기존175실제 응답/Git 일치 및300정상URL 기록 연결 | 새로 원본CDN을 재요청하지 않았고 두 수를 합산하지 않음 |
| 5페이지×2환경 | producer/shared ref 일치, 기존3크기 raw 연결 | shared 두 번째 요청은 QA217줄의 의도적 반복 진입 |
| 여섯 설정 | 고정 전후SHA/정·역patch 연결 | 현재 저장 원본에서 직접 적용할 patch가 아니며 부분적용 불가 |
| 초기화/잠금 | 실제 owner source와 기존30잠금·Hero36·inverse3 연결 | guard/태그 존재를 기능 완료로 세지 않음 |
| 검사 재현 | 동결QA34파일 SHA, recovery20 + portable13/corpus 위치 확인 | 외부인이 로컬 raw 접근 없으면 전체 시각/재현 감사 보류 |

## About820 421픽셀

[상세 판별과 SHA](evidence/about820-readonly-investigation.json). 기존 실패 PNG의421픽셀은 네20px모서리에만 있고 중앙/흰배경 변경0이다. 네 모서리는104/106/106/105픽셀, 두 배치JSON은 byte같다. x150/y367.046875/520×445.90625의 fractional 배치가 같고, 새6관찰의 radius는20px이다.

입력은 **전체가 동일한 SHA가 아니다.** 고유104URL 중103본문은 동일하고 의도적인 D02 label CSS391a0297→94740b1a 한 개만 다르다. 영상SHA77e8cd40…도 같다. 244개의 순수 배경 모서리 픽셀을 같은 영상의 실제 프레임과 오프라인 대조했다. 원본은 frame0에 평균RGB절대오차1.065, 후보는 frame184/약7.674초에1.199이며 후보를첫프레임에대조하면35.461이다. **노출 배경의 영상 위상 차이가 강하게 지지된다.** 이것은 새 기준PNG나 통과 허용오차가 아닌 진단용 수치다.

관찰용 검사3쌍은 기존 font-ready/pause/seek/PNG exact 코드를 유지하고 시각·native/표시frame·폰트·이미지 상태만 기록했다. 모두 exact이며6캡처 전 fonts loaded·화면내5이미지 완료·영상 clock/frame0·radius20px였다. 과거 실패쌍에는 실제 font/image 완료시각과 표시frame trace가 없으므로 새 기록으로 대체하지 않는다. 당시 seek/합성 순서의 정확한 원인은 **미해결**, 검사 안정화 수정·문제종료도 하지 않았다. V0푸터 재개나 U01승격의 근거로 사용하지 않는다.

## 미게시 변경 확인

[실제 읽기 범위](evidence/unpublished-scope-readonly.json). 공개10HTML 전체SHA/pin·사이트 metadata·관련 저장코드6조회/7블록은 이전 최종 관측과 같다. 현재 API는42페이지(draft3),2737스타일 이름/선택자,27컴포넌트 이름/instanceCount,0CMS컬렉션을 반환했다. 스타일 속성의 게시전후diff나 컴포넌트 정의 이력·변경자는 반환하지 않는다.

`shouldPublish=true`42개를42개 변경/확정 게시대상으로 세지 않는다. non-draft/non-archived39개는 전체게시의 잠재 페이지 집합일 뿐이다. 게시 뒤 timestamp가 바뀐 치과·안과는 draft며 작성자/수정내용은 여전히 미확인이다. 빈 CMS목록에 항목비교 대상이 없지만 이를 사이트 전체 미게시 없음으로 확대하지 않는다.

권한 있는 실제 확인 경로는 사이트 담당자의 Webflow Designer/활동기록/게시대상 읽기 화면이다(`https://webflow.com/design/helix-amc`). Activity 권한 보유자는 Nov19 변경 actor/actions를, Designer 담당자는 최근 게시 기준 대비 공통스타일/컴포넌트를, 게시 검토 권한 보유자는 실제 포함범위를 확인해야 한다. 백업은 읽기 비교만 하고 복원하지 않는다. 현재 도구에는 activity 로그 읽기 동작과 연결된 브라우저가 없어 이 경로를 실행하지 못했다. 문서 안내가 제시한 Enterprise activity API는 본 사이트 요금제/권한을 시험하지 않았고 직접 공식 문서 읽기는 환경 proxy403으로 차단됐다. 이를 사이트 권한403으로 오인하지 않는다. 실제 Designer의 mode/page 읽기도 시도했으나 MCP 앱 세션에 연결할 수 없다는 응답으로 중단됐다. 이는 데이터 API 조회 성공과 별개이며, 권한 있는 Designer/활동기록 읽기 연결이 재개 조건이다. 초대/역할 변경 요청이나 사용자 수동코드 붙여넣기를 요구하지 않았다.

## 기술 위험 재분류

| 항목 | 현재 사실 | 판정 |
|---|---|---|
| 일반HTTP200 실행오류 | 합성 early/partial/syntax6조건 메뉴0, partial guardtrue. 실제 정상자산80조건에서 같은 오류 관측 아님 | 기능복구 미해결. 지원실제경로에서 재현되면 적용차단 |
| 영구 무응답 | 유한지연/응답해제 복구만 검증, 시험deadline은native실패 아님 | 무한pending 복구 미검증 |
| 미래mutable | 메뉴쌍은동일고정ref, 다른fallback 미래branch는미지 | 향후소비SHA변경시영향검토 |
| 다른firstpaint | 공개head/fallback/Section1 phase/CSS·selector대기 경계 확인 | 지정검사밖은미검증, 새정상결함관측없음 |
| Safari/iOS/iPad | Linux/Chromium만 확보, 실제WebKit실행파일없음 | 실제회전 미검증 |
| V0/U01 | 조사제한/기존승격조건유지 | 재개/이관안함 |
| Services 의미범위 | 6파일중shared에메뉴외기존기능포함 | 전체nav/SEO새인증아님 |
| About820 | 영상frame차이가강하게지지되나과거합성trace없음 | 원인일부판별/완료보류 |

## 다음 조건

제품 추가 정리는 시작하지 않는다. 다른 검토자가 고정 자료와 로컬 raw를 읽을 수 있게 한 후 검토자/독립성/판정/누락을 직접 기록한다. 공개 반영 전에는 실제 actor·미게시 공통변경·정확한 게시범위·소비자산SHA·여섯 설정의 동일cohort·실기기 범위를 확인하고 별도 사용자 승인을 받아야 한다. 새로운 raw 외부 업로드와 기존Drive 두 백업 중복 업로드는 하지 않으며 Drive 원격SHA 미검증도 유지한다.
