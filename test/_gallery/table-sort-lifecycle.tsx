import {flushSync} from "hono/jsx/dom";
import {createRoot} from "hono/jsx/dom/client";
import {WgTableSort} from "@/component/widget/table-sort/wg-table-sort";

let mounted: ReturnType<typeof createRoot>;

/**
 * 공개 번들 밖에서 표 정렬 위젯의 마운트와 해제만 노출
 */
window.tableSortFixture = {
    mount: () => {
        mounted = createRoot(document.createElement("div"));
        flushSync(() => mounted.render(<WgTableSort />));
    },
    unmount: () => {
        flushSync(() => mounted.unmount());
    },
};
