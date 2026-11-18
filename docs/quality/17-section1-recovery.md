# D03/S1 — 실제 GSAP 복구 후 Hero 초기화 재개

2026-11-18 KST. 시작 HEAD `3f73eca`, 이전 검증 소스·검사 `c2a0b34`. AGENTS·관련 CLAUDE의 firstpaint/폰트/글로우/지그 보호 규칙과 최신 HANDOFF·16·firstpaint-final을 읽었다. 전용 Drive 표준과 최신 인계(수정일 11/16)도 읽었지만 현재 실행 범위와 기록은 사용자 지정 최신 GitHub 인계를 우선한다. 기존 완료 제품·검사·다른 작업자는 보존한다.

## 작업 개요와 범위

작업량 대. 현재 모델을 유지하고 높은 추론 강도·높은 예상 사용량으로 진행한다. 산출물은 원본 실제 실패 재현, 상태/소유자 추적, Section1의 최소 제품 변경, 별도 검사·역커밋, 새 동결 소스의 기존 22단계+복구 계약 단일 연속 실행과 인계다. 기존 승인 범위이며 중간 승인을 반복하지 않는다. main/staging 병합, 공개 head/pin/설정 및 Publish·운영 배포는 금지다.

## 수정 전 확인과 기술적 결정

- 작업장 clean·원격 HEAD 일치. 이전 runtime 및 핵심 증거 SHA, Section1 `cd54649e559fe939b754c5ea6af2652209be320d7e4078b9edaf0eb780f8d3f1`, 이전 firstpaint 검사 `dc5ca574f5b15abe816339e52c514ee1c10158aa1e91c65b5417e5248aa1a4da`를 대조했다. main `3c4f78d4`, staging `a074f455`, 참고 후보719도 그대로다. 공개 정식/스테이징 10 HTML은 이전 bytes와 같다.
- `__HELIX_SECTION1_LOADED__`는 모듈의 단일 소유권이다. GSAP 미로딩 때 `startSection1()`은 private `started`를 true로 만들기 **전에** false를 반환한다. 따라서 이 실패에서 private started가 붙잡힌다는 가설은 소스와 다르다.
- 100ms×40 재시도 종료 후 interval은 제거된다. 모듈 소유권은 남고 실제 의존성 로드 뒤 재진입 연결이 없어 ready/done이 생산되지 않는다. 모듈 guard를 무조건 지우거나 재시도 상한을 늘리지 않는다.
- 공개 head는 자기 준비 조건과 최종 ready class를 소유한다. coming-soon의 ready/done 소비 및 기존 fallback 공개는 Hero 완료가 아니다. sections는 자기 정상 재진입으로 복구할 수 있고 `helix-s1-done`을 받아 재측정한다. 이 소비자와 공개 head는 수정 대상이 아니다.
- 가설은 **기존 40회 창을 그대로 유지하면서**, 종료 시 Section1이 자기 미완료 상태와 실제 script load를 연결하고 초기화 시작 시 연결을 철회하는 것이다. 정상 시작/실행/완료는 재실행하지 않는다. 새 timer·observer·범용 복구 계층은 만들지 않는다. 현재 DOM과 실제 GSAP가 없는 실패는 완료로 바꾸지 않는다.

## 검증·복구 계약

이전 정확한 GSAP URL/본문과 40회 실제 console 실패 신호를 재사용한다. 원본 실패→후보의 실제 ready·done, ghost 복원과 원래 부모/타이포·배치, fade→1.5초 hold→loop를 확인한다. PC/태블릿/모바일에서 정상·지연·일시 실패·소진 후 복원·영구 실패·중복 진입과 역전환을 나눈다. head가 먼저 열린 뒤 복구하는 경계도 따로 관찰한다. 정상 PC/모바일은 최소 3회 짝비교한다.

기존 22단계와 5×3·CTA108/36·heading/지그/메뉴/폼 계약을 보존하고 새 단위를 추가한다. 과거 성공을 합산하지 않는다. 이전 firstpaint의 미해결 분류는 원본에 남기되 후보에서는 실제 완료의 정방향 계약으로 승격해야 한다. 기준 PNG·mask·100px·threshold0.2·다른 expected failure는 유지한다. 같은 실패 2회면 덮어쓰기를 멈추고 입력/소유자를 재진단한다.

제품과 도구는 별도 커밋, 원인별 역커밋은 별도 recovery 브랜치에 보존한다. 새 clone에 실제 역패치와 1px 오류를 개별 주입해 검출 후 해당 hunk만 복구한다. 원시 증거는 새 `/workspace/artifacts/helix-s1-recovery-20261118`에 보존하며 기존 자료를 덮지 않는다. 원격 보존 여부는 별도 판정하고 로컬 전용 자료를 원격 전달 완료로 표시하지 않는다.

## 현재 상태·다음 단계

기존 입력을 무수정 소스에 재실행 중이다. 아직 제품 수정/복구 완료 판정은 아니다. Hero 단위가 실제 통과한 뒤 D02 다른 label·제목→D05 실제 소비 속성→실환경 D06→전체 독립 감사의 조건을 평가한다. D04 잔여·V0/U01 보류와 719 참고용 경계는 유지한다.

참고: [최신 인계](HANDOFF.md), [이전 소유 그래프·실패](16-firstpaint-hero.md), [이전 동결 대장](evidence/firstpaint-final.json).
