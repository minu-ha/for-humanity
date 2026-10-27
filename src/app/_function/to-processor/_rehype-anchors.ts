import type {Root} from "hast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_warn_broken_anchor} from "@/constant/copy";

/**
 * 사이트 주소의 문서 id 와 hash. 홈은 id 빈 문자열
 */
const site_hash_pattern = /^\/([^?#]*?)\/?(?:\?[^#]*)?#(.+)$/;

/**
 * @helper 퍼센트 인코딩한 hash 의 원문. 해석 실패는 원문 그대로
 */
const toHash = (raw: string): string => {
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
};

/**
 * hash 링크의 대상 제목 검사
 *
 *   - 같은 문서의 `#id` 는 제목 수집 직후 파일 경고
 *   - 다른 문서의 `/id/#hash` 는 fh.anchors 에 모아 read-docs 가 전체 수집 뒤 대조. 홈은 제외
 *   - 외부 주소, 문서가 아닌 자원 주소는 제외
 */
export const rehypeAnchors = () => (tree: Root, file: VFile) => {
    const fh = file.data.fh;

    if (fh === undefined) {
        return;
    }

    const slugs = new Set(fh.headings.map((heading) => heading.slug));

    visit(tree, "element", (node) => {
        const href = node.properties.href;

        if (node.tagName !== "a" || typeof href !== "string") {
            return;
        }

        if (href.startsWith("#")) {
            const hash = toHash(href.slice(1));

            if (hash !== "" && !slugs.has(hash)) {
                file.message(`${copy_warn_broken_anchor}: ${href}`, node);
            }

            return;
        }

        const match = site_hash_pattern.exec(href);

        if (match === null || match[1] === "") {
            return;
        }

        fh.anchors.push({id: match[1], hash: toHash(match[2]), line: node.position?.start.line});
    });
};
