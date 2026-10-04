import clsx from "clsx";
import {Fragment} from "hono/jsx";
import {toNavigationBranchId} from "@/component/widget/navigation/_function/to-navigation-branch-id";
import type {NavigationGroup} from "@/component/widget/navigation/_type/navigation-data";
import {WgNavigationBranchToggle} from "@/component/widget/navigation/_wg-navigation-branch-toggle";
import "./_wg-navigation-nav-list.css";

/**
 * 한 단계의 문서 목록과 하위 묶음 · 재귀에서도 같은 탐색 표현 유지
 */
export interface WgNavigationNavListProps {
    /**
     * 현재 단계의 문서와 하위 묶음
     */
    group: NavigationGroup;
    /**
     * 사용자가 접은 가지
     */
    collapsed: Record<string, boolean>;
    /**
     * 브라우저에서 가지 선택 변경
     */
    onToggle?: (key: string) => void;
    /**
     * 부모 버튼과 연결할 가지 키 · 루트 묶음·문서 모두 같은 규칙 사용
     */
    branchKey: string;
}

export const WgNavigationNavList = (props: WgNavigationNavListProps) => {
    const entries = [
        ...props.group.docs.map((doc) => {
            const active = doc.active;
            return {kind: "document" as const, key: `doc:${doc.id}`, doc, active, current: doc.current};
        }),
        ...props.group.groups.map((group) => ({
            kind: "group" as const,
            key: `group:${JSON.stringify(group.path)}`,
            group,
            current: group.current,
        })),
    ];
    const currentIndex = entries.findIndex((entry) => entry.current);

    return (
        <ul
            className={clsx("wg_navigationNavList__root")}
            aria-label={props.group.name}
            id={toNavigationBranchId(props.branchKey)}
            hidden={props.collapsed[props.branchKey] === true}
        >
            {/**
             * 현재 경로 앞의 줄기와 도착 가지 · 문서 링크는 원래 파일 URL 사용
             */}
            {entries.map((entry, index) => (
                <li
                    className={clsx("wg_navigationNavList__item", {
                        "wg_navigationNavList__item--trail": index < currentIndex,
                        "wg_navigationNavList__item--current": entry.current,
                    })}
                    key={entry.key}
                >
                    {/**
                     * 문서 링크 · 부모도 독립 페이지, 현재 한 문서에만 페이지 상태 부여
                     */}
                    {entry.kind === "document" && (
                        <Fragment>
                            <a
                                className={clsx("wg_navigationNavList__link", {"wg_navigationNavList__link--active": entry.active})}
                                href={`/${entry.doc.id}/`}
                                title={entry.doc.label}
                                aria-current={entry.active ? "page" : undefined}
                            >
                                {entry.doc.name}
                            </a>
                            {/**
                             * 하위 문서 · 부모 아래에서도 기존 목록의 들여쓰기와 키보드 이동 유지
                             */}
                            {entry.doc.children.length > 0 && (
                                <WgNavigationBranchToggle branchKey={entry.key} label={entry.doc.name} collapsed={props.collapsed} onToggle={props.onToggle} />
                            )}
                            {entry.doc.children.length > 0 && (
                                <WgNavigationNavList
                                    group={{name: entry.doc.name, path: props.group.path, current: entry.current, docs: entry.doc.children, groups: []}}
                                    collapsed={props.collapsed}
                                    onToggle={props.onToggle}
                                    branchKey={entry.key}
                                />
                            )}
                        </Fragment>
                    )}
                    {/**
                     * 하위 묶음 · 같은 목록을 재귀로 이어 깊이에 따라 들여쓰기
                     */}
                    {entry.kind === "group" && (
                        <Fragment>
                            <span className={clsx("wg_navigationNavList__branch")}>{entry.group.name}</span>
                            <WgNavigationBranchToggle branchKey={entry.key} label={entry.group.name} collapsed={props.collapsed} onToggle={props.onToggle} />
                            <WgNavigationNavList group={entry.group} collapsed={props.collapsed} onToggle={props.onToggle} branchKey={entry.key} />
                        </Fragment>
                    )}
                </li>
            ))}
        </ul>
    );
};
