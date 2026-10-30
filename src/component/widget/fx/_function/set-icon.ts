import {type FxIcon, fx_icons} from "@/component/widget/fx/_constant/fx";

/**
 * 아이콘 교체 입력
 */
interface IconParams {
    /**
     * 아이콘을 넣을 버튼
     */
    button: HTMLButtonElement;

    /**
     * 아이콘 이름
     */
    icon: FxIcon;

    /**
     * 버튼 이름. aria-label과 툴팁 data-tip
     */
    label: string;
}

/**
 * SVG 이름공간
 */
const svg_namespace = "http://www.w3.org/2000/svg";

/**
 * 버튼의 내용을 16px 아이콘 SVG로 바꾸고 이름을 aria-label과 툴팁으로 옮김. 재생과 멈춤 전환에도 사용
 */
export const setIcon = (params: IconParams) => {
    const svg = document.createElementNS(svg_namespace, "svg");

    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "wg_fx__glyph");

    for (const shape of fx_icons[params.icon]) {
        const element = document.createElementNS(svg_namespace, shape.tag);

        for (const [name, value] of shape.attributes) {
            element.setAttribute(name, value);
        }

        svg.append(element);
    }

    params.button.replaceChildren(svg);
    params.button.classList.add("wg_fx__icon");
    params.button.setAttribute("aria-label", params.label);
    params.button.dataset.tip = params.label;
};
