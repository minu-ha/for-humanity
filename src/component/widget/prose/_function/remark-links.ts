import {dirname, posix, relative} from "node:path";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";

/**
 * 링크. 다른 문서의 .md 로 건 링크 (GitHub 에서도 열리는 꼴) 를 사이트 주소로 바꾼다.
 * `settings.md#시간대` 는 `/settings/#시간대` 가 된다. 바깥 주소, 절대 경로, 같은 쪽의 #절은 그대로 둔다
 */
export const remarkLinks = (options: {root: string}) => (tree: Root, file: VFile) => {
	const here = dirname(relative(options.root, file.path));

	visit(tree, "link", (node) => {
		// 둘째 묶음은 #절이 없으면 빈 글이다
		const match = /^(?![a-z]+:|\/|#)([^#?]+)\.mdx?(#.*|)$/i.exec(node.url);

		if (match) {
			node.url = `/${posix.join(here, match[1]).toLowerCase()}/${match[2]}`;
		}
	});
};
