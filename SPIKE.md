# 시험판: Astro 를 Hono + React 로 바꾸기

> 2026-10-01 합격. 그날 main 으로 옮기고 Astro 를 걷어냈다. 아래는 그때의 브리프와 결과 기록이다. 섬 (쪽지) 은 시험판 커밋 `1fb5b8c` 에만 있다

for-humanity 의 엔진을 Astro 에서 Hono + React 로 옮겨도 되는지 재는 시험판이다. 옮기는 작업이 아니라 **되는지 확인하는 작업**이다.
`spike/hono-react` 브랜치에서 하고 main 에 합치지 않는다. 합격하면 그때 옮긴다. (2026-09-30 대화에서 정한 내용을 다른 세션에서 이어 하려고 남긴다)

## 왜 바꾸나

- Astro 컨벤션 (`.astro`, island 지시어, 콘텐츠 모음) 을 React · TS · CSS 컨벤션 위에 또 다뤄야 한다
- React 라이브러리를 쓸 것이라 화면을 전부 진짜 React 로 짠다. `hono/jsx` 는 React 가 아니다. `hono/jsx/dom` 의 `hydrateRoot` 는 render 와 같고 (타입 파일에 "hydrate is equivalent to render"), `@hono/react-compat` 는 0.0.3 이다
- 나중에 API 를 붙일 때 같은 Hono 앱에 `/api/*` 만 더하면 된다
- Astro 를 CLI 뒤에 숨기느라 넣은 우회가 빠진다: root 를 킷으로 잡기, `process.chdir`, astro-check 때문의 TS 6, Biome html 실험 옵션, 번호를 raw 노드로 넣고 목차 차례를 머리말 `fhSections` 로 나르는 요령

## 목표 구성

| 자리              | 지금 (Astro)                          | 시험판                                                                                          |
|-------------------|---------------------------------------|-------------------------------------------------------------------------------------------------|
| 화면              | `.astro` 5개                          | React 19 TSX. 서버 렌더는 `@hono/react-renderer`                                                |
| 라우트            | `injectRoute` 두 개                   | Hono 코드 라우트 `/` 와 `/:slug{.+}/`. 문서 id 는 `ssgParams`                                   |
| 빌드              | `astro build`                         | `toSSG` (`hono/ssg`) 로 쪽마다 HTML, 자원은 복사                                                |
| 미리보기          | Astro dev (Vite)                      | `@hono/node-server` 로 같은 앱을 띄운다. Markdown 이 바뀌면 새로고침 (SSE)                      |
| 문서 모음         | `src/content.config.ts` (glob + zod)  | 직접: `fs.glob` + 머리말 (`yaml`) + 같은 zod 스키마                                             |
| Markdown          | Astro 의 unified 처리기               | unified 를 직접 조립 (아래 "같게 맞출 것")                                                      |
| CSS               | 컴포넌트가 import, Vite 가 하나로     | esbuild 로 하나로 묶는다. 배포할 때 미리 만든다                                                 |
| 브라우저 스크립트 | 컴포넌트의 `<script>`                 | `src/client.ts` 하나를 esbuild 로 묶는다. 머리의 테마 인라인 스크립트는 그대로 인라인            |
| 글꼴              | Astro Fonts API (`<Font>`)            | `pretendard` (dynamic subset CSS + woff2) 와 `@fontsource-variable/jetbrains-mono` 를 결과에 복사하고 `@font-face` 를 직접 |
| dev toolbar       | Astro toolbar 앱 (`src/toolbar/`)     | 시험판 범위 밖. 합격 뒤 개발 모드 전용 경고 패널로 옮긴다                                       |
| 사용자 쪽 의존성  | astro 외, 설치 약 200MB               | hono, @hono/node-server, @hono/react-renderer, react, react-dom, unified 부품, zod, beautiful-mermaid. Vite 없음 |
| 킷 개발           | Astro dev                             | 시험판은 esbuild 로 충분. 원하면 Vite + `@hono/vite-dev-server`                                 |

