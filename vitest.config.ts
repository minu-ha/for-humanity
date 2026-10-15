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
        include: ["src/**/*.test.ts", "test/**/*.test.ts", "util/*.test.ts"],
        testTimeout: 15000,
        restoreMocks: true,
        clearMocks: true,
    },
});
