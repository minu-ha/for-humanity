import {html} from "hono/html";
import type {Child} from "hono/jsx";

/**
 * Hono JSX 문서의 HTML 선언, 페이지 응답과 정적 출력 공용
 */
export const toHtml = (page: Child) => {
    return html`<!DOCTYPE html>${page}`;
};