움직이는 부분:

- 테마 단추, 목차의 읽는 절 표시, #절 맞추기는 지금 DOM 스크립트를 그대로 옮긴다 (비교 기준과 같게)
- React 라이브러리 섬 하나: 시험용 문서에 `@radix-ui/react-dialog` 같은 것 하나를 서버에서 그리고 `hydrateRoot` 로 이어받는다. provider 는 모든 섬이 같이 쓰는 감싸개 하나로 둔다
- 선택: 테마 단추를 React 섬으로 바꿨을 때의 쪽 크기를 DOM 스크립트와 견준다

## 비교 기준 떠 두기

지금 main (`89e6f2a` 에 이 파일만 더한 상태) 의 빌드 결과가 기준이다.

```sh
pnpm install && pnpm build
cp -R templates/document/dist /tmp/fh-astro-dist
git switch -c spike/hono-react
```

## Astro 에서 옮길 때 같게 맞출 것

Astro 가 말없이 해 주던 것이라 빠뜨리면 픽셀이 달라진다.

- **Markdown 처리 차례:** `remark-parse` → `remark-gfm` → `remark-smartypants` (Astro 기본이 켜짐) → 지금 remark 플러그인 → `remark-rehype` (`allowDangerousHtml: true`) → `rehype-raw` → 제목 id → 지금 rehype 플러그인 → `rehype-stringify`
  - 지금 차례 (`src/cli.ts`): remark 는 `remarkDirective`, `remarkParts`, `remarkFlow`, `remarkStatus({status})`, `remarkSwatch`, `remarkLinks({root})`, `remarkUnknownDirectives`, `remarkReport` (toolbar 용). rehype 는 `rehypeHead({title})`, `rehypeSections`, `rehypeTables`
- **제목 id:** Astro 는 github-slugger 로 만들고 끝의 `-` 를 뗀다. 번호 (`<span class="wg_prose__num">`) 는 id 글자에 들어가면 안 된다. 번호를 넣기 전에 id 를 매기면 된다
- **목차 재료:** 지금은 Astro 가 모은 `headings` 와 `fhSections` 를 짝짓는다. 시험판에서는 id 를 먼저 매기니 rehype 단계에서 목차를 바로 만들 수 있다. 결과 HTML 만 같으면 된다
- **CSS 차례:** `/tmp/fh-astro-dist/_astro/*.css` 를 열어 같은 차례로 묶는다. `@import` 가 있으면 맨 앞이다
- **글꼴:** 기준 HTML 의 `@font-face` 와 preload (코드 글꼴만 미리 받는다) 를 열어 같게 둔다. `--app-font-face-sans`, `--app-font-face-mono` 변수 이름은 `src/constant/font.ts`
- **HTML:** 클래스, `data-*` (`data-toc-link`, `data-toc-sub`, `data-toc-sub-link`, `data-theme-toggle`, `data-part`), `lang="ko"`, 머리의 인라인 스크립트 (테마, scroll-behavior) 를 그대로
- **주소:** `/`, `/commands/` (끝에 `/`). 다른 문서의 `.md` 링크는 `/settings/#시간대` 꼴
- **빌드를 멈추는 오류:** 모르는 명령, 틀린 설정, 머리말 누락, 첫 글자 겹침, 모르는 부품 (`::nope`), 그리지 못한 흐름도. 문구는 `src/constant/copy.ts`. Astro 는 Markdown 렌더 오류를 삼켜서 `pg-doc.astro` 가 따로 막았는데, 직접 조립하면 그냥 던지면 된다

## 할 일

