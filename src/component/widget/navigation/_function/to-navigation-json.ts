import type {NavigationData} from "@/component/widget/navigation/_type/navigation-data";

/**
 * 작성한 이름이 script 종료 태그나 JavaScript 줄 구분자로 해석되지 않는 JSON
 */
export const toNavigationJson = (data: NavigationData) => {
    return JSON.stringify(data).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
};
