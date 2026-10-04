import type {NavigationTreeState} from "@/store/navigation/navigation-state";

/**
 * persist 저장 자료에서 boolean 접힘 선택만 수용
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
