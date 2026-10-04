import clsx from "clsx";
import type {NavigationGroup} from "@/component/widget/navigation/_type/navigation-data";
import {WgNavigationBranchToggle} from "@/component/widget/navigation/_wg-navigation-branch-toggle";
import {WgNavigationNavList} from "@/component/widget/navigation/_wg-navigation-nav-list";
import {copy_nav_aria_label} from "@/constant/copy";
import "./_wg-navigation-nav.css";

/**
 * 서버·브라우저가 공유하는 문서 트리
 */
export interface WgNavigationNavProps {
    /**
     * 본문을 제외한 읽는 순서의 문서 묶음
     */
    groups: NavigationGroup[];
    /**
     * 사용자가 접은 가지
     */
    collapsed: Record<string, boolean>;
    /**
     * 브라우저에서 가지 선택 변경 · 서버 출력에서는 생략
     */
    onToggle?: (key: string) => void;
}

export const WgNavigationNav = (props: WgNavigationNavProps) => {
    return (
        <nav className={clsx("wg_navigationNav__root")} aria-label={copy_nav_aria_label}>
            {/**
             * 문서 이동 · 클릭하지 않는 묶음과 독립 문서
             */}
            <div className={clsx("wg_navigationNav__docs")}>
                {props.groups.map((group) => (
                    <section className={clsx("wg_navigationNav__docGroup")} key={JSON.stringify(group.path)} aria-label={group.name}>
                        <div className={clsx("wg_navigationNav__group")}>{group.name}</div>
                        <WgNavigationBranchToggle branchKey={`group:${JSON.stringify(group.path)}`} label={group.name} collapsed={props.collapsed} onToggle={props.onToggle} />
                        <WgNavigationNavList group={group} branchKey={`group:${JSON.stringify(group.path)}`} collapsed={props.collapsed} onToggle={props.onToggle} />
                    </section>
                ))}
            </div>
        </nav>
    );
};
