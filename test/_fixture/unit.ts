import {mkdir, mkdtemp, realpath, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test as base} from "vitest";
import {content_default} from "@/constant/site";
import type {ContentScope} from "@/type/content-scope";

/**
 * 파일 시스템 검증마다 격리하는 임시 문서 루트와 공개 범위
 */
export const test = base.extend<{root: string; scope: ContentScope}>({
    // biome-ignore lint/correctness/noEmptyPattern: Vitest가 구조분해 매개변수로 fixture 의존성을 조회
    root: async ({}, use) => {
        // 문서 범위 검사와 같은 실제 경로. macOS 임시 폴더의 symlink 해소
        const root = await realpath(await mkdtemp(join(tmpdir(), "for-humanity-test-")));

        try {
            await use(root);
        } finally {
            await rm(root, {recursive: true, force: true});
        }
    },

    /**
     * 사이트 빌드와 같은 기본 폴더 구조. 공개 폴더 생성, 내부 문서 제외
     */
    scope: async ({root}, use) => {
        await mkdir(join(root, content_default.public));
        await use({root, publicRoot: join(root, content_default.public), privateRoot: join(root, content_default.private), includePrivate: false});
    },
});
