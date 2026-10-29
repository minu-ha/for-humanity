import {execFileSync} from "node:child_process";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test as base} from "@playwright/test";
import {loadBrowserScript} from "@test/_fixture/load-browser-script";
import {preview} from "vite";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";

/**
 * 네 종류의 그림과 그림 아래 제목을 둔 영어 문서
 *
 *   - 단계: data-on 세 형식, data-hl, data-pos, 캡션 셋
 *   - 탭: data-labels와 data-steps
 *   - 작성자 스크립트가 fx:step을 받고 fx:goto를 보내는 단계 그림
 *   - 슬라이더, 실행 상자, custom의 data-icon 버튼
 *   - hash 진입을 볼 그림 아래 제목과 화면보다 긴 본문
 */
const figures_document = [
    "---",
    "name: Figures",
    "label: Figures",
    "group: Guide",
    "---",
    "",
    "## Steps",
    "",
    '<figure class="fx" data-fx="steps" id="steps" aria-label="Three step scene">',
    '<div class="fx__stage">',
    '<p><span id="marked" data-hl="2">Highlight on two</span></p>',
    '<div class="fx-row">',
    '<span class="fx-chip" id="only-one" data-on="1">One</span>',
    '<span class="fx-chip" id="from-two" data-on="2-">Two onward</span>',
    '<span class="fx-chip" id="up-to-two" data-on="-2">Up to two</span>',
    '<span class="fx-chip" id="moved" data-pos="1:0 0;3:40 0">Moves</span>',
    "</div>",
    "</div>",
    '<ol class="fx__captions">',
    "<li>First caption</li>",
    "<li>Second caption</li>",
    "<li>Third caption</li>",
    "</ol>",
    "</figure>",
    "",
    "## Tabs",
    "",
    '<figure class="fx" data-fx="steps" id="tabs" data-labels="Before|After" data-steps="2" aria-label="Two tabs">',
    '<div class="fx__stage">',
    '<p data-on="1">Before scene</p>',
    '<p data-on="2">After scene</p>',
    "</div>",
    "</figure>",
    "",
    "## Scripted",
    "",
    '<figure class="fx" data-fx="steps" id="scripted" data-steps="3" aria-label="Scripted steps">',
    '<div class="fx__stage"><p id="scripted-out">waiting</p><button type="button" id="scripted-replay" class="fx-button">Replay</button></div>',
    "</figure>",
    '<script type="module">',
    'const root = document.getElementById("scripted");',
    'root.addEventListener("fx:step", (event) => { document.getElementById("scripted-out").textContent = "step " + event.detail.step; });',
    'document.getElementById("scripted-replay").addEventListener("click", () => root.dispatchEvent(new CustomEvent("fx:goto", {detail: {step: 1, play: true}})));',
    "</script>",
    "",
    "## Range",
    "",
    '<figure class="fx" data-fx="range" id="range" aria-label="Width slider">',
    '<div class="fx__stage"><div class="fx-box" id="bar" style="width: calc(20% + var(--fx-v, 0) * 80%)">Bar</div></div>',
    '<label class="fx__range">Width <input type="range" min="0" max="10" value="5" data-unit="px"> <output></output></label>',
    "</figure>",
    "",
    "## Run",
    "",
    "```js",
    'console.log("hello", 1 + 1);',
    'console.log({a: 1}, "</script>");',
    "missing.x;",
    "```",
    "",
    '<div class="fx" data-fx="run" id="run"></div>',
    "",
    "## Custom",
    "",
    '<figure class="fx" data-fx="custom" id="custom" aria-label="Custom figure">',
    '<div class="fx__stage"><p>Custom scene</p></div>',
    '<div class="fx__bar"><button type="button" data-icon="play">Replay</button></div>',
    "</figure>",
    '<script type="module">',
    'document.getElementById("custom").classList.add("fx--ready");',
    "</script>",
    "",
    "## After",
    "",
    "Readable context. ".repeat(400),
    "",
].join("\n");

/**
 * 워커마다 격리한 실제 CLI 출력과 빈 포트의 로컬 서버. /lifecycle/은 셸 번들 대신 갤러리 스크립트
 */
export const test = base.extend<Record<never, never>, {fxSite: string}>({
    fxSite: [
        // biome-ignore lint/correctness/noEmptyPattern: Playwright가 구조분해 매개변수로 fixture 의존성을 조회
        async ({}, use) => {
            const root = await mkdtemp(join(tmpdir(), "for-humanity-fx-"));

            try {
                await mkdir(join(root, "public"));
                await writeFile(join(root, "for-humanity.config.ts"), 'export default {content: {root: "."}, lang: "en"};');
                await writeFile(join(root, "README.md"), "# Home\n\nOrdinary content.\n");
                await writeFile(join(root, "public/figures.md"), figures_document);
                await writeFile(join(root, "public/plain.md"), "---\nname: Plain\nlabel: Plain\ngroup: Guide\n---\n\nNo figures here.\n");

                execFileSync(process.execPath, ["dist/cli.js", "build", root]);

                const fixture = await loadBrowserScript("test/_gallery/fx-lifecycle.tsx");
                const shell = await readFile("dist/browser.js", "utf8");

                const html = (await readFile(join(root, "dist/figures/index.html"), "utf8"))
                    .replace(`<script>${shell}</script>`, "")
                    .replace("</body>", () => `<script>${fixture}</script></body>`);

                await mkdir(join(root, "dist/lifecycle"));
                await writeFile(join(root, "dist/lifecycle/index.html"), html);

                const server = await preview(toPreviewConfig({root, port: 0, host: "localhost", basePath: "/"}));

                try {
                    const url = server.resolvedUrls?.local[0];

                    if (url === undefined) {
                        throw new Error("미리보기 서버의 테스트 주소가 없습니다");
                    }

                    await use(new URL(url).origin);
                } finally {
                    await server.close();
                }
            } finally {
                await rm(root, {recursive: true, force: true});
            }
        },
        {scope: "worker"},
    ],
    baseURL: async ({fxSite}, use) => {
        await use(fxSite);
    },
});
