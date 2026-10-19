import {describe, expect, expectTypeOf, test} from "vitest";
import {type SiteConfig, siteConfigSchema} from "@/type/site-config";

describe("사이트 설정", () => {
    test("설정을 생략하면 기본 이름과 포트와 탐색 순서를 적용한다", () => {
        /**
         * WHEN
         * 빈 공개 설정의 검증
         */
        const input = {} satisfies SiteConfig;
        const result = siteConfigSchema.parse(input);

        /**
         * THEN
         * 기본값 적용과 선택 주소 미생성
         */
        expect(result).toStrictEqual({
            content: {root: "content", public: "public", private: "private"},
            title: "for humanity",
            port: 4321,
            cursorFace: false,
            navigation: [],
            status: [
                {phrase: "확인됨", kind: "verified", date: true},
                {phrase: "확인되지 않았다", kind: "unverified"},
            ],
        });
        expectTypeOf<NonNullable<SiteConfig["navigation"]>[number]>().toEqualTypeOf<string | string[]>();
    });

    test.each([
        {url: "https://docs.example.org/", expected: "https://docs.example.org"},
        {url: "http://localhost:4321", expected: "http://localhost:4321"},
    ])("공개 주소 $url 입력은 루트 주소로 정규화한다", (scenario) => {
        /**
         * WHEN
         * 공개 주소 검증
         */
        const result = siteConfigSchema.parse({url: scenario.url});

        /**
         * THEN
         * 정규화한 사이트 주소
         */
        expect(result.url).toBe(scenario.expected);
    });

    test("공개 입력은 단일 묶음과 중첩 경로를 함께 허용한다", () => {
        /**
         * GIVEN
         * 기본값과 다른 포트와 명시적 커서 설정
         */
        const input = {port: 4322, cursorFace: true, navigation: [" Guide ", ["Projects", "Research"]], status: []} satisfies SiteConfig;

        /**
         * WHEN
         * 공개 입력의 정규화
         */
        const result = siteConfigSchema.parse(input);

        /**
         * THEN
         * 설정 값 유지와 탐색 경로 정규화
         */
        expect(result).toStrictEqual({
            content: {root: "content", public: "public", private: "private"},
            title: "for humanity",
            port: 4322,
            cursorFace: true,
            navigation: [["Guide"], ["Projects", "Research"]],
            status: [],
        });
    });

    test.each([
        {name: "0 포트", input: {port: 0}},
        {name: "포트 상한 초과", input: {port: 65536}},
        {name: "소수 포트", input: {port: 4321.5}},
        {name: "문자열 포트", input: {port: "4321"}},
        {name: "문자열 커서 설정", input: {cursorFace: "true"}},
        ...[
            "",
            "/",
            "file:///docs",
            "ftp://docs.example.org",
            "https://user:password@docs.example.org",
            "https://docs.example.org/docs/",
            "https://docs.example.org/?q=guide",
            "https://docs.example.org/#guide",
        ].map((url) => ({name: url, input: {url}})),
        {name: "중복 탐색 경로", input: {navigation: ["Guide", [" Guide "]]}},
        {name: "빈 탐색 경로", input: {navigation: [["Projects", ""]]}},
        {name: "빈 상태 문구", input: {status: [{phrase: " ", kind: "verified"}]}},
        {name: "지원하지 않는 상태", input: {status: [{phrase: "확인", kind: "unknown"}]}},
    ])("$name 입력은 거부한다", (scenario) => {
        /**
         * WHEN
         * 잘못된 외부 설정 검증
         */
        const result = siteConfigSchema.safeParse(scenario.input);

        /**
         * THEN
         * 설정 오류
         */
        expect(result.success).toBe(false);
    });
    test("문서 경로를 부분 지정하면 나머지는 기본 구조를 유지한다", () => {
        const result = siteConfigSchema.parse({content: {root: "knowledge", private: "internal"}});
        expect(result.content).toStrictEqual({root: "knowledge", public: "public", private: "internal"});
    });

    test.each([
        {root: "../outside"},
        {root: "/absolute"},
        {root: "C:\\content"},
        {public: "."},
        {public: ""},
        {public: "../outside"},
        {public: "dist"},
        {public: "same", private: "same"},
        {public: "guide", private: "guide/internal"},
        {public: "notes/public", private: "notes"},
        {public: "PUBLIC", private: "public"},
        {private: "node_modules"},
        {private: "folder/.git"},
        {public: "guide?draft"},
    ])("문서 범위를 모호하게 만드는 경로 %j는 거부한다", (content) => {
        expect(siteConfigSchema.safeParse({content}).success).toBe(false);
    });
});
