import {describe, expect, expectTypeOf, test} from "vitest";
import {type SiteConfig, siteConfigSchema} from "@/type/site-config";

describe("사이트 설정", () => {
    describe("기본값과 공개 입력", () => {
        test("상태 이미지는 공개 설정에서 SVG 경로를 받고 영상 형식은 거부한다", () => {
            /**
             * GIVEN
             * 교체할 상태 이미지의 문서 루트 기준 경로
             */
            const input = {statusImage: "asset/face.svg"} satisfies SiteConfig;

            /**
             * WHEN
             * 공개 설정과 지원하지 않는 이미지 형식 검증
             */
            const result = siteConfigSchema.parse(input);
            const invalid = siteConfigSchema.safeParse({statusImage: "asset/face.mov"});

            /**
             * THEN
             * 이미지 경로 보존과 형식 오류
             */
            expect(result.statusImage).toBe("asset/face.svg");
            expect(invalid.success).toBe(false);
        });

        test("설정을 생략하면 기본 이름, 포트, 탐색 순서를 적용한다", () => {
            /**
             * GIVEN
             * 빈 공개 설정
             */
            const input = {} satisfies SiteConfig;

            /**
             * WHEN
             * 공개 설정 검증
             */
            const result = siteConfigSchema.parse(input);

            /**
             * THEN
             * 기본값 적용과 선택 주소 미생성
             */
            expect(result).toStrictEqual({
                content: {root: "content", public: "public", private: "private"},
                title: "for humanity",
                lang: "ko",
                basePath: "/",
                port: 4321,
                host: "localhost",
                cursorFace: false,
                navigation: [],
                status: [
                    {phrase: "확인됨", kind: "verified", date: true},
                    {phrase: "확인되지 않았다", kind: "unverified"},
                ],
            });
        });

        test.each([
            {url: "https://docs.example.org/", expected: "https://docs.example.org"},
            {url: "http://localhost:4321", expected: "http://localhost:4321"},
        ])("공개 주소 $url 입력은 루트 주소로 정규화한다", (scenario) => {
            /**
             * GIVEN
             * 끝 슬래시나 포트가 있는 공개 주소
             */

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
             * 단일 묶음과 중첩 경로를 섞은 탐색, 기본값과 다른 포트와 커서 설정
             */
            const input = {port: 4322, cursorFace: true, navigation: [" Guide ", ["Projects", "Research"]], status: []} satisfies SiteConfig;

            /**
             * WHEN
             * 공개 입력의 정규화
             */
            const result = siteConfigSchema.parse(input);

            /**
             * THEN
             * 설정 값 유지, 탐색 경로 정규화, 탐색 항목 타입
             */
            expect(result).toStrictEqual({
                content: {root: "content", public: "public", private: "private"},
                title: "for humanity",
                lang: "ko",
                basePath: "/",
                port: 4322,
                host: "localhost",
                cursorFace: true,
                navigation: [["Guide"], ["Projects", "Research"]],
                status: [],
            });

            expectTypeOf<NonNullable<SiteConfig["navigation"]>[number]>().toEqualTypeOf<string | string[]>();
        });

        test.each([
            {input: "/", expected: "/"},
            {input: "/agent-conventions", expected: "/agent-conventions/"},
            {input: "/uoo/", expected: "/uoo/"},
            {input: "/projects/docs.v2/", expected: "/projects/docs.v2/"},
        ])("배포 경로 $input 입력은 끝 슬래시를 포함한다", (scenario) => {
            expect(siteConfigSchema.parse({basePath: scenario.input}).basePath).toBe(scenario.expected);
        });

        test.each(["", "docs", "//example.org/", "/docs//guide/", "/./", "/docs/../", "/docs?x=1", "/docs#top", "/docs\\guide", "/%2e%2e/", "/docs path/"])(
            "잘못된 배포 경로 %s는 거부한다",
            (basePath) => {
                expect(siteConfigSchema.safeParse({basePath}).success).toBe(false);
            },
        );

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
            ].map((url) => ({name: `공개 주소 "${url}"`, input: {url}})),
            {name: "언어 태그가 아닌 lang", input: {lang: "Korean language"}},
            {name: "미리보기 서비스가 표시하지 않는 SVG image", input: {image: "asset/preview.svg"}},
            {name: "중복 탐색 경로", input: {navigation: ["Guide", [" Guide "]]}},
            {name: "빈 탐색 경로", input: {navigation: [["Projects", ""]]}},
            {name: "빈 상태 문구", input: {status: [{phrase: " ", kind: "verified"}]}},
            {name: "지원하지 않는 상태", input: {status: [{phrase: "확인", kind: "unknown"}]}},
        ])("$name 입력은 거부한다", (scenario) => {
            /**
             * GIVEN
             * 범위를 벗어나거나 형식이 잘못된 외부 설정
             */

            /**
             * WHEN
             * 외부 설정 검증
             */
            const result = siteConfigSchema.safeParse(scenario.input);

            /**
             * THEN
             * 설정 오류
             */
            expect(result.success).toBe(false);
        });
    });

    describe("문서 경로", () => {
        test("문서 경로를 부분 지정하면 나머지는 기본 구조를 유지한다", () => {
            /**
             * GIVEN
             * 루트와 내부 폴더만 지정한 문서 경로
             */
            const input = {content: {root: "knowledge", private: "internal"}};

            /**
             * WHEN
             * 문서 경로 설정 검증
             */
            const result = siteConfigSchema.parse(input);

            /**
             * THEN
             * 지정한 값과 기본 공개 폴더 유지
             */
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
            /**
             * GIVEN
             * 모호하거나 허용 범위를 벗어난 문서 경로
             */

            /**
             * WHEN
             * 문서 경로 설정 검증
             */
            const result = siteConfigSchema.safeParse({content});

            /**
             * THEN
             * 외부 경로, 예약 경로, 중첩된 수집 범위 거부
             */
            expect(result.success).toBe(false);
        });
    });

    describe("서버 수신 주소", () => {
        test.each([true, false, "0.0.0.0", "127.0.0.1", "::1", "localhost", "dev.example.test"])("host %s 입력은 수신 설정으로 보존한다", (host) => {
            /**
             * GIVEN
             * LAN 전체, 루프백과 특정 주소 입력
             */
            const input = {host} satisfies SiteConfig;

            /**
             * WHEN
             * 공개 사이트 설정 검증
             */
            const result = siteConfigSchema.parse(input);

            /**
             * THEN
             * 지정한 수신 주소 보존
             */
            expect(result.host).toBe(host);
        });

        test.each(["", "   ", "http://localhost", "localhost:9999", "/tmp/server.sock", 9999])("host %s 입력은 잘못된 주소로 거부한다", (host) => {
            /**
             * GIVEN
             * 주소 이외의 형식과 포트를 섞은 수신 설정
             */
            const input = {host};

            /**
             * WHEN
             * 외부 설정 입력 검증
             */
            const result = siteConfigSchema.safeParse(input);

            /**
             * THEN
             * 서버 시작 전 입력 거부
             */
            expect(result.success).toBe(false);
        });
    });
});
