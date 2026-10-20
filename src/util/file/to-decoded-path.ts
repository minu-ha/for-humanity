/**
 * URL 경로와 해시의 퍼센트 인코딩 해제. 잘못된 인코딩은 undefined
 */
export const toDecodedPath = (path: string) => {
    try {
        return decodeURIComponent(path);
    } catch {
        return undefined;
    }
};
