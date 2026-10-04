/*
 * 브라우저 진입 · 서버 자료 검증과 저장소 생성 후 공통 셸 컨트롤을 한 번 마운트
 */
import {createRoot} from "hono/jsx/dom/client";
import {navigationDataSchema} from "@/component/widget/navigation/_constant/navigation-data-schema";
import {WgShellControls} from "@/component/widget/shell-controls/wg-shell-controls";
import {createNavigationStores} from "@/store/navigation/create-navigation-stores";

const root = document.querySelector<HTMLElement>("[data-shell-browser-root]");
const payload = document.getElementById("fh-navigation-data");

if (root !== null && payload !== null) {
    try {
        const value: unknown = JSON.parse(payload.textContent);
        const data = navigationDataSchema.parse(value);
        const stores = createNavigationStores({local: () => localStorage, session: () => sessionStorage});
        createRoot(root).render(<WgShellControls data={data} stores={stores} reload={root.hasAttribute("data-shell-reload")} />);
    } catch (error) {
        // 초기화 오류에서도 서버의 링크·본문과 네이티브 스크롤 유지
        console.error("for-humanity browser initialization failed", error);
    }
}
