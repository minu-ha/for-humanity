import {copy_theme_label} from "@/constant/copy";
import type {theme_order} from "@/constant/theme";

/**
 * 테마 버튼의 아이콘·접근 가능한 이름·툴팁 동기화
 * 초기 저장 모드와 버튼 순환에 공통 적용
 */
export const setThemeButton = (button: HTMLButtonElement, mode: (typeof theme_order)[number]) => {
    button.setAttribute("aria-label", copy_theme_label[mode]);
    button.title = copy_theme_label[mode];

    for (const symbol of button.querySelectorAll<SVGGElement>("[data-theme-icon]")) {
        symbol.classList.toggle("wg_shellNav__themeSymbol--active", symbol.getAttribute("data-theme-icon") === mode);
    }

    return;
};
