import "./wg-prose.css";

/**
 * 문서 본문. Markdown 이 만든 태그와 빌드 때 붙은 부품 (머리, 가름, 절 번호, 알약, 색 칩, 흐름도, 표 상자) 의 모양을 맡는다.
 * 부품을 그리는 remark · rehype 플러그인은 _function 에 있고, content/create-processor 가 Markdown 처리기에 건다
 */
export interface WgProseProps {
	/**
	 * 그린 문서의 HTML. 머리는 rehype-head 가 안에 넣었다
	 */
	html?: string;
	/**
	 * Markdown 없이 그리는 머리. 첫 화면이 넘긴다
	 */
	head?: {
		/**
		 * 제목 위 눈썹 줄에 차례로 놓는 글
		 */
		eyebrow: string[];
		/**
		 * h1
		 */
		title: string;
		/**
		 * 제목 밑 첫 문단
		 */
		lead?: string;
	};
}

export const WgProse = (props: WgProseProps) => {
	if (props.html !== undefined) {
		return <article className="wg_prose__root" dangerouslySetInnerHTML={{__html: props.html}} />;
	}

	return (
		<article className="wg_prose__root">
			{props.head !== undefined && (
				<header className="wg_prose__head">
					<div className="wg_prose__eyebrow">
						{props.head.eyebrow.map((text) => (
							<span key={text}>{text}</span>
						))}
					</div>
					<h1>{props.head.title}</h1>
					{props.head.lead !== undefined && <p>{props.head.lead}</p>}
				</header>
			)}
		</article>
	);
};
