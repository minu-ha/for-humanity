import {copyFile} from "node:fs/promises";

/*
 * 공식 사이트의 캐시 헤더와 404 페이지, 패키지 CLI 출력과 분리
 */
for (const file of ["_headers", "404.html"]) {
    await copyFile(new URL(`../.cloudflare/${file}`, import.meta.url), new URL(`../content/dist/${file}`, import.meta.url));
}
