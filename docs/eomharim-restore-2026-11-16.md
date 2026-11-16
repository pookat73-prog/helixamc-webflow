# 엄하림 과장 재노출 · 정식 반영 완료 · 2026-11-16

## 작업 개요

영상의학과 엄하림 과장의 임시 숨김을 해제했다. 개인 소개 자료와 순서는 유지했다.

## 기술적 결정 사항

- 원본: `seocho/doctors/data/di-2/_index.json`의 `eomharim`에서 `draft: true` 제거. `_all.json` 재생성, 공개 의료진 27명.
- GitHub: PR #2069 → staging squash `4296e4503bb4531c625083bc2381ac6cfaacf4a3`. SEO 자동 재생성 후 자산 SHA `143e512dbab58c657f2fa6d00148df07f69a2217`.
- 숨김 당시 생성하지 않았던 직접 접속용 페이지도 기존 생성기로 구성: pageId `6afa60e07aaf690f7296bd9d`, folderId `6ad81fdf61eceb7f36fc1347`, `/doctors/eomharim`. Webflow `parentFolderId`로 폴더 지정, `draft:false`.
- 본문은 기존 의료진 페이지와 동일하게 page footer freeform에 원문 저장. 스타일/스크립트는 위 전체 SHA로 고정. 대표 주소·제목·설명은 Webflow 자동 생성값을 사용해 중복 방지.
- 기존 숨겨진 이름별 링크 목록은 변경하지 않았다.

## 현재 상태

- staging 카드·사진·상세보기: 실제 1440px/390px 검증 통과. 순서: 강유림 → 엄하림 → 이영은.
- 전체 27명 정적 본문·공유 메타정보 검사 및 25명 상세 모달 브라우저 회귀 검사 통과. GitHub Site Quality Checks, CDN 배포 성공.
- Webflow 게시 대상은 `customDomains: []`, `publishToWebflowSubdomain: true`. 최종 publishTaskId `6d8736e3-195d-4200-a692-45ee4e8e3634`.
- 사용자 정식 반영 승인 후 PR #2071을 main에 병합: `9a05f1e102d947975cf572eac2a71c6755ff6536`. 엄하림 관련 6개 파일만 현재 main에 반영했다.
- 사용자 "함께 게시" 승인 후 www/비www 운영 도메인에 전체 게시했다. Webflow 단일 페이지 게시가 지원되지 않아, 사전 비교에서 확인한 `.about_contents-title-white.sub`의 모바일 14px/행간 20px 변경 1건도 함께 포함하도록 승인받았다.
- 운영 publishTaskId `d0650b04-7af5-4fe3-aef2-64d43b58fb17`, 양쪽 운영 도메인 게시 완료 시각 `2026-11-16T02:05:55.313Z` (한국시간 11:05). 스테이징은 이 게시에서 제외했다.
- 운영 1440px/390px 카드·상세보기 검증 통과. `/doctors/eomharim`은 www/비www HTTP 200, 최초 HTML의 이력 본문 포함, 고유 제목·단일 대표 주소, 사진 로드, 가로 넘침 없음, 새로고침·ESC 복귀 검증 통과. 승인된 부제 CSS의 운영 응답 포함도 확인했다.
- Search Console 제출은 실행하지 않았다.

## 다음 단계

요청 범위의 정식 반영과 검증 완료. staging 전체 병합은 수행하지 않았다. 별도 후속 작업 없음.

## 참고 파일 및 링크

- https://github.com/pookat73-prog/helixamc-webflow/pull/2071
- https://github.com/pookat73-prog/helixamc-webflow/pull/2069
- https://helix-amc.com/seocho?fresh=1#medical-team
- https://helix-amc.com/doctors/eomharim
- https://helixanimalmedicalcenter.webflow.io/seocho?fresh=1#medical-team
- https://helixanimalmedicalcenter.webflow.io/doctors/eomharim
- `docs/doctor-staging-deployment.json`: 기존 26명 배포 이력. 이번 엄하림 페이지 식별값·상태는 본 문서가 최신이다.
