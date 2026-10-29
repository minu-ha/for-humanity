import {flushSync} from "hono/jsx/dom";
import {createRoot} from "hono/jsx/dom/client";
import {WgFx} from "@/component/widget/fx/wg-fx";

let mounted: ReturnType<typeof createRoot>;

window.fxEnhanced = 0;

/**
 * 공개 번들 밖에서 그림 위젯의 마운트와 해제만 노출. onEnhanced 호출은 fxEnhanced에 셈
 */
window.fxFixture = {
    mount: () => {
        mounted = createRoot(document.createElement("div"));
        flushSync(() =>
            mounted.render(
                <WgFx
                    onEnhanced={() => {
                        window.fxEnhanced += 1;
                    }}
                />,
            ),
        );
    },
    unmount: () => {
        flushSync(() => mounted.unmount());
    },
};
