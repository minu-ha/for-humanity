/*
 * 브라우저 진입 · 검증한 탐색 자료로 셸의 Hono JSX 컴포넌트만 마운트
 */
import {render} from "hono/jsx/dom";
import {navigationDataSchema} from "@/component/widget/navigation/_constant/navigation-data-schema";
import {WgShellBrowser} from "@/component/widget/shell/wg-shell-browser";
import {createNavigationStores} from "@/store/navigation/create-navigation-stores";

const root = document.querySelector<HTMLElement>("[data-shell-browser-root]");
const payload = document.getElementById("fh-navigation-data");

if (root !== null && payload !== null) {
    try {
        const value: unknown = JSON.parse(payload.textContent);
        const data = navigationDataSchema.parse(value);
        const stores = createNavigationStores({local: () => localStorage, session: () => sessionStorage});
        render(<WgShellBrowser data={data} stores={stores} reload={root.hasAttribute("data-shell-reload")} />, root);
    } catch (error) {
        // 초기화 오류에서도 서버의 링크·본문과 네이티브 스크롤 유지
        console.error("for-humanity browser initialization failed", error);
    }
}
