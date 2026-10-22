import {resolve} from "node:path";
import type {ParsedArgs} from "citty";
import {colors} from "consola/utils";
import {z} from "zod";
import {env_ci} from "@/config/env";
import {type init_args, init_cancel_code, init_cancelled, init_copy} from "@/entry/init/_constant/init";
import {applyInitPlan} from "@/entry/init/_function/apply-init-plan";
import {printInitPanel} from "@/entry/init/_function/print-init-panel";
import {printInitPlan} from "@/entry/init/_function/print-init-plan";
import {printInitResult} from "@/entry/init/_function/print-init-result";
import {readInitProject} from "@/entry/init/_function/read-init-project";
import {toInitOptions} from "@/entry/init/_function/to-init-options";
import {toInitPlan} from "@/entry/init/_function/to-init-plan";
import {initInputSchema} from "@/entry/init/_type/init-input";
import {toErrorMessage} from "@/util/error/to-error-message";
import {logger} from "@/util/logger/logger";

/**
 * 사이트 설정을 실행하지 않는 프로젝트 초기화 진입점
 */
export const runInit = async (input: ParsedArgs<typeof init_args>) => {
    try {
        const args = initInputSchema.parse(input);
        const interactive = !args.yes && process.stdin.isTTY === true && process.stdout.isTTY === true && env_ci !== "true" && env_ci !== "1";

        if (!args.yes && !interactive && args.deploy === undefined) {
            throw new Error(init_copy.interactive);
        }

        const project = await readInitProject({root: resolve(args.dir), manager: args.manager});
        printInitPanel({title: `for-humanity v${project.version}`, message: `${init_copy.welcome}\n${colors.dim(init_copy.tagline)}`});
        const options = await toInitOptions({args, project, interactive});
        const plan = await toInitPlan({project, options});

        printInitPlan(plan);

        if (interactive) {
            const confirm = await logger.prompt(init_copy.confirm, {type: "confirm", initial: true, cancel: "symbol"});

            if (confirm !== true) {
                throw init_cancelled;
            }
        }

        await applyInitPlan(plan);
        printInitResult(plan);
    } catch (error) {
        if (error === init_cancelled) {
            logger.info(init_copy.cancelled);
            process.exitCode = init_cancel_code;

            return;
        }

        const message = error instanceof z.ZodError ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n") : toErrorMessage(error);
        logger.error(message);
        process.exitCode = 1;
    }
};
