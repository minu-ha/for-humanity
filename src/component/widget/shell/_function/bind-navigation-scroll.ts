import {navigation_mobile_query, navigation_scroll_storage_key} from "@/component/widget/shell/_constant/navigation";

/**
 * 문서 이동·새로고침에서 공유 탐색의 위치 유지 · 본문 스크롤과 독립
 * 저장소 실패는 기본 탐색 유지, 문서 목록 변경은 이전 위치를 사용하지 않음
 */
export const bindNavigationScroll = () => {
    const navigation = document.querySelector<HTMLElement>("[data-navigation]");
    const sidebar = document.querySelector<HTMLElement>(".wg_shell__sidebar");
    const dialog = document.querySelector<HTMLDialogElement>("[data-navigation-drawer]");
    const openButton = document.querySelector<HTMLButtonElement>("[data-navigation-open]");

    if (!navigation || !sidebar || !dialog || !openButton) {
        return;
    }

    const mobile = matchMedia(navigation_mobile_query);
    const layout = {mobile: mobile.matches};
    // 목차와 현재 상태는 페이지마다 바뀜 · 공통 문서 링크의 순서로 저장 위치의 유효성 판단
    const signature = [...navigation.querySelectorAll<HTMLAnchorElement>(".wg_shellNav__root a[href]")].map((link) => `${link.pathname}:${link.textContent}`).join("\n");
    const positions = new Map<HTMLElement, number>();
    const storageKeys = new Map<HTMLElement, string>([
        [sidebar, `${navigation_scroll_storage_key}:desktop`],
        [dialog, `${navigation_scroll_storage_key}:drawer`],
    ]);
    const userInput = new AbortController();

    for (const [port, key] of storageKeys) {
        try {
            const value = sessionStorage.getItem(key);

            if (value !== null) {
                const stored: unknown = JSON.parse(value);

                if (
                    typeof stored === "object" &&
                    stored !== null &&
                    "navigation" in stored &&
                    stored.navigation === signature &&
                    "top" in stored &&
                    typeof stored.top === "number" &&
                    Number.isFinite(stored.top) &&
                    stored.top >= 0
                ) {
                    positions.set(port, stored.top);
                }
            }
        } catch {
            // 차단되거나 손상된 저장소는 복원만 생략 · 스크롤과 기본 링크 이동 유지
        }

        for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
            port.addEventListener(type, () => userInput.abort(), {once: true, passive: true});
        }
    }
    const initialPositions = new Map(positions);

    /**
     * 네이티브 스크롤 범위로 복원 · 닫힌 드로어의 0 좌표는 복원하지 않음
     */
    const restoreScroll = () => {
        layout.mobile = mobile.matches;
        const port = mobile.matches ? dialog : sidebar;
        const top = positions.get(port);

        if (top === undefined || (mobile.matches && !dialog.open)) {
            return;
        }

        port.scrollTop = top;
    };

    /**
     * 드로어 닫기 이전 클릭·현재 스크롤·페이지 이탈에서 마지막 탐색 위치 저장
     */
    const saveScroll = (event: Event) => {
        const port = mobile.matches ? dialog : sidebar;
        const key = storageKeys.get(port);

        // 반응형 전환의 숨김·닫기 스크롤은 사용자 위치가 아님 · 활성 포트만 저장
        if (layout.mobile !== mobile.matches || (event.type === "scroll" && event.currentTarget !== port) || key === undefined || (mobile.matches && !dialog.open)) {
            return;
        }

        positions.set(port, port.scrollTop);

        try {
            sessionStorage.setItem(key, JSON.stringify({navigation: signature, top: port.scrollTop}));
        } catch {
            // 저장 실패도 같은 페이지의 드로어 재열기와 반응형 위치 복원은 유지
        }
    };

    /**
     * 글꼴로 탐색 높이가 달라진 경우 한 번만 재보정 · 사용자 입력이 먼저면 유지
     */
    const settleScroll = async () => {
        await document.fonts.ready;

        if (!userInput.signal.aborted) {
            const port = mobile.matches ? dialog : sidebar;
            const top = initialPositions.get(port);

            if (top !== undefined && (!mobile.matches || dialog.open)) {
                port.scrollTop = top;
            }
        }
    };

    sidebar.addEventListener("scroll", saveScroll, {passive: true});
    dialog.addEventListener("scroll", saveScroll, {passive: true});
    navigation.addEventListener("click", saveScroll, {capture: true});
    openButton.addEventListener("click", restoreScroll);
    mobile.addEventListener("change", restoreScroll);
    addEventListener("pagehide", saveScroll);
    restoreScroll();

    if (document.readyState === "complete") {
        settleScroll();
    } else {
        addEventListener("load", settleScroll, {once: true});
    }
};
