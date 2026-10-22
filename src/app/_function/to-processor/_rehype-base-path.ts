import type {Root} from "hast";
import {visit} from "unist-util-visit";
import {asset_srcset_candidate_pattern} from "@/app/_constant/asset";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {toSitePath} from "@/util/url/to-site-path";

/**
 * 본문 URL의 배포 경로 입력
 */
interface BasePathOptions {
    /**
     * 끝 슬래시를 포함한 검증된 배포 경로
     */
    basePath: ResolvedSiteConfig["basePath"];
}

/**
 * 문서와 자원 수집 이후의 URL 변환, 원시 HTML과 Mermaid 포함
 */
export const rehypeBasePath = (options: BasePathOptions) => (tree: Root) => {
    visit(tree, "element", (node) => {
        for (const property of ["href", "src", "poster", "data", "action", "formAction", "cite", "dataMermaidModule", "srcSet"]) {
            const value = node.properties[property];

            if (typeof value !== "string") {
                continue;
            }

            node.properties[property] =
                property === "srcSet"
                    ? value.replace(
                          asset_srcset_candidate_pattern,
                          (candidate: string, lead: string, url: string) =>
                              `${lead}${toSitePath({basePath: options.basePath, path: url})}${candidate.slice(lead.length + url.length)}`,
                      )
                    : toSitePath({basePath: options.basePath, path: value});
        }
    });
};
