import type {createNavigationStores} from "@/store/navigation/create-navigation-stores";
import {navigation_tree_storage_key} from "@/store/navigation/navigation-storage";

/**
 * persist 스토어를 문서·목차 버튼과 연결 · 닫은 자식의 키보드 포커스는 부모 버튼으로 복원
 */
export const bindNavigationTree = (tree: ReturnType<typeof createNavigationStores>["tree"]) => {
    const branches = [...document.querySelectorAll<HTMLButtonElement>("[data-navigation-toggle]")].flatMap((button) => {
        const key = button.dataset.navigationToggle;
        const label = button.dataset.navigationLabel;
        const controls = button.getAttribute("aria-controls");
        const target = controls === null ? null : document.getElementById(controls);
        return key !== undefined && label !== undefined && target !== null ? [{button, key, label, target}] : [];
    });

    /**
     * 값이 없는 가지는 펼침 · 링크·현재 위치 강조와 접힘 상태는 서로 독립
     */
    const renderTree = () => {
        for (const branch of branches) {
            const collapsed = tree.getState().collapsed[branch.key] === true;
            if (collapsed && branch.target.contains(document.activeElement)) branch.button.focus({preventScroll: true});
            branch.target.hidden = collapsed;
            branch.button.setAttribute("aria-expanded", String(!collapsed));
            branch.button.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} ${branch.label}`);
            branch.button.textContent = collapsed ? "+" : "−";
            branch.button.hidden = false;
        }
    };

    /**
     * 입력 순간의 스토어 값으로 반전 · 다른 페이지에서 바꾼 선택을 보존
     */
    const handleBranchClick = (key: string) => () => {
        tree.setState((state) => ({collapsed: {...state.collapsed, [key]: state.collapsed[key] !== true}}));
    };

    /**
     * 같은 origin의 다른 탭에서 바꾼 선택과 저장소 초기화 반영
     */
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === navigation_tree_storage_key || event.key === null) tree.persist.rehydrate();
    };

    /**
     * 뒤로 가기 캐시는 module을 재실행하지 않으므로 다음 페이지에서 바꾼 선택을 다시 읽음
     */
    const handlePageShow = (event: PageTransitionEvent) => {
        if (event.persisted) tree.persist.rehydrate();
    };

    for (const branch of branches) {
        branch.button.addEventListener("click", handleBranchClick(branch.key));
    }

    addEventListener("storage", handleStorageChange);
    addEventListener("pageshow", handlePageShow);
    tree.subscribe(renderTree);
    renderTree();
};
