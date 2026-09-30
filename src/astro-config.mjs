/*
 * 쓰는 사람의 문서 폴더(root)와 for-humanity.config.mjs 로 Astro 설정을 만든다.
 * 앱(쪽, 레이아웃, 스타일)은 이 패키지의 app/ 에 있고, 문서 폴더에는 Markdown 과 설정만 있다.
 */
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import { unified } from '@astrojs/markdown-remark'
import remarkDirective from 'remark-directive'
import {
  rehypeNumbers,
  rehypeTables,
  remarkFlow,
  remarkHead,
  remarkLinks,
  remarkParts,
  remarkStatus,
  remarkSwatch,
  remarkUnknownDirectives,
} from './markdown/plugins.mjs'

const appDir = fileURLToPath(new URL('../app/', import.meta.url))

const defaultStatus = [
  { phrase: '확인됨', kind: 'verified', date: true },
  { phrase: '확인되지 않았다', kind: 'unverified' },
]

/**
 * 앱이 읽는 설정. 빠진 값은 기본값으로 채운다
 */
export const resolveConfig = (user = {}) => ({
  title: user.title ?? 'Documents',
  description: user.description ?? '',
  status: user.status ?? defaultStatus,
})

/**
 * 앱에 설정을 넘기는 가상 모듈 (virtual:for-humanity/config)
 */
const configModule = (config) => ({
  name: 'for-humanity:config',
  resolveId: (id) => (id === 'virtual:for-humanity/config' ? '\0for-humanity:config' : undefined),
  load: (id) => (id === '\0for-humanity:config' ? `export default ${JSON.stringify(config)}` : undefined),
})

export const createAstroConfig = (root, user = {}) => {
  const config = resolveConfig(user)

  return {
    root,
    srcDir: appDir,
    publicDir: join(root, 'public'),
    outDir: join(root, 'dist'),
    cacheDir: join(root, 'node_modules', '.for-humanity'),
    configFile: false,
    integrations: [mdx(), react()],
    markdown: {
      syntaxHighlight: false,
      processor: unified({
        remarkPlugins: [
          remarkDirective,
          remarkParts,
          [remarkHead, config],
          remarkFlow,
          [remarkStatus, config],
          remarkSwatch,
          [remarkLinks, { root }],
          remarkUnknownDirectives,
        ],
        rehypePlugins: [rehypeNumbers, rehypeTables],
      }),
    },
    vite: {
      plugins: [configModule(config)],
      server: { fs: { allow: [appDir, root] } },
    },
  }
}
