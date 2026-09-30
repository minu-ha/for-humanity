import {defineToolbarApp} from "astro/toolbar";
import {copy_toolbar_empty} from "@/constant/copy";
import {toolbar_report_event} from "@/constant/toolbar";

/**
 * 문서 검사 앱 (브라우저 쪽). 열면 서버에 결과를 달라고 보내고, 온 줄을 목록으로 보인다.
 * 경고가 있으면 toolbar 의 아이콘에 점이 뜬다. 문서를 고치면 쪽이 다시 열리며 새로 받는다
 */
// biome-ignore lint/style/noDefaultExport: Astro 가 앱을 기본 내보내기로 읽는다
export default defineToolbarApp({
	init(canvas, app, server) {
		const panel = document.createElement("astro-dev-toolbar-window");
		const list = document.createElement("ul");
		const style = document.createElement("style");

		style.textContent =
			"ul { margin: 0; padding: 0; list-style: none; font-family: monospace; font-size: 13px; line-height: 1.7; }";
		panel.append(style, list);
		canvas.append(panel);

		server.on<string[]>(toolbar_report_event, (lines) => {
			list.replaceChildren(
				...(lines.length > 0 ? lines : [copy_toolbar_empty]).map((line) => {
					const item = document.createElement("li");

					item.textContent = line;

					return item;
				}),
			);
			app.toggleNotification(lines.length > 0 ? {state: true, level: "warning"} : {state: false});
		});
		server.send(toolbar_report_event, undefined);
	},
});
