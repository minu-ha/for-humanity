import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test as base} from "vitest";

/**
 * 파일 시스템 검증마다 격리하는 임시 문서 루트
 */
export const test = base.extend<{root: string}>({
    // biome-ignore lint/correctness/noEmptyPattern: Vitest가 구조분해 매개변수로 fixture 의존성을 조회
    root: async ({}, use) => {
        const root = await mkdtemp(join(tmpdir(), "for-humanity-test-"));

        try {
            await use(root);
        } finally {
            await rm(root, {recursive: true, force: true});
        }
    },
});
