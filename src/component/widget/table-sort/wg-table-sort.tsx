import {useLayoutEffect} from "hono/jsx";
import {toCellComparator} from "@/component/widget/table-sort/_function/compare-cell-text";
import {isSortableTable} from "@/component/widget/table-sort/_function/is-sortable-table";
import "./wg-table-sort.css";

/**
 * 머리글의 정렬 상태. th의 aria-sort 값과 같음
 */
type SortDirection = "none" | "ascending" | "descending";

/**
 * 누를 때마다 도는 다음 상태. 오름차순, 내림차순, 쓴 순서
 */
const next_direction: Record<SortDirection, SortDirection> = {none: "ascending", ascending: "descending", descending: "none"};

/**
 * 화살표 SVG의 이름공간
 */
const svg_namespace = "http://www.w3.org/2000/svg";

/**
 * 아래를 가리키는 꺾쇠. 그림 가운데가 회전 중심이라 오름차순은 CSS가 180도 돌림
 */
const arrow_path = "M2.5 3.5 L5 6 L7.5 3.5";

/**
 * aria-sort 값의 상태. 알 수 없는 값은 none
 */
const toDirection = (value: string | null): SortDirection => {
    return value === "ascending" || value === "descending" ? value : "none";
};

/**
 * 머리글 오른쪽 끝의 화살표. 글자색의 가는 선, 끝과 꺾인 곳만 둥글게
 */
const toArrow = () => {
    const arrow = document.createElementNS(svg_namespace, "svg");
    const path = document.createElementNS(svg_namespace, "path");

    arrow.setAttribute("class", "wg_tableSort__arrow");
    arrow.setAttribute("viewBox", "0 0 10 10");
    arrow.setAttribute("aria-hidden", "true");
    path.setAttribute("d", arrow_path);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    arrow.append(path);

    return arrow;
};

/**
 * 서버 본문의 표에 머리글 정렬 버튼. 셸과 본문 DOM 교체 미포함
 *
 *   - 머리 행 하나와 본문 두 줄 이상, 병합 칸이 없는 표만 대상. 조건은 isSortableTable
 *   - 한 번에 한 열만 정렬. 세 번째 누름은 쓴 순서로 되돌림
 *   - 스크립트가 없으면 쓴 순서의 표 유지
 */
export const WgTableSort = () => {
    /**
     * 본문 파싱 후 조건에 맞는 표마다 머리글을 버튼으로 감쌈. 해제에서 쓴 순서와 머리글 글자 복원
     */
    useLayoutEffect(() => {
        const lifetime = new AbortController();
        const compare = toCellComparator(document.documentElement.lang);

        /**
         * 버튼을 단 표와 쓴 순서의 본문 행. 되돌리기와 해제의 기준
         */
        const owned = new Map<HTMLTableElement, HTMLTableRowElement[]>();

        /**
         * 머리글 상태 표시. th의 aria-sort와 버튼의 수정자 class
         */
        const setDirection = (header: HTMLTableCellElement, direction: SortDirection) => {
            const button = header.querySelector(".wg_tableSort__button");

            header.setAttribute("aria-sort", direction);
            button?.classList.toggle("wg_tableSort__button--ascending", direction === "ascending");
            button?.classList.toggle("wg_tableSort__button--descending", direction === "descending");
        };

        /**
         * 쓴 순서에서 다시 정렬해 같은 값의 행은 쓴 순서 유지
         */
        const sortRows = (table: HTMLTableElement, index: number, direction: SortDirection) => {
            const rows = owned.get(table);
            const body = table.tBodies.item(0);

            if (rows === undefined || body === null) {
                return;
            }

            if (direction === "none") {
                body.append(...rows);

                return;
            }

            const keyed = rows.map((row) => ({row, text: row.cells.item(index)?.textContent}));

            keyed.sort((a, b) => compare(a.text, b.text, direction === "descending"));
            body.append(...keyed.map((entry) => entry.row));
        };

        /**
         * 머리글 버튼 누름. 누른 열은 다음 상태, 다른 열은 해제
         */
        const handleClick = (event: MouseEvent) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const header = event.target.closest(".wg_tableSort__button")?.closest("th") ?? null;
            const row = header?.closest("tr") ?? null;
            const table = header?.closest("table") ?? null;

            if (header === null || row === null || table === null || !owned.has(table)) {
                return;
            }

            const direction = next_direction[toDirection(header.getAttribute("aria-sort"))];

            for (const cell of row.cells) {
                setDirection(cell, cell === header ? direction : "none");
            }

            sortRows(table, header.cellIndex, direction);
        };

        /**
         * 조건에 맞는 표의 머리글 글자를 버튼 안으로 옮기고 오른쪽 끝에 화살표를 더함. 이미 단 표 제외
         */
        const enhance = () => {
            for (const table of document.querySelectorAll<HTMLTableElement>(".wg_article__table > table")) {
                const head = table.tHead?.rows.item(0);
                const body = table.tBodies.item(0);

                if (owned.has(table) || head === null || head === undefined || body === null || !isSortableTable(table)) {
                    continue;
                }

                owned.set(table, [...body.rows]);

                for (const header of head.cells) {
                    const button = document.createElement("button");

                    button.type = "button";
                    button.className = "wg_tableSort__button";
                    button.append(...header.childNodes, toArrow());
                    header.append(button);
                    setDirection(header, "none");
                }
            }
        };

        document.addEventListener("click", handleClick, {signal: lifetime.signal});

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", enhance, {once: true, signal: lifetime.signal});
        } else {
            enhance();
        }

        return () => {
            lifetime.abort();

            for (const [table, rows] of owned) {
                const head = table.tHead?.rows.item(0);

                table.tBodies.item(0)?.append(...rows);

                for (const header of head === null || head === undefined ? [] : head.cells) {
                    const button = header.querySelector(".wg_tableSort__button");

                    header.querySelector(".wg_tableSort__arrow")?.remove();
                    button?.replaceWith(...button.childNodes);
                    header.removeAttribute("aria-sort");
                }
            }

            owned.clear();
        };
    }, []);

    return null;
};
