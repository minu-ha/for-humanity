---
name: Architecture
label: 엔진과 처리 흐름
group: Development
order: 10
---

라이브러리 내부 구현을 수정하는 사람을 위한 참고 문서.
Hono 라우팅과 정적 출력, Hono JSX 서버 렌더링, unified Markdown processor.
브라우저 탐색·앵커·커서는 `hono/jsx/dom` 위젯이 소유하고, CLI가 문서를 읽어 본문 HTML을 준비합니다.

## Overview

```mermaid
flowchart LR
    a("Markdown<br>설정") --> b("unified<br>본문 HTML")
    b --> c("Hono JSX<br>페이지 HTML")
    c --> d("Hono<br>dev 또는 SSG")
```

| Entry       | Responsibility                               | Runtime       |
| ----------- | -------------------------------------------- | ------------- |
| `src/entry/cli/cli.ts`    | 인자 · 설정 · 문서 · 폰트 · 빌드·서버 시작   | Node.js       |
| `src/entry/cli/_function/create-app.tsx` | 첫 화면과 문서 라우트 · Hono JSX → HTML | Node.js |
| `src/entry/cli/_function/create-dev-app.ts` | 자원 · SSE 새로고침 · 페이지 앱 위임 | Node.js · dev |
| `src/entry/browser/browser.tsx` | 입력 검증 · 저장소 생성 · 브라우저 셸 마운트 | Browser · 동기 |

::part[Engine]

## Routing and rendering

페이지 앱의 라우트: `/`, `/:slug{.+}/`. 문서 id에는 하위 폴더 포함.
`/`는 문서 폴더의 `README.md`. 일반 문서 목록과 별도로 읽고, 개발 중 함께 갱신.

- Hono JSX: `c.html`에 컴포넌트를 전달해 HTML 문서 생성
- build: Hono `ssgParams`와 `toSSG`로 같은 라우트 출력
- dev: `@hono/node-server`로 같은 페이지 앱 제공
- preview: `serveStatic`으로 빌드 결과 제공

페이지 앱과 dev 앱의 분리는 SSG 대상과 개발 전용 자원의 경계.
Hono 정규식 매개변수와 wildcard 라우트 혼합 시 Router 제약도 이 경계에서 격리.

### Document processing lifetime

`src/entry/cli/_function`이 파일 읽기·frontmatter 검증·Markdown 처리·서버 구성을 소유합니다. `create-processor`의 전용 플러그인은 그 함수 폴더의 `_` 파일에 둡니다. 본문의 표현을 만드는 플러그인은 `prose` 위젯이 계속 소유합니다.

- `build`: Markdown을 한 번 처리하고 페이지 앱의 라우트를 정적 HTML로 출력합니다.
- `dev` 시작: 전체 문서와 README를 읽어 본문 HTML을 메모리에 준비합니다.
- `dev` 문서·자원 변경: 처리기를 새로 만들고 문서·자원 목록을 함께 교체한 뒤 브라우저에 갱신을 알립니다.
- `dev` 페이지 요청: 준비한 본문을 Hono JSX 셸과 조립합니다. 요청마다 Markdown을 다시 읽거나 변환하지 않습니다.
- `preview`와 배포 사이트: 이미 생성한 HTML·CSS·자원을 제공합니다.

### JSX and browser runtime

페이지 JSX는 `hono/jsx`로 HTML을 만듭니다. `tsconfig.json`의 `jsxImportSource`가 `hono/jsx`이며 React 서버 렌더러와 React 의존성은 사용하지 않습니다. Markdown 본문은 unified가 HTML로 변환한 뒤 페이지의 `<article>` 안에 넣습니다.

서버에서 JSX를 출력해도 `onClick` 함수가 HTML로 전송되지는 않습니다. 브라우저 상호작용에는 별도의 클라이언트 JavaScript가 필요합니다. Hono의 `hono/jsx/dom`은 브라우저에서 컴포넌트와 Hooks를 실행할 수 있습니다.

