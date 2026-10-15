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
import {rehypeAssets} from "@/entry/cli/_function/create-processor/_rehype-assets";
import {rehypeHeadingIds} from "@/entry/cli/_function/create-processor/_rehype-heading-ids";
import {remarkReport} from "@/entry/cli/_function/create-processor/_remark-report";
import {remarkSnippets} from "@/entry/cli/_function/create-processor/_remark-snippets";
import {shikiTransformers} from "@/entry/cli/_function/create-processor/_shiki-transformers";
import type {MermaidAssets} from "@/type/mermaid-assets";
import type {SiteConfig} from "@/type/site-config";

/**
 * Markdown 처리 순서: remark(스니펫·부품·흐름도) → 코드 강조(줄 표기·블록 색 transformer) → 머리 → 제목 id → 가름 수집 → 표
 * 플러그인 HTML 조각은 마지막 rehype-raw에서 해석
 * Shiki inline style: token.css의 --app-code-* 참조
 */
export const createProcessor = (options: {site: SiteConfig; root: string; files?: Map<string, string>; snippets?: Set<string>; mermaid?: MermaidAssets}) => {
    return unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ["yaml"])
        .use(remarkGfm)
        .use(remarkSnippets, {root: options.root, snippets: options.snippets ?? new Set<string>()})
        .use(remarkSmartypants)
        .use(remarkDirective)
        .use(remarkBlocks)
        .use(remarkParts)
        .use(remarkMermaid, {assets: options.mermaid, files: options.files ?? new Map<string, string>()})
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
        .use(rehypeAssets, {root: options.root, files: options.files ?? new Map<string, string>()})
        .use(rehypeStringify, {allowDangerousHtml: true});
};

/**
 * 플러그인 조립을 마친 Markdown 처리기
 */
export type Processor = ReturnType<typeof createProcessor>;
