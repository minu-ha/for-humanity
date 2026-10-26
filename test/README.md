# 테스트

제품 빌드는 Vite, Node 환경 검사는 독립 설정의 Vitest, 실제 브라우저 검사는 Playwright가 담당합니다. React 설치는 필요하지 않습니다. 브라우저 fixture는 제품과 같은 Vite 설정과 Hono JSX DOM 런타임을 사용합니다.

개발 환경은 Node 22.12 이상인 22.x 또는 Vitest가 지원하는 상위 버전을 사용합니다. CI는 Ubuntu의 Node 22.12.0과 24, Windows의 Node 22.12.0에서 실행하며, 브라우저 검사는 Ubuntu와 Windows의 Node 22.12.0에서 러너에 설치된 Chrome으로 실행합니다. 패키지 소비자의 Node 요구 사항은 `package.json`의 `engines`를 따릅니다.

## 층

| 층 | 실행기와 프로젝트 | 바꾸는 입력 | 확인하는 것 | 자리 |
| --- | --- | --- | --- | --- |
| static | TypeScript, Biome, Stylelint | 코드 | 타입, 이름, 가져오기, CSS 규칙 | `pnpm check` |
| unit | Vitest `unit` | 인자 | 함수 하나의 반환값, 임시 폴더의 파일 조회 | `src/**/*.test.ts`, `util/*.test.ts` |
| node | Vitest `node` | 임시 프로젝트의 문서, 설정, CLI 인자 | Node에서 실제 파일, Markdown 처리기, CLI 프로세스, 미리보기 HTTP 서버를 연결한 결과 | `*.node.test.ts` |
| integration | Playwright `integration` | 갤러리에서 마운트한 위젯 | 테마, 툴팁, 구독과 타이머의 수명 | `*.integration.spec.ts` |
| e2e | Playwright `e2e` | 실제 CLI 빌드나 개발 서버의 URL, 클릭, 화면 환경 | 배치, 스크롤 복원, 앵커, 지연 수신, 문서 갱신 | `*.e2e.spec.ts` |

unit과 node는 Vitest, integration과 e2e는 Playwright입니다. 프로젝트 이름이 곧 층 이름이라 테스트 목록과 결과의 각 줄 앞에 `unit`, `node`, `integration`, `e2e`가 붙습니다.

층은 네 가지 질문으로 고릅니다. 함수 하나로 답이 나오면 unit, 브라우저 없이 실제 파일과 프로세스를 연결해야 하면 node, 위젯을 그려야 알 수 있으면 integration, 빌드한 사이트나 개발 서버를 지나야 하면 e2e입니다.
같은 조건을 두 층에서 보지 않습니다. 예를 들어 HTML 이스케이프는 변환 검사에서, 스크립트 비활성 상태의 가독성은 실제 브라우저에서 확인합니다. jsdom으로 SVG 배치, 폰트, Shadow DOM, 시스템 테마를 대신 판정하지 않습니다.

## 구조

