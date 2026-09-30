import {copy_theme_label} from "@/constant/copy";
import {theme_mode, theme_order, theme_storage_key} from "@/constant/theme";

/**
 * 테마 단추. 누를 때마다 시스템 → 밝게 → 어둡게 차례로 바꾸고 고른 것을 기억한다.
 * 기억한 테마는 그리기 전에 wg-shell.astro 머리가 data-theme 으로 붙이므로, 지금 테마는 그 속성에서 읽는다.
 * `<script>` 안의 코드는 tsc 가 보지 않으므로 _wg-shell-nav.astro 의 스크립트는 이 파일을 불러 부르기만 한다
 */
export const startThemeToggle = () => {
	const button = document.querySelector<HTMLButtonElement>(".wg_shellNav__theme");

	if (!button) {
		return;
	}

	const readMode = () =>
		theme_order.find((mode) => mode === document.documentElement.getAttribute("data-theme")) ?? theme_mode.system;

	button.textContent = copy_theme_label[readMode()];
	button.addEventListener("click", () => {
		const next = theme_order[(theme_order.indexOf(readMode()) + 1) % theme_order.length];

		if (next === theme_mode.system) {
			document.documentElement.removeAttribute("data-theme");
		} else {
			document.documentElement.setAttribute("data-theme", next);
		}

		button.textContent = copy_theme_label[next];

		try {
			localStorage.setItem(theme_storage_key, next);
		} catch {
			// 저장이 막혀도 이번 방문에는 적용된 채로 둔다
		}
	});
};
