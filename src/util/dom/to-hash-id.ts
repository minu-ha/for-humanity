/**
 * URL 해시의 대상 id. 한국어 제목의 퍼센트 인코딩 해석
 *
 *   - 빈 해시와 잘못된 인코딩은 대상 없음
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
