import {promises as fileSystem} from "node:fs";
import {dirname, join} from "node:path";
import {readInitFile} from "@/entry/init/_function/read-init-file";
import {readInitPath} from "@/entry/init/_function/read-init-path";
import {writeInitChange} from "@/entry/init/_function/write-init-change";
import type {InitChange, InitPlan} from "@/entry/init/_type/init";
import {logger} from "@/util/logger/logger";

/**
 * 전체 재검사 뒤 파일 생성, 실패 시 이 실행의 변경만 복구
 */
export const applyInitPlan = async (plan: InitPlan) => {
    // 적용 완료 파일과 이번 실행이 생성한 폴더의 복구 기록
    const completed: InitChange[] = [];
    const directories: string[] = [];

    for (const file of plan.files) {
        const current = await readInitFile({root: plan.root, path: file.path});

        if (file.previous === undefined ? current !== undefined : current === undefined || !current.equals(file.previous)) {
            throw new Error(`File changed during init: ${file.path}`);
        }
    }

    for (const path of plan.directories) {
        const entry = await readInitPath({root: plan.root, path});

        if (entry !== undefined && !entry.isDirectory()) {
            throw new Error(`Existing file blocks this folder: ${path}`);
        }
    }

    try {
        for (const path of [...plan.directories.map((directory) => join(plan.root, directory)), ...plan.files.map((file) => dirname(join(plan.root, file.path)))]) {
            // 생성 전 없는 폴더 기록, Windows의 mkdir 반환값은 \\?\ 접두사 경로라 비교에 사용하지 않음
            for (let missing = path; (await fileSystem.stat(missing).catch(() => undefined)) === undefined; missing = dirname(missing)) {
                directories.push(missing);
            }

            await fileSystem.mkdir(path, {recursive: true});
        }

        for (const file of plan.files) {
            if (file.previous?.equals(Buffer.from(file.content)) === true) {
                continue;
            }

            completed.push(file);
            await writeInitChange({root: plan.root, change: file});
        }
    } catch (error) {
        for (const file of completed.toReversed()) {
            try {
                const current = await readInitFile({root: plan.root, path: file.path});

                // 동시에 편집된 파일의 내용 유지
                if (current === undefined || !current.equals(Buffer.from(file.content))) {
                    if (current !== undefined && file.previous?.equals(current) !== true) {
                        logger.warn(`Kept a file changed during init: ${file.path}. Review this file before running init again.`);
                    }

                    continue;
                }

                if (file.previous === undefined) {
                    await fileSystem.unlink(join(plan.root, file.path));
                } else {
                    await writeInitChange({root: plan.root, change: {path: file.path, content: file.previous.toString("utf8"), previous: current}});
                }
            } catch {
                logger.warn(`Could not restore ${file.path}. Review this file before running init again.`);
            }
        }

        for (const path of [...new Set(directories)].toSorted((left, right) => right.length - left.length)) {
            try {
                await fileSystem.rmdir(path);
            } catch {
                // 다른 작업이 추가한 파일과 폴더 유지
            }
        }

        throw error;
    }
};
