/**
 * 스크롤 영역의 배치 · 넓은 3열, 좁은 2열, 모바일 모달
 */
export type NavigationLayout = "wide" | "desktop" | "drawer";

/**
 * 사용자가 명시적으로 바꾼 가지 선택 · 없는 키는 펼침
 */
export interface NavigationTreeState {
    /**
     * 문서 ID·그룹 전체 경로·페이지별 heading으로 구분한 접힘 상태
     */
    collapsed: Record<string, boolean>;
}

/**
 * 한 화면 배치의 마지막 탐색 위치 · 목록 변경과 다른 페이지의 목차는 재사용하지 않음
 */
export interface NavigationPosition {
    /**
     * 현재 사이트의 공통 문서 URL·제목 목록
     */
    navigation: string;
    /**
     * 목차가 속한 페이지
     */
    pathname: string;
    /**
     * 공통 문서 목록의 세로 위치
     */
    documents: number;
    /**
     * 현재 페이지 목차의 세로 위치
     */
    outline: number;
}

/**
 * 같은 탭 안에서 유지하는 배치별 탐색 위치
 */
export interface NavigationScrollState {
    /**
     * 아직 열지 않은 배치의 위치는 저장하지 않음
     */
    positions: Partial<Record<NavigationLayout, NavigationPosition>>;
}
