---
name: Architecture
label: 엔진과 처리 흐름
group: Development
order: 10
---

라이브러리 내부 구현을 수정하는 사람을 위한 참고 문서.
Hono 라우팅과 정적 출력, React 서버 렌더링, unified Markdown processor.
브라우저는 탐색 초기화와 본문 동작을 나눈 DOM 스크립트 사용.

## Overview

```mermaid
flowchart LR
    a("Markdown<br>설정") --> b("unified<br>본문 HTML")
    b --> c("React<br>페이지 HTML")
    c --> d("Hono<br>dev 또는 SSG")
```

| Entry       | Responsibility                               | Runtime       |
| ----------- | -------------------------------------------- | ------------- |
| `cli.ts`    | 인자 · 설정 · 문서 · 폰트 · 빌드·서버 시작   | Node.js       |
| `app.tsx`   | 첫 화면과 문서 라우트 · React → HTML         | Node.js       |
| `dev.ts`    | 자원 · SSE 새로고침 · 페이지 앱 위임         | Node.js · dev |
| `navigation.ts` | 탐색 상태 복원 · 접기 버튼 · 드로어 · 스크롤 | Browser · 동기 |
| `client.ts` | 커서 장식 · 읽는 section · 접힌 hash 보정 | Browser · module |

::part[Engine]

## Routing and rendering

페이지 앱의 라우트: `/`, `/:slug{.+}/`. 문서 id에는 하위 폴더 포함.
`/`는 문서 폴더의 `README.md`. 일반 문서 목록과 별도로 읽고, 개발 중 함께 갱신.

- React: `renderToStaticMarkup`으로 HTML 문서 생성
- build: Hono `ssgParams`와 `toSSG`로 같은 라우트 출력
- dev: `@hono/node-server`로 같은 페이지 앱 제공
- preview: `serveStatic`으로 빌드 결과 제공

페이지 앱과 dev 앱의 분리는 SSG 대상과 개발 전용 자원의 경계.
Hono 정규식 매개변수와 wildcard 라우트 혼합 시 Router 제약도 이 경계에서 격리.

### JSX and browser runtime

현재 JSX 런타임은 React입니다. `tsconfig.json`은 `react-jsx`, 페이지 HTML은 `react-dom/server`의 `renderToStaticMarkup`으로 생성합니다. Hono는 라우팅과 SSG를 담당하며 `hono/jsx`를 렌더러로 사용하지 않습니다.

JSX는 컴포넌트와 요소를 작성하는 문법이고, 이벤트와 Hooks가 실행되는 위치는 렌더러가 결정합니다. 서버 TSX 내부에 일반 함수를 선언할 수 있지만, 서버에서 HTML로 출력한 `onClick` 함수가 브라우저로 전달되지는 않습니다. React의 `renderToStaticMarkup` 출력은 hydration 대상도 아닙니다.

Hono도 `hono/jsx/dom`의 `render`와 Hooks로 브라우저 UI를 만들 수 있습니다. React로 상호작용 컴포넌트를 만들려면 브라우저 React 진입점과 렌더링이 필요하고, hydration을 선택하면 서버 출력도 그에 맞게 바꿔야 합니다. 둘 다 가능한 선택이며, Hono가 함수 문자열 주입을 요구하는 것은 아닙니다.

현재는 문서 HTML과 기본 링크를 미리 생성하고 작은 DOM 동작을 연결하는 구조를 유지합니다. 탐색의 첫 화면 복원에는 동기 진입점을 사용하며, 전체 문서를 클라이언트에서 다시 렌더링하지 않습니다.

