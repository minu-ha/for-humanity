import {describe, expect, test} from "vitest";
import {docDataSchema} from "@/type/doc-data";

describe("문서 메타", () => {
    describe("묶음 이름", () => {
        test("묶음 이름은 공백을 정리하고 문장부호를 보존한다", () => {
            /**
             * GIVEN
             * 앞뒤 공백이 있는 단일 이름과 중첩 경로, 문장부호가 있는 이름
             */
            const groups = [" Guide ", [" Projects ", "Example project", "Research"], "Research, decisions / notes"];

            /**
             * WHEN
             * 단일 이름과 중첩 경로의 정규화
             */
            const result = groups.map((group) => docDataSchema.parse({name: "Guide", label: "Guide", group}).group);

            /**
             * THEN
             * 원문 이름 단위의 경로
             */
            expect(result).toStrictEqual([["Guide"], ["Projects", "Example project", "Research"], ["Research, decisions / notes"]]);
        });

        test.each(["", " ", [], ["Projects", " "], ["Projects", 1], [["Projects"]], null].map((group) => ({group})))("잘못된 묶음 $group 입력은 거부한다", (scenario) => {
            /**
             * GIVEN
             * 빈 값이나 문자열이 아닌 값이 섞인 묶음
             */

            /**
             * WHEN
             * 문서 메타 검증
             */
            const result = docDataSchema.safeParse({name: "Guide", label: "Guide", group: scenario.group});

            /**
             * THEN
             * 메타 오류
             */
            expect(result.success).toBe(false);
        });
    });

    describe("부모 식별자", () => {
        test("부모는 생략 가능하며 지정한 식별자의 공백을 정리한다", () => {
            /**
             * GIVEN
             * 필수 문서 메타
             */
            const data = {name: "Child", label: "Child", group: "Guide"};

            /**
             * WHEN
             * 부모 생략과 상대 식별자 지정
             */
            const result = {absent: docDataSchema.parse(data).parent, present: docDataSchema.parse({...data, parent: " guide/settings "}).parent};

            /**
             * THEN
             * 생략한 부모 없음과 공백을 정리한 식별자
             */
            expect(result).toStrictEqual({absent: undefined, present: "guide/settings"});
        });

        test.each(["", " ", null, 1, [], ["guide"]].map((parent) => ({parent})))("잘못된 부모 $parent 입력은 거부한다", (scenario) => {
            /**
             * GIVEN
             * 빈 값이나 문자열이 아닌 부모
             */

            /**
             * WHEN
             * 문서 메타 검증
             */
            const result = docDataSchema.safeParse({name: "Child", label: "Child", group: "Guide", parent: scenario.parent});

            /**
             * THEN
             * 메타 오류
             */
            expect(result.success).toBe(false);
        });
    });

    describe("작성 날짜", () => {
        test("날짜는 생략할 수 있고 달까지나 날까지 적은 값을 그대로 유지한다", () => {
            /**
             * GIVEN
             * 필수 문서 메타
             */
            const data = {name: "Post", label: "Post", group: "Posts"};

            /**
             * WHEN
             * 날짜 생략, 달까지 적은 날짜, 날까지 적은 윤년 날짜, 같은 달 안의 두 정밀도
             */
            const result = [
                docDataSchema.parse(data),
                docDataSchema.parse({...data, created: "2022-12", revised: "2026-10"}),
                docDataSchema.parse({...data, created: "2024-02-29"}),
                docDataSchema.parse({...data, created: "2026-10-05", revised: "2026-10"}),
            ].map((parsed) => ({created: parsed.created, revised: parsed.revised}));

            /**
             * THEN
             * 적은 그대로의 날짜 문자열
             */
            expect(result).toStrictEqual([
                {created: undefined, revised: undefined},
                {created: "2022-12", revised: "2026-10"},
                {created: "2024-02-29", revised: undefined},
                {created: "2026-10-05", revised: "2026-10"},
            ]);
        });

        test.each(["2026", "2026-13", "2026-1", "2026/10", "2026-02-30", "2026-10-05T10:00", 2026, null].map((created) => ({created})))(
            "잘못된 날짜 $created 입력은 거부한다",
            (scenario) => {
                /**
                 * GIVEN
                 * 형식이 다르거나 없는 날을 적은 날짜
                 */

                /**
                 * WHEN
                 * 문서 메타 검증
                 */
                const result = docDataSchema.safeParse({name: "Post", label: "Post", group: "Posts", created: scenario.created});

                /**
                 * THEN
                 * 항목 이름과 형식 안내가 붙은 메타 오류
                 */
                expect(result.error?.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`)).toStrictEqual(["created must be YYYY-MM or YYYY-MM-DD"]);
            },
        );

        test.each([
            {created: "2026-10", revised: "2026-09"},
            {created: "2026-10-05", revised: "2026-10-04"},
            {created: "2026-10-05", revised: "2026-09-30"},
        ])("다시 정리한 날짜 $revised 값이 처음 작성한 날짜보다 앞서면 거부한다", (scenario) => {
            /**
             * GIVEN
             * 처음 작성한 날짜보다 앞선 정리 날짜
             */

            /**
             * WHEN
             * 문서 메타 검증
             */
            const result = docDataSchema.safeParse({name: "Post", label: "Post", group: "Posts", ...scenario});

            /**
             * THEN
             * revised 항목의 순서 오류
             */
            expect(result.error?.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`)).toStrictEqual(["revised must not be earlier than created"]);
        });
    });
});
