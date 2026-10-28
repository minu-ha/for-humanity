/**
 * 머리글 버튼 안에 둘 수 없는 상호작용 요소
 */
const interactive_selector = "a, button, input, select, textarea, details, summary, label, [tabindex]";

/**
 * 머리글 정렬을 붙일 수 있는 표. 머리 행 하나, 본문 두 줄 이상, 같은 칸 수, 병합 칸과 머리글 링크 없음
 *
 *   - 본문 행을 통째로 옮기므로 병합 칸이 있으면 열이 어긋남
 *   - 머리글 안 링크는 버튼 안에 들어갈 수 없는 상호작용 요소
 */
export const isSortableTable = (table: HTMLTableElement): boolean => {
    const head = table.tHead?.rows.item(0) ?? null;
    const body = table.tBodies.item(0);

    if (head === null || table.tHead?.rows.length !== 1 || table.tBodies.length !== 1 || body === null || body.rows.length < 2) {
        return false;
    }

    const headers = [...head.cells];

    if (headers.length === 0 || headers.some((cell) => cell.tagName !== "TH" || cell.colSpan !== 1 || cell.rowSpan !== 1 || cell.querySelector(interactive_selector) !== null)) {
        return false;
    }

    return [...body.rows].every((row) => row.cells.length === headers.length && [...row.cells].every((cell) => cell.colSpan === 1 && cell.rowSpan === 1));
};
