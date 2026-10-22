import {readFile} from "node:fs/promises";
import {posix} from "node:path";
import {parseDocument, stringify} from "yaml";
import {deploy_artifact_step_index, deploy_build_step_index, deploy_install_step_index, deploy_manager_step_index, deploy_node_step_index} from "@/entry/init/_constant/deploy";
import type {InitFile, InitOptions} from "@/entry/init/_type/init";

/**
 * 계정 연동 없이 생성하는 호스팅별 배포 파일
 */
export const toDeployFiles = async (params: InitOptions): Promise<InitFile[]> => {
    if (params.deploy === "none") {
        return [];
    }

    const templateRoot = new URL("./template/", import.meta.resolve("for-humanity/package.json"));

    if (params.deploy === "cloudflare-pages") {
        const [notFound, prepare] = await Promise.all([
            readFile(new URL("cloudflare/404.html", templateRoot), "utf8"),
            readFile(new URL("cloudflare/prepare.mjs", templateRoot), "utf8"),
        ]);

        return [
            {path: ".cloudflare/404.html", content: notFound},
            {path: ".cloudflare/prepare.mjs", content: prepare.replace('"<CONTENT_ROOT>"', () => JSON.stringify(params.content))},
        ];
    }

    const workflow = parseDocument(await readFile(new URL("github-pages.yml", templateRoot), "utf8"));
    workflow.setIn(["on", "push", "branches"], [params.branch.replace(/[?*+![\]\\]/g, "\\$&")]);
    workflow.setIn(["jobs", "build", "steps", deploy_install_step_index, "run"], params.manager === "npm" ? "npm ci" : "pnpm install --frozen-lockfile");
    workflow.setIn(["jobs", "build", "steps", deploy_build_step_index, "run"], params.manager === "npm" ? "npm run docs:build" : "pnpm docs:build");
    workflow.setIn(["jobs", "build", "steps", deploy_artifact_step_index, "with", "path"], posix.join(params.content, "dist"));

    if (params.manager === "npm") {
        workflow.deleteIn(["jobs", "build", "steps", deploy_node_step_index, "with", "package-manager-cache"]);
        workflow.setIn(["jobs", "build", "steps", deploy_node_step_index, "with", "cache"], "npm");
        workflow.deleteIn(["jobs", "build", "steps", deploy_manager_step_index]);
    }

    return [{path: ".github/workflows/docs.yml", content: stringify(workflow)}];
};
