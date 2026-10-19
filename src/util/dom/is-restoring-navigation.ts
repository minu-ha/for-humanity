/**
 * 브라우저가 이전 스크롤 위치를 복원하는 문서 진입. 새로고침, 뒤로가기, 앞으로가기
 */
export const isRestoringNavigation = (): boolean => {
    const navigation = performance.getEntriesByType("navigation")[0];
    return navigation instanceof PerformanceNavigationTiming && (navigation.type === "reload" || navigation.type === "back_forward");
};
