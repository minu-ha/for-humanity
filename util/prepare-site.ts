import {copyFile} from "node:fs/promises";

/*
 * 공식 사이트의 캐시 헤더, 404는 패키지 공통 출력 사용
 */
await copyFile(new URL("../.cloudflare/_headers", import.meta.url), new URL("../content/dist/_headers", import.meta.url));
