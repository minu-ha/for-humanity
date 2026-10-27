import type {Root} from "hast";
import {visit} from "unist-util-visit";

/**
 * 문단에 이미지 하나만 있는 그림의 래퍼. SVG 그림은 좁은 화면에서 표처럼 가로 스크롤
 *
 *   - SVG의 width, height는 작성자가 정한 CSS 픽셀. 래스터는 촬영 배율을 알 수 없어 화면 폭에 맞춤
 *   - 속성을 적은 원시 HTML 문단은 작성자 마크업으로 유지
 */
export const rehypeFigures = () => (tree: Root) => {
    visit(tree, "element", (node) => {
        const children = node.children.filter((child) => child.type !== "text" || child.value.trim() !== "");
        const image = children[0];

        if (node.tagName !== "p" || Object.keys(node.properties).length > 0 || children.length !== 1 || image.type !== "element" || image.tagName !== "img") {
            return;
        }

        // 내용 지문 URL로 바꾸기 전의 작성 경로. 쿼리와 해시 제외 확장자
        const svg = typeof image.properties.src === "string" && /\.svg(?:[?#]|$)/i.test(image.properties.src);

        node.tagName = "div";
        node.properties = svg ? {className: ["wg_article__figure", "wg_article__figure--svg"], tabIndex: 0} : {className: ["wg_article__figure"]};
    });
};
