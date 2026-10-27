/**
 * 참조 칩 색. 접두마다 하나, 생략 시 gray
 */
export const ref_color = {
    gray: "gray",
    blue: "blue",
    violet: "violet",
    amber: "amber",
} as const;

/**
 * 참조 접두. 대문자 1~3자
 */
export const ref_prefix_pattern = /^[A-Z]{1,3}$/;

/**
 * 링크 글자의 접두와 번호. 접두는 설정과 대조
 */
export const ref_text_pattern = /^([A-Z]{1,3})\d+$/;
