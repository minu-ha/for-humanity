/**
 * 순서도와 시퀀스의 화살표 끝 표식별 꺾쇠. 표식의 기준점에 끝이 닿는 속이 빈 작은 꺾쇠
 *
 *   - 제약: Mermaid 12는 끝 표식의 모양과 크기를 설정으로 받지 않음. 그린 SVG의 marker 안 도형을 교체
 *   - 표식 id의 끝은 Mermaid 12.2 기준. 목록 밖 표식(원, 엑스, 다른 유형)은 공식 모양 유지
 */
const open_arrow_paths: Record<string, string> = {
    "_flowchart-v2-pointEnd-margin": "M 4.5 3 L 11 7 L 4.5 11",
    "_flowchart-v2-pointStart-margin": "M 7 3 L 0.5 7 L 7 11",
    arrowhead: "M 2 1.5 L 7.9 5 L 2 8.5",
};

/**
 * 채운 삼각형 화살표를 본문 SVG 그림의 가는 선과 같은 굵기의 꺾쇠로 교체
 */
export const toOpenArrows = (root: ParentNode, color: string) => {
    for (const marker of root.querySelectorAll("marker")) {
        const suffix = Object.keys(open_arrow_paths).find((key) => marker.id.endsWith(key));

        if (suffix === undefined) {
            continue;
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        path.setAttribute("d", open_arrow_paths[suffix]);
        path.setAttribute("style", `fill: none; stroke: ${color}; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round;`);
        marker.replaceChildren(path);
    }
};
