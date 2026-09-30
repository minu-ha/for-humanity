/*
 * 문서를 사람이 읽기 좋은 모양으로 바꾸는 remark · rehype 플러그인.
 * 브라우저에서 하던 일(번호 글자, 가름 머리, 흐름도, 알약, 색 칩, 표 상자)을 전부 빌드 때 한다. 그래서 JS 없이도 다 보인다.
 */
import { dirname, posix, relative } from 'node:path'
import { visit, SKIP } from 'unist-util-visit'
import { renderFlow } from './grid.mjs'

const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const plainText = (node) => ('value' in node ? node.value : (node.children ?? []).map(plainText).join(''))

const html = (value) => ({ type: 'html', value })

/**
 * 가름. `::part[이름]` 한 줄을 가름 머리로 바꾸고, 바로 다음 절(h2)의 차례를 머리말에 적어 목차가 같은 자리에서 끊기게 한다
 */
export const remarkParts = () => (tree, file) => {
  const parts = {}
  let h2 = 0
  let pending = null

  for (const node of tree.children) {
    if (node.type === 'leafDirective' && node.name === 'part') {
      pending = plainText(node).trim()
      Object.assign(node, html(`<div class="fh_index__part"><span class="fh_index__partLabel">${escapeHtml(pending)}</span></div>`))
      delete node.children
      delete node.name
      delete node.attributes
    } else if (node.type === 'heading' && node.depth === 2) {
      if (pending) {
        parts[h2] = pending
        pending = null
      }

      h2 += 1
    }
  }

  file.data.astro.frontmatter.fhParts = parts
}

/**
 * 문서 머리. 눈썹 줄(사이트 · 묶음 · 파일), 머리말 name 으로 만든 h1, 첫 절 앞의 글을 한 덩어리로 묶는다
 */
export const remarkHead = ({ title }) => (tree, file) => {
  const frontmatter = file.data.astro?.frontmatter ?? {}
  const first = tree.children.findIndex((node) => node.type === 'heading' && node.depth === 2)
  const lead = tree.children.splice(0, first === -1 ? tree.children.length : first)
  const fileName = file.history[0]?.split('/').at(-1) ?? ''
  const eyebrow = [title, frontmatter.group, fileName].filter(Boolean).map((text) => `<span>${escapeHtml(text)}</span>`).join('')

  tree.children.unshift({
    type: 'fhHead',
    data: { hName: 'header', hProperties: { className: ['fh_index__head'] } },
    children: [html(`<div class="fh_index__eyebrow">${eyebrow}</div>`), { type: 'heading', depth: 1, children: [{ type: 'text', value: frontmatter.name ?? '' }] }, ...lead],
  })
}

/**
 * 흐름도. ```mermaid 원문을 beautiful-mermaid 격자 SVG 로 바꾼다. 그리지 못하면 파일과 줄을 들어 빌드를 멈춘다
 */
export const remarkFlow = () => (tree, file) => {
  visit(tree, 'code', (node, index, parent) => {
    if (node.lang !== 'mermaid') {
      return
    }

    let svg

    try {
      svg = renderFlow(node.value)
    } catch (error) {
      file.fail(`흐름도를 그리지 못했다: ${error.message}`, node)
    }

    parent.children[index] = html(`<div class="fh_index__flow">${svg}</div>`)
  })
}

/**
 * 상태 표지. 설정에 적은 문구("확인됨 2026-09-30", "확인되지 않았다")를 알약으로 바꾼다. 코드, 링크, 제목 안은 그대로 둔다
 */
export const remarkStatus = ({ status }) => {
  const phrases = status.map((item) => ({ ...item, source: item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (item.date ? '(?: \\d{4}-\\d{2}-\\d{2})?' : '') }))
  const pattern = new RegExp(`\\((${phrases.map((item) => item.source).join('|')})\\)|(${phrases.map((item) => item.source).join('|')})`, 'g')
  const kindOf = (text) => phrases.find((item) => text.startsWith(item.phrase))?.kind ?? 'verified'

  const walk = (node) => {
    if (node.type === 'link' || node.type === 'heading' || node.type === 'code' || node.type === 'inlineCode' || !node.children) {
      return
    }

    node.children = node.children.flatMap((child) => {
      if (child.type !== 'text' || !pattern.test(child.value)) {
        walk(child)

        return [child]
      }

      pattern.lastIndex = 0

      const out = []
      let last = 0

      for (const match of child.value.matchAll(pattern)) {
        const text = match[1] ?? match[2]

        out.push({ type: 'text', value: child.value.slice(last, match.index) })
        out.push(html(`<span class="fh_index__pill fh_index__pill--${kindOf(text)}">${escapeHtml(text)}</span>`))
        last = match.index + match[0].length
      }

      out.push({ type: 'text', value: child.value.slice(last) })

      return out
    })
  }

  return (tree) => walk(tree)
}

