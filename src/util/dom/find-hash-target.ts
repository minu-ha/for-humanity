/**
 * 주소의 #조각이 가리키는 요소. 한글 절 이름은 주소에서 퍼센트로 적히므로 풀어서 찾는다
 */
export const findHashTarget = (hash: string): HTMLElement | null =>
	hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
