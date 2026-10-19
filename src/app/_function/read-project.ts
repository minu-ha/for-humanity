import {existsSync, realpathSync} from "node:fs";
import {isAbsolute, relative, resolve, sep} from "node:path";
import {readSiteConfig} from "@/app/_function/read-site-config";

/**
 * 프로젝트 설정과 문서 루트 해소, 외부와 시스템 폴더 symlink 거부
 */
export const readProject = async (directory: string) => {
    const projectRoot = realpathSync(resolve(directory));
    const site = await readSiteConfig(projectRoot);
    const root = resolve(projectRoot, site.content.root);
    if (existsSync(root)) {
        const location = relative(projectRoot, realpathSync(root));
        if (location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location)) throw new Error(`content 루트는 프로젝트 내부여야 합니다: ${root}`);
        if (location.split(sep).some((part) => ["dist", ".git", "node_modules"].includes(part.toLowerCase()))) {
            throw new Error(`content 루트는 dist, .git, node_modules 내부일 수 없습니다: ${root}`);
        }
    }
    return {root, site};
};
