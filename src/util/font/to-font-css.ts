import {readFileSync} from "node:fs";
import {basename, dirname, join} from "node:path";

/**
 * 글꼴 CSS의 @font-face 추출 · 자원 URL 치환과 원본 파일 수집
 */
export const toFontCss = (options: {css: string; fontDir: string}) => {
	const files = new Map<string, string>();
	const css = [...readFileSync(options.css, "utf8").matchAll(/@font-face\s*\{[^}]*\}/g)]
		.map((match) =>
			match[0].replace(/url\(([^)]+)\)/g, (_match: string, relativeUrl: string) => {
				const file = join(dirname(options.css), relativeUrl);
				const url = `${options.fontDir}/${basename(file)}`;

				files.set(url, file);

				return `url(${url})`;
			}),
		)
		.join("\n");

	return {css, files};
};
