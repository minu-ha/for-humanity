import {colors} from "consola/utils";
import {init_copy, init_deploy_choices} from "@/entry/init/_constant/init";
import {printInitPanel} from "@/entry/init/_function/print-init-panel";
import type {InitPlan} from "@/entry/init/_type/init";
import {logger} from "@/util/logger/logger";

/**
 * 선택한 설정과 생성 전 파일 목록
 */
export const printInitPlan = (plan: InitPlan) => {
    printInitPanel({title: init_copy.reviewStep, message: init_copy.reviewHint});
    const deployment = init_deploy_choices.find((choice) => choice.value === plan.options.deploy);
    const created = plan.files.filter((file) => file.previous === undefined).length;

    logger.info(
        [
            `${colors.dim("Project")}   ${plan.root}`,
            `${colors.dim("Title")}     ${colors.bold(plan.options.title)}`,
            `${colors.dim("Folder")}    ${plan.options.content}`,
            `${colors.dim("Language")}  ${plan.options.lang}`,
            `${colors.dim("Hosting")}   ${deployment?.label ?? plan.options.deploy}`,
            `${colors.dim("Manager")}   ${plan.options.manager}`,
            "",
            colors.bold(`${created} new files, ${plan.files.length - created} existing files`),
            ...plan.files.map((file) => `${file.previous === undefined ? colors.green("+ create") : colors.yellow("~ update")}  ${file.path}`),
        ].join("\n"),
    );
};
