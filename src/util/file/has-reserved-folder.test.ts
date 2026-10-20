import {describe, expect, test} from "vitest";
import {hasReservedFolder} from "@/util/file/has-reserved-folder";

describe("예약 폴더 판정", () => {
    test.each([
        {location: "public/dist/a.png", expected: true},
        {location: "public\\Node_Modules\\a.md", expected: true},
        {location: ".GIT/config", expected: true},
        {location: "public/distribution/a.png", expected: false},
        {location: "public/guide.md", expected: false},
    ])("$location 경로는 예약 폴더 여부 $expected 값을 반환한다", (scenario) => {
        /**
         * WHEN / THEN
         * 구분자와 대소문자를 무시한 폴더 이름 비교
         */
        expect(hasReservedFolder(scenario.location)).toBe(scenario.expected);
    });
});
