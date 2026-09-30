/*
 * 브라우저에서 하는 일은 셋뿐이다. 테마 전환, 지금 읽는 절 표시, 주소의 #절로 들어왔을 때 글꼴이 바뀐 뒤 다시 맞추기.
 * 나머지(사이드바, 번호, 가름, 흐름도)는 빌드 때 이미 그려져 있어 JS 가 없어도 보인다
 */
const storageKey = 'fh-theme'
const labels = { system: '테마 · 시스템', light: '테마 · 밝게', dark: '테마 · 어둡게' }
type Theme = keyof typeof labels
const order: Theme[] = ['system', 'light', 'dark']

const readTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(storageKey)

    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

const button = document.querySelector<HTMLButtonElement>('.fh_index__theme')
let theme = readTheme()

const applyTheme = (next: Theme) => {
  if (next === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', next)
  }

  if (button) {
    button.textContent = labels[next]
  }
}

applyTheme(theme)
button?.addEventListener('click', () => {
  theme = order[(order.indexOf(theme) + 1) % order.length]
  applyTheme(theme)

  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // 저장이 막혀도 이번 방문에는 적용된 채로 둔다
  }
})

/*
 * 읽는 선에 걸린 절과 소제목을 켠다. 읽는 선은 제목이 서는 높이(--app-space-anchor)라 목차로 옮긴 곳이 곧 켜진다
 */
type Sub = { heading: HTMLElement; link: HTMLElement }
type Section = Sub & { list: HTMLElement | null; subs: Sub[] }

const target = (link: HTMLAnchorElement) => document.getElementById(decodeURIComponent(link.hash.slice(1)))
const sections: Section[] = []

for (const link of document.querySelectorAll<HTMLAnchorElement>('.fh_index__toc .fh_index__navLink')) {
  const heading = target(link)

  if (!heading) {
    continue
  }

  const list = link.parentElement?.querySelector<HTMLElement>('.fh_index__tocSub') ?? null
  const subs = [...(list?.querySelectorAll<HTMLAnchorElement>('.fh_index__tocSubLink') ?? [])].flatMap((sub) => {
    const subHeading = target(sub)

    return subHeading ? [{ heading: subHeading, link: sub }] : []
  })

  sections.push({ heading, link, list, subs })
}

if (sections.length > 0) {
  let frame = 0

  const markActive = () => {
    frame = 0

    // scroll-margin-top 은 vh 를 px 로 푼 값으로 읽힌다. 반올림 오차만큼 1px 여유를 둔다
    const line = parseFloat(getComputedStyle(sections[0].heading).scrollMarginTop) + 1
    const current = sections.findLast((section) => section.heading.getBoundingClientRect().top <= line) ?? sections[0]
    const sub = current.subs.findLast((item) => item.heading.getBoundingClientRect().top <= line)

    for (const section of sections) {
      section.link.classList.toggle('fh_index__navLink--active', section === current)
      section.list?.classList.toggle('fh_index__tocSub--open', section === current)

      for (const item of section.subs) {
        item.link.classList.toggle('fh_index__tocSubLink--active', item === sub)
      }
    }
  }

  const schedule = () => {
    frame ||= requestAnimationFrame(markActive)
  }

  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule)
  markActive()
}

/*
 * 주소의 #절로 들어오면 글꼴이 늦게 와 높이가 바뀐 뒤 한 번 더 맞춘다. 그새 사용자가 스크롤을 시작했으면 건너뛴다.
 * 쪽을 여는 동안은 부드러운 스크롤을 꺼 둔다 (layouts/Base.astro 머리). 켜 두면 브라우저가 처음 옮기는 움직임이
 * 글꼴이 오기 전 자리로 이어져, 여기서 맞춘 자리를 덮는다. 맞춘 뒤에 다시 켠다
 */
const hashTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null
let moved = false

if (hashTarget) {
  for (const type of ['wheel', 'touchmove', 'keydown', 'mousedown']) {
    addEventListener(type, () => (moved = true), { once: true, passive: true })
  }
}

// 글꼴 파일은 쪽의 load 무렵에야 요청이 끝나므로 load 뒤에 fonts.ready 를 기다린다
const settle = () =>
  document.fonts.ready.then(() => {
    if (hashTarget && !moved) {
      hashTarget.scrollIntoView({ behavior: 'instant' })
    }

    document.documentElement.style.removeProperty('scroll-behavior')
  })

if (document.readyState === 'complete') {
  settle()
} else {
  addEventListener('load', settle, { once: true })
}
