import {useLayoutEffect} from "hono/jsx";
import {type FxIcon, fx_icons} from "@/component/widget/fx/_constant/fx";
import {enhanceRange} from "@/component/widget/fx/_function/enhance-range";
import {enhanceRun} from "@/component/widget/fx/_function/enhance-run";
import {enhanceSteps} from "@/component/widget/fx/_function/enhance-steps";
import {setIcon} from "@/component/widget/fx/_function/set-icon";
import {toFxCopy} from "@/component/widget/fx/_function/to-fx-copy";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";
import "./wg-fx.css";

/**
 * 작성자 HTML의 data-fx 값과 enhance의 대응 계약. custom은 작성자 스크립트 담당이라 없음
 *
 *   - Map이라 __proto__ 같은 상속 키는 대상 아님
 */
const enhance_by_kind = new Map<string, FxEnhance>([
    ["steps", enhanceSteps],
    ["range", enhanceRange],
    ["run", enhanceRun],
]);

/**
 * data-icon 값이 아이콘 이름인지
 */
const isIcon = (value: string | undefined): value is FxIcon => {
    return value !== undefined && Object.hasOwn(fx_icons, value);
};

/**
 * 인터랙티브 그림 위젯의 입력
 */
export interface WgFxProps {
    /**
     * 조작부가 붙고 캡션이 접혀 본문 높이가 바뀐 뒤의 앵커 보정
     */
    onEnhanced?: () => void;
}

/**
 * 서버 본문의 .fx[data-fx] 그림에 조작부와 단계 표시. 셸과 본문 DOM 교체 미포함
 *
 *   - steps는 조작부 생성, range는 슬라이더 연결, run은 실행 상자, custom은 작성자 스크립트
 *   - 모든 종류의 button[data-icon]은 같은 아이콘 버튼으로 바꿈
 *   - 스크립트가 없으면 끝까지 가는 요소와 캡션 전체가 보이는 서버 HTML 유지
 *   - 해제는 signal 하나. 그림과 아이콘이 각자 abort에서 되돌림
 */
export const WgFx = (props: WgFxProps) => {
    /**
     * 본문 파싱 뒤 그림마다 살리고 해제에서 되돌림
     *
     *   - 의존성 없음. 콜백 변경으로 재실행하면 모든 그림을 다시 만들게 됨
     */
    useLayoutEffect(() => {
        const lifetime = new AbortController();

        /**
         * 아이콘 버튼 교체 뒤 종류별 enhance. 하나라도 찾으면 셸에 앵커 보정 알림
         */
        const enhance = () => {
            const copy = toFxCopy(document.documentElement.lang);
            const buttons = document.querySelectorAll<HTMLButtonElement>(".fx button[data-icon]");
            const roots = document.querySelectorAll<HTMLElement>(".fx[data-fx]");

            for (const button of buttons) {
                if (!isIcon(button.dataset.icon)) {
                    continue;
                }

                const children = [...button.childNodes];

                setIcon({button, icon: button.dataset.icon, label: button.textContent.trim()});
                lifetime.signal.addEventListener(
                    "abort",
                    () => {
                        button.classList.remove("wg_fx__icon");
                        button.removeAttribute("aria-label");
                        delete button.dataset.tip;
                        button.replaceChildren(...children);
                    },
                    {once: true},
                );
            }

            for (const root of roots) {
                if (root.dataset.fx !== undefined) {
                    enhance_by_kind.get(root.dataset.fx)?.({root, copy, signal: lifetime.signal});
                }
            }

            if (buttons.length > 0 || roots.length > 0) {
                props.onEnhanced?.();
            }
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", enhance, {once: true, signal: lifetime.signal});
        } else {
            enhance();
        }

        return () => {
            lifetime.abort();
        };
    }, []);

    return null;
};
