import {fx_range_default_max, fx_range_default_min} from "@/component/widget/fx/_constant/fx";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";

/**
 * 슬라이더 그림의 값 비율 --fx-v, data-value 반영, output 갱신과 fx:input 발송
 *
 *   - min, max 속성이 없으면 HTML 기본값
 *   - data-unit은 output 값 뒤의 단위
 *   - 해제는 signal의 abort에서 --fx-v와 data-value 제거, output 글자 유지
 */
export const enhanceRange: FxEnhance = (params) => {
    // 이미 해제된 signal은 abort 이벤트 없음, 복원 불가
    if (params.signal.aborted) {
        return;
    }

    const input = params.root.querySelector<HTMLInputElement>("input[type=range]");
    const output = params.root.querySelector("output");

    if (input === null) {
        return;
    }

    /**
     * 현재 값의 --fx-v, data-value, output 반영, fx:input 발송
     *
     *   - max가 min 이하면 비율 0
     */
    const show = () => {
        const min = input.min === "" ? fx_range_default_min : Number(input.min);
        const max = input.max === "" ? fx_range_default_max : Number(input.max);
        const ratio = max > min ? (input.valueAsNumber - min) / (max - min) : 0;

        params.root.style.setProperty("--fx-v", String(ratio));
        params.root.dataset.value = input.value;

        if (output !== null) {
            output.textContent = input.dataset.unit === undefined ? input.value : `${input.value}${input.dataset.unit}`;
        }

        params.root.dispatchEvent(new CustomEvent("fx:input", {detail: {value: input.valueAsNumber, ratio}}));
    };

    params.signal.addEventListener(
        "abort",
        () => {
            params.root.classList.remove("fx--ready");
            params.root.style.removeProperty("--fx-v");
            delete params.root.dataset.value;
        },
        {once: true},
    );

    input.addEventListener("input", show, {signal: params.signal});
    params.root.classList.add("fx--ready");
    show();
};