`WgShell`은 HTML 문서·자원·본문 배치를 소유합니다. `src/component/widget/shell-controls`의 `WgShellControls`는 서버와 브라우저가 공유하는 탐색·커서 조립과 앵커 수명을 소유합니다. `browser.tsx`는 DOM과 서버 자료를 찾고 검증·스토어 생성·최초 마운트를 실행하는 진입점입니다.

서버는 `WgShellControls`로 전체 펼침 링크를 출력합니다. 브라우저 진입점은 `hono/jsx/dom/client`의 `createRoot(root).render(...)`로 같은 영역을 저장 상태가 반영된 JSX로 교체합니다. 이후 접힘·드로어·현재 헤딩은 Hooks와 JSX 이벤트로 갱신합니다. 컴포넌트 해제는 같은 root의 `unmount()`가 Effect 정리를 실행합니다. 본문은 마운트 범위 밖의 서버 HTML로 유지합니다.

Hono 브라우저 렌더러로 탐색·커서 영역을 첫 paint 전에 마운트합니다. 본문은 서버가 만든 HTML을 그대로 표시하고 문서 링크는 전체 페이지를 이동합니다.

현재 Hono의 `hydrateRoot`는 내부에서 `createRoot`와 `render`를 호출합니다. React의 hydration처럼 기존 DOM을 재사용하는 의미가 아닙니다. `createRoot`는 갱신·해제할 수 있는 root 수명을 제공하며 최초 DOM 교체 방식은 같습니다. [Hono 구현](https://github.com/honojs/hono/blob/main/src/jsx/dom/client.ts)

JSX·Hooks로 동작을 소유하면서 정적 본문을 유지하는 현재 조건에서는 작은 제어 영역을 한 번 마운트하는 구성을 사용합니다. 최초 DOM 교체 비용은 남습니다. DOM 재사용을 요구한다면 실제 hydration을 제공하는 렌더러나 서버 DOM에 이벤트를 직접 연결하는 구성이 필요하며, 후자는 DOM과 상태 갱신을 함께 관리해야 합니다.

참조: [Hono JSX](https://hono.dev/docs/guides/jsx), [Hono Client Components](https://hono.dev/docs/guides/jsx-dom).

## Navigation lifecycle

문서 링크는 전체 HTML 페이지를 이동합니다.  탐색의 클라이언트 상태는 Zustand vanilla 스토어가 소유합니다.
문서 목록과 On this page는 각각 독립 스크롤 컨테이너입니다. 1536px 이상에서는 같은 폭의 양쪽 사이드바로 표시하고, 그 아래에서는 목차를 숨깁니다. 모바일 드로어에는 문서 목록만 포함합니다.

`script/build-kit.mjs`가 esbuild API로 `src/entry/browser/browser.tsx`를 단일 IIFE로 컴파일합니다. CLI는 생성한 `dist/browser.js`를 코드 문자열로 읽고 탐색 HTML과 탐색 전용 JSON 바로 뒤, 본문 앞에 포함합니다. JSON에는 문서 이름·URL·계층·현재 목차만 담고 본문은 포함하지 않습니다. `<`와 줄 구분자는 escape하여 작성한 이름이 script 태그를 닫지 못하게 합니다. 함수의 `.toString()`이나 수동 함수 조립은 사용하지 않습니다.
이 진입점은 첫 paint 전에 저장 상태를 읽고 `hono/jsx/dom` 런타임으로 탐색 컴포넌트를 마운트합니다. 브라우저 빌드만 `jsxImportSource=hono/jsx/dom`을 사용합니다. 외부 JS 다운로드를 기다리지 않아 버튼이 뒤늦게 나타나지 않습니다. 별도의 `client.ts`나 본문 module은 없습니다.

Hono의 최초 레이아웃 효과는 아직 연결되지 않은 fragment에서 실행됩니다. 스크롤 측정·복원은 이 경우에만 연결 직후 microtask로 미루며 첫 paint 앞에 완료합니다. 이후 반응형 전환에서는 연결된 요소를 동기 복원합니다. 외부 저장 상태 변경으로 접힌 가지 안에 포커스가 남으면 해당 가지 버튼으로 옮깁니다.

가지 선택은 `localStorage`에 문서 ID·그룹 경로·페이지별 헤딩 키로 저장합니다. 기본값은 전체 펼침입니다.
스크롤은 같은 탭의 `sessionStorage`에 넓은 화면·좁은 데스크톱·드로어 위치를 따로 저장합니다. 기존 배치별 저장 자료도 첫 복원에서 수용합니다.
문서 링크 순서가 달라지면 이전 위치는 무효입니다. 목차 위치는 같은 페이지에서만 복원하고 다른 문서의 목차는 시작점에서 읽습니다. 저장소가 차단되거나 값이 손상돼도 메모리 상태와 기본 탐색은 유지합니다.
`ResizeObserver`와 스크롤 이벤트는 실제 위·아래 넘침이 있는 끝만 흐리게 합니다. 강제 색상과 JavaScript 미사용 환경은 네이티브 손잡이를 사용합니다.

### Shell and cursor lifecycle

`WgShellControls`가 앵커 클릭·hash 변경·Details 공개·3초 헤딩 강조·초기 글꼴 보정과 dev SSE 연결을 소유합니다. 초기화는 본문 앞에서 실행되므로 본문 대상 조회는 `DOMContentLoaded` 이후로 미룹니다. 새로 생성한 `AbortController`로 DOM 이벤트를 묶고, 해제 시 이벤트·강조 타이머·도착 감시·SSE를 정리합니다. 글꼴 완료를 기다리는 비동기 보정도 해제된 인스턴스에서는 실행하지 않습니다.

커서 장식은 `src/component/widget/cursor-face`의 `WgCursorFace`가 DOM ref·좌표·미디어 조건·전역 이벤트·예약 frame을 소유합니다. 마지막 좌표는 같은 탭의 페이지 이동에서만 이어받으며 터치·reduced motion에서는 숨깁니다. 본문과 커서 동작을 모듈 최상위에서 바로 실행하지 않고 컴포넌트의 Effect에서 설치·정리합니다.

`.tsx`는 JSX 문법의 구분입니다. 서버의 `hono/jsx`는 HTML을 만들고 Effect 콜백은 실행하지 않습니다. esbuild가 브라우저 진입점에서 가져오는 컴포넌트·Hook을 JS로 묶으며, `hono/jsx/dom` 렌더러가 브라우저에서 Effect를 실행합니다. Hono가 Hook마다 자동으로 청크를 생성하거나 전송하는 구조는 아닙니다.

### Store ownership and lifetime

`src/store/navigation`에 생성기·저장 키·상태 계약·저장 자료 검증을 모읍니다. JSX 이벤트·반응형 배치·스크롤 영역·현재 헤딩은 `src/component/widget/navigation`이 소유하며 구독을 설치한 효과에서 정리합니다.
`createNavigationStores`는 브라우저의 탐색 진입점에서 페이지마다 생성하며, 서버 요청이나 정적 빌드에서는 실행하지 않습니다. 페이지 사이의 선택은 `persist`가 이어받고, BFCache 복귀에서는 최신 저장 상태를 다시 읽습니다.

vanilla 생성기는 `use-` 접두사를 붙이지 않습니다. `useNavigationTreeStore`는 Hono의 `useSyncExternalStore`로 같은 vanilla 스토어를 구독합니다. 최초 브라우저 렌더도 저장된 값을 읽으며, 사용자 상태는 서버 요청 사이에 공유하지 않습니다.
서버의 `AppOptions.store`는 읽은 문서 목록과 홈을 담는 별도 객체이며 사용자 탐색 상태를 저장하는 Zustand 스토어가 아닙니다.

참조: [Zustand vanilla store](https://zustand.docs.pmnd.rs/reference/apis/create-store), [persist](https://zustand.docs.pmnd.rs/reference/middlewares/persist).

## Markdown pipeline

| Stage  | Work                                                                 |
| ------ | -------------------------------------------------------------------- |
| Read   | 파일 탐색 · remark-frontmatter의 YAML 노드 · yaml 값 해석 · Zod 검증 |
| remark | GFM · 문장부호 · Note·Details · part · 흐름도 · status badge · swatch · 링크 · 경고 |
| rehype | 코드 강조 · 문서 header · 제목 id · 가름 수집 · 표 상자           |
| Output | raw HTML 해석 · HTML 문자열                                          |

제목 원문에서 id와 TOC 텍스트를 수집하고 가름별로 묶음. 제목 번호는 자동 생성하지 않음.
중간 계약은 `file.data.fh`. 제목과 section 정보는 문서 순서 유지.
frontmatter는 정규식으로 잘라내지 않고 AST 노드로 읽음. 본문 노드의 원본 줄·열은 유지.
Note·Details의 검증은 Markdown 부품 변환 전. 제목은 native label, 본문은 기존 처리 흐름.
접힌 본문의 `###`도 같은 제목 id·TOC. 부품의 작성 계약은 [Parts](parts.md).

remark는 Markdown을 AST로 다루는 플러그인 체계. 현재의 부품 변환·검증과 rehype 연결에 사용.
markdown-it도 확장 가능한 렌더러이며 VitePress에서 사용. 한쪽이 항상 더 좋은 것은 아니고, 이 프로젝트는 기존 AST 변환을 유지.
gray-matter는 frontmatter를 분리·해석하는 다른 선택지. 여기서는 `remark-frontmatter`와 기존 `yaml`을 조합.

참조: [remark](https://github.com/remarkjs/remark), [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter), [gray-matter](https://github.com/jonschlinkert/gray-matter), [VitePress Markdown](https://vitepress.dev/ko/guide/markdown).

::part[Ownership]

## Code ownership

| Concern                       | Owner                        |
| ----------------------------- | ---------------------------- |
| 첫 화면 · 문서 페이지         | `src/page`                   |
| HTML 틀 · 자원 · 본문 배치    | `src/component/widget/shell` |
| 공통 제어 UI · 앵커 수명      | `src/component/widget/shell-controls` |
| 포인터 장식 · 좌표 · 입력 구독 | `src/component/widget/cursor-face` |
| 문서 트리 계산 · 탐색 · 목차 · 드로어 | `src/component/widget/navigation` |
| 탐색 저장 상태 · 검증         | `src/store/navigation`       |
| 본문 · remark·rehype 플러그인 | `src/component/widget/prose` |
| processor · 문서 읽기 · 서버 구성 | `src/entry/cli/_function` |
| 최초 브라우저 마운트          | `src/entry/browser` |
| 상수 · 문구 · 스키마          | `src/constant` · `src/type`  |
| 색 · 폰트 · 간격              | `src/style/token.css`        |
| 격자 렌더러 · 폰트 변환       | `src/util`                   |

문서 렌더 결과의 공통 계약(`DocContent`, `DocOutline`, `DocSection`)은 `src/type`에 둡니다. CLI와 본문·탐색 위젯이 같은 계약을 소비하며 루트 타입이 위젯 내부 타입에 의존하지 않습니다. 문서 트리 표현 계약(`DocGroup`, `DocBranch`)은 탐색 위젯의 `_type`에 둡니다.

## Package output

`build:kit`: `script/build-kit.mjs`에서 esbuild API로 CLI·CSS·단일 브라우저 번들을 생성합니다. 이전 번들이 npm 패키지에 남지 않도록 `dist` 생성물을 먼저 비웁니다.
폰트와 favicon 원본은 패키지에 포함, 사이트 빌드 시 결과 폴더로 복사.

- `dist/cli.js`: npm bin 진입점
- `dist/cli.css`: 컴포넌트 CSS 묶음
- `dist/browser.js`: HTML에 포함하는 셸·탐색·커서의 Hono JSX 런타임
- 자원 URL: `/_fh/` · favicon: `/favicon.svg`

패키지 빌드와 문서 사이트 빌드는 별도 단계. 절차는 [Maintenance](maintenance.md).
