# HELIX 실행환경 복구와 D02/D05 종료 판단

2026-11-19 KST. 시작 `4517b5d`, 이전 동결 `c4b2e5a`. [18의 종료 게이트](18-residual-closure.md)를 이번 한정 범위에서 한 번 평가한다. main/staging·공개 설정·head·pin·Publish·운영은 변경하지 않는다.

## 실행 복구와 보존

기존 `/workspace/helix-residual`에서 실제 shell 명령·Git·Node·Chromium 실행을 확인했다. 기존 clean HEAD6cf에서 문서/증거만 변경한4517을 exact Git object 검증 후 fast-forward했다. C4와4517의 제품·검사 소스가 같은 것을 확인했고 reset/clean/restore·후보 재적용·기존 raw 교체는 하지 않았다. 기존12입력 root, 원본8manifest의2,130body binding, 기존 raw2,480파일, 이전23단계 결과와 두 승인 아카이브의 로컬 SHA를 대조했다. 이전 환경 중단은 제품 결함이 아니다.

## 실제 D02 개선

현재 생산자의 이름/연락처/메모 label 세 개에서 전역 keep-all/normal 정책이 긴 비분리 토큰의 줄바꿈을 막았다. 게시된 짧은 문구와 합성 stress 입력은 구분했다. 실제 폰트를 유지한3폭×3label×4언어×직접/span/a의108조건에서 원본 넘침을 확인했다.

