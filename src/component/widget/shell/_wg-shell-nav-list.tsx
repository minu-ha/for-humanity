import clsx from "clsx";
import {Fragment} from "react";
import {toNavigationBranchId} from "@/component/widget/shell/_function/to-navigation-branch-id";
import {WgShellBranchToggle} from "@/component/widget/shell/_wg-shell-branch-toggle";
import type {Doc} from "@/type/doc";
import type {DocGroup} from "@/type/doc-group";
import "./_wg-shell-nav-list.css";

/**
 * 한 단계의 문서 목록과 하위 묶음 · 재귀에서도 같은 탐색 표현 유지
 */
export interface WgShellNavListProps {
    /**
     * 현재 단계의 문서와 하위 묶음
     */
    group: DocGroup;
    /**
     * 현재 문서 · 조상 묶음의 경로까지 표시
     */
    currentDoc?: Doc;
    /**
     * 부모 버튼과 연결할 가지 키 · 루트 묶음·문서 모두 같은 규칙 사용
     */
    branchKey: string;
}

export const WgShellNavList = (props: WgShellNavListProps) => {
    const currentAncestors = new Set(props.currentDoc?.ancestors);
    const entries = [
        ...props.group.docs.map((doc) => {
            const active = doc.id === props.currentDoc?.id;
            return {kind: "document" as const, key: `doc:${doc.id}`, doc, active, current: active || currentAncestors.has(doc.id)};
        }),
        ...props.group.groups.map((group) => ({
            kind: "group" as const,
            key: `group:${JSON.stringify(group.path)}`,
            group,
            current: group.path.every((name, index) => name === props.currentDoc?.data.group[index]),
        })),
    ];
    const currentIndex = entries.findIndex((entry) => entry.current);

    return (
        <ul className={clsx("wg_shellNavList__root")} aria-label={props.group.name} id={toNavigationBranchId(props.branchKey)}>
            {/**
             * 현재 경로 앞의 줄기와 도착 가지 · 문서 링크는 원래 파일 URL 사용
             */}
            {entries.map((entry, index) => (
                <li
                    className={clsx("wg_shellNavList__item", {
                        "wg_shellNavList__item--trail": index < currentIndex,
                        "wg_shellNavList__item--current": entry.current,
                    })}
                    key={entry.key}
                >
                    {/**
                     * 문서 링크 · 부모도 독립 페이지, 현재 한 문서에만 페이지 상태 부여
                     */}
                    {entry.kind === "document" && (
                        <Fragment>
                            <a
                                className={clsx("wg_shellNavList__link", {"wg_shellNavList__link--active": entry.active})}
                                href={`/${entry.doc.id}/`}
                                title={entry.doc.data.label}
                                aria-current={entry.active ? "page" : undefined}
                            >
                                {entry.doc.data.name}
                            </a>
                            {/**
                             * 하위 문서 · 부모 아래에서도 기존 목록의 들여쓰기와 키보드 이동 유지
                             */}
                            {entry.doc.children !== undefined && entry.doc.children.length > 0 && <WgShellBranchToggle branchKey={entry.key} label={entry.doc.data.name} />}
                            {entry.doc.children !== undefined && entry.doc.children.length > 0 && (
                                <WgShellNavList
                                    group={{name: entry.doc.data.name, path: entry.doc.data.group, docs: entry.doc.children, groups: []}}
                                    currentDoc={props.currentDoc}
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
                            <span className={clsx("wg_shellNavList__branch")}>{entry.group.name}</span>
                            <WgShellBranchToggle branchKey={entry.key} label={entry.group.name} />
                            <WgShellNavList group={entry.group} currentDoc={props.currentDoc} branchKey={entry.key} />
                        </Fragment>
                    )}
                </li>
            ))}
        </ul>
    );
};