```text
test/
  _constant/    여러 검사가 공유하는 입력 자료. 공식 문법별 다이어그램 원문과 기대 라벨(diagram)
  _fixture/     Vitest 임시 루트와 공개 범위(temp-root), Playwright 사이트별 서버(dev, docs, mermaid, navigation),
                갤러리 번들(load-browser-script), 탐색 조회 도우미(read-navigation-scroll, to-navigation-html)
  _gallery/     공개 번들 밖에서 위젯을 마운트하고 해제하는 페이지 스크립트(mermaid-lifecycle, navigation-lifecycle)
  _type/        갤러리와 spec이 공유하는 브라우저 전역 계약(browser.d.ts)
  0-command/
    0.1-command.node.test.ts     ↔ src/entry/cli                                        CMD
    0.2-config.node.test.ts      ↔ src/app/_function/read-site-config.ts                CFG
    0.3-content.node.test.ts     ↔ src/app/load-site.ts, src/util/file                  CNT
  1-document/
    1.1-document.node.test.ts    ↔ src/app/_function/read-docs.ts                       DOC
    1.2-home.node.test.ts        ↔ src/app/_function/read-home.ts, src/page/home        HOM
    1.3-link.node.test.ts        ↔ remark-links, remark-parts, _rehype-content-links    LNK
    1.4-code.node.test.ts        ↔ shiki-transformers, _remark-snippets                 COD
    1.5-asset.node.test.ts       ↔ _rehype-assets                                       AST
    1.6-crawling.node.test.ts    ↔ src/app/_function/to-crawling-app.ts                 CRW
  2-page/
    2.1-shell.node.test.ts       ↔ src/component/widget/shell                           SHL
    2.1-shell.e2e.spec.ts
    2.2-navigation.e2e.spec.ts   ↔ sidebar, shell-controls, cursor-face                 NAV
    2.2-navigation.integration.spec.ts
    2.2-navigation.node.test.ts
    2.3-mermaid.e2e.spec.ts      ↔ src/component/widget/mermaid                         MRM
    2.3-mermaid.integration.spec.ts
    2.3-mermaid.node.test.ts
    2.4-accessibility.e2e.spec.ts ↔ content/public, src/component                       ACC
    2.5-status.node.test.ts      ↔ src/page/status, src/component/ui/status, load-site   STA
    2.5-status.e2e.spec.ts
  3-server/
    3.1-dev.e2e.spec.ts          ↔ src/entry/dev                                        DEV
    3.2-preview.node.test.ts     ↔ src/entry/preview                                    PRV
```

- 영역 하나는 한 폴더 안에서 한 이름으로 묶습니다. 층과 실행기 프로젝트는 접미사(`.node.test.ts`, `.integration.spec.ts`, `.e2e.spec.ts`)로 구분합니다. 프로젝트는 접미사로 파일을 고르므로 접미사가 없는 파일은 어느 프로젝트에도 들어가지 않습니다.
- 폴더와 파일 번호는 사용자 흐름을 따릅니다. 0은 명령과 설정, 1은 문서 조립, 2는 페이지, 3은 서버입니다. 폴더는 정수(`1-document`), 파일은 폴더 번호를 이어 붙인 점 번호(`1.3-link`)를 씁니다. 번호가 9를 넘는 폴더는 모든 번호를 `1.01`처럼 두 자리로 씁니다.
- 파일 이름은 영역 이름이며 케이스 코드와 1:1로 대응합니다. 컴포넌트 접두사(`wg-`, `pg-`)는 붙이지 않습니다. 대응하는 `src` 경로는 파일 머리 주석에 적습니다.
- 새 영역은 그 흐름의 끝 번호로 붙입니다. 흐름상 중간에 끼워야 할 때만 번호를 밉니다. 케이스 번호는 파일 번호와 무관합니다.
- `_` 폴더는 지원 코드입니다. `src`의 `_constant`처럼 그 자체는 검증 대상이 아닙니다. 테스트 파일이 없으므로 테스트 목록에 나타나지 않습니다.
- 가져오기는 `@test/` 별칭을 씁니다. 상대 경로를 쓰지 않습니다. Vitest는 `vitest.config.ts`, Playwright는 `tsconfig.json`의 같은 별칭을 읽습니다.
- unit 테스트는 `src`의 함수 옆에 둡니다. 저장소 도구의 검사는 `util/*.test.ts`입니다.
- 케이스 목록의 원본은 테스트 제목입니다. `pnpm exec playwright test --list`와 `pnpm exec vitest list`가 경로와 describe, 제목을 한 줄로 출력하므로 별도 목록을 두지 않습니다.

## 실행

```sh
pnpm test
pnpm test:watch
pnpm exec vitest run test/1-document
pnpm exec vitest run --project node
pnpm exec vitest run -t 'DOC-003'

pnpm exec playwright install chromium
pnpm test:browser
pnpm test:navigation
pnpm test:mermaid --grep MRM-019
pnpm test:browser --grep @high
pnpm exec playwright test --project integration
FH_TEST_BROWSER_CHANNEL=chrome pnpm test:mermaid

pnpm exec playwright show-report .cache/playwright/report
pnpm exec playwright show-trace .cache/playwright/results/<case>/trace.zip
```

