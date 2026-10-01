import {findHashTarget} from "@/util/dom/find-hash-target";

/**
 * 접힌 내용의 hash 대상과 상위 Details 공개
 * 초기 접속·문서 안 링크·hash 변경에 동일 적용
 */
export const revealHashTarget = (hash: string): HTMLElement | null => {
    const target = findHashTarget(hash);

    for (let fold = target?.closest("details"); fold; fold = fold.parentElement?.closest("details")) {
        fold.open = true;
    }

    return target;
};