제품 [46af337](https://github.com/pookat73-prog/helixamc-webflow/commit/46af33742bcc43b3b5df78149f9ca4120f37721a)은 `global/floating-cta.css`의 label root/자손에 emergency wrap 소유권7줄만 추가한다. global word-break, input·다른 form root, 기존 내과·intro·consent·CTA 완료 스타일과 외부 정렬은 보존한다. CSS SHA256은 `391a0297…`에서 `94740b1a9ace5f61d13c27fd2816be322a28573766a2aa4b947df3c612cc408c`로 변경됐다.

한 번의 완전한15쌍 실행에서5페이지×3크기의 게시 glyph/전체 배치·타이포·modal PNG가 exact이고, 216개 원본/후보 stress 측정에서 원본 넘침→후보 정상 줄바꿈을 확인했다. input focus·동의 상세/checkbox·Escape/초점 복귀·늦은 전역 스타일·관련 반응형 경계·기존 예외를 확인했다. 단독15쌍을 전체 통합 통과로 합산하지 않는다.

별도 복구 [19455fd](https://github.com/pookat73-prog/helixamc-webflow/commit/19455fd41fd07d554eaa8c9308bf7941a5b2671b)는 `recovery/helix-form-label-wrap-only-20261119`에만 보존했다. diff가 CTA CSS 한 파일뿐이고 원본 CSS blob으로 돌아감을 검증했다. 정상 작업 브랜치에는 적용하지 않았다. 실제 역패치의 회귀 검출과 복구는 최종 연속 검증 뒤 확인한다. 최초 복구5c96a64는 잘못된 tree로 문서까지 역변경하므로 검증에서 기각했다. 해당 과거 recovery 브랜치를 사용하지 않는다.

## D05 font-weight 판정 — 제품 미변경

실제 전화 span과 최종 공용 label 규칙을 확인했다. 앞의700→800 편집은 최종600에 가려지지만, 명시적으로 전화/예약 문구를 맞추는 최종600 소유자를500으로 편집하면 정상 반영된다. 오래된 선언의 편집 무효화와 실제 최종 소유권 충돌을 구분했다. 18폭×6variant의108쌍 CSS·geometry·PNG 동등성과36통제 편집(30실소비/6legacy 비소비)을 한 번의 완전한 실행에서 확인했다. 최종 소유자 편집이 가려지는 결함은 이 속성에서 재현되지 않아 CSS 정리나 제품/복구 커밋을 만들지 않았다.

첫 검사 실패는 외부 stylesheet CSSOM의 SecurityError였다. 원인 확인 뒤 동일 바이트 inline 검사 사본을 원래 위치에 넣었고 전체 계산값/geometry가 같은 것을 먼저 입증했다. 브라우저 보안 설정·제품 CSS·허용 기준을 바꾸지 않았다. 실패 로그와 진단도 보존했다. legacy fixture와 현재 생산자 소비를 구분하며 현재 없는 subtext를 삭제하지 않는다.

## 새 동결 검증 — 실행 중

검사 전용 [06f8bba](https://github.com/pookat73-prog/helixamc-webflow/commit/06f8bbaee3a5c7865362af501966933dac951f37)를 동결했다. 별도 clone `/workspace/helix-closure-final-20261119`에서 기존23단계+label15쌍+phone-weight108/36의 **25단계를 단일 연속 실행 중**이다. 완료 전 통과로 표시하지 않는다. 원래 PNG33/응답286·mask·100px·threshold0.2·expected failure는 불변이다.

intro/consent 검사는 현재 소스에서 자기 제품 hunk만 역적용해 비교하도록 구성했다. 새 label 소유권과 input의 기존 normal 정책을 각각 엄격히 검사한다. 다른 label까지 normal로 가정하던 과거 검사 조합만 현재 책임 경계에 맞췄으며 기존 target 실패·비대상 동등성·PNG 기준을 완화하지 않았다.

## 공개 자산 및 D04 적용 경로 — 특정 범위 보류

시작 main `3c4f78d4e75a06524b16a32e05e3185c48fbe800`, staging `a074f455a4adc3dd8515255f6d779dea0afeeb10`과 실제 정식/스테이징10HTML 및 고정 공개4자산 HTTP200/SHA를 재확인했다. 공개 CTA CSS와 완료 제품 CSS는 다르며 Git 전달을 공개 반영으로 보지 않는다. `@main` hamburger의 실제 본문은 작업본과 다르다. 해당 응답 SHA와 fallback 소스 경로는 확인했지만 미래 캐시/혼합 자산 전체 호환성을 보증하지 않는다.

실제 immutable46af 자산으로 private 적용 조합을 만들려던 수집은14파일 뒤 page-time.js403, 제한적 재시도에서는30파일 뒤 footer.js403으로 중단했다. 첫 URL 단독 진단은200이어서 영구 자산 부재로 단정하지 않는다. 두 번째 실패 후 추가 수집/덮어쓰기를 중단했다. 미완성 입력으로 브라우저 적용 검사를 실행하지 않았고 다른 버전 응답·합성 alias를 누락 자산 대신 붙이지 않았다. 실제 적용 패키지와 공개 head는 구성·변경하지 않았다.

기존 HTTP200 early/partial/syntax 오류 주입의 메뉴 부재는 미해결 조건이며 검사의 exit0을 메뉴 성공으로 보지 않는다. 그 fixture가 현재 공개 JS 자체의 구문 오류라는 의미는 아니다. 지원되는 실제 적용 경로에서 같은 핵심 메뉴 실패에 도달하는지 미검증이므로 공개 적용 게이트를 열지 않는다. 7195463은 최신 개선 없는 과거 참고 후보다.

## 원시 증거와 남은 게이트

이번 raw·PNG·전체 로그는 `/workspace/artifacts/helix-final-closure-20261119`에 로컬 보존한다. GitHub에는 소스/검사·판정·SHA를 전달하며 새 raw 원격 보존은 아직 없다. 기존 승인 Drive 두 파일은 중복 업로드하지 않았고 원격 다운로드 SHA 미검증을 유지한다.

최종 연속25단계, 역패치/1px 오류 검출·자기 hunk 복구가 남았다. 이후18의 게이트를 한 번 판정한다. D03의 다른 firstpaint/지그/임의 실행 예외, D04 일반 실행 예외·무응답·미래혼합/cache, V0/U01, 실제 Safari/iOS/iPad의 D06은 해결/미검증을 구분해 남긴다. 새 미세 개선 탐색이나 범용 복구 계층을 시작하지 않는다.
