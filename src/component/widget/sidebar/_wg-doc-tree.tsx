import clsx from "clsx";
import {copy_nav_aria_label} from "@/component/widget/sidebar/_constant/copy";
import type {NavigationData, NavigationGroup} from "@/component/widget/sidebar/_type/navigation-data";
import {WgDocList} from "@/component/widget/sidebar/_wg-doc-list";
import "./_wg-doc-tree.css";

/**
 * 서버, 브라우저가 공유하는 문서 트리
 */
export interface WgDocTreeProps {
    /**
     * 본문을 제외한 읽는 순서의 문서 묶음
     */
    groups: NavigationGroup[];

    /**
     * 트리 전체에 적용할 배포 경로
     */
    basePath: NavigationData["basePath"];
}

export const WgDocTree = (props: WgDocTreeProps) => {
    return (
        <nav className={clsx("wg_docTree__root")} aria-label={copy_nav_aria_label}>
            {/**
             * 문서 이동. 클릭하지 않는 묶음과 독립 문서
             */}
            {props.groups.map((group) => {
                return (
                    <section className={clsx("wg_docTree__docGroup")} key={JSON.stringify(group.path)} aria-label={group.name}>
                        <div className={clsx("wg_docTree__group")}>{group.name}</div>
                        <WgDocList group={group} basePath={props.basePath} />
                    </section>
                );
            })}
        </nav>
    );
};
