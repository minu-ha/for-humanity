import rehypeShiki from "@shikijs/rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import {createCssVariablesTheme} from "shiki";
import {unified} from "unified";
import {rehypeAssets} from "@/app/_function/to-processor/_rehype-assets";
import {rehypeContentLinks} from "@/app/_function/to-processor/_rehype-content-links";
import {rehypeReport} from "@/app/_function/to-processor/_rehype-report";
import {remarkSnippets} from "@/app/_function/to-processor/_remark-snippets";
import {shikiTransformers} from "@/component/widget/article/_constant/shiki-transformers";
import {rehypeHead} from "@/component/widget/article/_function/rehype-head";
import {rehypeHeadingIds} from "@/component/widget/article/_function/rehype-heading-ids";
import {rehypeSections} from "@/component/widget/article/_function/rehype-sections/rehype-sections";
import {rehypeTables} from "@/component/widget/article/_function/rehype-tables";
import {remarkBlocks} from "@/component/widget/article/_function/remark-blocks/remark-blocks";
import {remarkLinks} from "@/component/widget/article/_function/remark-links";
import {remarkParts} from "@/component/widget/article/_function/remark-parts";
import {remarkStatus} from "@/component/widget/article/_function/remark-status";
import {remarkSwatch} from "@/component/widget/article/_function/remark-swatch";
import {remarkUnknownDirectives} from "@/component/widget/article/_function/remark-unknown-directives";
import {remarkMermaid} from "@/component/widget/mermaid/_function/remark-mermaid";
import type {ContentScope} from "@/type/content-scope";
import type {MermaidAssets} from "@/type/mermaid-assets";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * Markdown 처리기 조립 입력
 */
interface ProcessorParams {
    /**
     * 기본값을 적용한 사이트 설정
     */
    site: ResolvedSiteConfig;

    /**
     * 상대 링크, 자원, 스니펫을 해석하고 공개 범위를 검사할 문서 범위
     */
    scope: ContentScope;

    /**
     * 사용한 자원의 URL과 원본 경로 수집
     */
    files?: Map<string, string>;

    /**
     * 지연 수신할 로컬 Mermaid 런타임
     */
    mermaid?: MermaidAssets;
}

/**
 * Markdown 변환과 문서 메타데이터 수집
 *
 *   - 코드와 문서 머리 생성 후 제목 ID와 가름 수집
 *   - 원시 HTML과 플러그인 HTML 조각은 Shiki 다음 rehype-raw에서 해석. Mermaid 원문과 원시 pre의 코드 강조 방지
 *   - 머리, 제목 ID, 가름, 표, 링크, 자원 처리는 원시 HTML 포함
 *   - 코드 상자의 색상은 article CSS 소유, Shiki 토큰 색상은 --app-code-* 참조
 */
export const toProcessor = (params: ProcessorParams) => {
    const files = params.files ?? new Map<string, string>();

    return unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ["yaml"])
        .use(remarkGfm)
        .use(remarkSnippets, {scope: params.scope})
        .use(remarkSmartypants)
        .use(remarkDirective)
        .use(remarkBlocks)
        .use(remarkParts)
        .use(remarkMermaid, {assets: params.mermaid, files})
        .use(remarkStatus, {status: params.site.status})
        .use(remarkSwatch)
        .use(remarkLinks, {scope: params.scope})
        .use(remarkUnknownDirectives)
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeShiki, {theme: createCssVariablesTheme({name: "for-humanity", variablePrefix: "--app-code-"}), transformers: shikiTransformers})
        .use(rehypeRaw)
        .use(rehypeHead)
        .use(rehypeHeadingIds)
        .use(rehypeSections)
        .use(rehypeTables)
        .use(rehypeContentLinks, {scope: params.scope})
        .use(rehypeAssets, {scope: params.scope, files})
        .use(rehypeReport, {root: params.scope.root})
        .use(rehypeStringify, {allowDangerousHtml: true});
};
