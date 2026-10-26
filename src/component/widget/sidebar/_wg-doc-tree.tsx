import clsx from "clsx";
import {Fragment} from "hono/jsx";
import {copy_nav_aria_label} from "@/component/widget/sidebar/_constant/copy";
import type {NavigationData, NavigationGroup} from "@/component/widget/sidebar/_type/navigation-data";
import {WgDocList} from "@/component/widget/sidebar/_wg-doc-list";
import {toSitePath} from "@/util/url/to-site-path";
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
     * 문서 목록 위의 언어 줄. 번역 언어가 없으면 빈 목록
     */
    languages: NavigationData["languages"];

    /**
     * 트리 전체에 적용할 배포 경로
     */
    basePath: NavigationData["basePath"];
}

export const WgDocTree = (props: WgDocTreeProps) => {
    return (
        <nav className={clsx("wg_docTree__root")} aria-label={copy_nav_aria_label}>
            {/**
             * 언어 전환. 현재 언어는 링크 없이 표시, 번역이 없는 언어는 그 언어의 홈
             */}
            {props.languages.length > 0 && (
                <p className={clsx("wg_docTree__languages")}>
                    {props.languages.map((language, index) => {
                        return (
                            <Fragment key={language.path}>
                                {index > 0 && " | "}
                                {language.active && (
                                    <span className={clsx("wg_docTree__language", "wg_docTree__language--active")} lang={language.lang} aria-current="true">
                                        {language.name}
                                    </span>
                                )}
                                {!language.active && (
                                    <a className={clsx("wg_docTree__language")} href={toSitePath({basePath: props.basePath, path: language.path})} lang={language.lang}>
                                        {language.name}
                                    </a>
                                )}
                            </Fragment>
                        );
                    })}
                </p>
            )}

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
