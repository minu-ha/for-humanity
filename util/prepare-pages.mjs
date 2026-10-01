import {copyFile} from "node:fs/promises";

/*
 * 이 저장소의 문서 사이트에만 필요한 Pages 파일 · 패키지 CLI의 일반 출력과 분리
 */
for (const file of ["_headers", "404.html"]) {
    await copyFile(new URL(`../.cloudflare/${file}`, import.meta.url), new URL(`../templates/document/dist/${file}`, import.meta.url));
}
