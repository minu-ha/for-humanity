import clsx from "clsx";
import {toNavigationBranchId} from "@/component/widget/navigation/_function/to-navigation-branch-id";
import "./_wg-navigation-branch-toggle.css";

/**
 * 문서·목차에서 공유하는 가지 조작 · 링크 이동과 분리된 네이티브 버튼
 */
export interface WgNavigationBranchToggleProps {
    /**
     * 문서 ID·묶음 경로·페이지별 헤딩으로 구분한 상태 키
     */
    branchKey: string;
    /**
     * 펼치거나 접을 가지의 접근 가능한 이름
     */
    label: string;
    /**
     * 같은 저장 키의 접힘 상태
     */
    collapsed: Record<string, boolean>;
    /**
     * 브라우저에서만 제공하는 가지 변경 동작
     */
    onToggle?: (key: string) => void;
}

export const WgNavigationBranchToggle = (props: WgNavigationBranchToggleProps) => {
    /**
     * 링크 이동과 별도로 현재 가지 선택 변경
     */
    const handleToggleClick = () => props.onToggle?.(props.branchKey);

    return (
        <button
            className={clsx("wg_navigationBranchToggle__root")}
            type="button"
            aria-label={`${props.collapsed[props.branchKey] === true ? "Expand" : "Collapse"} ${props.label}`}
            aria-expanded={String(props.collapsed[props.branchKey] !== true)}
            aria-controls={toNavigationBranchId(props.branchKey)}
            data-navigation-toggle={props.branchKey}
            data-navigation-label={props.label}
            hidden={props.onToggle === undefined}
            onClick={handleToggleClick}
        >
            {props.collapsed[props.branchKey] === true ? "+" : "−"}
        </button>
    );
};
