/**
 * Hono가 배치 변경에서 이전 DOM의 자식을 분리하기 전에 기억하는 키보드 위치
 */
export interface NavigationFocusSnapshot {
    /**
     * 문서 탐색 안에서 새 배치로 옮길 위치인지 구분
     */
    navigation: boolean;
    /**
     * 메뉴 진입·닫기 버튼에서 데스크톱 브랜드로 돌아갈 위치인지 구분
     */
    drawer: boolean;
    /**
     * 하위 문서·묶음 접힘 버튼의 안정된 식별자
     */
    branch: string | null;
    /**
     * 문서 이동 링크의 안정된 식별자
     */
    href: string | null;
}
