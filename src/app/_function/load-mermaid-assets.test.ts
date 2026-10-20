import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {loadMermaidAssets} from "@/app/_function/load-mermaid-assets";

describe("다이어그램", () => {
    describe("패키지 자원", () => {
        test("진입 모듈, 공유 청크, 라이선스 고지가 같은 공개 경로에 등록된다", async ({root}) => {
            /**
             * GIVEN
             * 빌드된 모듈, 공유 청크, 고지 파일
             */
            const directory = join(root, "dist/mermaid");
            const names = ["mermaid-HASH.js", "chunk-HASH.js", "THIRD-PARTY-NOTICES.txt"];

            await mkdir(directory, {recursive: true});
            await Promise.all(names.map((name) => writeFile(join(directory, name), name)));

            /**
             * WHEN
             * 패키지 자원 조회
             */
            const result = loadMermaidAssets(root);

            /**
             * THEN
             * 내용 지문을 유지한 진입 경로와 전체 자원 목록
             */
            expect(result.entry).toBe("/_fh/mermaid/mermaid-HASH.js");
            expect(result.files).toStrictEqual(new Map(names.map((name) => [`/_fh/mermaid/${name}`, join(directory, name)])));
        });

        test("진입 모듈이 없으면 빌드 안내가 포함된 오류가 발생한다", async ({root}) => {
            /**
             * GIVEN
             * 진입 모듈 없이 공유 청크만 있는 패키지
             */
            await mkdir(join(root, "dist/mermaid"), {recursive: true});
            await writeFile(join(root, "dist/mermaid/chunk-HASH.js"), "export {};");

            /**
             * WHEN
             * 패키지 자원 조회
             */
            const result = () => {
                return loadMermaidAssets(root);
            };

            /**
             * THEN
             * 누락된 진입 모듈과 빌드 명령 안내
             */
            expect(result).toThrow(/Missing Mermaid browser entry.*pnpm build:kit/);
        });

        test("자원 폴더가 없어도 빌드 안내가 포함된 오류가 발생한다", ({root}) => {
            /**
             * WHEN
             * 빌드 전 패키지의 자원 조회
             */
            const result = () => {
                return loadMermaidAssets(root);
            };

            /**
             * THEN
             * 파일 시스템 오류 대신 빌드 명령 안내
             */
            expect(result).toThrow(/Missing Mermaid browser entry.*pnpm build:kit/);
        });
    });
});
