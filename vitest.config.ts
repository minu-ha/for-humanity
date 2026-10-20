import {fileURLToPath} from "node:url";
import {defineConfig} from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "@test": fileURLToPath(new URL("./test", import.meta.url)),
            "@tool": fileURLToPath(new URL("./util", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        testTimeout: 15000,
        restoreMocks: true,
        clearMocks: true,

        // 테스트 층과 같은 프로젝트 이름. 결과 목록의 |unit|, |node| 표시와 --project 선택 기준
        projects: [
            {extends: true, test: {name: "unit", include: ["src/**/*.test.ts", "util/*.test.ts"]}},

            // 실제 파일, Shiki 초기화, CLI 프로세스를 포함해 함수 검사보다 긴 시간 한도
            {extends: true, test: {name: "node", include: ["test/**/*.node.test.ts"], testTimeout: 30000}},
        ],
    },
});
