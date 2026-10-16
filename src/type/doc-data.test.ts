import {describe, expect, test} from "vitest";
import {docDataSchema} from "@/type/doc-data";

describe("문서 메타", () => {
    test("묶음 이름은 공백을 정리하고 문장부호를 보존한다", () => {
        /**
         * WHEN
         * 단일 이름과 중첩 경로의 정규화
         */
        const result = [" Guide ", [" Projects ", "Example project", "Research"], "Research, decisions / notes"].map(
            (group) => docDataSchema.parse({name: "Guide", label: "Guide", group}).group,
        );

        /**
         * THEN
         * 원문 이름 단위의 경로
         */
        expect(result).toStrictEqual([["Guide"], ["Projects", "Example project", "Research"], ["Research, decisions / notes"]]);
    });

    test.each(["", " ", [], ["Projects", " "], ["Projects", 1], [["Projects"]], null].map((group) => ({group})))("잘못된 묶음 $group 입력은 거부한다", (scenario) => {
        /**
         * WHEN
         * 잘못된 묶음 입력의 검증
         */
        const result = docDataSchema.safeParse({name: "Guide", label: "Guide", group: scenario.group});

        /**
         * THEN
         * 메타 오류
         */
        expect(result.success).toBe(false);
    });

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
         * 선택 계약과 식별자 유지
         */
        expect(result).toStrictEqual({absent: undefined, present: "guide/settings"});
    });

    test.each(["", " ", null, 1, [], ["guide"]].map((parent) => ({parent})))("잘못된 부모 $parent 입력은 거부한다", (scenario) => {
        /**
         * WHEN
         * 잘못된 부모 입력의 검증
         */
        const result = docDataSchema.safeParse({name: "Child", label: "Child", group: "Guide", parent: scenario.parent});

        /**
         * THEN
         * 메타 오류
         */
        expect(result.success).toBe(false);
    });
});
