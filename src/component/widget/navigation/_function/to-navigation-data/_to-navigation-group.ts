import {toNavigationDocument} from "@/component/widget/navigation/_function/to-navigation-data/_to-navigation-document";
import type {NavigationGroup} from "@/component/widget/navigation/_type/navigation-data";
import type {DocGroup} from "@/type/doc-group";

/**
 * 전체 묶음 경로와 본문 없는 하위 가지 · 현재 문서의 경로만 트리선으로 연결
 */
export const toNavigationGroup = (options: {group: DocGroup; current?: string; ancestors: Set<string>; currentGroup?: string[]}): NavigationGroup => ({
    name: options.group.name,
    path: options.group.path,
    current: options.group.path.every((name, index) => name === options.currentGroup?.[index]),
    docs: options.group.docs.map((doc) => toNavigationDocument({doc, current: options.current, ancestors: options.ancestors})),
    groups: options.group.groups.map((group) => toNavigationGroup({...options, group})),
});
