import rehypeShiki from "@shikijs/rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import {unified} from "unified";
import {rehypeAssets} from "@/app/_function/to-processor/_rehype-assets";
import {rehypeBasePath} from "@/app/_function/to-processor/_rehype-base-path";
import {rehypeContentLinks} from "@/app/_function/to-processor/_rehype-content-links";
import {rehypeReport} from "@/app/_function/to-processor/_rehype-report";
import {remarkSnippets} from "@/app/_function/to-processor/_remark-snippets";
import {shikiTransformers} from "@/component/widget/article/_constant/shiki-transformers";
import {rehypeBlocks} from "@/component/widget/article/_function/rehype-blocks";
import {rehypeFigures} from "@/component/widget/article/_function/rehype-figures";
import {rehypeHead} from "@/component/widget/article/_function/rehype-head";
import {rehypeHeadingIds} from "@/component/widget/article/_function/rehype-heading-ids";
import {rehypeSections} from "@/component/widget/article/_function/rehype-sections/rehype-sections";
import {rehypeTables} from "@/component/widget/article/_function/rehype-tables";
import {remarkBlocks} from "@/component/widget/article/_function/remark-blocks/remark-blocks";
import {remarkLinks} from "@/component/widget/article/_function/remark-links";
import {remarkParts} from "@/component/widget/article/_function/remark-parts";
import {remarkRefs} from "@/component/widget/article/_function/remark-refs";
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
 *   - 부품 제목 검사, 머리, 제목 ID, 가름, 표, 그림, 링크, 자원 처리는 원시 HTML 포함
 *   - 코드 상자의 바탕과 글색은 article CSS 소유, 토큰 색상은 GitHub 기본 테마의 light-dark()
 *   - 주석과 보라 토큰은 github.com 현행 값으로 교체, 코드 상자 바탕 위 대비 4.5 확보
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
        .use(remarkRefs, {refs: params.site.refs})
        .use(remarkSwatch)
        .use(remarkLinks, {scope: params.scope})
        .use(remarkUnknownDirectives)
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeShiki, {
            themes: {light: "github-light-default", dark: "github-dark-default"},
            defaultColor: "light-dark()",
            colorReplacements: {"github-light-default": {"#6e7781": "#59636e", "#8250df": "#6639ba"}, "github-dark-default": {"#8b949e": "#9198a1"}},
            transformers: shikiTransformers,
        })
        .use(rehypeRaw)
        .use(rehypeBlocks)
        .use(rehypeHead, {lang: params.site.lang})
        .use(rehypeHeadingIds)
        .use(rehypeSections)
        .use(rehypeTables)
        .use(rehypeFigures)
        .use(rehypeContentLinks, {scope: params.scope})
        .use(rehypeAssets, {scope: params.scope, files})
        .use(rehypeBasePath, {basePath: params.site.basePath})
        .use(rehypeReport, {root: params.scope.root})
        .use(rehypeStringify, {allowDangerousHtml: true});
};
