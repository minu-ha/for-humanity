import {createJSONStorage, persist, type StateStorage} from "zustand/middleware";
import {createStore} from "zustand/vanilla";
import {type NavigationScrollState, navigationScrollStateSchema} from "@/store/navigation/navigation-state";
import {navigation_scroll_storage_key, navigation_storage_version} from "@/store/navigation/navigation-storage";

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
    // 읽기 실패는 persist에서 처리, 쓰기 실패는 메모리 상태 유지
    const storage = createJSONStorage<NavigationScrollState>(() => ({
        getItem: (key) => {
            return options.session().getItem(key);
        },
        setItem: (key, value) => {
            try {
                return options.session().setItem(key, value);
            } catch {
                // 용량 부족, 저장소 차단 시 현재 탭의 상태 유지
            }
        },
        removeItem: (key) => {
            try {
                return options.session().removeItem(key);
            } catch {
                // 저장소 차단 시에도 기본 탐색 유지
            }
        },
    }));

    return {
        scroll: createStore<NavigationScrollState>()(
            persist(() => ({positions: {}}), {
                name: navigation_scroll_storage_key,
                version: navigation_storage_version,
                storage,
                merge: (persisted, current) => {
                    const result = navigationScrollStateSchema.safeParse(persisted);
                    return result.success ? result.data : current;
                },
            }),
        ),
    };
};
