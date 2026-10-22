import {randomUUID} from "node:crypto";
import {promises as fileSystem} from "node:fs";
import {dirname, join} from "node:path";
import {readInitFile} from "@/entry/init/_function/read-init-file";
import type {InitChange} from "@/entry/init/_type/init";

/**
 * 적용할 파일과 프로젝트 경계
 */
interface InitWriteParams {
    /**
     * 프로젝트의 절대 경로
     */
    root: string;
    /**
     * 기대하는 원본과 완성한 파일 내용
     */
    change: InitChange;
}

/**
 * 임시 파일 완성 후 새 파일은 배타적 생성, 기존 파일은 원본 재확인 후 교체
 */
export const writeInitChange = async (params: InitWriteParams) => {
    const path = join(params.root, params.change.path);
    const temporary = join(dirname(path), `.for-humanity-${randomUUID()}.tmp`);

    try {
        await fileSystem.writeFile(temporary, params.change.content, {flag: "wx"});
        const current = await readInitFile({root: params.root, path: params.change.path});

        if (params.change.previous === undefined) {
            if (current !== undefined) {
                throw new Error(`File changed during init: ${params.change.path}`);
            }

            await fileSystem.link(temporary, path);
        } else {
            if (current === undefined || !current.equals(params.change.previous)) {
                throw new Error(`File changed during init: ${params.change.path}`);
            }

            await fileSystem.chmod(temporary, (await fileSystem.stat(path)).mode);
            await fileSystem.rename(temporary, path);
        }
    } finally {
        await fileSystem.rm(temporary, {force: true});
    }
};
