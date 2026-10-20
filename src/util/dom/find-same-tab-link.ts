/**
 * 현재 탭에서 기본 이동을 일으키는 클릭의 링크
 *
 *   - 보조키, 보조 버튼, 새 창, 다운로드, 이미 취소한 클릭은 없음
 */
export const findSameTabLink = (event: MouseEvent): HTMLAnchorElement | null => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) {
        return null;
    }

    const link = event.target.closest("a[href]");

    return link instanceof HTMLAnchorElement && (link.target === "" || link.target === "_self") && !link.hasAttribute("download") ? link : null;
};
