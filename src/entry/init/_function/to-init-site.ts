import {content_default} from "@/constant/content";
import type {InitOptions} from "@/entry/init/_type/init";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 사용자 사이트·프로젝트 사이트·사용자 도메인의 공개 경로
 */
export const toInitSite = (options: InitOptions) => {
    let url = options.url;
    let basePath = "/";

    if (options.deploy === "github-pages") {
        if (options.repository === undefined) {
            throw new Error("GitHub Pages needs --repository owner/name.");
        }

        const [owner, repository] = options.repository.split("/");
        const origin = `https://${owner.toLowerCase()}.github.io`;
        url = url ?? origin;

        if (url === origin && repository.toLowerCase() !== `${owner.toLowerCase()}.github.io`) {
            basePath = `/${repository}/`;
        }
    }

    const site = siteConfigSchema.parse({title: options.title, lang: options.lang, content: {...content_default, root: options.content}, url, basePath});

    return {title: site.title, lang: site.lang, content: site.content, url: site.url, basePath: site.basePath};
};
