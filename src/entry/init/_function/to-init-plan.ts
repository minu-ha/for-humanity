import {promises as fileSystem} from "node:fs";
import {join, posix} from "node:path";
import {content_default} from "@/constant/content";
import {deploy_workers} from "@/entry/init/_constant/deploy";
import {init_copy, init_defaults, init_empty_entries} from "@/entry/init/_constant/init";
import {readInitFile} from "@/entry/init/_function/read-init-file";
import {readInitPath} from "@/entry/init/_function/read-init-path";
import type {InitProject} from "@/entry/init/_function/read-init-project";
import {toDeployFiles} from "@/entry/init/_function/to-deploy-files";
import {toInitSite} from "@/entry/init/_function/to-init-site";
import type {InitOptions, InitPlan} from "@/entry/init/_type/init";

/**
 * 기존 프로젝트와 검증한 초기화 선택값
 */
interface InitPlanParams {
    /**
     * 설치와 저장소 정보를 읽은 프로젝트
     */
    project: InitProject;
    /**
     * 사용자 선택과 기본값
     */
    options: InitOptions;
}

/**
 * 덮어쓰기 없는 파일 목록과 JSON과 gitignore 병합 계획
 */
export const toInitPlan = async (params: InitPlanParams): Promise<InitPlan> => {
    for (const path of [
        "for-humanity.config.ts",
        "for-humanity.config.mjs",
        ...(params.options.deploy === "cloudflare-workers" ? ["wrangler.jsonc", "wrangler.json", "wrangler.toml"] : []),
    ]) {
        if ((await readInitPath({root: params.project.root, path})) !== undefined) {
            throw new Error(`${init_copy.conflict}: ${path}`);
        }
    }

    const folders = params.options.content === "." ? [content_default.public, content_default.private, "asset"] : [params.options.content];

    for (const path of folders) {
        const entry = await readInitPath({root: params.project.root, path});

        if (entry !== undefined && (!entry.isDirectory() || (await fileSystem.readdir(join(params.project.root, path))).length > 0)) {
            throw new Error(`${init_copy.conflict}: ${path}`);
        }
    }

    const config = toInitSite(params.options);
    const prefix = params.options.manager === "npm" ? "npm run" : "pnpm";
    const scripts = {
        "docs:dev": "for-humanity dev",
        "docs:build": ["cloudflare-pages", "cloudflare-workers"].includes(params.options.deploy) ? "for-humanity build && node .cloudflare/prepare.mjs" : "for-humanity build",
        "docs:preview": "for-humanity preview",
        ...(params.options.deploy === "cloudflare-workers" ? {"docs:deploy": `${prefix} docs:build && wrangler deploy`} : {}),
    };
    const previousScripts = params.project.manifest.scripts ?? init_empty_entries;

    for (const [name, command] of Object.entries(scripts)) {
        if (previousScripts[name] !== undefined && previousScripts[name] !== command) {
            throw new Error(`Existing script conflicts with init: ${name}. Rename it before running init.`);
        }
    }

    const installed = params.project.manifest.devDependencies?.["for-humanity"] !== undefined || params.project.manifest.dependencies?.["for-humanity"] !== undefined;
    const needsWrangler =
        params.options.deploy === "cloudflare-workers" &&
        params.project.manifest.devDependencies?.wrangler === undefined &&
        params.project.manifest.dependencies?.wrangler === undefined;
    const manifest = {
        ...params.project.manifest,
        scripts: {...previousScripts, ...scripts},
        ...(!installed || needsWrangler
            ? {
                  devDependencies: {
                      ...(params.project.manifest.devDependencies ?? init_empty_entries),
                      ...(installed ? {} : {"for-humanity": params.project.version}),
                      ...(needsWrangler ? {wrangler: deploy_workers.version} : {}),
                  },
              }
            : {}),
        ...(params.options.manager === "pnpm" && params.project.manifest.packageManager === undefined ? {packageManager: params.project.packageManager} : {}),
    };
    const original = params.project.packageFile?.toString("utf8");
    const indent = original?.match(/\n([\t ]+)"/)?.[1] ?? init_defaults.indent;
    const packageEol = original?.includes("\r\n") === true ? "\r\n" : "\n";
    const packageBom = original?.startsWith("\uFEFF") === true ? "\uFEFF" : "";
    const ignore = await readInitFile({root: params.project.root, path: ".gitignore"});
    const ignoreText = ignore === undefined ? "" : ignore.toString("utf8");
    const ignoreEol = ignoreText.includes("\r\n") ? "\r\n" : "\n";
    const output = posix.join(params.options.content, "dist");
    const ignoreLine = `/${output.replace(/[!#[\] ]/g, "\\$&")}/`;
    const ignoreAdditions = [ignoreLine, ...(params.options.deploy === "cloudflare-workers" ? ["/.wrangler/"] : [])].filter((line) => !ignoreText.split(/\r?\n/).includes(line));
    const ignoreContent =
        ignoreAdditions.length === 0 ? ignoreText : `${ignoreText}${ignoreText === "" || ignoreText.endsWith("\n") ? "" : ignoreEol}${ignoreAdditions.join(ignoreEol)}${ignoreEol}`;

    for (const [name, buffer] of [
        ["package.json", params.project.packageFile],
        [".gitignore", ignore],
    ] as const) {
        if (buffer !== undefined && !Buffer.from(buffer.toString("utf8")).equals(buffer)) {
            throw new Error(`Keep ${name} as UTF-8 before running init.`);
        }
    }

    const intro = params.options.lang.startsWith("ko") ? "프로젝트 소개와 사용 안내입니다." : "Documentation for your project.";
    const starter = params.options.lang.startsWith("ko")
        ? "첫 번째 공개 문서입니다. 이 파일을 수정하고 저장하면 개발 서버에 반영됩니다."
        : "Your first public document. Edit this file and save to update the development server.";
    const files = [
        {
            path: "for-humanity.config.ts",
            content: `import type {SiteConfig} from "for-humanity";\n\nexport default ${JSON.stringify(config, null, init_defaults.configIndent)} satisfies SiteConfig;\n`,
        },
        {path: posix.join(params.options.content, "README.md"), content: `# ${params.options.title}\n\n${intro}\n\n[Getting started](public/getting-started.md)\n`},
        {
            path: posix.join(params.options.content, "public/getting-started.md"),
            content: `---\nname: Getting started\nlabel: Getting started\ngroup: Guide\norder: 10\n---\n\n## Your first document\n\n${starter}\n\n\`\`\`sh\n${prefix} docs:dev\n${prefix} docs:build\n${prefix} docs:preview\n\`\`\`\n\nPublish \`${output}\`. Keep local notes in \`${posix.join(params.options.content, "private")}\`.\n`,
        },
        ...(await toDeployFiles(params.options)),
    ];
    const directories = [
        params.options.content,
        posix.join(params.options.content, "public"),
        posix.join(params.options.content, "private"),
        posix.join(params.options.content, "asset"),
    ];

    for (const file of files) {
        const path = file.path.toLowerCase();

        if (directories.some((directory) => directory.toLowerCase() === path || directory.toLowerCase().startsWith(`${path}/`))) {
            throw new Error(`Documentation folder conflicts with a generated file: ${file.path}. Choose another --content folder.`);
        }
    }

    const created = await Promise.all(
        files.map(async (file) => {
            if ((await readInitPath({root: params.project.root, path: file.path})) !== undefined) {
                throw new Error(`${init_copy.conflict}: ${file.path}`);
            }

            return {...file, previous: undefined};
        }),
    );

    return {
        root: params.project.root,
        options: params.options,
        files: [
            ...created,
            {path: "package.json", previous: params.project.packageFile, content: `${packageBom}${JSON.stringify(manifest, null, indent)}\n`.replaceAll("\n", packageEol)},
            {path: ".gitignore", previous: ignore, content: ignoreContent},
        ],
        directories,
        install: !installed || needsWrangler,
    };
};
