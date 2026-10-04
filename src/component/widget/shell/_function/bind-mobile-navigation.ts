import {navigation_mobile_query} from "@/component/widget/shell/_constant/navigation";
import {revealHashTarget} from "@/util/dom/reveal-hash-target";

/**
 * 같은 문서 탐색을 데스크톱 사이드바와 모바일 모달 사이에서 이동
 * 닫기·크기 변경에서 스크롤과 포커스 복원 · 초기화 실패 시 기본 목록 유지
 */
export const bindMobileNavigation = () => {
    const navigation = document.querySelector<HTMLElement>("[data-navigation]");
    const dialog = document.querySelector<HTMLDialogElement>("[data-navigation-drawer]");
    const content = document.querySelector<HTMLElement>("[data-navigation-content]");
    const openButton = document.querySelector<HTMLButtonElement>("[data-navigation-open]");
    const closeButton = document.querySelector<HTMLButtonElement>("[data-navigation-close]");
    const sidebar = navigation?.parentElement;

    if (!navigation || !dialog || !content || !openButton || !closeButton || !sidebar) {
        return;
    }

    const mobile = matchMedia(navigation_mobile_query);

    /**
     * Escape 등 네이티브 닫기에서도 배경 스크롤과 버튼의 상태 복원
     */
    const handleClose = () => {
        // 닫기 직후 다시 연 모달에 이전 close 이벤트가 개입하지 않도록 함
        if (dialog.open) {
            return;
        }

        document.body.classList.remove("wg_shell__root--drawerOpen");
        openButton.setAttribute("aria-expanded", "false");
    };

    /**
     * 기본 링크 이동보다 먼저 잠금 해제 · 네이티브 close가 열기 버튼으로 포커스 복원
     */
    const closeNavigation = () => {
        dialog.close();
        handleClose();
    };

    /**
     * 네이티브 모달로 외부 포커스 차단 · 모바일에서만 열기
     */
    const handleOpen = () => {
        if (!mobile.matches || dialog.open) {
            return;
        }

        dialog.showModal();
        document.body.classList.add("wg_shell__root--drawerOpen");
        openButton.setAttribute("aria-expanded", "true");
    };

    /**
     * 대화상자 바깥 배경 클릭만 닫기 · 내부의 빈 공간은 유지
     */
    const handleBackdropClick = (event: MouseEvent) => {
        const bounds = dialog.getBoundingClientRect();

        if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) {
            closeNavigation();
        }
    };

    /**
     * 링크의 기본 이동은 유지 · 목차는 닫은 뒤 실제 제목에 키보드 위치 전달
     */
    const handleNavigationClick = (event: MouseEvent) => {
        if (
            !dialog.open ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            !(event.target instanceof Element)
        ) {
            return;
        }

        const link = event.target.closest("a[href]");

        if (!(link instanceof HTMLAnchorElement) || (link.target !== "" && link.target !== "_self") || link.hasAttribute("download")) {
            return;
        }

        closeNavigation();

        if (link.origin === location.origin && link.pathname === location.pathname && link.search === location.search && link.hash) {
            const target = revealHashTarget(link.hash);

            if (target) {
                target.tabIndex = -1;
                target.focus({preventScroll: true});
            }
        }
    };

    /**
     * 반응형 전환에도 목록 중복 없음 · 열린 모달을 데스크톱으로 가져가기 전에 닫기
     */
    const handleLayoutChange = () => {
        const focused = document.activeElement;

        if (mobile.matches) {
            openButton.classList.add("wg_shell__menuToggle--visible");

            if (navigation.parentElement !== content) {
                content.append(navigation);
            }

            if (focused instanceof HTMLElement && navigation.contains(focused)) {
                openButton.focus({preventScroll: true});
            }

            return;
        }

        closeNavigation();

        // 첫 desktop 연결에서 같은 DOM을 재삽입하면 내부 스크롤이 0으로 초기화됨
        if (navigation.parentElement !== sidebar) {
            sidebar.append(navigation);
        }

        if (focused instanceof HTMLElement && navigation.contains(focused)) {
            focused.focus({preventScroll: true});
        } else if (focused === openButton || (focused instanceof HTMLElement && dialog.contains(focused))) {
            sidebar.querySelector<HTMLAnchorElement>(".wg_shell__brand")?.focus({preventScroll: true});
        }

        // CSS의 폭 조건이 먼저 버튼을 숨겨 포커스가 사라지지 않도록 복원 후 숨김
        openButton.classList.remove("wg_shell__menuToggle--visible");
    };

    openButton.addEventListener("click", handleOpen);
    closeButton.addEventListener("click", closeNavigation);
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleBackdropClick);
    navigation.addEventListener("click", handleNavigationClick);
    mobile.addEventListener("change", handleLayoutChange);
    handleLayoutChange();
    sidebar.classList.add("wg_shell__sidebar--navigationReady");
};
