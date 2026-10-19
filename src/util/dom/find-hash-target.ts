import {toHashId} from "@/util/dom/to-hash-id";

/**
 * URL hash 대상 요소. 대상 id가 없으면 없음
 */
export const findHashTarget = (hash: string): HTMLElement | null => {
    const id = toHashId(hash);

    return id === undefined ? null : document.getElementById(id);
};
