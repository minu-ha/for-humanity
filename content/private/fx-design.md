---
name: Fx design
label: 인터랙티브 그림 위젯 설계
group: Development
order: 62
---

# 인터랙티브 그림(fx) 위젯 설계

상태: 승인된 설계(2026-10-29). 구현 순서는 [Fx implementation plan](fx-plan.md).

## 목적

nomeehej.dev의 공개 글 40편은 단계 재생, 슬라이더, 실행 상자, 직접 만든 시뮬레이션 같은 인터랙티브 그림을 쓴다. for-humanity에 사이트 공통 CSS와 JS를 넣는 설정이 없어 그 저장소는 268줄짜리 런타임 블록(`<!-- fx:runtime 3 -->`)을 그림이 있는 문서 끝마다 복사하고 `pnpm fx`로 정본과 맞춰 왔다.
이 런타임을 for-humanity의 내장 위젯으로 옮긴다. 문서에는 글과 그림만 남고 런타임 수정은 패키지 릴리스 하나로 모든 사이트에 적용된다.

이름 `fx`는 effects의 줄임이다. 작성자가 그림마다 직접 치는 접두(`class="fx"`, `data-fx`, `fx-box`, `fx:step`)라 두 글자로 골랐다. figure의 줄임이 아니다. 접두는 옮긴 뒤에도 `fx`로 둔다. Markdown 안에 직접 쓰는 문법이라 `:::note`처럼 짧아야 하고 기존 그림 214개를 손대지 않아도 된다.

## 접근 방식

1. 채택: `browser.js` 번들 안의 Hono 위젯 `WgFx`. 0.27.0의 표 정렬 `WgTableSort`와 같은 구조다. 작성자 HTML 위에 동작을 얹고 `WgShellControls`가 마운트한다. vite 모드, 모듈 로더, rehype 플러그인, dev 소스 모드 예외, knip 등록이 필요 없다. 그림이 없는 페이지도 압축 뒤 4KB 안팎의 JS를 함께 받는다.
2. 대안: Mermaid식 지연 모듈. 그림이 있는 페이지만 `/_fh/fx/fx-[hash].js`를 요청한다. `vite --mode fx`, `loadMermaidAssets`의 일반화, `rehypeFx`, dev 소스 모드의 `/src/entry/fx/` 예외, knip 항목이 든다. 번들 크기가 문제가 될 때 같은 컴포넌트를 이 경로로 옮긴다.
3. 검토 후 제외: MDX와 `:::fx` 디렉티브. 그림 분량의 대부분은 SVG 장면과 단계 속성이라 줄어드는 것이 상자 한 줄뿐이고, MDX는 파이프라인과 하이드레이션을 새로 짜야 한다.

Roadmap의 "실행형 데모를 기본 기능으로 자동 이식하지 않는다"는 문장은 실행 상자(`run`)를 포함하기로 하면서 "샌드박스 콘솔 상자 밖의 실행형 데모는 이식하지 않는다"로 좁힌다.

## 작성 계약

작성자가 Markdown 안에 원시 HTML로 쓰는 공개 계약이다. nomeehej.dev의 기존 그림과 같고 바뀌는 것은 없다.

