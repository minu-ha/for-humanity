/**
 * 상태 표지의 종류. 알약의 색을 가른다
 */
export const status_kind = {
	verified: "verified",
	unverified: "unverified",
} as const;

/**
 * 설정에 status 가 없을 때 알약으로 바꾸는 문구. "확인됨" 은 뒤의 날짜까지 알약에 넣는다
 */
export const status_default_phrases = [
	{phrase: "확인됨", kind: status_kind.verified, date: true},
	{phrase: "확인되지 않았다", kind: status_kind.unverified},
];