1. 기준을 떠 두고 브랜치를 만든다 (위)
2. 의존성: `hono @hono/node-server @hono/react-renderer react react-dom unified remark-parse remark-gfm remark-smartypants remark-rehype rehype-raw rehype-stringify github-slugger yaml zod clsx pretendard @fontsource-variable/jetbrains-mono`, 개발용 `@types/react @types/react-dom playwright`. Astro 는 합격 전까지 지우지 않는다
3. 문서 모음 읽기와 unified 처리기
4. `.astro` 5개를 TSX 로: `wg-shell`, `_wg-shell-nav`, `wg-prose`, `pg-home`, `pg-doc`. `class:list` 는 `clsx`
5. Hono 앱 (`/`, `/:slug{.+}/`) 과 `toSSG` 빌드, 자원 복사 (CSS · JS · 글꼴 · favicon)
6. 브라우저 스크립트를 `src/client.ts` 로 모아 esbuild 로 묶는다
7. `dev` (Markdown 이 바뀌면 새로고침) 와 `preview` (정적 서버)
8. CLI 를 esbuild 로 묶는다 (`--jsx=automatic`)
9. React 라이브러리 섬 하나
10. 아래 확인을 돌리고 결과를 이 파일 끝 "결과" 에 적는다

## 확인 (합격 기준)

1. **픽셀:** 4쪽 × 3 (1600 밝게, 1600 어둡게, 390 밝게) 전체 캡처가 기준과 같다. 글꼴 로딩 타이밍 탓에 가끔 수십 px 다를 수 있어, 다른 장은 다시 찍어 본다
2. **동작:** #절 주소로 들어오면 제목이 높이 1000px 창에서 400px 에 선다. 테마 단추가 시스템 → 밝게 → 어둡게를 돌고 새로고침해도 기억한다. 스크롤하면 목차의 읽는 절이 켜진다. JS 를 꺼도 본문과 흐름도가 다 보인다
3. **오류:** 위 여섯 경우가 exit 1 로 멈춘다
4. **설치:** `pnpm pack` 한 파일을 저장소 밖 빈 프로젝트에 pnpm 과 npm 으로 각각 설치해 `build` 와 `dev` 가 된다. `node_modules` 크기와 빌드 시간을 기준 (Astro, 약 200MB) 과 함께 적는다
5. **섬:** React 라이브러리 섬이 hydrate 되어 동작한다. 그 쪽의 JS 크기를 적는다
6. **검사:** `pnpm check` (Biome, stylelint, tsc) 가 통과한다. astro-check 없이 tsc 로

아래 두 스크립트는 임시 폴더에 저장하고 **저장소 뿌리에서** 실행한다 (playwright 를 저장소의 node_modules 에서 찾는다). 처음 한 번 `npx playwright install chromium`.

픽셀 비교. 기준과 새 결과를 각각 정적 서버로 띄운 뒤 돌린다.

```sh
(cd /tmp/fh-astro-dist && python3 -m http.server 4322) &
(cd templates/document/dist && python3 -m http.server 4323) &
node /tmp/spike-diff.mjs http://localhost:4322 http://localhost:4323
```

```js
// /tmp/spike-diff.mjs — 두 사이트의 전체 캡처를 쪽마다 픽셀로 견준다
import {createRequire} from "node:module";

const {chromium} = createRequire(`${process.cwd()}/package.json`)("playwright");
const [before, after] = process.argv.slice(2);
const pages = ["", "commands/", "settings/", "workflow/"];
const views = [[1600, "light"], [1600, "dark"], [390, "light"]];
const browser = await chromium.launch();
const diffPage = await browser.newPage();

const shot = async (base, path, width, scheme) => {
	const context = await browser.newContext({viewport: {width, height: 1000}, colorScheme: scheme});
	const page = await context.newPage();
	await page.goto(`${base}/${path}`);
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(800);
	const png = await page.screenshot({fullPage: true});
	await context.close();
	return `data:image/png;base64,${png.toString("base64")}`;
};

const diff = (a, b) =>
	diffPage.evaluate(async ([a, b]) => {
		const load = (src) => new Promise((done) => { const image = new Image(); image.onload = () => done(image); image.src = src; });
		const [x, y] = await Promise.all([load(a), load(b)]);
		if (x.width !== y.width || x.height !== y.height) return `size ${x.width}x${x.height} vs ${y.width}x${y.height}`;
		const canvas = new OffscreenCanvas(x.width, x.height).getContext("2d");
		canvas.drawImage(x, 0, 0);
		const p = canvas.getImageData(0, 0, x.width, x.height).data;
		canvas.clearRect(0, 0, x.width, x.height);
		canvas.drawImage(y, 0, 0);
		const q = canvas.getImageData(0, 0, x.width, x.height).data;
		let count = 0;
		let top = -1;
		for (let i = 0; i < p.length; i += 4) {
			if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 30) {
				count++;
				if (top < 0) top = Math.floor(i / 4 / x.width);
			}
		}
		return count ? `${count} px differ, first at y=${top}` : "identical";
	}, [a, b]);

for (const path of pages) {
	for (const [width, scheme] of views) {
		console.log(`/${path}`.padEnd(12), width, scheme.padEnd(5), await diff(await shot(before, path, width, scheme), await shot(after, path, width, scheme)));
	}
}

await browser.close();
```

