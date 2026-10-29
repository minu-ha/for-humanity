import {describe, expect, test} from "vitest";
import {toPositions} from "@/component/widget/fx/_function/to-positions";

/**
 * 단계별 위치 표기(src/component/widget/fx/_function/to-positions.ts) 검증
 */
describe("단계별 위치", () => {
    test("세미콜론으로 이은 단계와 좌표를 차례로 읽는다", () => {
        expect(toPositions("1:0 0;4:120 40")).toEqual([
            {step: 1, x: 0, y: 0},
            {step: 4, x: 120, y: 40},
        ]);
    });

    test("음수와 소수 좌표를 읽는다", () => {
        expect(toPositions("2:-3.5 .5")).toEqual([{step: 2, x: -3.5, y: 0.5}]);
    });

    test("형식에 맞지 않는 조각은 뺀다", () => {
        expect(toPositions("1:1.2.3 0;2:5 5")).toEqual([{step: 2, x: 5, y: 5}]);
    });
});
