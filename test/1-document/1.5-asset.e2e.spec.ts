import {expect} from "@playwright/test";
import {test} from "@test/_fixture/docs";

/**
 * 그림 상자의 화면 폭별 크기(src/component/widget/article/_function/rehype-figures.ts, wg-article.css) 검증
 *
 *   - 공식 문서 Images의 너비 560 예시 SVG
 */
test.describe("문서 자원", () => {
    for (const layout of [
        {caseId: "AST-020", name: "휴대폰 390px 터치", options: {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}, scroll: true},
        {caseId: "AST-021", name: "데스크톱 1600px", options: {viewport: {width: 1600, height: 1000}}, scroll: false},
    ]) {
        test.describe(`레이아웃 ${layout.name}`, () => {
            test.use(layout.options);

            test(`[${layout.caseId}] SVG 그림은 적은 크기를 유지하고 본문보다 넓으면 가로로 스크롤한다`, {tag: "@mid"}, async ({page}) => {
                /**
                 * GIVEN
                 * 문단에 혼자 있는 너비 560 SVG의 Images 문서
                 */
                await page.goto("/images/");

                /**
                 * WHEN
                 * 그림과 그림 상자의 폭 조회
                 */
                const figure = page.locator(".wg_article__figure--svg").filter({has: page.getByRole("img", {name: "Selected state in a fictional book list", exact: true})});

                await expect(figure).toBeVisible();

                const size = await figure.evaluate((element) => ({
                    image: element.querySelector("img")?.getBoundingClientRect().width,
                    scroll: element.scrollWidth > element.clientWidth,
                }));

                /**
                 * THEN
                 * SVG에 적은 560px 그림, 휴대폰의 가로 스크롤과 데스크톱의 스크롤 없음, 키보드 포커스 가능한 그림 상자
                 */
                expect(size).toStrictEqual({image: 560, scroll: layout.scroll});
                await expect(figure).toHaveAttribute("tabindex", "0");
            });
        });
    }
});
