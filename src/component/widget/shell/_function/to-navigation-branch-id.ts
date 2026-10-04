/**
 * 전체 경로 기반 가지 키를 HTML id로 변환 · 제목이 같은 묶음·문서도 독립 제어
 */
export const toNavigationBranchId = (key: string) => {
    return `fh-branch-${encodeURIComponent(key)}`;
};
