/*
 * 브라우저 진입. 서버 자료 검증과 저장소 생성 후 공통 셸 컨트롤을 한 번 마운트
 */
import {createRoot} from "hono/jsx/dom/client";
import {WgShellControls} from "@/component/widget/shell-controls/wg-shell-controls";
import {navigationDataSchema} from "@/component/widget/sidebar/_constant/navigation-data-schema";
import {createNavigationStores} from "@/store/navigation/create-navigation-stores";

const root = document.querySelector<HTMLElement>("[data-shell-browser-root]");
const payload = document.getElementById("fh-navigation-data");

if (root !== null && payload !== null) {
    try {
        createRoot(root).render(
            <WgShellControls
                data={navigationDataSchema.parse(JSON.parse(payload.textContent))}
                stores={createNavigationStores({
                    session: () => {
                        return sessionStorage;
                    },
                })}
            />,
        );
    } catch (error) {
        // 초기화 오류에서도 서버의 링크, 본문과 네이티브 스크롤 유지
        console.error("for-humanity browser initialization failed", error);
    }
}
