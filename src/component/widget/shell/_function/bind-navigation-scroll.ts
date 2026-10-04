import {navigation_mobile_query, navigation_scroll_storage_key} from "@/component/widget/shell/_constant/navigation";
import {restoreNavigationScroll} from "@/component/widget/shell/_function/restore-navigation-scroll";

/**
 * 문서 목록과 페이지 목차의 위치를 따로 저장 · TOC 길이가 목록 위치를 바꾸지 않음
 * 첫 데스크톱 복원은 HTML에서 완료 · 늦은 module 실행에서 다시 이동하지 않음
 */
export const bindNavigationScroll = () => {
    const navigation = document.querySelector<HTMLElement>("[data-navigation]");
    const documents = document.querySelector<HTMLElement>('[data-navigation-scroll="documents"]');
    const outline = document.querySelector<HTMLElement>('[data-navigation-scroll="outline"]');
    const dialog = document.querySelector<HTMLDialogElement>("[data-navigation-drawer]");
    const openButton = document.querySelector<HTMLButtonElement>("[data-navigation-open]");

    if (!navigation || !documents || !outline || !dialog || !openButton) {
        return;
    }

    const mobile = matchMedia(navigation_mobile_query);
    const layout = {mobile: mobile.matches};
    const ports = [documents, outline];
    const positions = new Map<string, Map<HTMLElement, number>>();
    const signature = [...navigation.querySelectorAll<HTMLAnchorElement>(".wg_shellNav__root a[href]")].map((link) => `${link.pathname}:${link.textContent}`).join("\n");

    /**
     * 숨김·닫기보다 먼저 마지막 위치 보존 · 저장소 차단 시에도 드로어 재열기 유지
     */
    const saveScroll = () => {
        if (layout.mobile !== mobile.matches || (mobile.matches && !dialog.open)) {
            return;
        }

        const key = `${navigation_scroll_storage_key}:${mobile.matches ? "drawer" : "desktop"}`;
        positions.set(key, new Map(ports.map((port) => [port, port.scrollTop])));

        try {
            sessionStorage.setItem(key, JSON.stringify({navigation: signature, pathname: location.pathname, documents: documents.scrollTop, outline: outline.scrollTop}));
        } catch {
            // 현재 페이지 안의 위치는 메모리에 유지 · 저장 실패가 링크 이동을 막지 않음
        }
    };

    /**
     * 열기·반응형 DOM 이동 완료 후 화면별 위치 복원
     */
    const restoreScroll = () => {
        layout.mobile = mobile.matches;

        if (mobile.matches && !dialog.open) {
            return;
        }

        const key = `${navigation_scroll_storage_key}:${mobile.matches ? "drawer" : "desktop"}`;
        const saved = positions.get(key);

        if (saved === undefined) {
            restoreNavigationScroll(key);
        } else {
            for (const port of ports) {
                const top = saved.get(port);

                if (top !== undefined) {
                    port.scrollTop = top;
                }
            }
        }

        saveScroll();
    };

    for (const port of ports) {
        port.addEventListener("scroll", saveScroll, {passive: true});
    }

    // 캡처 단계에서 모바일의 기본 닫기보다 먼저 저장
    navigation.addEventListener("click", saveScroll, {capture: true});
    dialog.addEventListener("cancel", saveScroll);
    dialog.querySelector("[data-navigation-close]")?.addEventListener("click", saveScroll, {capture: true});
    dialog.addEventListener("click", saveScroll, {capture: true});
    openButton.addEventListener("click", restoreScroll);
    mobile.addEventListener("change", restoreScroll);
    addEventListener("pagehide", saveScroll);
    saveScroll();
};
