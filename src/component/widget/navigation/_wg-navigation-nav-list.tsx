import clsx from "clsx";
import {Fragment} from "hono/jsx";
import type {NavigationGroup} from "@/component/widget/navigation/_type/navigation-data";
import "./_wg-navigation-nav-list.css";

/**
 * 한 단계의 문서 목록과 하위 묶음 · 재귀에서도 같은 탐색 표현 유지
 */
export interface WgNavigationNavListProps {
    /**
     * 현재 단계의 문서와 하위 묶음
     */
    group: NavigationGroup;
}

export const WgNavigationNavList = (props: WgNavigationNavListProps) => {
    const entries = [
        ...props.group.docs.map((doc) => ({kind: "document" as const, key: `doc:${doc.id}`, doc})),
        ...props.group.groups.map((group) => ({kind: "group" as const, key: `group:${JSON.stringify(group.path)}`, group})),
    ];

    return (
        <ul className={clsx("wg_navigationNavList__root")} aria-label={props.group.name}>
            {/**
             * 문서 링크는 원래 파일 URL 사용
             */}
            {entries.map((entry) => (
                <li className={clsx("wg_navigationNavList__item")} key={entry.key}>
                    {/**
                     * 문서 링크 · 부모도 독립 페이지, 현재 한 문서에만 페이지 상태 부여
                     */}
                    {entry.kind === "document" && (
                        <Fragment>
                            <a
                                className={clsx("wg_navigationNavList__link", {"wg_navigationNavList__link--active": entry.doc.active})}
                                href={`/${entry.doc.id}/`}
                                title={entry.doc.label}
                                aria-current={entry.doc.active ? "page" : undefined}
                            >
                                {entry.doc.name}
                            </a>
                            {/**
                             * 하위 문서 · 부모 아래에서도 기존 목록의 들여쓰기와 키보드 이동 유지
                             */}
                            {entry.doc.children.length > 0 && <WgNavigationNavList group={{name: entry.doc.name, path: props.group.path, docs: entry.doc.children, groups: []}} />}
                        </Fragment>
                    )}
                    {/**
                     * 하위 묶음 · 같은 목록을 재귀로 이어 깊이에 따라 들여쓰기
                     */}
                    {entry.kind === "group" && (
                        <Fragment>
                            <span className={clsx("wg_navigationNavList__branch")}>{entry.group.name}</span>
                            <WgNavigationNavList group={entry.group} />
                        </Fragment>
                    )}
                </li>
            ))}
        </ul>
    );
};
