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
 * Markdown 처리기. 차례는 GFM 과 smartypants, 부품 플러그인, HTML 로 바꾼 뒤 코드 색, 머리, 제목 id, 번호, 표 상자다.
 * 플러그인이 넣는 HTML 조각 (알약, 흐름도, 번호) 은 마지막의 rehype-raw 가 요소로 푼다.
 * 코드 색은 token.css 의 --app-code-* 가 정한다. Shiki 는 그 변수 이름만 inline style 로 적는다
 */
export const createProcessor = (options: {site: SiteConfig; root: string}) =>
	unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkSmartypants)
		.use(remarkDirective)
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

/**
 * 조립한 처리기
 */
export type Processor = ReturnType<typeof createProcessor>;
