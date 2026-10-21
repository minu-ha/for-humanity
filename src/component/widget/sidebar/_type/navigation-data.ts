import type {TocGroup} from "@/component/widget/sidebar/_type/toc-group";
import type {Doc} from "@/type/doc";
import type {DocData} from "@/type/doc-data";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 브라우저 문서 가지. 본문, 파일 경로를 포함하지 않는 탐색 전용 계약
 */
export interface NavigationDoc {
    /**
     * 링크의 문서 id
     */
    id: Doc["id"];

    /**
     * 표시 이름
     */
    name: DocData["name"];

    /**
     * 링크의 보조 설명
     */
    label: DocData["label"];

    /**
     * 현재 페이지 한 항목만 강조
     */
    active: boolean;

    /**
     * 클릭 가능한 하위 문서
     */
    children: NavigationDoc[];
}

/**
 * 클릭하지 않는 문서 묶음. 같은 이름은 전체 경로로 구분
 */
export interface NavigationGroup {
    /**
     * 묶음 이름
     */
    name: DocData["group"][number];

    /**
     * 최상위부터 현재 묶음까지
     */
    path: DocData["group"];

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
 * 서버가 계산한 최소 탐색 자료. 서버 출력과 클라이언트 JSX의 공통 입력
 */
export interface NavigationData {
    /**
     * 브랜드 이름
     */
    title: ResolvedSiteConfig["title"];

    /**
     * 읽는 순서의 문서 트리
     */
    groups: NavigationGroup[];

    /**
     * 페이지별 활성 표시를 제외한 문서 목록의 짧은 식별값. 같은 목록에서만 저장 위치 복원
     */
    signature: string;

    /**
     * 현재 페이지의 목차
     */
    outline: TocGroup[];

    /**
     * README 홈 여부
     */
    home: boolean;

    /**
     * 커서 옆 픽셀 얼굴 표시 여부
     */
    cursorFace: ResolvedSiteConfig["cursorFace"];
}
