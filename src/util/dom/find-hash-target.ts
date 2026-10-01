/**
 * URL hash 대상 · 한국어 제목의 percent encoding 해석
 */
export const findHashTarget = (hash: string): HTMLElement | null => {
	if (!hash) {
		return null;
	}

	try {
		return document.getElementById(decodeURIComponent(hash.slice(1)));
	} catch (error) {
		if (error instanceof URIError) {
			return null;
		}

		throw error;
	}
};
