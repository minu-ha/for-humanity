import clsx from "clsx";
import {toNavigationBranchId} from "@/component/widget/shell/_function/to-navigation-branch-id";
import "./_wg-shell-branch-toggle.css";

/**
 * 문서·목차에서 공유하는 가지 조작 · 링크 이동과 분리된 네이티브 버튼
 */
interface WgShellBranchToggleProps {
    /**
     * 문서 ID·묶음 경로·페이지별 헤딩으로 구분한 상태 키
     */
    branchKey: string;
    /**
     * 펼치거나 접을 가지의 접근 가능한 이름
     */
    label: string;
}

export const WgShellBranchToggle = (props: WgShellBranchToggleProps) => {
    return (
        <button
            className={clsx("wg_shellBranchToggle__root")}
            type="button"
            aria-label={`Collapse ${props.label}`}
            aria-expanded="true"
            aria-controls={toNavigationBranchId(props.branchKey)}
            data-navigation-toggle={props.branchKey}
            data-navigation-label={props.label}
            hidden
        >
            −
        </button>
    );
};
