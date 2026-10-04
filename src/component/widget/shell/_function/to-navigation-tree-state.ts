import type {NavigationTreeState} from "@/component/widget/shell/_type/navigation-state";

/**
 * 저장소 자료에서 boolean 접힘 선택만 수용 · HTML의 첫 paint 전에도 직렬화해 사용
 */
export const toNavigationTreeState = (value: unknown): NavigationTreeState => {
    if (
        typeof value !== "object" ||
        value === null ||
        !("collapsed" in value) ||
        typeof value.collapsed !== "object" ||
        value.collapsed === null ||
        Array.isArray(value.collapsed)
    ) {
        return {collapsed: {}};
    }

    return {collapsed: Object.fromEntries(Object.entries(value.collapsed).filter((entry) => typeof entry[1] === "boolean"))};
};
