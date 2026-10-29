import {describe, expect, test} from "vitest";
import {toSteps} from "@/component/widget/fx/_function/to-steps";

/**
 * 단계 범위 표기(src/component/widget/fx/_function/to-steps.ts) 검증
 */
describe("단계 범위", () => {
    test("하나, 구간, 끝까지, 처음부터 표기를 공백으로 이어 쓴다", () => {
        expect([...toSteps("3", 5)]).toEqual([3]);
        expect([...toSteps("2-4", 5)]).toEqual([2, 3, 4]);
        expect([...toSteps("4-", 5)]).toEqual([4, 5]);
        expect([...toSteps("-2", 5)]).toEqual([1, 2]);
        expect(toSteps("1 3-4 -1", 5)).toEqual(new Set([1, 3, 4]));
        expect(toSteps("2-9", 5)).toEqual(new Set([2, 3, 4, 5]));
    });

    test("빈 표기와 숫자가 아닌 조각은 단계를 켜지 않는다", () => {
        expect(toSteps("", 5).size).toBe(0);
        expect(toSteps("  ", 5).size).toBe(0);
        expect(toSteps("a 2 0x3 1.5", 5)).toEqual(new Set([2]));
    });
});
