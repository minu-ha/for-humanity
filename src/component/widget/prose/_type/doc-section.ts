/**
 * 번호를 받는 제목 (h2 · h3) 하나의 번호와 가름. rehype-sections 가 문서 순서대로 머리말에 적는다
 */
export interface DocSection {
	/**
	 * 00, 01.A 꼴. 첫 절보다 앞에 온 소제목은 번호가 없다
	 */
	number?: string;
	/**
	 * 이 절에서 시작하는 가름의 이름
	 */
	part?: string;
}
