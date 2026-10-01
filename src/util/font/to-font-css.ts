import {readFileSync} from "node:fs";
import {basename, dirname, join} from "node:path";

/**
 * 글꼴 CSS 를 결과 폴더용으로 고친다. @font-face 블록만 남기고, url 을 자원 주소로 바꾸며 그 파일의 자리를 모은다
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
