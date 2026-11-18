# 7195463 services 생산자 채택 — 별도 승인안 (미적용)

2026-11-18, 공개 HTML 읽기 전용 관측. Webflow draft 설정을 읽거나 변경하지 않았다. 공개 head/pin/Publish는 이번 실행의 승인 범위 밖이다. 아래는 **staging hostname 분기만 변경**하는 검토안이며 main/staging 병합이나 운영 배포를 포함하지 않는다. 이전13의 양쪽 hostname 변경안은 이 안에 포함하지 않는다.

## 변경 대상과 범위

Webflow `/services` 페이지의 `<head>`에 있는 `Helix services loader` 블록 **한 곳**, URL 삼항식의 webflow.io 쪽 SHA 하나만 ba91d70d93f8a1b54ca499b0ca942c0710d025e7 → 719546330ce1413b2e68b6c3da45dd2d3798e7eb로 바꾼다. 같은 페이지의 critical/native CSS, 공통 global loader, footer, 다른 페이지 설정은 변경 범위가 아니다. production hostname은 ba91을 계속 선택한다.

Git tree 전체254파일 대조에서 공개 ba91과 후보719의 유일한 차이는 `services/bootstrap.js`다. 후보 생산자가 자기 commit의 immutable 자산을 선택하므로 URL은 바뀌지만 나머지 모든 자산 blob은 공개 ba91과 같다. 후보 SHA256 `3fbf77621adc78be33679decb8665e49de6a4caa30b76c0d4495e8d965c63f84`, Git blob `58f2c046e4987311544d79f2bb575899f7df0aa9`.

실제 entry URL:
`https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@719546330ce1413b2e68b6c3da45dd2d3798e7eb/services/bootstrap.js`

24개 고정 URL의 이번 재조회 모두200·이전 SHA와 일치했다. 기존 단일12조건 검증(기존 공통 구로더, 2폭×정상/생산자2회 실패/영구실패×원본/후보)은 **동일한 패키지 검증 이력으로 보존**한다. 오늘 새 브라우저12회 통과라고 바꾸거나 작업 소스의 새 통합 검사에 합산하지 않는다. 실제20개 후보 URL 채택/4개 선행 측정 소유자 존중·측정 기능 미검증을 그대로 유지한다.

## staging 분기 보완 리허설 — 별도12조건 통과

기존 production12는 `@main` fallback과 공통 entry4aeeb4a…를 사용했다. 실제 staging head는 공통 entry490a313…와 `@staging` fallback을 선택하므로 기존 성공을 그대로 staging 성공으로 계산하지 않았다. Nov18 실제 staging HTML, 실제 `@staging` 메뉴 응답(SHA256 `4aa23eeae351559499937e78a2e415f5f16947572100b299411703f0b541d4c5`), 원래 exact-URL 고정 응답과 후보719의 실제 자산을 조합해 **새 디렉터리에서 단일12조건(2폭×정상/2회native실패/영구실패×원본/후보)**을 별도로 통과했다. core21과 합산하지 않았다.

초기2실행은 입력 누락으로 중단했고 그대로 보존했다. 첫 실패의9URL과 두번째에 드러난490 메뉴JS를 확인한 뒤, 실제490 공통 loader의 **16개 FILES 경로 전체**를 대조해 아직 없는10URL을 추가 확보했다. 새19개 고정/분기 의존 응답은 모두 실제 요청200·Git blob과 일치하며 합성 alias는 없다. 제품·assert·기준을 바꾸지 않았다. 복구 시719→staging→490 메뉴 요청3회와 메뉴1/Escape/초점, 정상 원본/후보 배치·타이포 exact를 확인했다. 영구 실패는 메뉴0·기존 총3회 cap으로 남는 경계 검증이다.

