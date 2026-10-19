import {describe, expect, test} from "vitest";
import {toChangeQueue} from "@/util/async/to-change-queue";

describe("변경 처리 큐", () => {
    test("실행 중 들어온 변경은 최신 값으로 합치고 동시에 실행하지 않는다", async () => {
        /**
         * GIVEN
         * 완료를 제어할 수 있는 첫 작업
         */
        const gate = Promise.withResolvers<void>();
        const renders: number[] = [];
        const concurrency: number[] = [];
        const errors: unknown[] = [];
        let version = 1;
        let running = 0;

        const queue = toChangeQueue({
            run: async () => {
                running += 1;
                concurrency.push(running);

                const current = version;

                if (current === 1) {
                    await gate.promise;
                }

                renders.push(current);
                running -= 1;
            },
            onError: (error) => {
                return errors.push(error);
            },
        });

        /**
         * WHEN
         * 첫 작업이 진행 중인 상태에서 연속 변경 후 완료
         */
        const first = queue();

        for (const next of [2, 3, 4, 5]) {
            version = next;
            await queue();
        }

        gate.resolve();
        await first;

        /**
         * THEN
         * 첫 값과 최신 값만 순차 처리
         */
        expect(renders).toStrictEqual([1, 5]);
        expect(concurrency).toStrictEqual([1, 1]);
        expect(errors).toStrictEqual([]);
    });

    test("실패한 작업 뒤에도 대기 중 변경과 다음 변경을 처리한다", async () => {
        /**
         * GIVEN
         * 완료 시 실패하는 첫 작업
         */
        const gate = Promise.withResolvers<void>();
        const errors: unknown[] = [];
        const renders: number[] = [];
        const failure = new Error("Invalid source");
        let version = 1;

        const queue = toChangeQueue({
            run: async () => {
                const current = version;

                if (current === 1) {
                    await gate.promise;

                    throw failure;
                }

                renders.push(current);
            },
            onError: (error) => {
                return errors.push(error);
            },
        });

        /**
         * WHEN
         * 실패 전 예약과 실패 후 추가 변경
         */
        const first = queue();

        version = 2;
        await queue();
        gate.resolve();
        await first;
        version = 3;
        await queue();

        /**
         * THEN
         * 정확한 원인 전달과 후속 변경 유지
         */
        expect(renders).toStrictEqual([2, 3]);
        expect(errors).toStrictEqual([failure]);
    });
});
