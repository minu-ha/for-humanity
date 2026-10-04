import type {NavigationLayout} from "@/store/navigation/navigation-state";
import type {toNavigationScrollState} from "@/store/navigation/to-navigation-scroll-state";

/**
 * 초기 HTML과 저장 스토어가 같은 좌표 형태를 소비하는 복원 경계
 */
interface RestoreNavigationScrollOptions {
    /**
     * persist 키 · 이전 배치별 키의 접두사도 동일
     */
    key: string;
    /**
     * 수용할 저장 형태 버전
     */
    version: number;
    /**
     * 현재 표시 중인 화면 배치
     */
    layout: NavigationLayout;
    /**
     * persist와 같은 저장 자료 검증
     */
    toState: typeof toNavigationScrollState;
}

/**
 * 탐색 진입점에서 첫 paint 전 복원 · 기존 배치별 저장 자료도 한 번 수용
 */
export const restoreNavigationScroll = (options: RestoreNavigationScrollOptions) => {
    const navigation = document.querySelector<HTMLElement>("[data-navigation]");
    const documents = document.querySelector<HTMLElement>('[data-navigation-scroll="documents"]');
    const outline = document.querySelector<HTMLElement>('[data-navigation-scroll="outline"]');
    if (!navigation || !documents || !outline) return;
    // module을 기다리는 동안 breakpoint가 바뀌었는지 구분 · 자료가 없어도 적용 배치는 기록
    navigation.dataset.navigationLayout = options.layout;

    try {
        const value = sessionStorage.getItem(options.key);
        const stored: unknown = value === null ? undefined : JSON.parse(value);
        const state =
            typeof stored === "object" && stored !== null && "version" in stored && stored.version === options.version && "state" in stored
                ? options.toState(stored.state)
                : {positions: {}};
        const legacy = sessionStorage.getItem(`${options.key}:${options.layout === "drawer" ? "drawer" : "desktop"}`);
        const previous =
            state.positions[options.layout] === undefined && legacy !== null
                ? options.toState({positions: {[options.layout]: JSON.parse(legacy)}}).positions[options.layout]
                : undefined;
        const position = state.positions[options.layout] ?? previous;
        const signature = [...navigation.querySelectorAll<HTMLAnchorElement>(".wg_shellNav__root a[href]")].map((link) => `${link.pathname}:${link.textContent}`).join("\n");
        if (position === undefined || position.navigation !== signature) return;

        documents.scrollTop = position.documents;
        // 공통 문서 목록은 페이지 간 공유 · 목차는 같은 페이지에서만 재사용
        if (position.pathname === location.pathname) outline.scrollTop = position.outline;
    } catch {
        // 차단·손상된 저장소는 복원만 생략 · 기본 링크와 스크롤 유지
    }
};
