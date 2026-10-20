import {flushSync} from "hono/jsx/dom";
import {createRoot} from "hono/jsx/dom/client";
import {WgMermaid} from "@/component/widget/mermaid/wg-mermaid";

let mounted: ReturnType<typeof createRoot>;

/**
 * 공개 번들 밖에서 소유 컴포넌트의 마운트와 해제만 노출
 */
window.diagramFixture = {
    mount: () => {
        mounted = createRoot(document.createElement("div"));
        flushSync(() => mounted.render(<WgMermaid />));
    },
    unmount: () => {
        flushSync(() => mounted.unmount());
    },
};
