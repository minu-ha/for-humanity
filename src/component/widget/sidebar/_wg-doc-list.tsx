import clsx from "clsx";
import {Fragment} from "hono/jsx";
import type {NavigationGroup} from "@/component/widget/sidebar/_type/navigation-data";
import "./_wg-doc-list.css";

/**
 * 한 단계의 문서 목록과 하위 묶음. 재귀에서도 같은 탐색 표현 유지
 */
export interface WgDocListProps {
    /**
     * 현재 단계의 문서와 하위 묶음
     */
    group: NavigationGroup;
}

export const WgDocList = (props: WgDocListProps) => {
    return (
        <ul className={clsx("wg_docList__root")} aria-label={props.group.name}>
            {/**
             * 문서 링크는 원래 파일 URL 사용
             */}
            {[
                ...props.group.docs.map((doc) => ({kind: "document" as const, key: `doc:${doc.id}`, doc})),
                ...props.group.groups.map((group) => ({kind: "group" as const, key: `group:${JSON.stringify(group.path)}`, group})),
            ].map((entry) => {
                return (
                    <li className={clsx("wg_docList__item")} key={entry.key}>
                        {/**
                         * 문서 링크. 부모도 독립 페이지, 현재 한 문서에만 페이지 상태 부여
                         */}
                        {entry.kind === "document" && (
                            <Fragment>
                                <a
                                    className={clsx("wg_docList__link", entry.doc.active && "wg_docList__link--active")}
                                    href={`/${entry.doc.id}/`}
                                    title={entry.doc.label}
                                    aria-current={entry.doc.active ? "page" : undefined}
                                >
                                    {entry.doc.name}
                                </a>

                                {/**
                                 * 하위 문서. 부모 아래에서도 기존 목록의 들여쓰기와 키보드 이동 유지
                                 */}
                                {entry.doc.children.length > 0 && <WgDocList group={{name: entry.doc.name, path: props.group.path, docs: entry.doc.children, groups: []}} />}
                            </Fragment>
                        )}

                        {/**
                         * 하위 묶음. 같은 목록을 재귀로 이어 깊이에 따라 들여쓰기
                         */}
                        {entry.kind === "group" && (
                            <Fragment>
                                <span className={clsx("wg_docList__branch")}>{entry.group.name}</span>
                                <WgDocList group={entry.group} />
                            </Fragment>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};