동작 확인. 새 결과를 띄운 서버 주소를 넘긴다.

```sh
node /tmp/spike-behavior.mjs http://localhost:4323
```

```js
// /tmp/spike-behavior.mjs — #절 착지, 테마 단추, 읽는 절 표시, JS 없이 보이기
import {createRequire} from "node:module";

const {chromium} = createRequire(`${process.cwd()}/package.json`)("playwright");
const [base] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1600, height: 1000}});

await page.goto(`${base}/commands/#search`);
await page.waitForTimeout(3000);
console.log("#search 제목 높이 (400 이어야 함):", await page.evaluate(() => Math.round(document.getElementById("search").getBoundingClientRect().top)));

const seen = [];
for (let i = 0; i < 3; i++) {
	await page.click("[data-theme-toggle]");
	seen.push(await page.evaluate(() => `${document.documentElement.getAttribute("data-theme")}/${localStorage.getItem("fh-theme")}/${document.querySelector("[data-theme-toggle]").textContent}`));
}
console.log("테마 순환 (light → dark → system):", seen.join(" → "));
await page.click("[data-theme-toggle]");
await page.reload();
await page.waitForTimeout(500);
console.log("새로고침 뒤 (light 여야 함):", await page.evaluate(() => document.documentElement.getAttribute("data-theme")));

await page.evaluate(() => document.getElementById("확인-안-된-것").scrollIntoView({behavior: "instant"}));
await page.waitForTimeout(300);
console.log("읽는 절 (05 여야 함):", await page.evaluate(() => document.querySelector("[data-toc-link].wg_shellNav__link--active")?.textContent?.trim()));

const noJs = await browser.newContext({javaScriptEnabled: false});
const plain = await noJs.newPage();
await plain.goto(`${base}/commands/`);
console.log("JS 없이 흐름도 수 (2 여야 함):", await plain.evaluate(() => document.querySelectorAll(".wg_prose__flow svg").length));

