import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {asset_font_dir} from "@/constant/asset";
import {font_body_css, font_brand_css, font_mono_css} from "@/constant/font";
import {toFontCss} from "@/util/font/to-font-css";

describe("글꼴 자원", () => {
    test.for([font_mono_css, font_body_css, font_brand_css])("내장 글꼴 %s는 늦은 글꼴 교체를 방지한다", (css) => {
        /**
         * WHEN
         * 내장 글꼴의 공개 CSS 생성
         */
        const result = toFontCss({css: join(process.cwd(), css), fontDir: asset_font_dir});

        /**
         * THEN
         * 선택적 글꼴 표시와 뒤늦은 교체 제외
         */
        expect(result.css).toMatch(/font-display:\s*optional;/);
        expect(result.css).not.toMatch(/font-display:\s*swap;/);
    });

    test("글꼴 URL은 내용이 같으면 유지하고 바뀌면 새로 만든다", async ({root}) => {
        /**
         * GIVEN
         * 글꼴 파일과 이 파일을 참조하는 CSS
         */
        const file = join(root, "example.woff2");
        const css = join(root, "font.css");

        await writeFile(css, "@font-face { font-family: Example; font-display: swap; src: url(./example.woff2); }");
        await writeFile(file, "first font bytes");

        /**
         * WHEN
         * 같은 내용의 반복 처리와 변경된 글꼴 처리
         */
        const first = toFontCss({css, fontDir: asset_font_dir});
        const repeated = toFontCss({css, fontDir: asset_font_dir});

        await writeFile(file, "changed font bytes");

        const changed = toFontCss({css, fontDir: asset_font_dir});

        /**
         * THEN
         * 입력 파일 대응과 내용별 URL 안정성
         */
        expect([...first.files]).toStrictEqual([...repeated.files]);
        expect(first.css).toMatch(/example\.[a-f0-9]+\.woff2/);
        expect([...first.files.values()]).toStrictEqual([file]);
        expect([...first.files.keys()]).not.toStrictEqual([...changed.files.keys()]);
        expect(first.css).not.toBe(changed.css);
    });
});
