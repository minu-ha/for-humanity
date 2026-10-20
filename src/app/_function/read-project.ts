import {existsSync, realpathSync} from "node:fs";
import {relative, resolve} from "node:path";
import {copy_error_content_root_outside, copy_error_content_root_reserved} from "@/app/_constant/copy";
import {readSiteConfig} from "@/app/_function/read-site-config";
import {hasReservedFolder} from "@/util/file/has-reserved-folder";
import {isOutsideRoot} from "@/util/file/is-outside-root";

/**
 * 프로젝트 설정과 문서 루트 해소, 외부와 시스템 폴더 symlink 거부
 */
export const readProject = async (directory: string) => {
    const projectRoot = realpathSync(resolve(directory));
    const site = await readSiteConfig(projectRoot);
    const root = resolve(projectRoot, site.content.root);

    if (existsSync(root)) {
        const location = relative(projectRoot, realpathSync(root));

        if (isOutsideRoot(location)) {
            throw new Error(`${copy_error_content_root_outside}: ${root}`);
        }

        if (hasReservedFolder(location)) {
            throw new Error(`${copy_error_content_root_reserved}: ${root}`);
        }
    }

    return {root, site};
};
