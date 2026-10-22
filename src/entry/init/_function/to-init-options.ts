import {z} from "zod";
import {
    init_branch_choices,
    init_cancelled,
    init_content_choices,
    init_copy,
    init_defaults,
    init_deploy_choices,
    init_deployments,
    init_lang_choices,
} from "@/entry/init/_constant/init";
import {printInitPanel} from "@/entry/init/_function/print-init-panel";
import {promptInitChoice} from "@/entry/init/_function/prompt-init-choice";
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
    if (params.interactive && (params.args.title === undefined || params.args.content === undefined || params.args.lang === undefined)) {
        printInitPanel({title: init_copy.siteStep, message: init_copy.siteHint});
    }

    const detectedTitle = initTitleSchema.safeParse(params.project.manifest.name);
    const suggestedTitle = detectedTitle.success ? detectedTitle.data : init_defaults.title;
    const title =
        params.args.title ??
        (params.interactive
            ? await promptInitChoice({
                  message: init_copy.title,
                  placeholder: init_copy.titleExample,
                  presets: [{value: suggestedTitle, label: suggestedTitle, hint: init_copy.recommended}],
                  schema: initTitleSchema,
              })
            : initTitleSchema.parse(suggestedTitle));
    const content =
        params.args.content ??
        (params.interactive
            ? await promptInitChoice({message: init_copy.content, placeholder: init_copy.contentExample, presets: init_content_choices, schema: initContentSchema})
            : init_defaults.content);
    const lang =
        params.args.lang ??
        (params.interactive
            ? await promptInitChoice({message: init_copy.lang, placeholder: init_copy.langExample, presets: init_lang_choices, schema: siteConfigSchema.shape.lang.unwrap()})
            : init_defaults.lang);

    if (params.interactive && params.args.deploy !== "none") {
        printInitPanel({title: init_copy.deployStep, message: init_copy.deployHint});
    }

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
            repository = await promptInitChoice({
                message: init_copy.repository,
                placeholder: init_copy.repositoryExample,
                presets: repository === undefined ? [] : [{value: repository, label: repository, hint: init_copy.recommended}],
                schema: initRepositorySchema,
            });
        }

        if (repository === undefined) {
            throw new Error("GitHub Pages needs a repository. Add --repository owner/name or run init interactively.");
        }

        repository = initRepositorySchema.parse(repository);

        if (params.args.branch === undefined && params.interactive) {
            branch = await promptInitChoice({
                message: init_copy.branch,
                placeholder: init_copy.branchExample,
                presets: [branch, ...init_branch_choices.filter((candidate) => candidate !== branch)].map((value, index) => ({
                    value,
                    label: value,
                    hint: index === 0 ? init_copy.recommended : undefined,
                })),
                schema: initBranchSchema,
            });
        }
    }

    const url =
        params.args.url ??
        (params.interactive && deploy !== "none"
            ? await promptInitChoice({
                  message: init_copy.url,
                  placeholder: init_copy.emptyUrl,
                  presets: [{value: undefined, label: deploy === "github-pages" ? init_copy.defaultUrl : init_copy.laterUrl, hint: init_copy.recommended}],
                  schema: initUrlSchema,
              })
            : undefined);

    return {title, content, lang, deploy, repository, branch, manager: params.project.manager, url};
};