이 검사는 실제 staging hostname에서의 **로컬 응답 재생 및 미적용 head 리허설**이다. Webflow draft 수정/Publish나 공개 staging 적용 검증이 아니다. 현재 branch/SVG 응답도 미래 동일성을 보증하지 않는다. 초기 실패, 같은 source의 완전12결과, 각 manifest/SHA/검사 원문을 보존했다. [최종 대장](evidence/execution-final.json), [검사 원문 archive](evidence/execution-staging-rehearsal.cjs.txt)를 따른다.

## 적용 전 코드 (복구 코드와 동일)

```html
<!-- Helix services loader — pinned with the native card layout.
     Update this immutable SHA when services code changes. -->
<script>
(function(){
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@'+(/\.webflow\.io$/i.test(location.hostname)?'ba91d70d93f8a1b54ca499b0ca942c0710d025e7':'ba91d70d93f8a1b54ca499b0ca942c0710d025e7')+'/services/bootstrap.js';
  s.async=false;document.head.appendChild(s);
})();
</script>
```

## 승인 후 변경할 코드

```html
<!-- Helix services loader — pinned with the native card layout.
     Update this immutable SHA when services code changes. -->
<script>
(function(){
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@'+(/\.webflow\.io$/i.test(location.hostname)?'719546330ce1413b2e68b6c3da45dd2d3798e7eb':'ba91d70d93f8a1b54ca499b0ca942c0710d025e7')+'/services/bootstrap.js';
  s.async=false;document.head.appendChild(s);
})();
</script>
```

정확한 [forward patch](evidence/execution-staging-head-proposal.patch)와 [inverse patch](evidence/execution-staging-head-rollback.patch)를 보존한다. 위 원본으로 되돌리면 두 hostname 모두 ba91이 된다. 복구 시 전체 head를 오래된 snapshot으로 교체하지 않고 이 블록의 staging SHA 한 곳만 되돌려 다른 진행자의 변경을 보존한다.

## 승인 이후에 필요한 실제 적용 절차

1. 실제 Webflow draft `/services` head와 위 공개 관측 원본을 다시 대조한다. 다르면 덮어쓰지 말고 변경 소유자/최신 자산부터 재확인한다.
2. 사용자 별도 승인 후에만 draft의 staging 분기 한 곳을 수정한다. 공개 staging 검증을 위해 Publish가 필요하면 그 대상 도메인과 Publish도 별도 승인 범위에 포함해야 한다. 이번 작업에서는 어느 것도 실행하지 않았다.
3. staging 공개 응답에서 생산자719 URL과 SHA를 다시 확인하고 메뉴 열기/닫기/Escape/초점·기존 fallback/요청 상한을 확인한다. production HTML은 원본 SHA 분기를 유지하는지 대조한다. 실패 시 위 inverse를 적용하고 같은 승인 범위의 staging만 재게시/복구 검사한다. 브라우저 캐시를 피한 새 context에서 재검수하며 구세션 자동 갱신을 주장하지 않는다.
4. 운영 hostname의 SHA 변경은 별도 후속 판단이다. 이 안의 승인은 production pin이나 main/staging 병합 승인이 아니다.

## 영향과 남은 위험

직접 영향은 staging `/services` 생산자의 native 실패 철회와 이미 점유한 메뉴 존중이다. 메뉴/CSS/기타 자산은 공개 ba91과 바이트가 같다. 공통 구로더의 총요청 상한3회와 작업 소스의4회를 혼동하지 않는다. `@main` fallback의 향후 응답·CDN edge stale·과거 관측403의 원인은 이번 후보만으로 해결되지 않는다.

**이번 작업의 새 메뉴 의존성 복구 및 pending 소유권 개선은719에 포함되지 않는다.** 719는 이전 검증 제품2개만 담은 제한된 채택안이다. 새 개선을 운영 자산에 포함하려면 현재 공개 asset tree를 기준으로 별도 최소 패키지와 실제 고정 URL 검증이 필요하다. 작업 브랜치 전체를 공개 pin으로 바꾸지 않는다. 따라서 이 승인안을 전체 D04/구조 안정화 완료안으로 취급하지 않는다.
