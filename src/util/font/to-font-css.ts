import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {basename, dirname, join} from "node:path";

/**
 * 글꼴 패키지의 CSS 를 결과 폴더용으로 고친다.
 * @font-face 블록 가운데 keep 글자가 든 것만 남기고, url 을 자원 주소로 바꾸며 그 파일의 자리를 모은다
 */
export const toFontCss = (options: {css: string; keep?: string; fontDir: string}) => {
	const cssPath = createRequire(import.meta.url).resolve(options.css);
	const files = new Map<string, string>();
	const css = [...readFileSync(cssPath, "utf8").matchAll(/@font-face\s*\{[^}]*\}/g)]
		.map((match) => match[0])
		.filter((block) => options.keep === undefined || block.includes(options.keep))
		.map((block) =>
			block.replace(/url\(([^)]+)\)/g, (_match, relativeUrl: string) => {
				const file = join(dirname(cssPath), relativeUrl);
				const url = `${options.fontDir}/${basename(file)}`;

				files.set(url, file);

				return `url(${url})`;
			}),
		)
		.join("\n");

	return {css, files};
};
