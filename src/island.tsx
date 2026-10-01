/*
 * 섬을 이어받는 브라우저 스크립트. 서버가 그린 자리 (data-island 요소) 마다 같은 트리를 그려 hydrate 한다.
 * esbuild 가 dist/island.js 로 묶고 wg-shell.tsx 가 섬이 있는 쪽에만 싣는다
 */

import {hydrateRoot} from "react-dom/client";
import {island_attribute_name} from "@/component/widget/island/_constant/island";
import {WgIsland} from "@/component/widget/island/wg-island";

for (const root of document.querySelectorAll<HTMLElement>(`[${island_attribute_name}]`)) {
	if (root.dataset.island !== undefined && root.dataset.props !== undefined) {
		hydrateRoot(
			root,
			<WgIsland name={root.dataset.island} props={JSON.parse(decodeURIComponent(root.dataset.props))} />,
		);
	}
}
