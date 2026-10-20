import {createJSONStorage, persist, type StateStorage} from "zustand/middleware";
import {createStore} from "zustand/vanilla";
import {storage_scroll_key, storage_version} from "@/store/navigation/_constant/storage";
import {type NavigationScrollState, navigationScrollStateSchema} from "@/store/navigation/navigation-state";

/**
 * 브라우저 저장소의 지연 조회 경계. 차단 환경과 테스트의 메모리 저장소 지원
 */
interface NavigationStoresParams {
    /**
     * 같은 탭 안에서만 복원할 스크롤 위치
     */
    session: () => StateStorage;
}

/**
 * 페이지별 브라우저 탐색 스토어
 *
 *   - 브라우저 진입점에서만 생성, 서버 요청 간 상태 공유 금지
 *   - 읽기 오류는 persist에서 처리, 쓰기 오류는 메모리 상태 유지
 */
export const toNavigationStores = (params: NavigationStoresParams) => {
    const storage = createJSONStorage<NavigationScrollState>(() => {
        return {
            getItem: (key) => {
                return params.session().getItem(key);
            },
            setItem: (key, value) => {
                try {
                    params.session().setItem(key, value);
                } catch {
                    // 용량 부족, 저장소 차단 시 현재 탭의 상태 유지
                }
            },
            removeItem: (key) => {
                try {
                    params.session().removeItem(key);
                } catch {
                    // 저장소 차단 시에도 기본 탐색 유지
                }
            },
        };
    });

    return {
        scroll: createStore<NavigationScrollState>()(
            persist(() => ({positions: {}}), {
                name: storage_scroll_key,
                version: storage_version,
                storage,
                merge: (persisted, current) => {
                    const result = navigationScrollStateSchema.safeParse(persisted);

                    return result.success ? result.data : current;
                },
            }),
        ),
    };
};