`pnpm test`와 `pnpm test:browser`는 최신 제품 번들을 먼저 생성합니다. CI는 앞 단계에서 빌드한 뒤 `pnpm exec playwright test`로 같은 검사를 실행합니다. 실패하면 `.cache/playwright/`에 trace, 스크린샷, HTML 보고서를 남깁니다. 재시도로 실패를 숨기지 않습니다.

개발 서버 검사는 `pnpm build:kit` 이후 `pnpm exec playwright test test/3-server`로 실행합니다. 임시 프로젝트를 사용하며 소스 변경 검사는 격리한 복사본에서 실행합니다.

## fixture

- Vitest의 `temp-root` fixture는 테스트마다 임시 루트(`root`)와 사이트 빌드와 같은 공개 범위(`scope`)를 제공합니다. 임시 루트는 심볼릭 링크를 따라간 실제 경로입니다. 문서는 `scope.publicRoot`, 홈은 `scope.root`에 씁니다.
- Playwright fixture는 워커마다 임시 사이트를 만들고 빈 포트로 서버를 시작합니다. 각 테스트에는 새 브라우저 컨텍스트를 제공합니다. 성공과 실패에 관계없이 임시 파일과 서버를 정리합니다.
- Mermaid와 탐색 fixture는 제품과 같은 `toPreviewConfig`로 Vite preview를 실행합니다. 마운트와 해제 전용 갤러리 페이지는 임시 출력 폴더에만 추가하며 별도 정적 서버를 만들지 않습니다. 실제 설치 CLI의 preview는 패키지 검사에서 확인합니다.
- 준비 코드의 전역 구독, 서버, 임시 파일은 fixture에서 만들고 정리합니다. fixture 매개변수는 실행기가 구조분해한 이름으로 의존성을 조회하므로 그 자리에서만 구조분해를 유지합니다.

## 케이스 번호, 우선순위, 종류

번호는 정렬과 검색에 쓰이므로 제목 맨 앞에 둡니다.

```ts
test("[DOC-002] 정규화한 문서 주소가 겹치면 로드를 거부한다", async ({scope}) => { … });
test("[MRM-014] 모듈 수신에 실패하면 안내와 원문을 표시한다", {tag: ["@high", "@negative"]}, async ({page}) => { … });
```

**번호(제목 접두)**

- 형식은 `[<영역 코드>-<3자리>]`입니다. 영역 코드는 CMD(CLI 명령), CFG(설정), CNT(공개와 내부 문서), DOC(문서 수집), HOM(홈), LNK(링크와 목차), COD(코드 블록), AST(자원), CRW(크롤러 파일), SHL(페이지 셸), NAV(문서 탐색), MRM(다이어그램), DEV(개발 서버), PRV(정적 미리보기), ACC(접근성), STA(상태 화면)입니다. 새 영역은 세 글자 코드를 하나 더합니다.
- 코드마다 1부터 선언 순서대로 붙입니다. 지운 번호는 재사용하지 않습니다. 새 케이스는 해당 묶음 끝에 그 코드의 다음 번호로 붙입니다. 같은 코드가 여러 층에 있으면 층과 무관하게 이어 붙입니다.
- 반복 시나리오는 자료에 `caseId`를 두고 제목에 `[$caseId]`나 `` `[${scenario.caseId}]` ``로 넣습니다. 변형마다 번호가 하나씩 붙습니다.
- `--grep DOC-002`(Playwright)나 `-t DOC-002`(Vitest)로 한 건만 실행합니다.
- 아래 명령으로 번호 중복을 확인합니다. 중복이 없으면 아무것도 출력하지 않습니다.

```sh
grep -rhoE '\[[A-Z]{3}-[0-9]{3}\]|caseId: "[A-Z]{3}-[0-9]{3}"' test --include='*.ts' | grep -oE '[A-Z]{3}-[0-9]{3}' | sort | uniq -d
```

