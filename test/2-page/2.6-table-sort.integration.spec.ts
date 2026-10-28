import {expect} from "@playwright/test";
import {test} from "@test/_fixture/table-sort";

/**
 * 표 정렬 위젯(src/component/widget/table-sort/wg-table-sort.tsx) 검증. 갤러리에서 마운트한 위젯
 */
test.describe("표 정렬", () => {
    test.describe("수명", () => {
        test("[TBL-006] 위젯을 해제하면 정렬한 표가 쓴 순서와 머리글 글자로 돌아오고 다시 마운트하면 버튼이 붙는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 갤러리에서 마운트하고 한 열을 정렬한 표
             */
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.tableSortFixture.mount());

            const table = page.locator(".wg_article__table table").first();
            const names = table.locator("tbody td:nth-child(2)");

            await table.getByRole("button", {name: "Name"}).click();
            await expect(names).toHaveText(["Apple", "Apple", "Banana", "Cherry"]);

            /**
             * WHEN
             * 위젯 해제
             */
            await page.evaluate(() => window.tableSortFixture.unmount());

            /**
             * THEN
             * 버튼, 화살표, 정렬 상태 없이 쓴 순서. 다시 마운트하면 버튼
             */
            await expect(table.getByRole("button")).toHaveCount(0);
            await expect(table.locator(".wg_tableSort__arrow")).toHaveCount(0);
            await expect(table.locator("[aria-sort]")).toHaveCount(0);
            await expect(table.locator("th")).toHaveText(["Order", "Name", "Years", "Deadline"]);
            await expect(names).toHaveText(["Cherry", "Apple", "Banana", "Apple"]);

            await page.evaluate(() => window.tableSortFixture.mount());
            await expect(table.getByRole("button")).toHaveCount(4);

            await table.getByRole("button", {name: "Name"}).click();
            await expect(names).toHaveText(["Apple", "Apple", "Banana", "Cherry"]);
        });
    });
});