- 상자는 `<figure class="fx" data-fx="steps|range|run|custom" aria-label="...">`. 안에 `<div class="fx__stage">`와 선택인 `<ol class="fx__captions">`, `<figcaption>`을 둔다. 좁은 화면 격자는 `fx-cols`, 나란히 비교는 `fx-pair`, 가로 스크롤 SVG는 `fx-scroll`.
- `steps`: 요소에 `data-on`(그 단계에만 보임), `data-hl`(형광펜), `data-pos`(단계별 위치)를 단다. 범위는 `3`, `2-5`, `4-`(끝까지), `-2`(처음부터)를 공백으로 잇고 위치는 `1:0 0;4:120 40`처럼 단계와 x y를 적는다. 단계 수는 캡션 항목 수이고 캡션이 없으면 `data-steps`. `data-labels="a|b|c"`를 주면 재생 조작부 대신 탭 버튼이다. 위젯은 그림 아래 띠 `fx__bar`에 재생과 멈춤, 이전 단계, 다음 단계 아이콘 버튼, 스크러버, `n / N`을 이 순서로 만든다. 방향키 좌우로도 넘긴다. 재생은 단계마다 2초 머물고 첫 전환만 0.5초 뒤에 한다. 끝에서 다시 재생하면 1단계부터 2초. 그림은 `fx:step`(detail.step)을 받고 `fx:goto`(detail.step, detail.play)를 보낼 수 있다.
- `range`: 안의 `<input type="range">`와 `<output>`을 잇는다. 값 비율을 `--fx-v`(0~1)와 `data-value`로 주고 `fx:input`(detail.value, detail.ratio)을 보낸다. `data-unit`은 output 뒤에 붙는 단위.
- `run`: 바로 앞 형제가 코드 블록(`pre` 또는 `pre code`를 담은 상자)이면 그 코드를 쓴다. 버튼은 실행, 코드 고치기, 처음 코드로. 출력은 `fx__out`에 쌓이고 비었을 때 문구는 `data-empty`, 실행 뒤 수집 시간은 `data-wait`(ms, 기본 2000). 실행은 `sandbox="allow-scripts"`만 준 `srcdoc` iframe에서 하고 `console.log`, `info`, `warn`, `error`, 잡히지 않은 오류와 거부를 부모에 `postMessage`로 보낸다. 부모는 실행마다 만든 id가 맞는 메시지만 받는다. 사용자 코드의 `</script`는 이스케이프한다.
- `custom`: 위젯은 손대지 않는다. 작성자의 `<script type="module">`이 `fx--ready`를 붙이고 이벤트를 쓴다. 다만 `.fx button[data-icon]`은 모든 종류에서 위젯이 같은 아이콘 버튼으로 바꾸고 글자를 `aria-label`과 `data-tip`으로 옮긴다.
- 공용 클래스: `fx-pair`, `fx-cols`, `fx-scroll`, `fx-row`, `fx-lane`, `fx-chip`(`--mine`, `--dash`), `fx-lines`, `fx-box`, `fx-label`, `fx-muted`, `fx-swap`, `fx-button`. SVG 안은 `fx-strong`, `fx-muted`, `fx-mono`, `fx-box`, `fx-mine`, `fx-ground`, `fx-dash`, `fx-ln`, `fx-ln-strong`, `fx-arrow`, `fx-mark`. 작성자가 직접 만든 `fx__bar` 안의 `button`과 `aria-pressed`도 위젯 CSS가 꾸민다.
- 공개 변수: `--fx-line`, `--fx-line-strong`, `--fx-ink`, `--fx-ink-strong`, `--fx-ink-muted`, `--fx-fill`, `--fx-ground`, `--fx-mark`, `--fx-ph`, `--fx-ease`를 `.fx`에 선언한다. 사이트 토큰의 별칭이거나 `light-dark()` 값이다. JS가 주는 값은 스크러버 진행 `--fx-p`와 슬라이더 비율 `--fx-v`.
- JavaScript가 없으면 `data-on`이 `-`로 끝나는 요소(끝까지 가는 요소)와 캡션 목록 전체가 보이고 조작부는 없다.
- 조작부 문구는 `html lang`의 기본 하위 태그가 `ko`면 한국어, 그 밖은 영어다. 날짜 라벨 `copy_doc_dates`와 같은 규칙이다.

| 문구 | en | ko |
| --- | --- | --- |
| 재생 버튼 | Play | 재생 |
| 멈춤 버튼 | Pause | 멈춤 |
| 이전 단계 | Previous step | 이전 단계 |
| 다음 단계 | Next step | 다음 단계 |
| 스크러버 | Step | 단계 |
| 실행 | Run | 실행 |
| 코드 고치기 | Edit code | 코드 고치기 |
| 고치기 닫기 | Close editor | 고치기 닫기 |
| 처음 코드로 | Reset code | 처음 코드로 |
| 코드 입력 상자 | Code to run | 실행할 코드 |
| 빈 출력 | Console output appears here after you run the code | 실행하면 콘솔 출력이 여기에 나온다 |

