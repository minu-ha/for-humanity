import {createJSONStorage, persist, type StateStorage} from "zustand/middleware";
import {createStore} from "zustand/vanilla";
import type {NavigationScrollState} from "@/store/navigation/navigation-state";
import {navigation_scroll_storage_key, navigation_storage_version} from "@/store/navigation/navigation-storage";
import {toNavigationScrollState} from "@/store/navigation/to-navigation-scroll-state";

/**
 * 브라우저 저장소를 늦게 읽는 경계. 차단 환경과 테스트의 메모리 저장소 지원
 */
interface NavigationStorage {
    /**
     * 같은 탭 안에서만 복원할 스크롤 위치
     */
    session: () => StateStorage;
}

/**
 * 페이지별 브라우저 탐색 스토어
 *
 *   - 서버 요청은 이 생성기를 실행하지 않으며 저장 실패 시 메모리 상태 유지
 */
export const createNavigationStores = (options: NavigationStorage) => {
    /**
     * persist 저장 실패 격리, 메모리 기반 스크롤 동작 유지
     */
    const toSafeStorage = (getStorage: NavigationStorage["session"]): StateStorage => {
        return {
            getItem: (key) => {
                // persist 오류 경로에서 메모리 상태 유지, null 반환은 저장 상태 초기화에만 사용
                return getStorage().getItem(key);
            },
            setItem: (key, value) => {
                try {
                    return getStorage().setItem(key, value);
                } catch {
                    // 저장 실패 시 스토어의 메모리 상태 유지
                }
            },
            removeItem: (key) => {
                try {
                    return getStorage().removeItem(key);
                } catch {
                    // 저장소 차단 시에도 기본 탐색 유지
                }
            },
        };
    };

    return {
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
