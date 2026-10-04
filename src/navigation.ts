/*
 * 탐색 DOM 직후 실행할 브라우저 진입점 · esbuild가 만든 IIFE를 HTML에 포함
 * 함수 직렬화와 늦은 module 초기화 없이 첫 paint 전에 상태 복원과 이벤트 연결 완료
 */

import {navigation_mobile_query, navigation_wide_query} from "@/component/widget/shell/_constant/navigation";
import {bindMobileNavigation} from "@/component/widget/shell/_function/bind-mobile-navigation";
import {bindNavigationOverflow} from "@/component/widget/shell/_function/bind-navigation-overflow";
import {bindNavigationScroll} from "@/component/widget/shell/_function/bind-navigation-scroll";
import {bindNavigationTree} from "@/component/widget/shell/_function/bind-navigation-tree";
import {restoreNavigationScroll} from "@/component/widget/shell/_function/restore-navigation-scroll";
import {createNavigationStores} from "@/store/navigation/create-navigation-stores";
import {navigation_scroll_storage_key, navigation_storage_version} from "@/store/navigation/navigation-storage";
import {toNavigationScrollState} from "@/store/navigation/to-navigation-scroll-state";

const navigationStores = createNavigationStores({local: () => localStorage, session: () => sessionStorage});
bindNavigationTree(navigationStores.tree);
bindMobileNavigation();
bindNavigationOverflow();

if (!matchMedia(navigation_mobile_query).matches) {
    restoreNavigationScroll({
        key: navigation_scroll_storage_key,
        version: navigation_storage_version,
        layout: matchMedia(navigation_wide_query).matches ? "wide" : "desktop",
        toState: toNavigationScrollState,
    });
}

bindNavigationScroll(navigationStores.scroll);
