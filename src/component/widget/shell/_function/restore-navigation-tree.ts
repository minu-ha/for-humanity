import type {toNavigationTreeState} from "@/component/widget/shell/_function/to-navigation-tree-state";

/**
 * import 없이 첫 paint 전에 사용할 저장 형태와 검증 함수
 */
interface RestoreNavigationTreeOptions {
    /**
     * persist의 저장 키
     */
    key: string;
    /**
     * 수용할 저장 형태 버전
     */
    version: number;
    /**
     * Zustand와 같은 자료 검증 · 함수 자체를 HTML에 포함
     */
    toState: typeof toNavigationTreeState;
}

/**
 * module을 기다리지 않고 저장한 접힘을 먼저 적용 · 전체 펼침이 기본이며 버튼은 동작 연결 후 표시
 */
export const restoreNavigationTree = (options: RestoreNavigationTreeOptions) => {
    try {
        const value = localStorage.getItem(options.key);
        if (value === null) return;
        const stored: unknown = JSON.parse(value);
        if (typeof stored !== "object" || stored === null || !("version" in stored) || stored.version !== options.version || !("state" in stored)) return;
        const tree = options.toState(stored.state);

        for (const button of document.querySelectorAll<HTMLButtonElement>("[data-navigation-toggle]")) {
            const controls = button.getAttribute("aria-controls");
            const target = controls === null ? null : document.getElementById(controls);
            if (!target || button.dataset.navigationToggle === undefined) continue;
            target.hidden = tree.collapsed[button.dataset.navigationToggle] === true;
        }
    } catch {
        // 차단·손상된 저장소는 복원만 생략 · 기본 문서 구조 유지
    }
};
