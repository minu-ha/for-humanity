import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {basename, dirname, extname, join} from "node:path";
import {font_display_strategy, font_hash_length} from "@/constant/font";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {toSitePath} from "@/util/url/to-site-path";

/**
 * 글꼴 스타일 변환 입력
 */
interface FontCssParams {
    /**
     * 원본 font-face CSS 파일 경로
     */
    css: string;

    /**
     * 생성할 글꼴 URL의 디렉터리
     */
    fontDir: string;

    /**
     * CSS 참조의 배포 경로, 수집한 파일 키는 사이트 루트 기준 유지
     */
    basePath: ResolvedSiteConfig["basePath"];
}

/**
 * 내장 @font-face의 표시 정책과 내용 지문 URL 적용. 원본 파일 수집
 *
 *   - 늦은 글꼴 교체와 문서 이동마다 같은 글꼴을 다시 받는 현상 방지
 */
export const toFontCss = (params: FontCssParams) => {
    const files = new Map<string, string>();

    const css = [...readFileSync(params.css, "utf8").matchAll(/@font-face\s*\{[^}]*\}/g)]
        .map((match) => {
            return match[0].replace(/font-display:\s*[^;]+;/g, `font-display: ${font_display_strategy};`).replace(/url\(([^)]+)\)/g, (_match: string, relativeUrl: string) => {
                const file = join(dirname(params.css), relativeUrl);
                const extension = extname(file);
                const hash = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, font_hash_length);
                const url = `${params.fontDir}/${basename(file, extension)}.${hash}${extension}`;

                files.set(url, file);

                return `url(${toSitePath({basePath: params.basePath, path: url})})`;
            });
        })
        .join("\n");

    return {css, files};
};