**우선순위(태그, Playwright 케이스에 하나 필수)**

| 태그 | 뜻 | 예 |
| --- | --- | --- |
| `@high` | 배포에 필요한 계약. 깨지면 배포하지 않습니다 | 문법 렌더, 조건부 모듈 수신, 원문 대체 표시, 수명 정리, 배치, 스크롤 복원 |
| `@mid` | 주요 표현과 상호작용. 다음 배포 전에 고칩니다 | 모바일 폭, 툴팁, 커서 장식 |
| `@low` | 표시와 부가 요소. 모아서 고칩니다 | 라벨 문구 |

**종류(태그, 해당할 때만)**

- `@negative`: 실패, 거부, 손상 입력 케이스. 따로 모으지 않고 그 흐름 묶음 안에 둡니다.

## describe 중첩

```ts
/**
 * 문서 수집, 주소, 부모 관계(src/app/_function/read-docs.ts) 검증
 */
describe("문서", () => {            // 바깥: 영역 이름
    describe("부모 문서", () => {   // 안쪽: 흐름이나 상태 묶음
        test("[DOC-009] 부모와 자식의 전체 묶음 경로가 다르면 거부한다", …);
    });
});
```

- 바깥 describe는 영역 이름, 안쪽 describe는 흐름이나 상태를 묶는 한글 명사구입니다. 테스트는 안쪽 describe 아래에만 둡니다.
- 환경을 바꿔야 하는 묶음(`test.use`)도 안쪽 describe로 만듭니다. `레이아웃 휴대폰 390px 터치`, `스크립트 비활성`처럼 환경 이름을 제목으로 씁니다.
- 파일 머리 주석은 바깥 describe 바로 위에 두고 대응하는 `src` 경로를 적습니다.

## GIVEN / WHEN / THEN

테스트 하나는 시나리오 하나입니다. 모든 테스트에 GIVEN, WHEN, THEN 블록 주석을 이 순서로 둡니다. 주석 둘째 줄에는 그 구간의 내용을 한글 명사구 한 줄로 적습니다.

```ts
test("[MRM-010] 접힌 다이어그램을 열면 모듈을 요청하고 표시한다", {tag: "@high"}, async ({page}) => {
    /**
     * GIVEN
     * 접힌 다이어그램만 있는 문서
     */
    await page.goto("/hidden/");

    /**
     * WHEN
     * 접힌 다이어그램 공개
     */
    await page.getByText("Hidden diagram", {exact: true}).click();

    /**
     * THEN
     * 공개한 다이어그램 표시
     */
    await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(1);
});
```

- GIVEN에는 시작 상태를 둡니다. 그려진 화면만 확인하는 테스트도 출발점인 fixture나 페이지를 GIVEN에, 그 화면을 여는 동작이나 조회를 WHEN에 둡니다. fixture, `beforeEach`, 반복 시나리오의 자료, 앞 step이 상태를 이미 만들었으면 GIVEN 블록에는 코드 없이 그 상태를 적은 주석만 둡니다.
- THEN에는 `expect`만 둡니다. 동작은 WHEN에 둡니다. 확인한 뒤에 동작이 더 필요한 시나리오는 그 동작부터 다음 step으로 나눕니다.
- 상태를 기다리거나 전제를 확인하는 `expect`는 GIVEN이나 WHEN에 둘 수 있습니다.
- 함수 검사는 WHEN에서 결과를 상수에 담고 THEN에서 `expect`로 비교합니다. 값은 `toBe`, 구조는 `toStrictEqual`로 비교합니다.
- 시나리오가 둘 이상이면 테스트를 나누거나 시나리오마다 `test.step("…")`으로 감쌉니다. step으로 나눈 테스트는 여러 step이 함께 쓰는 준비만 본문의 GIVEN에 둡니다. 동작과 확인은 step마다 GIVEN, WHEN, THEN으로 나눠 둡니다. step 이름에는 그 시나리오를 한 문장으로 적습니다.

