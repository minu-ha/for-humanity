import {posix, relative} from "node:path";
import {colors} from "consola/utils";
import {init_copy} from "@/entry/init/_constant/init";
import {printInitPanel} from "@/entry/init/_function/print-init-panel";
import {toInitSite} from "@/entry/init/_function/to-init-site";
import type {InitPlan} from "@/entry/init/_type/init";
import {logger} from "@/util/logger/logger";

/**
 * 생성 결과와 설치·실행·배포의 다음 단계
 */
export const printInitResult = (plan: InitPlan) => {
    logger.success(init_copy.done);

    const location = relative(process.cwd(), plan.root);

    if (location !== "") {
        const quoted = process.platform === "win32" ? location.replaceAll("'", "''") : location.replaceAll("'", "'\\''");
        logger.info(`Open your project first: cd '${quoted}'`);
    }

    const prefix = plan.options.manager === "npm" ? "npm run" : "pnpm";
    const commands = [...(plan.install ? [`${plan.options.manager} install`] : []), `${prefix} docs:dev`, `${prefix} docs:build`, `${prefix} docs:preview`];

    printInitPanel({title: init_copy.next, message: commands.map((command) => colors.cyan(command)).join("\n")});

    if (plan.options.deploy === "github-pages") {
        const site = toInitSite(plan.options);
        logger.info(init_copy.github);
        logger.info(`Deployment branch: ${plan.options.branch}\nExpected URL: ${site.url}${site.basePath}`);
    } else if (plan.options.deploy === "cloudflare-pages") {
        logger.info(init_copy.cloudflare);
        logger.info(
            `Build command: ${prefix} docs:build\nOutput directory: ${posix.join(plan.options.content, "dist")}\nNode.js: 22.12 or later\nPackage manager: ${plan.options.manager}`,
        );
    } else {
        logger.info(init_copy.none);
    }
};
