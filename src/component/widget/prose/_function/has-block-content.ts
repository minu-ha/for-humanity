import type {Nodes} from "mdast";

/**
 * 부품 본문의 내용 판정 · 참조 정의·주석·빈 텍스트와 빈 구조 제외
 * 이미지·표·구분선·주석 외 원시 HTML은 본문 요소
 */
export const hasBlockContent = (node: Nodes): boolean => {
    if (node.type === "definition") {
        return false;
    }

    if (node.type === "html") {
        // HTML의 빈 주석·대체 닫힘·미종결 주석 포함
        return node.value.replace(/<!--(?:>|->|[\s\S]*?(?:--!?>|$))/g, "").trim() !== "";
    }

    if ("value" in node) {
        return node.value.trim() !== "";
    }

    if (node.type === "table" || node.type === "textDirective") {
        return true;
    }

    if ("children" in node) {
        return node.children.some(hasBlockContent);
    }

    return true;
};
