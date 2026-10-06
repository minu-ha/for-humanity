import assert from "node:assert/strict";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {asset_font_dir} from "@/constant/asset";
import {font_brand_css, font_mono_css} from "@/constant/font";
import {toFontCss} from "@/util/font/to-font-css";

test("bundled fonts prevent a late swap after fallback text is visible", () => {
    for (const css of [font_mono_css, font_brand_css]) {
        const result = toFontCss({css: join(process.cwd(), css), fontDir: asset_font_dir});

        assert.match(result.css, /font-display:\s*optional;/);
        assert.doesNotMatch(result.css, /font-display:\s*swap;/);
    }
});

test("font URLs stay stable for unchanged bytes and change when the font changes", (t) => {
    const root = mkdtempSync(join(tmpdir(), "for-humanity-font-"));
    const file = join(root, "example.woff2");
    const css = join(root, "font.css");

    t.after(() => rmSync(root, {recursive: true, force: true}));
    writeFileSync(css, "@font-face { font-family: Example; font-display: swap; src: url(./example.woff2); }");
    writeFileSync(file, "first font bytes");

    const first = toFontCss({css, fontDir: asset_font_dir});
    const repeated = toFontCss({css, fontDir: asset_font_dir});

    assert.deepEqual([...first.files], [...repeated.files]);
    assert.match(first.css, /example\.[a-f0-9]+\.woff2/);
    assert.deepEqual([...first.files.values()], [file]);

    writeFileSync(file, "changed font bytes");

    const changed = toFontCss({css, fontDir: asset_font_dir});

    assert.notDeepEqual([...first.files.keys()], [...changed.files.keys()]);
    assert.notEqual(first.css, changed.css);
});
