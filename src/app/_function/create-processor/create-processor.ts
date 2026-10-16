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
import {rehypeAssets} from "@/app/_function/create-processor/_rehype-assets";
import {rehypeHeadingIds} from "@/app/_function/create-processor/_rehype-heading-ids";
import {remarkReport} from "@/app/_function/create-processor/_remark-report";
import {remarkSnippets} from "@/app/_function/create-processor/_remark-snippets";
import {shikiTransformers} from "@/app/_function/create-processor/_shiki-transformers";
import {remarkMermaid} from "@/component/widget/mermaid/_function/remark-mermaid";
import {rehypeHead} from "@/component/widget/prose/_function/rehype-head";
import {rehypeSections} from "@/component/widget/prose/_function/rehype-sections/rehype-sections";
import {rehypeTables} from "@/component/widget/prose/_function/rehype-tables";
import {remarkBlocks} from "@/component/widget/prose/_function/remark-blocks";
import {remarkLinks} from "@/component/widget/prose/_function/remark-links";
import {remarkParts} from "@/component/widget/prose/_function/remark-parts";
import {remarkStatus} from "@/component/widget/prose/_function/remark-status";
import {remarkSwatch} from "@/component/widget/prose/_function/remark-swatch";
import {remarkUnknownDirectives} from "@/component/widget/prose/_function/remark-unknown-directives";
import type {MermaidAssets} from "@/type/mermaid-assets";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * Markdown 처리기 조립 입력
 */
interface ProcessorOptions {
    /**
     * 기본값을 적용한 사이트 설정
     */
    site: ResolvedSiteConfig;

    /**
     * 상대 링크와 자원을 해석할 문서 루트
     */
    root: string;

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
 *   - 플러그인 HTML 조각은 마지막 rehype-raw에서 해석
 *   - Shiki inline style: token.css의 --app-code-* 참조
 */
export const createProcessor = (options: ProcessorOptions) => {
    const files = options.files ?? new Map<string, string>();

    return unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ["yaml"])
        .use(remarkGfm)
        .use(remarkSnippets, {root: options.root})
        .use(remarkSmartypants)
        .use(remarkDirective)
        .use(remarkBlocks)
        .use(remarkParts)
        .use(remarkMermaid, {assets: options.mermaid, files})
        .use(remarkStatus, {status: options.site.status})
        .use(remarkSwatch)
        .use(remarkLinks, {root: options.root})
        .use(remarkUnknownDirectives)
        .use(remarkReport, {root: options.root})
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeShiki, {theme: createCssVariablesTheme({name: "for-humanity", variablePrefix: "--app-code-"}), transformers: shikiTransformers})
        .use(rehypeHead)
        .use(rehypeHeadingIds)
        .use(rehypeSections)
        .use(rehypeTables)
        .use(rehypeRaw)
        .use(rehypeAssets, {root: options.root, files})
        .use(rehypeStringify, {allowDangerousHtml: true});
};

/**
 * 플러그인 조립을 마친 Markdown 처리기
 */
export type Processor = ReturnType<typeof createProcessor>;
