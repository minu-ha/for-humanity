import {toNavigationDocument} from "@/component/widget/navigation/_function/to-navigation-data/_to-navigation-document";
import type {DocGroup} from "@/component/widget/navigation/_type/doc-group";
import type {NavigationGroup} from "@/component/widget/navigation/_type/navigation-data";

/**
 * 전체 묶음 경로와 본문 없는 하위 가지
 */
export const toNavigationGroup = (options: {group: DocGroup; current?: string}): NavigationGroup => ({
    name: options.group.name,
    path: options.group.path,
    docs: options.group.docs.map((doc) => toNavigationDocument({doc, current: options.current})),
    groups: options.group.groups.map((group) => toNavigationGroup({...options, group})),
});
