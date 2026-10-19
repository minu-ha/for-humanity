/**
 * URL hash의 대상 id. 한국어 제목의 percent encoding 해석
 *
 *   - 빈 hash와 잘못된 encoding은 대상 없음
 */
export const toHashId = (hash: string): string | undefined => {
    if (!hash) {
        return undefined;
    }

    try {
        return decodeURIComponent(hash.slice(1));
    } catch (error) {
        if (error instanceof URIError) {
            return undefined;
        }

        throw error;
    }
};
