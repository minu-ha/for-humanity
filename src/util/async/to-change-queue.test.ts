import assert from "node:assert/strict";
import {test} from "node:test";
import {toChangeQueue} from "@/util/async/to-change-queue";

test("coalesces changes during an active render and never overlaps work", async () => {
    const gate = Promise.withResolvers<void>();
    const renders: number[] = [];
    const errors: unknown[] = [];
    let version = 1;
    let running = 0;
    const queue = toChangeQueue({
        run: async () => {
            running += 1;
            assert.equal(running, 1);
            const current = version;
            if (current === 1) await gate.promise;
            renders.push(current);
            running -= 1;
        },
        onError: (error) => errors.push(error),
    });
    const first = queue();
    for (const next of [2, 3, 4, 5]) {
        version = next;
        await queue();
    }
    gate.resolve();
    await first;
    assert.deepEqual(renders, [1, 5]);
    assert.deepEqual(errors, []);
});

test("a failed render does not lose a queued recovery or block later edits", async () => {
    const gate = Promise.withResolvers<void>();
    const errors: unknown[] = [];
    const renders: number[] = [];
    let version = 1;
    const queue = toChangeQueue({
        run: async () => {
            const current = version;
            if (current === 1) {
                await gate.promise;
                throw new Error("Invalid source");
            }
            renders.push(current);
        },
        onError: (error) => errors.push(error),
    });
    const first = queue();
    version = 2;
    await queue();
    gate.resolve();
    await first;
    version = 3;
    await queue();
    assert.deepEqual(renders, [2, 3]);
    assert.equal(errors.length, 1);
});