## 구조

```text
src/component/widget/fx/
  wg-fx.tsx                  WgFx. DOMContentLoaded 뒤 .fx[data-fx]마다 종류별 enhance, 해제 시 복원
  wg-fx.css                  런타임 CSS를 저장소 규칙으로 다시 쓴 것
  _constant/copy.ts          en, ko 문구
  _constant/fx.ts            아이콘 path, 2000ms와 500ms 간격, run 수집 시간
  _function/to-steps.ts      범위 표기 → 단계 Set. unit test
  _function/to-positions.ts  위치 표기 → [단계, x, y][]
  _function/to-run-document.ts  srcdoc 문자열. 콘솔 shim과 </script 이스케이프. unit test
  _function/enhance-steps.ts 조작부 생성과 단계 표시. dispose 반환
  _function/enhance-range.ts 슬라이더 연결. dispose 반환
  _function/enhance-run.ts   실행 상자. dispose 반환
src/component/widget/shell-controls/wg-shell-controls.tsx   <WgFx onEnhanced={handlePageLoad} />
```

- 마운트 시점은 표 정렬과 같다. `document.readyState`가 `loading`이면 `DOMContentLoaded`를 기다린다. 작성자의 `<script type="module">`은 파싱 뒤 `DOMContentLoaded` 전에 실행되므로 custom 그림의 리스너는 위젯이 첫 `fx:step`을 보내기 전에 붙는다. 지금 nomeehej.dev의 순서(런타임 블록이 문서 끝)와 같다.
- 조작부가 붙고 캡션이 한 항목으로 접히면 본문 높이가 바뀐다. 위젯은 enhance를 마친 뒤 `onEnhanced`를 부르고 셸의 `handlePageLoad`가 Mermaid 렌더 뒤처럼 앵커 위치를 보정한다.
- 수명은 `AbortController` 하나다. 해제하면 타이머를 지우고 생성한 조작부, 입력 상자, 출력을 떼고 `fx--ready`, `data-step`, `is-on`, `is-hl`, 인라인 transform, 캡션 `hidden`을 되돌린다. 다시 마운트하면 처음부터 붙는다.
- 생성 마크업은 `createElement`와 `createElementNS`로 만든다. `innerHTML`은 쓰지 않는다. 아이콘은 표 정렬 화살표처럼 path 상수에서 SVG를 만든다.
- 토큰은 바뀌지 않는다. 런타임이 쓰던 `--app-*`는 모두 `token.css`에 있다.

## CSS 규칙 대응

런타임 CSS는 Stylelint 규칙에 맞게 다시 쓴다. 선택자와 값은 유지하고 형식만 바꾼다.

| 런타임 | 규칙 | 대응 |
| --- | --- | --- |
| `.fx [hidden]{display:none!important}` | `declaration-no-important` | `!important` 제거. `.fx [hidden]`의 특이도(0,2,0)가 `.fx-chip` 같은 단일 클래스보다 높다 |
| `:not(.fx--ready)`, `:not(.fx-cols)`, `:hover:not(:disabled)` | `selector-pseudo-class-disallowed-list: not` | 기본 규칙 뒤에 수정자 규칙을 두는 순서로 재구성 |
| `.fx{--fx-line:...}` | `property-disallowed-list: --` | `.fx` 블록 하나에 모아 두고 이유를 적은 예외 주석. 작성자 그림이 소비하는 공개 변수 |
| `[aria-pressed=true]`, `[aria-disabled=true]` | `selector-attribute-name-disallowed-list` | 이유를 적은 예외 주석. 작성자 마크업 버튼의 상태 계약 |
| `.fx-button:hover` | 최상위 상태 선택자 금지 | `.fx-button { &:hover {} }`로 중첩 |
| `.fx__bar button`, `.fx svg text`, `.fx-lines > li` | 소유 마크업의 요소 선택자 | 작성자 마크업이라 평면 선택자로 둔다. 파일 머리 주석에 이유 |
| `fx__bar`, `fx--ready` 같은 생성 클래스 | `selector-class-pattern`의 `wg_` 문법 | `wg_` 밖의 클래스는 외부 클래스로 허용된다. 작성자도 같은 이름을 쓰므로 `wg_fx__*`로 바꾸지 않는다 |
| `@media (width<640px)` | `media-feature-range-notation: context` | 그대로 |

