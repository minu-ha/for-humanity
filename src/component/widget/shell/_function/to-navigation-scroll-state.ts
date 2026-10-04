import type {NavigationPosition, NavigationScrollState} from "@/component/widget/shell/_type/navigation-state";

/**
 * 알 수 없는 저장 형태·음수·무한 좌표 제외 · 초기 HTML과 Zustand에 같은 검증 적용
 */
export const toNavigationScrollState = (value: unknown): NavigationScrollState => {
    /**
     * 한 배치의 완전한 좌표만 복원 대상으로 수용
     */
    const toPosition = (position: unknown): NavigationPosition | undefined => {
        if (
            typeof position !== "object" ||
            position === null ||
            !("navigation" in position) ||
            typeof position.navigation !== "string" ||
            !("pathname" in position) ||
            typeof position.pathname !== "string" ||
            !("documents" in position) ||
            typeof position.documents !== "number" ||
            !Number.isFinite(position.documents) ||
            position.documents < 0 ||
            !("outline" in position) ||
            typeof position.outline !== "number" ||
            !Number.isFinite(position.outline) ||
            position.outline < 0
        ) {
            return;
        }
        return {navigation: position.navigation, pathname: position.pathname, documents: position.documents, outline: position.outline};
    };

    if (typeof value !== "object" || value === null || !("positions" in value) || typeof value.positions !== "object" || value.positions === null) {
        return {positions: {}};
    }

    const positions = {
        wide: toPosition("wide" in value.positions ? value.positions.wide : undefined),
        desktop: toPosition("desktop" in value.positions ? value.positions.desktop : undefined),
        drawer: toPosition("drawer" in value.positions ? value.positions.drawer : undefined),
    };
    return {positions: Object.fromEntries(Object.entries(positions).filter((entry) => entry[1] !== undefined))};
};
