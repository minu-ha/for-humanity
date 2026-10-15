import {flushSync} from "hono/jsx/dom";
import {createRoot} from "hono/jsx/dom/client";
import {navigationDataSchema} from "@/component/widget/navigation/_constant/navigation-data-schema";
import {WgShellControls} from "@/component/widget/shell-controls/wg-shell-controls";
import {createNavigationStores} from "@/store/navigation/create-navigation-stores";

const root = document.querySelector<HTMLElement>("[data-shell-browser-root]");
const data = document.getElementById("fh-navigation-data");
if (root === null || data === null) throw new Error("셸 테스트의 초기 마크업이 없습니다");
const navigation = navigationDataSchema.parse(JSON.parse(data.textContent));
const stores = createNavigationStores({session: () => sessionStorage});

/**
 * 실제 셸 소유자의 마운트와 해제, 공개 번들에 미포함
 */
window.shellFixture = {
    mount: () => {
        const shell = createRoot(root);
        shell.render(<WgShellControls data={navigation} stores={stores} reload={true} />);
        window.shellFixture.unmount = () => flushSync(() => shell.unmount());
    },
    unmount: () => {},
};
