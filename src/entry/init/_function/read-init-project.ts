import {execFileSync} from "node:child_process";
import {promises as fileSystem} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {z} from "zod";
import {env_package_agent} from "@/config/env";
import {init_defaults, init_managers} from "@/entry/init/_constant/init";
import {readInitFile} from "@/entry/init/_function/read-init-file";
import type {InitManager} from "@/entry/init/_type/init";

/**
 * package.json의 알려진 필드와 추가 키를 보존하는 입력 경계
 */
const manifestSchema = z.looseObject({
    /**
     * 사이트 이름 후보
     */
    name: z.string().optional(),
    /**
     * 기존 실행 명령
     */
    scripts: z.record(z.string(), z.string()).optional(),
    /**
     * 기존 패키지 매니저 지정
     */
    packageManager: z.string().optional(),
    /**
     * 개발용 의존성
     */
    devDependencies: z.record(z.string(), z.string()).optional(),
    /**
     * 실행용 의존성
     */
    dependencies: z.record(z.string(), z.string()).optional(),
});

/**
 * CLI와 생성 계획이 공유하는 초기화 대상 프로젝트
 */
export interface InitProject {
    /**
     * 프로젝트의 절대 경로
     */
    root: string;
    /**
     * 템플릿을 포함한 패키지 루트
     */
    kitRoot: string;
    /**
     * 실행 중인 CLI 버전
     */
    version: string;
    /**
     * 추가 키를 보존한 기존 패키지 설정
     */
    manifest: z.infer<typeof manifestSchema>;
    /**
     * package.json 원본, 새 프로젝트이면 없음
     */
    packageFile: Buffer | undefined;
    /**
     * 선택한 패키지 매니저
     */
    manager: InitManager;
    /**
     * pnpm 워크플로의 버전 지정
     */
    packageManager: string | undefined;
    /**
     * 로컬 Git에서 읽은 GitHub 저장소 후보
     */
    repository: string | undefined;
    /**
     * 로컬 Git에서 읽은 배포 브랜치 후보
     */
    branch: string;
}

/**
 * 프로젝트와 명시한 패키지 매니저
 */
interface ReadInitProjectParams {
    /**
     * 프로젝트의 절대 경로
     */
    root: string;
    /**
     * 사용자 지정, 미지정 시 로컬 정보에서 판별
     */
    manager?: InitManager;
}

/**
 * 설정 실행 없이 manifest, lockfile과 로컬 Git 정보 조회
 */
export const readInitProject = async (params: ReadInitProjectParams): Promise<InitProject> => {
    const packageFile = await readInitFile({root: params.root, path: "package.json"});
    const manifest = manifestSchema.parse(packageFile === undefined ? {private: true} : JSON.parse(packageFile.toString("utf8").replace(/^\uFEFF/u, "")));
    const declared = manifest.packageManager?.split("@")[0];
    const declaration = declared === undefined ? undefined : z.enum(init_managers).parse(declared);
    const locks = await Promise.all(
        (
            [
                {path: "package-lock.json", manager: "npm"},
                {path: "pnpm-lock.yaml", manager: "pnpm"},
            ] as const
        ).map(async (lock) => ({...lock, file: await readInitFile({root: params.root, path: lock.path})})),
    );
    const existing = locks.filter((lock) => lock.file !== undefined);

    if (declaration !== undefined && params.manager !== undefined && declaration !== params.manager) {
        throw new Error(`packageManager selects ${declaration}. Use --manager ${declaration} or update package.json first.`);
    }

    if (declaration === undefined && params.manager === undefined && existing.length > 1) {
        throw new Error("Both npm and pnpm lockfiles exist. Choose --manager npm or --manager pnpm.");
    }

    const lockManager = existing.length === 1 ? existing[0].manager : undefined;
    const agent = env_package_agent?.split("/")[0];
    const agentManager = agent === "npm" || agent === "pnpm" ? agent : undefined;
    const manager = params.manager ?? declaration ?? lockManager ?? agentManager ?? init_defaults.manager;
    const pnpmVersion = env_package_agent?.match(/^pnpm\/(\d+\.\d+\.\d+)/)?.[1];
    const packageManager = manifest.packageManager ?? (pnpmVersion === undefined ? init_defaults.pnpm : `pnpm@${pnpmVersion}`);
    const kitRoot = dirname(fileURLToPath(import.meta.resolve("for-humanity/package.json")));
    const kit = z.object({version: z.string()}).parse(JSON.parse(await fileSystem.readFile(join(kitRoot, "package.json"), "utf8")));
    let repository: string | undefined;
    let branch: string = init_defaults.branch;

    try {
        const remotes = execFileSync("git", ["config", "--get-regexp", "^remote\\..*\\.url$"], {cwd: params.root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]});
        const repositories = remotes.split("\n").flatMap((remote) => {
            const match = remote.match(/\s(?:git@github\.com:|https:\/\/github\.com\/|ssh:\/\/git@github\.com\/)([A-Za-z0-9-]+\/[A-Za-z0-9._-]+?)(?:\.git)?\s*$/);

            return match === null ? [] : [match[1]];
        });
        const candidates = [...new Set(repositories)];

        if (candidates.length === 1) {
            repository = candidates[0];
        }
    } catch {
        // Git 미설치나 미연결 환경의 명시적 입력 허용
    }

    try {
        const current = execFileSync("git", ["branch", "--show-current"], {cwd: params.root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]}).trim();

        if (current === "main" || current === "master") {
            branch = current;
        }
    } catch {
        // Git 미설치나 저장소 밖에서는 기본 브랜치 제안
    }

    return {root: params.root, kitRoot, version: kit.version, manifest, packageFile, manager, packageManager, repository, branch};
};
