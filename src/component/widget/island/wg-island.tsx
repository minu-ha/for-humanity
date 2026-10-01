import {island_directive_note} from "@/component/widget/island/_constant/island";
import {WgIslandRoot} from "@/component/widget/island/_wg-island-root";
import {WgNote} from "@/component/widget/note/wg-note";

/**
 * 섬 하나. 지시문 이름으로 컴포넌트를 고르고 공통 감싸개에 넣는다. 서버 (render-islands) 와 브라우저 (island.tsx) 가 같은 트리를 그린다
 */
export interface WgIslandProps {
	/**
	 * 지시문 이름 (`::note`)
	 */
	name: string;
	/**
	 * 지시문에서 읽은 프롭. data-props 의 JSON
	 */
	props: Record<string, string>;
}

export const WgIsland = (props: WgIslandProps) => {
	if (props.name !== island_directive_note) {
		return null;
	}

	return (
		<WgIslandRoot>
			<WgNote label={props.props.label} />
		</WgIslandRoot>
	);
};