/**
 * 색 칩. 색 값 하나만 든 코드(`#e80030`) 앞에 그 색을 칠한다
 */
export const remarkSwatch = () => (tree) => {
  visit(tree, 'inlineCode', (node) => {
    const value = node.value.trim()

    if (/^#[0-9a-f]{3,8}$/i.test(value)) {
      node.data = { hProperties: { className: ['fh_index__color'], style: `--app-color-chip: ${value}` } }
    }
  })
}

/**
 * 링크. 다른 문서의 .md 로 건 링크(GitHub 에서도 열리는 꼴)를 사이트 주소로 바꾼다
 */
export const remarkLinks = ({ root }) => (tree, file) => {
  const here = dirname(relative(root, file.history[0] ?? root))

  visit(tree, 'link', (node) => {
    const match = /^(?![a-z]+:|\/|#)([^#?]+)\.mdx?(#.*)?$/i.exec(node.url)

    if (match) {
      node.url = `/${posix.join(here, match[1]).toLowerCase()}/${match[2] ?? ''}`
    }
  })
}

/**
 * 없는 부품 이름. 아는 지시문은 앞의 플러그인이 모두 바꿨으니, 남은 블록 지시문은 오타다.
 * 글 속의 `:` 뒤 낱말은 원문으로 되돌린다 (시간 표기나 "예:이것" 같은 글이 지시문으로 읽히는 것을 막는다)
 */
export const remarkUnknownDirectives = () => (tree, file) => {
  visit(tree, (node, index, parent) => {
    if (node.type === 'textDirective') {
      parent.children[index] = { type: 'text', value: String(file.value).slice(node.position.start.offset, node.position.end.offset) }

      return SKIP
    }

    if (node.type === 'leafDirective' || node.type === 'containerDirective') {
      file.fail(`모르는 부품이다: ${node.name}`, node)
    }
  })
}

const sectionNumber = (index) => String(index).padStart(2, '0')

/**
 * 절 번호. h2 는 00 · 01, h3 는 01.A 꼴이다. raw 노드로 넣어 heading id 와 목차 글자에는 섞이지 않는다
 */
export const rehypeNumbers = () => (tree) => {
  let h2 = -1
  let h3 = 0

  for (const node of tree.children) {
    if (node.type !== 'element') {
      continue
    }

    if (node.tagName === 'h2') {
      h2 += 1
      h3 = 0
      node.children.unshift({ type: 'raw', value: `<span class="fh_index__num">${sectionNumber(h2)}</span>` })
    } else if (node.tagName === 'h3' && h2 >= 0) {
      node.children.unshift({ type: 'raw', value: `<span class="fh_index__num">${sectionNumber(h2)}.${String.fromCharCode(65 + h3)}</span>` })
      h3 += 1
    }
  }
}

/**
 * 표 상자. 넓은 표는 상자 안에서 가로로 민다
 */
export const rehypeTables = () => (tree) => {
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'table' || !parent) {
      return
    }

    parent.children[index] = { type: 'element', tagName: 'div', properties: { className: ['fh_index__table'] }, children: [node] }

    return [SKIP, index + 1]
  })
}

/**
 * 목차의 번호. rehypeNumbers 와 같은 차례로 매긴다
 */
export const tocNumbers = (headings) => {
  let h2 = -1
  let h3 = 0

  return headings.map((heading) => {
    if (heading.depth === 2) {
      h2 += 1
      h3 = 0

      return sectionNumber(h2)
    }

    if (heading.depth === 3 && h2 >= 0) {
      return `${sectionNumber(h2)}.${String.fromCharCode(65 + h3++)}`
    }

    return ''
  })
}
