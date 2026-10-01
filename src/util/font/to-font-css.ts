import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {basename, dirname, extname, join} from "node:path";
import {font_display_strategy, font_hash_length} from "@/constant/font";

/**
 * 내장 @font-face의 표시 정책과 내용 지문 URL 적용 · 원본 파일 수집
 * 늦은 글꼴 교체와 문서 이동마다 같은 글꼴을 다시 받는 현상 방지
 */
export const toFontCss = (options: {css: string; fontDir: string}) => {
    const files = new Map<string, string>();
    const css = [...readFileSync(options.css, "utf8").matchAll(/@font-face\s*\{[^}]*\}/g)]
        .map((match) =>
            match[0].replace(/font-display:\s*[^;]+;/g, `font-display: ${font_display_strategy};`).replace(/url\(([^)]+)\)/g, (_match: string, relativeUrl: string) => {
                const file = join(dirname(options.css), relativeUrl);
                const extension = extname(file);
                const hash = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, font_hash_length);
                const url = `${options.fontDir}/${basename(file, extension)}.${hash}${extension}`;

                files.set(url, file);

                return `url(${url})`;
            }),
        )
        .join("\n");

    return {css, files};
};
