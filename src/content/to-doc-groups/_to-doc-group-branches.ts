import {locale_doc_group} from "@/constant/locale";
import {toDocBranches} from "@/content/to-doc-groups/_to-doc-branches";
import type {Doc} from "@/type/doc";
import type {DocGroup} from "@/type/doc-group";

/**
 * 같은 부모의 문서를 다음 경로 단계로 묶는 재귀 입력
 */
interface DocGroupBranchesOptions {
    /**
     * 부모 경로에 속한 문서
     */
    docs: readonly Doc[];
    /**
     * 검증된 부모 id별 문서 · 자손을 각 단계에서 다시 수집하지 않음
     */
    children: ReadonlyMap<Doc["data"]["parent"], Doc[]>;
    /**
     * 부모까지의 경로 · 최상위는 빈 배열
     */
    path: DocGroup["path"];
    /**
     * 전체 경로의 JSON 키와 navigation 위치
     */
    positions: ReadonlyMap<string, number>;
    /**
     * 미지정 경로를 지정한 묶음 뒤에 놓는 위치
     */
    unlistedPosition: number;
}

/**
 * 각 단계의 직접 문서와 하위 묶음을 분리 · 고정된 깊이 제한 없이 구성
 */
export const toDocGroupBranches = (options: DocGroupBranchesOptions): DocGroup[] => {
    return [
        ...Map.groupBy(
            options.docs.filter((doc) => doc.data.group.length > options.path.length),
            (doc) => doc.data.group[options.path.length],
        ),
    ]
        .map(([name, docs]) => {
            const path = [...options.path, name];

            return {
                name,
                path,
                docs,
                position: options.positions.get(JSON.stringify(path)) ?? options.unlistedPosition,
            };
        })
        .toSorted((a, b) => a.position - b.position || a.name.localeCompare(b.name, locale_doc_group))
        .map((group) => {
            return {
                name: group.name,
                path: group.path,
                docs: toDocBranches({
                    docs: group.docs.filter((doc) => doc.data.group.length === group.path.length && doc.data.parent === undefined),
                    children: options.children,
                }),
                groups: toDocGroupBranches({
                    docs: group.docs,
                    children: options.children,
                    path: group.path,
                    positions: options.positions,
                    unlistedPosition: options.unlistedPosition,
                }),
            };
        });
};
