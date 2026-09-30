#!/usr/bin/env node
/*
 * for-humanity <dev|build|preview> [문서 폴더]
 * 문서 폴더의 for-humanity.config.mjs 를 읽어 Astro 를 돌린다. 폴더를 빼면 지금 폴더다.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, dev, preview } from 'astro'
import { createAstroConfig } from '../src/astro-config.mjs'

const commands = { dev, build, preview }
const [command = 'dev', dir = '.'] = process.argv.slice(2)

if (!commands[command]) {
  console.error(`for-humanity: 모르는 명령이다: ${command} (dev, build, preview 중 하나)`)
  process.exit(1)
}

const root = resolve(dir)
const configFile = resolve(root, 'for-humanity.config.mjs')
const user = existsSync(configFile) ? (await import(pathToFileURL(configFile).href)).default : {}

// app/content.config.ts 가 문서 폴더를 찾는 길
process.env.FOR_HUMANITY_ROOT = root

await commands[command](createAstroConfig(root, user))
