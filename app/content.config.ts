/*
 * 문서 모음. 쓰는 사람의 문서 폴더(FOR_HUMANITY_ROOT)에 있는 Markdown 이 전부 문서다.
 * 머리말이 틀리면 빌드가 멈춘다.
 */
import { pathToFileURL } from 'node:url'
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const root = process.env.FOR_HUMANITY_ROOT ?? process.cwd()

export const collections = {
  docs: defineCollection({
    loader: glob({
      base: pathToFileURL(`${root}/`),
      pattern: ['**/*.{md,mdx}', '!**/node_modules/**', '!dist/**', '!README.md'],
    }),
    schema: z.object({
      // 영어 이름. 문서 제목(h1), 사이드바 문서 목록, 첫 화면 카드가 쓴다. 첫 글자가 목록의 표지다
      name: z.string(),
      // 한글 이름. 카드의 둘째 줄, 사이드바 이름에 올리면 뜨는 글
      label: z.string(),
      type: z.enum(['document', 'blueprint']).default('document'),
      // 첫 화면 카드와 문서 머리 윗줄의 묶음
      group: z.string().default(''),
    }),
  }),
}
