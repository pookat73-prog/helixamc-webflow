# 엄하림 과장 재노출 · 2026-11-16

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
- 정식 main 병합·운영 도메인 게시·Search Console 제출은 이번 작업에서 실행하지 않았다.

## 다음 단계

정식 반영 요청 시 이번 의료진 데이터 변경만 main으로 옮기고 신규 직접 접속 페이지를 운영 게시한다. staging 전체를 승격해 관련 없는 변경을 함께 내보내지 않는다. 신규 페이지는 `draft:false`이므로 이후 전체 운영 게시에도 포함될 수 있다.

## 참고 파일 및 링크

- https://github.com/pookat73-prog/helixamc-webflow/pull/2069
- https://helixanimalmedicalcenter.webflow.io/seocho?fresh=1#medical-team
- https://helixanimalmedicalcenter.webflow.io/doctors/eomharim
- `docs/doctor-staging-deployment.json`: 기존 26명 배포 이력. 이번 엄하림 페이지 식별값·상태는 본 문서가 최신이다.