```ts
test("[DEV-009] CSS 파일 추가와 삭제는 HTML의 스타일 목록에 반영된다", {tag: "@high"}, async ({page, devSite}) => {
    /**
     * GIVEN
     * 소스 스타일 목록을 사용하는 개발 페이지
     */
    const path = join(devSite.kitRoot, "src/component/widget/shell/_wg-shell-test.css");

    await page.goto("/");

    await test.step("새 CSS 파일은 등록 설정 없이 적용한다", async () => {
        /**
         * GIVEN
         * 테두리 스타일이 없는 본문
         */

        /**
         * WHEN
         * 기존 소유자 폴더에 스타일 파일 추가
         */
        await writeFile(path, ".wg_shell__main { outline: 2px solid rgb(4, 5, 6); }\n");

        /**
         * THEN
         * 새 HTML의 스타일 목록과 실제 렌더에 파일 반영
         */
        await expect(page.getByRole("main")).toHaveCSS("outline-style", "solid");
    });

    await test.step("삭제한 CSS 파일은 스타일 목록에서 제외한다", async () => { … });
});
```

- 반복 시나리오의 입력과 기대값은 `scenario.input`, `scenario.expected`처럼 원본 객체에서 읽습니다.
- 주석 앞에는 빈 줄을 둡니다. 블록, 객체, 배열, JSX의 첫 줄과 연속 주석은 예외입니다. 구간 주석 외의 절차 설명은 `//`, 선언 설명은 여러 줄 JSDoc을 씁니다.

## 문장

한 줄에 한 문장을 쓰고 마침표를 찍지 않습니다.

| 자리 | 꼴 | 예 |
| --- | --- | --- |
| 테스트 제목 | 번호 뒤에 '조건이면 결과다' 또는 '대상은 속성이다' | `[DOC-002] 정규화한 문서 주소가 겹치면 로드를 거부한다` |
| GIVEN | 상태를 나타내는 명사구. 서술어를 붙이지 않습니다 | `접힌 다이어그램만 있는 문서` |
| WHEN | 사용자나 실행기의 동작, 명사형 | `접힌 다이어그램 공개`, `문서 로드` |
| THEN | 드러나는 결과, 명사형 | `공개한 다이어그램 표시` |
| step 이름 | '조건이면 결과다' 또는 '대상은 속성이다' | `Escape로 닫으면 탐색 열기 버튼으로 포커스가 복귀한다` |

- 파일 이름은 영어, describe와 제목은 한국어입니다. 영어 토큰은 화면이나 터미널에 영어로 나타나는 문구(`On this page`, `Invalid asset`)와 파일 이름, 명령 이름에만 씁니다.
- 조사는 앞말에 붙여 씁니다. 라틴 문자와 숫자 토큰도 같습니다(`README가`, `404를`).
- Vitest 제목의 `$이름` 자리 표시자 바로 뒤에는 조사를 붙이지 않습니다. 한글까지 변수 이름으로 읽어 `undefined`를 출력하므로 `$parent 입력은`처럼 띄어 씁니다.

## locator

- role과 정확한 접근성 이름을 우선합니다(`getByRole("dialog", {name: "Navigation", exact: true})`). 이름은 기본으로 부분 일치하므로 버튼과 대화상자에는 `exact: true`를 붙입니다.
- SVG와 그림 영역처럼 접근성 이름으로 찾을 수 없는 곳은 CSS와 `data-mermaid-*`, `data-sidebar-*` 계약으로 조회합니다.
- 렌더 완료는 `toHaveCount`, `toHaveAttribute` 같은 자동 재시도 단언으로 확인합니다. 치수와 계산값은 필요한 경우에만 `expect.poll`을 씁니다.
- 고정 시간 대기, 외부 CDN, 개인 문서, 실행 중인 개발 서버에 의존하지 않습니다.
- 스크린샷은 실패 조사 자료입니다. 승인한 기준 이미지 없이 시각 회귀 검사로 보지 않습니다.
