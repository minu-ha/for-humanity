import {findSameTabLink} from "@/util/dom/find-same-tab-link";

/**
 * 현재 문서 안 해시 이동을 일으키는 기본 클릭의 링크
 *
 *   - 다른 문서, 해시 없는 링크는 없음
 */
export const findHashLink = (event: MouseEvent): HTMLAnchorElement | null => {
    const link = findSameTabLink(event);

    return link !== null && link.origin === location.origin && link.pathname === location.pathname && link.search === location.search && link.hash !== "" ? link : null;
};
