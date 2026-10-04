import clsx from "clsx";
import {Fragment} from "react";
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
}

export const WgShellNavList = (props: WgShellNavListProps) => {
    const entries = [
        ...props.group.docs.map((doc) => ({kind: "document" as const, key: `doc:${doc.id}`, doc, current: doc.id === props.currentDoc?.id})),
        ...props.group.groups.map((group) => ({
            kind: "group" as const,
            key: `group:${JSON.stringify(group.path)}`,
            group,
            current: group.path.every((name, index) => name === props.currentDoc?.data.group[index]),
        })),
    ];
    const currentIndex = entries.findIndex((entry) => entry.current);

    return (
        <ul className={clsx("wg_shellNavList__root")} aria-label={props.group.name}>
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
                     * 독립 문서 · 키보드 포커스와 현재 페이지 표시는 링크가 담당
                     */}
                    {entry.kind === "document" && (
                        <a
                            className={clsx("wg_shellNavList__link", {"wg_shellNavList__link--active": entry.current})}
                            href={`/${entry.doc.id}/`}
                            title={entry.doc.data.label}
                            aria-current={entry.current ? "page" : undefined}
                        >
                            {entry.doc.data.name}
                        </a>
                    )}
                    {/**
                     * 하위 묶음 · 같은 목록을 재귀로 이어 깊이에 따라 들여쓰기
                     */}
                    {entry.kind === "group" && (
                        <Fragment>
                            <span className={clsx("wg_shellNavList__branch")}>{entry.group.name}</span>
                            <WgShellNavList group={entry.group} currentDoc={props.currentDoc} />
                        </Fragment>
                    )}
                </li>
            ))}
        </ul>
    );
};
