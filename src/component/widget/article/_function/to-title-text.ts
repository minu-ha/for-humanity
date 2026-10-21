import type {PhrasingContent} from "mdast";

/**
 * 지시문 제목의 일반 텍스트. 링크, 강조, 코드 같은 서식이 있으면 undefined
 *
 *   - textDirective는 원문 복원. 예:이것 같은 일반 문장의 오인 방지
 */
export const toTitleText = (children: PhrasingContent[], source: string) => {
    if (children.some((child) => child.type !== "text" && child.type !== "textDirective")) {
        return undefined;
    }

    return children
        .map((child) => (child.type === "text" ? child.value : source.slice(child.position?.start.offset, child.position?.end.offset)))
        .join("")
        .trim();
};
