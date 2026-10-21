/**
 * 문서 id의 사이트 경로. 홈은 /, 경로 조각마다 퍼센트 인코딩
 *
 *   - 사이트맵과 대표 주소가 같은 문자열 사용
 */
export const toPagePath = (id?: string) => {
    return id === undefined ? "/" : `/${id.split("/").map(encodeURIComponent).join("/")}/`;
};
