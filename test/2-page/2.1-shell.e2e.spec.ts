import {expect} from "@playwright/test";
import {test} from "@test/_fixture/dev";

/**
 * 페이지 셸의 head(src/component/widget/shell/wg-shell.tsx) 검증
 *
 *   - 설치 번들과 저장소 소스 개발의 같은 HTML 계약
 */
test.describe("페이지 셸", () => {
    for (const scenario of [
        {caseId: "SHL-006", name: "설치 번들의 head", source: false},
        {caseId: "SHL-007", name: "소스 개발의 head", source: true},
    ]) {
        test.describe(scenario.name, () => {
            const site = {
                title: 'Site </title><script id="injected">bad</script> &copy;',
                description: 'Description "><script id="injected">bad</script> &copy;',
            };

            test.use({source: scenario.source, site, javaScriptEnabled: false});

            test(`[${scenario.caseId}] JavaScript 없이 제목과 설명을 원문으로 표시하고 스타일을 적용한다`, {tag: "@high"}, async ({page, devSite}) => {
                /**
                 * GIVEN
                 * 태그와 엔티티 모양의 제목과 설명을 설정한 사이트, 스크립트를 끈 브라우저
                 */

                /**
                 * WHEN
                 * 서버가 만든 HTML을 브라우저로 파싱
                 */
                const response = await page.goto("/");

                /**
                 * THEN
                 * 태그와 엔티티 모양의 입력은 원문으로 표시, 초기 CSS와 글꼴 선언 유지
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
});
