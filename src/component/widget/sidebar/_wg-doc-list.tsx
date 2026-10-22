import clsx from "clsx";
import type {NavigationData, NavigationGroup} from "@/component/widget/sidebar/_type/navigation-data";
import {toPagePath} from "@/util/url/to-page-path";
import {toSitePath} from "@/util/url/to-site-path";
import "./_wg-doc-list.css";

/**
 * 한 단계의 문서 목록과 하위 묶음. 재귀에서도 같은 탐색 표현 유지
 */
export interface WgDocListProps {
    /**
     * 현재 단계의 문서와 하위 묶음
     */
    group: NavigationGroup;

    /**
     * 재귀 목록 전체에 적용할 배포 경로
     */
    basePath: NavigationData["basePath"];
}

export const WgDocList = (props: WgDocListProps) => {
    return (
        <ul className={clsx("wg_docList__root")} aria-label={props.group.name}>
            {/**
             * 문서 링크. 부모도 원래 파일 URL의 독립 페이지, 현재 한 문서에만 페이지 상태 부여
             */}
            {props.group.docs.map((doc) => {
                return (
                    <li className={clsx("wg_docList__item")} key={`doc:${doc.id}`}>
                        <a
                            className={clsx("wg_docList__link", doc.active && "wg_docList__link--active")}
                            href={toSitePath({basePath: props.basePath, path: toPagePath(doc.id)})}
                            title={doc.label}
                            aria-current={doc.active ? "page" : undefined}
                        >
                            {doc.name}
                        </a>

                        {/**
                         * 하위 문서. 부모 아래에서도 기존 목록의 들여쓰기와 키보드 이동 유지
                         */}
                        {doc.children.length > 0 && <WgDocList group={{name: doc.name, path: props.group.path, docs: doc.children, groups: []}} basePath={props.basePath} />}
                    </li>
                );
            })}

            {/**
             * 하위 묶음. 같은 목록의 재귀 렌더, 깊이별 들여쓰기
             */}
            {props.group.groups.map((group) => {
                return (
                    <li className={clsx("wg_docList__item")} key={`group:${JSON.stringify(group.path)}`}>
                        <span className={clsx("wg_docList__branch")}>{group.name}</span>
                        <WgDocList group={group} basePath={props.basePath} />
                    </li>
                );
            })}
        </ul>
    );
};
