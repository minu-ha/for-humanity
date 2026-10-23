import {describe, expect, test} from "vitest";
import {initContentSchema, initInputSchema, initWorkerNameSchema} from "@/entry/init/_type/init-input";

describe("초기화 입력 경계", () => {
    test("생략한 옵션은 기본값으로 바뀌지 않고 대화형 질문에 남는다", () => {
        // biome-ignore lint/style/useNamingConvention: Citty의 위치 인자 계약
        const input = initInputSchema.parse({_: [], dir: ".", yes: false});

        expect(input.content).toBeUndefined();
        expect(input.lang).toBeUndefined();
        expect(input.deploy).toBeUndefined();
    });

    test("잘못된 문서 경로는 예외 대신 실패 결과로 다시 물을 수 있다", () => {
        expect(initContentSchema.safeParse("../outside").success).toBe(false);
        expect(initContentSchema.safeParse("knowledge/team")).toMatchObject({success: true, data: "knowledge/team"});
    });

    test.each(["Team docs", "한글", "../outside", "-docs", "docs-", "a".repeat(64)])("Worker 이름 %s는 배포 이름으로 거부한다", (name) => {
        expect(initWorkerNameSchema.safeParse(name).success).toBe(false);
    });
});
