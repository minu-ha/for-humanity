import type {TocGroup} from "@/component/widget/navigation/_type/toc-group";

/**
 * 브라우저 문서 가지 · 본문·파일 경로를 포함하지 않는 탐색 전용 계약
 */
export interface NavigationDoc {
    /**
     * 링크의 문서 id
     */
    id: string;
    /**
     * 표시 이름
     */
    name: string;
    /**
     * 링크의 보조 설명
     */
    label: string;
    /**
     * 현재 페이지 한 항목만 강조
     */
    active: boolean;
    /**
     * 현재 문서와 조상의 트리 경로
     */
    current: boolean;
    /**
     * 클릭 가능한 하위 문서
     */
    children: NavigationDoc[];
}

/**
 * 클릭하지 않는 문서 묶음 · 같은 이름은 전체 경로로 구분
 */
export interface NavigationGroup {
    /**
     * 묶음 이름
     */
    name: string;
    /**
     * 최상위부터 현재 묶음까지
     */
    path: string[];
    /**
     * 현재 페이지가 속한 묶음 경로
     */
    current: boolean;
    /**
     * 현재 단계의 문서
     */
    docs: NavigationDoc[];
    /**
     * 하위 묶음
     */
    groups: NavigationGroup[];
}

/**
 * 서버가 계산한 최소 탐색 자료 · 서버 출력과 클라이언트 JSX의 공통 입력
 */
export interface NavigationData {
    /**
     * 브랜드 이름
     */
    title: string;
    /**
     * 읽는 순서의 문서 트리
     */
    groups: NavigationGroup[];
    /**
     * 현재 페이지의 목차
     */
    outline: TocGroup[];
    /**
     * 목차의 접힘 상태를 구분할 문서 id
     */
    pageId: string;
    /**
     * README 홈 여부
     */
    home: boolean;
}
