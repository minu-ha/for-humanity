import rehypeShiki from "@shikijs/rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import {createCssVariablesTheme} from "shiki";
import {unified} from "unified";
import {rehypeHead} from "@/component/widget/prose/_function/rehype-head";
import {rehypeSections} from "@/component/widget/prose/_function/rehype-sections/rehype-sections";
import {rehypeTables} from "@/component/widget/prose/_function/rehype-tables";
import {remarkBlocks} from "@/component/widget/prose/_function/remark-blocks";
import {remarkFlow} from "@/component/widget/prose/_function/remark-flow";
import {remarkLinks} from "@/component/widget/prose/_function/remark-links";
import {remarkParts} from "@/component/widget/prose/_function/remark-parts";
import {remarkStatus} from "@/component/widget/prose/_function/remark-status";
import {remarkSwatch} from "@/component/widget/prose/_function/remark-swatch";
import {remarkUnknownDirectives} from "@/component/widget/prose/_function/remark-unknown-directives";
import {rehypeHeadingIds} from "@/content/rehype-heading-ids";
import {remarkReport} from "@/content/remark-report";
import type {SiteConfig} from "@/type/site-config";

/**
 * Markdown 처리 순서: remark → 코드 강조 → 머리 → 제목 id → 절 번호 → 표
 * 플러그인 HTML 조각은 마지막 rehype-raw에서 해석
 * Shiki inline style: token.css의 --app-code-* 참조
 */
export const createProcessor = (options: {site: SiteConfig; root: string}) => {
    return unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkSmartypants)
        .use(remarkDirective)
        .use(remarkBlocks)
        .use(remarkParts)
        .use(remarkFlow)
        .use(remarkStatus, {status: options.site.status})
        .use(remarkSwatch)
        .use(remarkLinks, {root: options.root})
        .use(remarkUnknownDirectives)
        .use(remarkReport, {root: options.root})
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeShiki, {theme: createCssVariablesTheme({name: "for-humanity", variablePrefix: "--app-code-"})})
        .use(rehypeHead, {title: options.site.title})
        .use(rehypeHeadingIds)
        .use(rehypeSections)
        .use(rehypeTables)
        .use(rehypeRaw)
        .use(rehypeStringify, {allowDangerousHtml: true});
};

/**
 * 플러그인 조립을 마친 Markdown 처리기
 */
export type Processor = ReturnType<typeof createProcessor>;
