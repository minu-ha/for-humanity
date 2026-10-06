import clsx from "clsx";
import type {NavigationGroup} from "@/component/widget/navigation/_type/navigation-data";
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
                        <WgNavigationNavList group={group} />
                    </section>
                ))}
            </div>
        </nav>
    );
};