await browser.close();
```

## 지킬 것

- 컨벤션 스킬 (convention-typescript, convention-react, convention-css) 을 따른다. 파일 · 폴더 이름, `wg-` · `pg-` 접두사, `@/` 가져오기, named export, props 인터페이스, 클래스 이름 문법
- 예시 문서는 지어낸 내용만 쓴다 (`templates/document`, Lantern). 다른 저장소의 내용을 넣지 않는다
- 커밋은 로컬에만, 트레일러 없이 한다. push 는 사용자가 한다
- 서브에이전트를 쓰지 않는다 (토큰)

## 합격하면

- Astro 를 다 걷어낸다: `astro`, `@astrojs/check`, `@astrojs/mdx`, `@astrojs/react`, `@astrojs/markdown-remark`, `.astro` 파일, `src/content.config.ts`, `src/env.d.ts` 의 astro 참조, `.mcp.json` (Astro 문서 MCP), `sync` 명령과 astro-check, root · chdir 우회, tsconfig 의 `astro/tsconfigs/strict`, `astro/zod` (→ `zod`), Biome `html.experimentalFullSupportEnabled`, `.gitignore` 의 `.astro`
- TypeScript 를 7 로 올린다 (astro-check 가 TS 6 을 요구해서 내렸었다)
- dev toolbar 앱을 개발 모드 전용 경고 패널로 옮긴다. `src/toolbar/remark-report.ts` 와 `report.ts` 는 unified 쪽이라 그대로 쓸 수 있다
- README 를 고친다

## 참고

- 버전 (2026-09-30): hono 4.13.11, @hono/react-renderer 1.0.1, @hono/node-server 2.1.3, @hono/vite-dev-server 0.26.1, @hono/vite-ssg 0.3.3, react 19.3
- `@hono/react-renderer` 는 `renderToString` 을 쓴다 (`stream` 을 켜면 `renderToReadableStream`, Vite 개발 서버에서는 안 된다). 컴포넌트 안에서 `await` 는 안 되니 문서는 라우트 핸들러에서 읽어 props 로 넘긴다
- `toSSG` 는 포트를 열지 않고 앱 안으로 요청을 흘려 파일을 쓴다. `/commands/` 는 `commands/index.html` 이 된다
- Hono 공식 스킬 (`honojs/skills` 의 `hono`, `hono-jsx`) 은 `hono/jsx` 기준이라 "No React" 라고 한다. 이 킷은 React 라이브러리 때문에 React 를 고른 것이라 그 스킬의 JSX 규칙은 따르지 않는다
- 픽셀 비교에서 가끔 한 장이 13 px 쯤 다르게 나오는 것은 같은 빌드를 다시 찍어도 생기던 글꼴 로딩 타이밍 차이였다

## 결과

2026-10-01, `spike/hono-react` 브랜치. 합격 기준 여섯을 모두 통과했다. 기준은 main `77cffd7` 의 빌드 (`/tmp/fh-astro-dist`) 다.

| 확인 | 결과 |
|---|---|
| 1. 픽셀 | 4쪽 × 3 캡처 12장 모두 `identical`. 다시 찍을 필요 없었다 |
| 2. 동작 | `#search` 제목 400px. 테마 light → dark → system 순환, 새로고침 뒤 light 유지. 읽는 절 05. JS 없이 흐름도 2 |
| 3. 오류 | 모르는 명령, 틀린 설정, 머리말 누락, 첫 글자 겹침, `::nope`, 그리지 못한 흐름도 모두 exit 1. 문구는 `copy.ts` 의 것 |
| 4. 설치 | pnpm: node_modules 297MB, 설치 6초, 빌드 7초. npm: 311MB, 설치 20초, 빌드 4초. 둘 다 `build` 와 `dev` 가 된다. 기준 Astro 는 브리프의 약 200MB |
| 5. 섬 | `::note[쪽지 보기]` 가 서버에서 단추로 그려지고 브라우저에서 hydrate 되어 Radix Dialog 가 열리고 닫힌다. 콘솔 경고 없음. `island.js` 264KB (React DOM + Radix) |
| 6. 검사 | `pnpm check` 통과. Biome · Stylelint · `tsc --noEmit` (astro-check 없이) |

그 밖의 수치: 꾸러미 151KB. 결과 폴더 3.6MB (기준 3.5MB), 글꼴 93 파일. dev 는 켜고 4초쯤 뒤에 받는다.

### 짠 것

