/**
 * 번호를 받는 제목의 깊이. 절은 h2, 소제목은 h3 이다
 */
export const section_heading_depth = {
	section: 2,
	sub: 3,
} as const;

/**
 * 절 번호의 자릿수. 00 부터 센다
 */
export const section_number_width = 2;

/**
 * 소제목 번호 (01.A) 의 글자. 절 하나에 소제목은 이 글자 수까지 둔다
 */
export const section_sub_letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
