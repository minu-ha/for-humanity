/*
 * 문서 모음. Astro 가 이 이름과 자리 (srcDir 바로 아래) 로 찾는다.
 * 문서 폴더의 Markdown 이 전부 문서이고, 머리말이 틀리면 빌드가 멈춘다
 */

import {defineCollection} from "astro:content";
import {pathToFileURL} from "node:url";
import {docsRoot} from "virtual:for-humanity/config";
import {glob} from "astro/loaders";
import {z} from "astro/zod";
import {doc_type} from "@/constant/doc";

export const collections = {
	docs: defineCollection({
		loader: glob({
			base: pathToFileURL(`${docsRoot}/`),
			pattern: ["**/*.{md,mdx}", "!**/node_modules/**", "!dist/**", "!README.md"],
		}),
		schema: z.object({
			/**
			 * 영어 이름. 문서 제목 (h1), 사이드바 문서 목록, 첫 화면 카드가 쓴다. 첫 글자가 목록의 표지다
			 */
			name: z.string(),
			/**
			 * 한글 이름. 카드의 둘째 줄, 사이드바 이름에 올리면 뜨는 글
			 */
			label: z.string(),
			/**
			 * 문서 종류
			 */
			type: z.enum(doc_type).default(doc_type.document),
			/**
			 * 첫 화면 카드와 문서 머리 윗줄의 묶음
			 */
			group: z.string(),
		}),
	}),
};
