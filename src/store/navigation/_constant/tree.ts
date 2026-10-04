import type {NavigationTreeState} from "@/store/navigation/navigation-state";

/**
 * 서버에서 사용자 저장소 없이 모든 가지를 펼치는 고정 스냅샷
 */
export const tree_server_state: NavigationTreeState = {collapsed: {}};
