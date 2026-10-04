import {useSyncExternalStore} from "hono/jsx";
import {tree_server_state} from "@/store/navigation/_constant/tree";
import type {createNavigationStores} from "@/store/navigation/create-navigation-stores";

/**
 * Hono 컴포넌트의 persist 구독 · 브라우저 최초 렌더도 저장된 값을 즉시 소비
 */
export const useNavigationTreeStore = (tree?: ReturnType<typeof createNavigationStores>["tree"]) => {
    const subscribe = tree === undefined ? () => () => {} : tree.subscribe;
    const getSnapshot = tree === undefined ? () => tree_server_state : tree.getState;
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
