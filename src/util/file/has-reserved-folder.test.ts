import {describe, expect, test} from "vitest";
import {hasReservedFolder} from "@/util/file/has-reserved-folder";

describe("예약 폴더 판정", () => {
    test.each([
        {location: "public/dist/a.png", expected: true},
        {location: "public\\Node_Modules\\a.md", expected: true},
        {location: ".GIT/config", expected: true},
        {location: "public/distribution/a.png", expected: false},
        {location: "public/guide.md", expected: false},
    ])("$location 경로의 예약 폴더 판정은 $expected 값이다", (scenario) => {
        /**
         * WHEN
         * 상대 경로의 예약 폴더 판정
         */
        const result = hasReservedFolder(scenario.location);

        /**
         * THEN
         * 구분자와 대소문자를 무시한 폴더 이름 비교 결과
         */
        expect(result).toBe(scenario.expected);
    });
});
