/*
 * 첫 화면 전 Hono 클라이언트 JSX 마운트 · 본문은 서버가 만든 HTML 유지
 */
import {render} from "hono/jsx/dom";
import {navigationDataSchema} from "@/component/widget/navigation/_constant/navigation-data-schema";
import {WgNavigation} from "@/component/widget/navigation/wg-navigation";
import {createNavigationStores} from "@/store/navigation/create-navigation-stores";

const root = document.querySelector<HTMLElement>("[data-navigation-root]");
const payload = document.getElementById("fh-navigation-data");

if (root !== null && payload !== null) {
    try {
        const value: unknown = JSON.parse(payload.textContent);
        const data = navigationDataSchema.parse(value);
        const stores = createNavigationStores({local: () => localStorage, session: () => sessionStorage});
        render(<WgNavigation data={data} stores={stores} />, root);
    } catch (error) {
        // 초기화 오류는 서버의 기본 탐색을 유지 · 문서 링크와 네이티브 스크롤 사용 가능
        console.error("for-humanity navigation initialization failed", error);
    }
}
