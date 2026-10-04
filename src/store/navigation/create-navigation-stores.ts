import {createJSONStorage, persist, type StateStorage} from "zustand/middleware";
import {createStore} from "zustand/vanilla";
import type {NavigationScrollState, NavigationTreeState} from "@/store/navigation/navigation-state";
import {navigation_scroll_storage_key, navigation_storage_version, navigation_tree_storage_key} from "@/store/navigation/navigation-storage";
import {toNavigationScrollState} from "@/store/navigation/to-navigation-scroll-state";
import {toNavigationTreeState} from "@/store/navigation/to-navigation-tree-state";

/**
 * 브라우저 저장소를 늦게 읽는 경계 · 차단 환경과 테스트의 메모리 저장소 지원
 */
interface NavigationStorage {
    /**
     * 브라우저 재실행 후에도 유지할 접힘 선택
     */
    local: () => StateStorage;
    /**
     * 같은 탭 안에서만 복원할 스크롤 위치
     */
    session: () => StateStorage;
}

/**
 * 브라우저 탐색의 vanilla 스토어 생성기 · React Hook이 아니므로 use- 접두사를 붙이지 않음
 * 서버 요청은 이 생성기를 실행하지 않으며 저장 실패 시 메모리 상태 유지
 */
export const createNavigationStores = (options: NavigationStorage) => {
    /**
     * 저장소 접근이 막혀도 persist 갱신이 버튼·스크롤 동작을 중단하지 않도록 격리
     */
    const toSafeStorage = (getStorage: NavigationStorage["local"]): StateStorage => {
        return {
            getItem: (key) => {
                // persist의 읽기 오류 경로로 보내 기존 메모리 상태를 유지 · null은 실제 저장소 초기화에만 사용
                return getStorage().getItem(key);
            },
            setItem: (key, value) => {
                try {
                    return getStorage().setItem(key, value);
                } catch {
                    /* 저장 실패 시에도 스토어의 메모리 상태는 유지 */
                }
            },
            removeItem: (key) => {
                try {
                    return getStorage().removeItem(key);
                } catch {
                    /* 저장소 차단이 탐색을 막지 않음 */
                }
            },
        };
    };

    return {
        tree: createStore<NavigationTreeState>()(
            persist(() => ({collapsed: {}}), {
                name: navigation_tree_storage_key,
                version: navigation_storage_version,
                storage: createJSONStorage(() => toSafeStorage(options.local)),
                merge: (persisted) => toNavigationTreeState(persisted),
                migrate: () => ({collapsed: {}}),
            }),
        ),
        scroll: createStore<NavigationScrollState>()(
            persist(() => ({positions: {}}), {
                name: navigation_scroll_storage_key,
                version: navigation_storage_version,
                storage: createJSONStorage(() => toSafeStorage(options.session)),
                merge: (persisted) => toNavigationScrollState(persisted),
                migrate: () => ({positions: {}}),
            }),
        ),
    };
};
