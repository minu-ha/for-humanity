import {expect} from "@playwright/test";
import {test} from "@test/_fixture/table-sort";

/**
 * 표 정렬(src/component/widget/table-sort) 검증. 실제 CLI 빌드 결과
 */
test.describe("표 정렬", () => {
    test.describe("머리글 누름", () => {
        test("[TBL-001] 머리글을 누를 때마다 오름차순, 내림차순, 쓴 순서를 돌고 화살표는 위, 아래, 숨김이 된다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 숫자와 글자가 섞인 열이 있는 빌드한 표
             */
            await page.goto("/table/");

            const table = page.locator(".wg_article__table table").first();
            const header = table.locator("th").nth(2);
            const button = table.getByRole("button", {name: "Years"});
            const arrow = header.locator(".wg_tableSort__arrow");
            const column = table.locator("tbody td:nth-child(3)");

            await expect(header).toHaveAttribute("aria-sort", "none");
            await expect(arrow).toHaveCSS("opacity", "0");
            await expect(column).toHaveText(["10", "2", "3년 이상", "2"]);

            /**
             * WHEN
             * 같은 머리글을 세 번 누름
             */
            await button.click();

            /**
             * THEN
             * 값 순서의 오름차순과 위 화살표, 내림차순과 아래 화살표, 쓴 순서와 숨긴 화살표
             */
            await expect(header).toHaveAttribute("aria-sort", "ascending");
            await expect(column).toHaveText(["2", "2", "3년 이상", "10"]);
            await expect(arrow).toHaveCSS("opacity", "1");
            await expect(arrow).toHaveCSS("transform", /^matrix\(-1, .*, -1, 0, 0\)$/);

            await button.click();
            await expect(header).toHaveAttribute("aria-sort", "descending");
            await expect(column).toHaveText(["10", "3년 이상", "2", "2"]);
            await expect(arrow).toHaveCSS("opacity", "1");
            await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

            await button.click();
            await page.mouse.move(0, 0);
            await expect(header).toHaveAttribute("aria-sort", "none");
            await expect(column).toHaveText(["10", "2", "3년 이상", "2"]);
            await expect(arrow).toHaveCSS("opacity", "0");
        });

        test("[TBL-002] 빈 칸은 방향과 관계없이 끝에 남고 다른 열을 누르면 앞 열의 상태가 풀린다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * -가 든 날짜 열과 같은 이름이 둘인 글자 열
             */
            await page.goto("/table/");

            const table = page.locator(".wg_article__table table").first();
            const deadline = table.locator("th").nth(3);
            const name = table.locator("th").nth(1);
            const orders = table.locator("tbody td:nth-child(1)");
            const deadlines = table.locator("tbody td:nth-child(4)");
            const names = table.locator("tbody td:nth-child(2)");

            /**
             * WHEN
             * 날짜 열을 두 번 누른 뒤 글자 열을 누름
             */
            await table.getByRole("button", {name: "Deadline"}).click();
            await expect(deadlines).toHaveText(["2026-10-29", "2026-11-01", "2027-10-22", "-"]);

            await table.getByRole("button", {name: "Deadline"}).click();
            await expect(deadlines).toHaveText(["2027-10-22", "2026-11-01", "2026-10-29", "-"]);

            await table.getByRole("button", {name: "Name"}).click();

            /**
             * THEN
             * 글자 열만 오름차순이고 같은 이름은 쓴 순서, 날짜 열은 해제
             */
            await expect(name).toHaveAttribute("aria-sort", "ascending");
            await expect(deadline).toHaveAttribute("aria-sort", "none");
            await expect(names).toHaveText(["Apple", "Apple", "Banana", "Cherry"]);
            await expect(orders).toHaveText(["2", "4", "3", "1"]);
            await expect(table.locator('[aria-sort="ascending"]')).toHaveCount(1);
            await expect(table.locator(".wg_tableSort__button--descending")).toHaveCount(0);
        });

        test("[TBL-003] 키보드로 머리글에 들어가 Enter로 정렬하고 포커스를 유지한다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 순번 열의 머리글 버튼에 포커스
             */
            await page.goto("/table/");

            const table = page.locator(".wg_article__table table").first();
            const button = table.getByRole("button", {name: "Order"});
            const column = table.locator("tbody td:nth-child(1)");

            await button.focus();

            /**
             * WHEN
             * Enter 두 번
             */
            await page.keyboard.press("Enter");
            await page.keyboard.press("Enter");

            /**
             * THEN
             * 내림차순, 포커스는 같은 버튼
             */
            await expect(table.locator("th").first()).toHaveAttribute("aria-sort", "descending");
            await expect(column).toHaveText(["4", "3", "2", "1"]);
            await expect(button).toBeFocused();
        });
    });

    test.describe("대상 표", () => {
        test("[TBL-004] 본문 한 줄, 머리글 링크, 머리 행 없음, 병합 칸인 표에는 버튼을 달지 않는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 정렬 대상 표 하나와 대상이 아닌 표 넷
             */
            await page.goto("/table/");

            /**
             * WHEN
             * 머리글 버튼 조회
             */
            await expect(page.locator(".wg_article__table")).toHaveCount(5);

            /**
             * THEN
             * 첫 표의 열 수만큼만 버튼과 화살표, 머리글 링크는 링크 유지
             */
            await expect(page.locator(".wg_article__table").getByRole("button")).toHaveCount(4);
            await expect(page.locator(".wg_article__table").first().getByRole("button")).toHaveCount(4);
            await expect(page.locator(".wg_article__table th a")).toHaveCount(1);
            await expect(page.locator("[aria-sort]")).toHaveCount(4);
            await expect(page.locator(".wg_tableSort__arrow")).toHaveCount(4);
        });
    });

    test.describe("스크립트 없음", () => {
        test.use({javaScriptEnabled: false});

        test("[TBL-005] 스크립트가 없으면 쓴 순서의 표와 머리글 글자만 남는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 스크립트를 끈 브라우저
             */
            await page.goto("/table/");

            const table = page.locator(".wg_article__table table").first();

            /**
             * WHEN
             * 표 조회
             */
            await expect(table).toBeVisible();

            /**
             * THEN
             * 버튼과 정렬 상태 없이 쓴 순서
             */
            await expect(table.getByRole("button")).toHaveCount(0);
            await expect(table.locator("[aria-sort]")).toHaveCount(0);
            await expect(table.locator("th")).toHaveText(["Order", "Name", "Years", "Deadline"]);
            await expect(table.locator("tbody td:nth-child(2)")).toHaveText(["Cherry", "Apple", "Banana", "Apple"]);
        });
    });
});
