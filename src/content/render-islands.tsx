import {renderToString} from "react-dom/server";
import {island_attribute_name, island_attribute_props} from "@/component/widget/island/_constant/island";
import {WgIsland} from "@/component/widget/island/wg-island";

/**
 * 섬을 서버에서 그린다. remark-islands 가 남긴 자리 (data-island 요소) 의 속을 React 로 채운다.
 * 브라우저의 island.tsx 가 같은 프롭으로 같은 트리를 그려 이어받는다
 */
export const renderIslands = (html: string) =>
	html.replace(
		new RegExp(`<div ${island_attribute_name}="([^"]+)" ${island_attribute_props}="([^"]+)">[^<]*</div>`, "g"),
		(_match, name: string, props: string) =>
			`<div ${island_attribute_name}="${name}" ${island_attribute_props}="${props}">${renderToString(
				<WgIsland name={name} props={JSON.parse(decodeURIComponent(props))} />,
			)}</div>`,
	);