참조: [Hono Client Components](https://hono.dev/docs/guides/jsx-dom), [React static rendering](https://react.dev/reference/react-dom/server/renderToStaticMarkup), [React hydration](https://react.dev/reference/react-dom/client/hydrateRoot).

## Navigation lifecycle

문서 링크는 전체 HTML 페이지를 이동합니다. React 브라우저 hydration은 사용하지 않으며, 탐색의 클라이언트 상태는 Zustand vanilla 스토어가 소유합니다.
문서 목록과 On this page는 각각 독립 스크롤 컨테이너입니다. 1536px 이상에서는 같은 폭의 양쪽 사이드바로 표시하고, 그 아래에서는 목차를 숨깁니다. 모바일 드로어에는 문서 목록만 포함합니다.

`src/navigation.ts`를 esbuild가 독립 IIFE로 컴파일합니다. CLI는 생성한 `dist/navigation.js`를 코드 문자열로 읽고 탐색 DOM·드로어 바로 뒤, 본문 앞에 포함합니다. 함수의 `.toString()`이나 수동 함수 조립은 사용하지 않습니다.
이 진입점이 첫 paint 전에 접힘 선택을 복원하고 버튼·드로어·스크롤 이벤트를 연결합니다. 큰 본문이나 외부 client module 다운로드를 기다리지 않아 버튼이 뒤늦게 나타나지 않습니다. 이미 제자리에 있는 탐색 DOM은 다시 삽입하지 않습니다.

가지 선택은 `localStorage`에 문서 ID·그룹 경로·페이지별 헤딩 키로 저장합니다. 기본값은 전체 펼침입니다.
스크롤은 같은 탭의 `sessionStorage`에 넓은 화면·좁은 데스크톱·드로어 위치를 따로 저장합니다. 기존 배치별 저장 자료도 첫 복원에서 수용합니다.
문서 링크 순서가 달라지면 이전 위치는 무효입니다. 목차 위치는 같은 페이지에서만 복원하고 다른 문서의 목차는 시작점에서 읽습니다. 저장소가 차단되거나 값이 손상돼도 메모리 상태와 기본 탐색은 유지합니다.
`ResizeObserver`와 스크롤 이벤트는 실제 위·아래 넘침이 있는 끝만 흐리게 합니다. 강제 색상과 JavaScript 미사용 환경은 네이티브 손잡이를 사용합니다.

### Store ownership and lifetime

`src/store/navigation`에 생성기·저장 키·상태 계약·저장 자료 검증을 모읍니다. DOM 이벤트와 반응형 배치는 shell이 소유합니다.
`createNavigationStores`는 브라우저의 탐색 진입점에서 페이지마다 생성하며, 서버 요청이나 정적 빌드에서는 실행하지 않습니다. 페이지 사이의 선택은 `persist`가 이어받고, BFCache 복귀에서는 최신 저장 상태를 다시 읽습니다.

React Hook이 아닌 vanilla 생성기이므로 `use-` 접두사를 붙이지 않습니다. 나중에 React 클라이언트 컴포넌트를 도입하면 `useStore(store, selector)`로 구독하는 `use-*-store.ts`를 추가할 수 있습니다. Hook을 사용하지 않는 현재 DOM 코드에는 `getState`, `setState`, `subscribe`를 사용합니다.
서버의 `AppOptions.store`는 읽은 문서 목록과 홈을 담는 별도 객체이며 사용자 탐색 상태를 저장하는 Zustand 스토어가 아닙니다.

참조: [Zustand vanilla store](https://zustand.docs.pmnd.rs/reference/apis/create-store), [persist](https://zustand.docs.pmnd.rs/reference/middlewares/persist), [React useStore](https://zustand.docs.pmnd.rs/reference/hooks/use-store).

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
| HTML 틀 · 사이드바            | `src/component/widget/shell` |
| 탐색 저장 상태 · 검증         | `src/store/navigation`       |
| 본문 · remark·rehype 플러그인 | `src/component/widget/prose` |
| processor · 문서 읽기         | `src/content`                |
| 상수 · 문구 · 스키마          | `src/constant` · `src/type`  |
| 색 · 폰트 · 간격              | `src/style/token.css`        |
| 격자 렌더러 · 폰트 변환       | `src/util`                   |

## Package output

`build:kit`: esbuild로 서버 CLI와 CSS, 브라우저 스크립트 생성.
폰트와 favicon 원본은 패키지에 포함, 사이트 빌드 시 결과 폴더로 복사.

- `dist/cli.js`: npm bin 진입점
- `dist/cli.css`: 컴포넌트 CSS 묶음
- `dist/navigation.js`: HTML에 포함하는 동기 탐색 초기화
- `dist/client.js`: 외부 module로 연결하는 본문 동작
- 자원 URL: `/_fh/` · favicon: `/favicon.svg`

패키지 빌드와 문서 사이트 빌드는 별도 단계. 절차는 [Maintenance](maintenance.md).
