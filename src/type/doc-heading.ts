/**
 * 제목 하나. rehype-heading-ids 가 문서 순서대로 모은다. slug 가 링크, text 가 글이다
 */
export interface DocHeading {
	/**
	 * h1 이 1, h2 가 2
	 */
	depth: number;
	/**
	 * 제목의 id. 주소의 #절이 된다
	 */
	slug: string;
	/**
	 * 번호를 뺀 제목 글
	 */
	text: string;
}
