/**
 * 현재 문서 안 hash 이동을 일으키는 기본 클릭의 링크
 *
 *   - 보조키, 새 창, 다운로드, 다른 문서 링크는 없음
 */
export const findHashLink = (event: MouseEvent): HTMLAnchorElement | null => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return null;
    }

    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const sameDocumentHash =
        link instanceof HTMLAnchorElement &&
        (link.target === "" || link.target === "_self") &&
        !link.hasAttribute("download") &&
        link.origin === location.origin &&
        link.pathname === location.pathname &&
        link.search === location.search &&
        link.hash !== "";
    return sameDocumentHash ? link : null;
};