- `src/cli.ts` — dev · build · preview. 글꼴 패키지 CSS 를 읽어 `@font-face` 를 만들고 (`util/font/to-font-css.ts`), 문서를 그리고, `toSSG` 로 쓰거나 서버를 띄운다
- `src/app.tsx` — 쪽 앱. `/` 와 `/:slug{.+}/` 둘, `@hono/react-renderer`
- `src/dev.ts` — dev 서버 앱. 자원 파일과 SSE 새로고침을 맡고 나머지는 쪽 앱에 넘긴다
- `src/content/` — `read-docs` (readdir + yaml + zod), `create-processor` (unified 조립), `rehype-heading-ids` (github-slugger), `remark-islands`, `render-islands`
- TSX 다섯: `wg-shell`, `_wg-shell-nav`, `wg-prose`, `pg-home`, `pg-doc`. `class:list` 는 `clsx`
- `src/client.ts` — 테마 단추, 읽는 절, #절 맞추기를 그대로 옮겼다. `src/island.tsx` — `hydrateRoot`
- 섬: `component/widget/island/` (감싸개 `WgIslandRoot`, 고르는 `WgIsland`), `component/widget/note/` (Radix Dialog)
- esbuild 둘: `cli.ts` 를 node 로 묶으면 컴포넌트가 import 한 CSS 가 `dist/cli.css` 로 함께 나온다. `client.ts` 와 `island.tsx` 는 브라우저로 묶는다

### 걸린 것

- **Hono 라우터.** `/:slug{.+}/` 와 `*` 또는 정적 라우트 (`/favicon.svg`) 가 한 앱에 있으면 RegExpRouter 가 `UnsupportedPath` 를 던져 SmartRouter 가 TrieRouter 로 물러나고, 거기서는 `{.+}` 가 맞지 않아 문서 쪽이 404 가 된다. 자원 라우트를 `dev.ts` 의 다른 앱으로 빼고 쪽 앱에 넘기는 식으로 풀었다. 빌드의 `toSSG` 는 쪽 앱만 본다
- **섬 프롭.** base64 로 넘기면 브라우저의 `atob` 가 한글을 깨뜨린다. `encodeURIComponent` 로 바꿨다
- **Astro 의 AstroInlineConfig 타입** 같은 우회는 없었다. 글꼴은 패키지 CSS 를 직접 읽으니 unifont 의 상대 경로 버그도 안 탄다

### Astro 와 다르게 둔 것

- 플러그인이 `file.data.astro.frontmatter` 대신 `file.data.fh` 를 읽고 쓴다 (`type/vfile-data.d.ts`). 번호와 가름은 머리말 `fhSections` 가 아니라 `file.data.fh.sections` 로 나른다
- 제목 id 는 번호를 넣기 전에 매긴다. Astro 의 raw 노드 건너뛰기 요령이 없어졌다
- favicon 은 data URI 대신 `/favicon.svg` 파일이다
- Astro 가 만들던 폭 맞춘 대체 글꼴 (`… fallback: Arial`) 은 없다. 글꼴이 온 뒤의 픽셀은 같고, 오기 전 라틴 글자의 폭만 조금 다를 수 있다
- 토큰에 층 넷 (`--app-z-index-*`) 과 덮개 색 (`--app-color-scrim`) 을 더했다. 섬의 Dialog 가 쓴다. 합치면 DESIGN.md 의 "층은 없다" 를 고친다
- Biome 에서 `security/noDangerouslySetInnerHtml` 을 끄고 `__html` 키를 허용했다. 그린 HTML 과 머리의 스크립트 · 스타일을 넣는 데 쓴다

### 합격 뒤 할 일에 보탤 것

- `pretendard` 패키지가 97MB 라 설치가 기준보다 100MB 쯤 크다. 가변 dynamic subset 만 든 작은 패키지로 바꾸거나 Astro 처럼 빌드 때 받는 쪽을 고른다
- 쪽지 섬은 Radix 를 직접 쓴다. 옮길 때 `Ui*` 래퍼 (convention-react R03) 로 감싼다
- esbuild 가 `dist/island.css` 도 내놓는데 `dist/cli.css` 에 같은 내용이 있어 쓰지 않는다. 묶는 설정에서 뺀다
- `src/toolbar/app.ts` 는 아직 `astro/toolbar` 를 import 한다. `remark-report` 는 터미널에 경고를 적는 채로 그대로 쓴다
- 경고의 줄 번호는 Astro 때와 같이 머리말을 뺀 본문 기준이다. 원문 줄로 맞추려면 머리말 줄 수를 더한다
