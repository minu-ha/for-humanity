import {defineConfig} from "@playwright/test";

export default defineConfig({
    testDir: "./test",
    testMatch: "**/*.spec.ts",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: 0,
    workers: 2,
    timeout: 30000,
    expect: {timeout: 10000},
    outputDir: ".cache/playwright/results",
    reporter: [[process.env.CI ? "github" : "list"], ["html", {outputFolder: ".cache/playwright/report", open: "never"}]],
    use: {
        browserName: "chromium",
        channel: process.env.FH_TEST_BROWSER_CHANNEL,
        viewport: {width: 1600, height: 1000},
        colorScheme: "light",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
});
