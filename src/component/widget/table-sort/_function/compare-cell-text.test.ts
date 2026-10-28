import {describe, expect, test} from "vitest";
import {toCellComparator} from "@/component/widget/table-sort/_function/compare-cell-text";

/**
 * 머리글 정렬의 칸 글 비교(src/component/widget/table-sort/_function/compare-cell-text.ts) 검증
 */
describe("표 정렬", () => {
    describe("칸 글 비교", () => {
        test("숫자가 든 글은 자릿수가 아니라 값 순서로 정렬한다", () => {
            /**
             * GIVEN
             * 순번과 단위가 섞인 칸 글
             */
            const compare = toCellComparator("ko");
            const texts = ["10", "2", "1", "3년 이상", "10년 이상"];

            /**
             * WHEN
             * 오름차순 정렬
             */
            const sorted = [...texts].sort((a, b) => compare(a, b));

            /**
             * THEN
             * 값 순서, 같은 수는 짧은 글 먼저
             */
            expect(sorted).toEqual(["1", "2", "3년 이상", "10", "10년 이상"]);
        });

        test("날짜는 오름차순과 내림차순으로 정렬한다", () => {
            /**
             * GIVEN
             * YYYY-MM-DD 칸 글
             */
            const compare = toCellComparator("ko");
            const texts = ["2027-10-22", "2026-10-29", "2026-11-01"];

            /**
             * WHEN
             * 두 방향 정렬
             */
            const ascending = [...texts].sort((a, b) => compare(a, b));
            const descending = [...texts].sort((a, b) => compare(a, b, true));

            /**
             * THEN
             * 이른 날짜 먼저, 내림차순은 그 반대
             */
            expect(ascending).toEqual(["2026-10-29", "2026-11-01", "2027-10-22"]);
            expect(descending).toEqual(["2027-10-22", "2026-11-01", "2026-10-29"]);
        });

        test.each([
            {direction: "오름차순", descending: false, expected: ["a", "b", "-", ""]},
            {direction: "내림차순", descending: true, expected: ["b", "a", "-", ""]},
        ])("빈 칸과 -는 $direction 에서도 쓴 순서대로 끝에 남는다", (scenario) => {
            /**
             * GIVEN
             * 빈 칸과 -가 섞인 칸 글
             */
            const compare = toCellComparator("ko");
            const texts = ["-", "b", "", "a"];

            /**
             * WHEN
             * 방향을 지정한 정렬
             */
            const sorted = [...texts].sort((a, b) => compare(a, b, scenario.descending));

            /**
             * THEN
             * 값이 있는 글 뒤에 빈 칸이 쓴 순서로
             */
            expect(sorted).toEqual(scenario.expected);
        });

        test("앞뒤 공백과 대소문자는 비교에서 제외한다", () => {
            /**
             * GIVEN
             * 공백과 대소문자가 다른 칸 글
             */
            const compare = toCellComparator("en");
            const texts = ["B", " a ", "A"];

            /**
             * WHEN
             * 오름차순 정렬
             */
            const sorted = [...texts].sort((a, b) => compare(a, b));

            /**
             * THEN
             * 글자 순서, 같은 글자는 쓴 순서
             */
            expect(sorted).toEqual([" a ", "A", "B"]);
        });

        test.each([{locale: ""}, {locale: "not a locale"}, {locale: undefined}])("언어 태그 $locale 는 기본 사전 순서로 대신한다", (scenario) => {
            /**
             * GIVEN
             * 비었거나 잘못된 언어 태그
             */
            const compare = toCellComparator(scenario.locale);

            /**
             * WHEN
             * 오름차순 정렬
             */
            const sorted = ["나", "b", "가", "a"].sort((a, b) => compare(a, b));

            /**
             * THEN
             * 오류 없이 사전 순서
             */
            expect(sorted).toEqual(["a", "b", "가", "나"]);
        });
    });
});
