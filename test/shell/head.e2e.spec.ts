import {expect} from "@playwright/test";
import {test} from "@test/_fixture/dev";

for (const source of [false, true]) {
    test.describe(source ? "소스 개발의 head" : "설치 번들의 head", () => {
        const site = {
            title: 'Site </title><script id="injected">bad</script> &copy;',
            description: 'Description "><script id="injected">bad</script> &copy;',
        };
        test.use({source, site, javaScriptEnabled: false});

        test("[HEAD-001] JavaScript 없이 제목·설명을 원문으로 표시하고 스타일을 적용한다", {tag: "@high"}, async ({page, devSite}) => {
            /**
             * WHEN
             * 서버가 만든 HTML을 브라우저로 파싱
             */
            const response = await page.goto("/");

            /**
             * THEN
             * 태그·엔티티 모양의 입력은 텍스트, 초기 CSS와 글꼴 선언은 유지
             */
            expect(response?.status()).toBe(200);
            await expect(page).toHaveTitle(site.title);
            await expect(page.locator('head meta[name="description"]')).toHaveAttribute("content", site.description);
            await expect(page.locator("script#injected")).toHaveCount(0);
            await expect(page.locator('head meta[charset="utf-8"]')).toHaveCount(1);
            await expect(page.locator('head meta[name="viewport"]')).toHaveCount(1);
            await expect(page.locator('head link[rel="preload"][as="font"]').first()).toHaveAttribute("crossorigin", "");
            await expect(page.locator("body")).toHaveCSS("display", "grid");
            expect(devSite.errors).toStrictEqual([]);
        });
    });
}
