import {posix, relative} from "node:path";
import {colors} from "consola/utils";
import {init_copy} from "@/entry/init/_constant/init";
import {printInitPanel} from "@/entry/init/_function/print-init-panel";
import {toInitSite} from "@/entry/init/_function/to-init-site";
import type {InitPlan} from "@/entry/init/_type/init";

/**
 * 생성 결과와 설치·실행·배포의 다음 단계
 */
export const printInitResult = (plan: InitPlan) => {
    printInitPanel({title: init_copy.ready, message: colors.green(init_copy.done), color: "green"});

    const location = relative(process.cwd(), plan.root);

    const quoted = process.platform === "win32" ? location.replaceAll("'", "''") : location.replaceAll("'", "'\\''");
    const prefix = plan.options.manager === "npm" ? "npm run" : "pnpm";
    const commands = [
        ...(location === "" ? [] : [`cd '${quoted}'`, ""]),
        ...(plan.install ? [colors.cyan(`${plan.options.manager} install`)] : []),
        colors.bold(colors.cyan(`${prefix} docs:dev`)),
        "",
        colors.dim(init_copy.buildPreview),
        `${prefix} docs:build`,
        `${prefix} docs:preview`,
    ];

    printInitPanel({title: init_copy.next, message: commands.join("\n")});

    if (plan.options.deploy === "github-pages") {
        const site = toInitSite(plan.options);
        printInitPanel({title: "GitHub Pages", message: `${init_copy.github}\n\nDeployment branch: ${plan.options.branch}\nExpected URL: ${site.url}${site.basePath}`});
    } else if (plan.options.deploy === "cloudflare-workers") {
        const exec = plan.options.manager === "npm" ? "npx" : "pnpm exec";
        printInitPanel({
            title: "Cloudflare Workers",
            message: `${init_copy.workers}\n\nBuild command: ${prefix} docs:build\nDeploy command: ${exec} wrangler deploy\n\nLocal deployment:\n${exec} wrangler login\n${prefix} docs:deploy\n\nNode.js: 22.12 or later\nSet url after deployment. Add custom domains separately.`,
        });
    } else if (plan.options.deploy === "cloudflare-pages") {
        printInitPanel({
            title: "Cloudflare Pages",
            message: `${init_copy.cloudflare}\n\nBuild command: ${prefix} docs:build\nOutput directory: ${posix.join(plan.options.content, "dist")}\nNode.js: 22.12 or later\nPackage manager: ${plan.options.manager}`,
        });
    } else {
        printInitPanel({title: "Publish later", message: init_copy.none});
    }
};