## 검증

- unit: `to-steps`(네 형식과 혼합, 빈 값), `to-run-document`(`</script` 이스케이프, id 전달).
- e2e `test/2-page/2.7-fx.e2e.spec.ts`, fixture `test/_fixture/fx.ts`(영어 사이트, 실제 CLI 빌드), 영역 코드 `FIG`:
  - steps: 조작부와 1단계, 다음과 이전, `data-on`, `data-hl`, `data-pos`, 캡션 한 항목, `n / N`, 양 끝의 `aria-disabled`.
  - 스크러버와 방향키.
  - 재생: `page.clock`으로 0.5초 뒤 2단계, 2초 간격, 끝에서 멈춤과 아이콘 복귀.
  - 탭 `data-labels`.
  - range: `--fx-v`, output, `fx:input`.
  - run: 콘솔 출력, 오류 출력, 코드 고치기 뒤 실행, `</script>`가 든 코드, `data-wait`.
  - custom: `data-icon` 치환, 작성자 스크립트의 `fx:step` 수신과 `fx:goto` 발신.
  - JavaScript 없음: 끝까지 가는 요소와 캡션 전체가 보이고 조작부 없음.
  - 그림 아래 제목으로 hash 진입 시 제목이 화면 안에 있음.
- integration `2.7-fx.integration.spec.ts`, 갤러리 `test/_gallery/fx-lifecycle.tsx`: 해제 시 조작부 제거와 재생 중단, 재마운트. `lang`을 `ko`로 바꾼 뒤 마운트하면 한국어 문구.
- 접근성은 2.4의 사이트맵 검사가 공식 문서의 Figures 페이지를 자동으로 포함한다.
- 수동: 두 테마, 1280px과 390px, 키보드만으로 모든 조작.

## 문서

- `content/public/figures.md`(Guide, parent writing, order 16)와 `content/ko/public/figures.md`. 종류 넷의 Source와 Result, 속성 표, 이벤트 표, 클래스와 변수 표, JavaScript 없을 때, 실행 상자의 경계. 공개 전까지 미공개 표시, 공개 뒤 "Supported since `0.28.0`".
- `writing.md`의 Content features에 한 줄과 링크. 영어와 한국어.
- `README.md`와 `language/README.ko.md`의 Add rich content 행에 Figures.
- `CHANGELOG.md`의 `Unreleased`.
- `architecture.md`: Markdown pipeline 아래 WgFx 문단, Package output의 `browser.js` 설명에 그림.
- `roadmap.md`: Visualization modules에 완료 항목과 문장 수정.
- `test/README.md`: 구조 목록과 영역 코드 `FIG`.

## nomeehej.dev 이관

for-humanity 0.28.0 공개 뒤 my_pjt_summary에서 한다.

- for-humanity를 0.28.0으로 올리고 설치.
- 문서 40편의 런타임 블록 삭제(약 10,700줄). `scripts/fx.ts`, `scripts/fx/`, `package.json`의 `fx` 스크립트, `check.ts`의 런타임 검사 삭제.
- Writing Guide의 `인터랙티브 그림` 절을 for-humanity Figures 링크와 저장소 고유 규칙(독자가 시작하는 움직임, 나란히 비교, 흑백과 가는 선, 사실 근거)으로 줄이고 Workflow의 `pnpm fx` 줄을 지운다. Decisions에 한 줄.
- custom 그림 6편의 자체 스크립트 11개는 그대로 둔다. 이벤트와 클래스가 안 바뀐다.
- `pnpm build`, `pnpm check`, 두 테마와 두 폭의 캡처로 몇 편 확인.
