import {type ReactNode, StrictMode} from "react";

/**
 * 모든 섬이 같이 쓰는 감싸개. 서버와 브라우저가 같은 트리를 그려야 하므로 두 쪽이 다 이 컴포넌트로 섬을 감싼다.
 * 섬이 함께 쓸 provider (테마, 문구) 가 생기면 여기에 둔다
 */
export interface WgIslandRootProps {
	children: ReactNode;
}

export const WgIslandRoot = (props: WgIslandRootProps) => {
	return <StrictMode>{props.children}</StrictMode>;
};
