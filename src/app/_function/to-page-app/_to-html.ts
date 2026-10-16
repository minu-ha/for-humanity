import {html} from "hono/html";
import type {Child} from "hono/jsx";

/**
 * Hono JSX 페이지의 HTML 문서 선언, 서버와 정적 출력의 공통 직렬화
 */
export const toHtml = (page: Child) => {
    return html`<!DOCTYPE html>${page}`;
};
