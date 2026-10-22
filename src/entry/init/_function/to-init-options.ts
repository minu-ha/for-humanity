import {z} from "zod";
import {init_cancelled, init_copy, init_defaults, init_deploy_choices, init_deployments} from "@/entry/init/_constant/init";
import {promptInitText} from "@/entry/init/_function/prompt-init-text";
import type {InitProject} from "@/entry/init/_function/read-init-project";
import type {InitOptions} from "@/entry/init/_type/init";
import {type InitInput, initBranchSchema, initContentSchema, initRepositorySchema, initTitleSchema, initUrlSchema} from "@/entry/init/_type/init-input";
import {siteConfigSchema} from "@/type/site-config";
import {logger} from "@/util/logger/logger";

/**
 * 명시적 인자와 로컬 후보를 대화형 입력으로 보완하는 경계
 */
interface InitOptionsParams {
    /**
     * 검증한 초기화 인자
     */
    args: InitInput;
    /**
     * 기존 프로젝트와 Git 후보
     */
    project: InitProject;
    /**
     * 터미널 질문 사용 여부
     */
    interactive: boolean;
}

/**
 * 공통 질문과 호스팅별 필수 입력 수집
 */
export const toInitOptions = async (params: InitOptionsParams): Promise<InitOptions> => {
    const title =
        params.args.title ??
        (params.interactive
            ? await promptInitText({message: init_copy.title, initial: params.project.manifest.name ?? init_defaults.title, schema: initTitleSchema})
            : initTitleSchema.parse(params.project.manifest.name ?? init_defaults.title));
    const content =
        params.args.content ??
        (params.interactive ? await promptInitText({message: init_copy.content, initial: init_defaults.content, schema: initContentSchema}) : init_defaults.content);
    const lang =
        params.args.lang ??
        (params.interactive ? await promptInitText({message: init_copy.lang, initial: init_defaults.lang, schema: siteConfigSchema.shape.lang}) : init_defaults.lang);
    let deploy = params.args.deploy ?? init_defaults.deploy;

    if (params.args.deploy === undefined && params.interactive) {
        const choice = await logger.prompt(init_copy.deploy, {type: "select", initial: init_defaults.deploy, options: init_deploy_choices, cancel: "symbol"});

        if (typeof choice === "symbol") {
            throw init_cancelled;
        }

        deploy = z.enum(init_deployments).parse(choice);
    }

    let repository = params.args.repository ?? params.project.repository;
    let branch = params.args.branch ?? params.project.branch;

    if (deploy === "github-pages") {
        if (params.args.repository === undefined && params.interactive) {
            repository = await promptInitText({message: init_copy.repository, initial: repository, schema: initRepositorySchema});
        }

        if (repository === undefined) {
            throw new Error("GitHub Pages needs a repository. Add --repository owner/name or run init interactively.");
        }

        repository = initRepositorySchema.parse(repository);

        if (params.args.branch === undefined && params.interactive) {
            branch = await promptInitText({message: init_copy.branch, initial: branch, schema: initBranchSchema});
        }
    }

    const url =
        params.args.url ??
        (params.interactive && deploy !== "none" ? await promptInitText({message: init_copy.url, placeholder: init_copy.emptyUrl, schema: initUrlSchema}) : undefined);

    return {title, content, lang, deploy, repository, branch, manager: params.project.manager, url};
};
