import {readFile, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {readSiteConfig} from "@/app/_function/read-site-config";

describe("설정 파일 조회", () => {
    describe("설정 모듈 로드", () => {
        test("파일이 없으면 기본 설정을 반환한다", async ({root}) => {
            /**
             * GIVEN
             * 설정 파일이 없는 빈 문서 루트
             */

            /**
             * WHEN
             * 설정 조회
             */
            const result = await readSiteConfig(root);

            /**
             * THEN
             * 기본 사이트 이름과 포트
             */
            expect(result.title).toBe("for humanity");
            expect(result.port).toBe(4321);
        });

        test.for(["ts", "mjs"])("%s 설정은 비동기 기본 내보내기를 읽는다", async (extension, {root}) => {
            /**
             * GIVEN
             * 최상위 await가 포함된 설정
             */
            await writeFile(join(root, `for-humanity.config.${extension}`), 'export default await Promise.resolve({title: "Async site"});');

            /**
             * WHEN
             * 설정 모듈 실행
             */
            const result = await readSiteConfig(root);

            /**
             * THEN
             * 작성한 설정 적용
             */
            expect(result.title).toBe("Async site");
        });

        test("TypeScript 설정은 같은 폴더의 모듈을 불러오고 타입 문법을 제거한다", async ({root}) => {
            /**
             * GIVEN
             * 타입 문법이 있는 설정과 같은 폴더의 TypeScript 모듈
             */
            await writeFile(join(root, "title.ts"), 'export const title: string = "Imported site";');
            await writeFile(join(root, "for-humanity.config.ts"), 'import {title} from "./title.ts"; export default {title} satisfies {title: string};');

            /**
             * WHEN
             * 설정 모듈 실행
             */
            const result = await readSiteConfig(root);

            /**
             * THEN
             * 가져온 값 적용
             */
            expect(result.title).toBe("Imported site");
        });
    });

    describe("잘못된 설정", () => {
        test("설정 파일이 둘이면 어느 쪽도 실행하지 않고 거부한다", async ({root}) => {
            /**
             * GIVEN
             * 함께 있는 TypeScript와 ESM 설정
             */
            await writeFile(join(root, "for-humanity.config.ts"), 'throw new Error("실행되면 안 됨");');
            await writeFile(join(root, "for-humanity.config.mjs"), 'throw new Error("실행되면 안 됨");');

            /**
             * WHEN
             * 설정 조회
             */
            const result = readSiteConfig(root);

            /**
             * THEN
             * 두 파일 이름을 포함한 중복 안내
             */
            await expect(result).rejects.toThrow(/More than one config file.*for-humanity.config.ts.*for-humanity.config.mjs/);
        });

        test.for(["ts", "mjs"])("%s 설정 실행이 실패하면 재실행하지 않고 원래 오류를 전달한다", async (extension, {root}) => {
            /**
             * GIVEN
             * 최초 실행만 실패하고 재실행하면 성공하는 설정
             */
            const marker = join(root, "executions.txt");

            await writeFile(
                join(root, `for-humanity.config.${extension}`),
                `
                import {appendFileSync, readFileSync} from "node:fs";
                appendFileSync(${JSON.stringify(marker)}, "run\\n");
                if (readFileSync(${JSON.stringify(marker)}, "utf8") === "run\\n") throw new Error("최초 설정 오류");
                export default {title: "오류가 숨겨짐"};
            `,
            );

            /**
             * WHEN
             * 실패하는 설정 로드
             */
            const result = readSiteConfig(root);

            /**
             * THEN
             * 최초 오류와 실행 기록 한 줄
             */
            await expect(result).rejects.toThrow("최초 설정 오류");
            expect(await readFile(marker, "utf8")).toBe("run\n");
        });

        test.for([
            {name: "기본 내보내기 누락", source: "export const title = 'Named';", error: /default/},
            {name: "잘못된 포트", source: "export default {port: '4321'};", error: /port/},
        ])("$name 설정은 기본값으로 대체하지 않고 거부한다", async (scenario, {root}) => {
            /**
             * GIVEN
             * 검증에 실패하는 설정
             */
            await writeFile(join(root, "for-humanity.config.ts"), scenario.source);

            /**
             * WHEN
             * 설정 조회
             */
            const result = readSiteConfig(root);

            /**
             * THEN
             * 원인을 식별할 수 있는 오류
             */
            await expect(result).rejects.toThrow(scenario.error);
        });
    });
});
