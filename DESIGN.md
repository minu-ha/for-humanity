# for-humanity 의 모양

이 문서는 for-humanity 가 만든 쪽이 어떻게 보여야 하는지를 적는다. 값 (색 코드, px) 은 여기 없다.
값은 `src/style/token.css` 한 곳에만 있고, 이 문서는 어느 토큰을 언제 쓰는지를 말한다.
새 부품을 만들 때는 이 문서와 `token.css` 만 보면 된다. 규칙은 `.claude/skills/convention-css` 가, 기계로 볼 수 있는 것은 Stylelint 가 본다.

## 인상

- 종이에 인쇄한 기술 문서. 회색 글, 가는 선, 강조색 하나. 그림자 · 그라데이션 · 움직임이 없다.
- 표지 (절 번호, 라벨, 눈썹 줄, 표 머리) 는 모노 글꼴을 작게, 자간을 벌려 쓴다. 본문은 넉넉한 행간의 산세리프다.
- 한국어가 기본이다. 낱말 안에서 줄을 끊지 않고 (`keep-all`), 긴 식별자만 예외로 끊는다.
- 첫 화면과 문서 한 장이 같은 머리 (눈썹 · 제목 · 굵은 선) 를 쓴다.

## 토큰 이름

`--app-<종류>-<쓰임>`. 값이 아니라 쓰임으로 짓는다 (`--app-color-surface`, `--app-space-stack`). `white`, `gray-100`, `space-16` 같은 이름은 만들지 않는다.
컴포넌트 CSS 는 토큰을 대체값 없이 쓴다. 토큰이 아닌 값 (외부 변수, remark 가 넘긴 색) 에만 대체값을 붙인다.

| 종류             | 토큰                                                                   | 뜻                                                |
|------------------|------------------------------------------------------------------------|---------------------------------------------------|
| `color`          | `ground` `surface` `code`                                              | 바탕. 쪽 · 상자 · 코드 상자                       |
|                  | `text` `text-strong` `text-muted`                                      | 글. 본문 · 제목과 강조 · 표지와 곁들이는 글       |
|                  | `border` `border-soft`                                                 | 선. 상자와 목록 · 표 안 가로선                    |
|                  | `accent` `accent-soft`                                                 | 강조 하나와 그 바탕                               |
|                  | `verified` `unverified` (+`-soft`)                                     | 상태. 알약에만                                    |
| `font`           | `sans` `mono`                                                          | 글꼴                                              |
| `font-size`      | `label` `mark` `detail` `dense` `body` `lead` `part` `section` `title` | 크기 사다리 아홉 칸                               |
| `font-weight`    | `mark` `strong` `title`                                                | 굵기. 본문은 기본이라 없다                        |
| `line-height`    | `title` `heading` `tight` `code` `body`                                | 행간                                              |
| `letter-spacing` | `label` `brand` `heading` `title`                                      | 자간                                              |
| `space`          | `inline` `stack` `block` `section`                                     | 리듬                                              |
|                  | `page-top` `gutter` `column` `anchor`                                  | 쪽의 틀과 읽는 선                                 |
| `size`           | `sidebar` `page`                                                       | 쪽의 틀                                           |
| `radius`         | `pill` `card` `box` `inline` `mark`                                    | 모서리                                            |
| `outline`        | `focus` `focus-offset`                                                 | 포커스                                            |
| `code`           | `foreground` `background` `token-*`                                    | Shiki 가 칠하는 코드 색. 위의 역할 색을 다시 쓴다 |

## 색

- 바탕은 셋이다. 쪽은 `ground`, 그 위에 놓이는 상자 (카드, 표, 흐름도) 는 `surface`, 코드 상자만 `code`.
- 글은 셋이다. 본문은 `text`, 제목 · 굵은 글 · 지금 읽는 절은 `text-strong`, 표지 · 소제목 링크 · 카드 설명은 `text-muted`.
- 강조색은 `accent` 하나다. 링크, 절 번호, 지금 읽는 절의 왼선, 포커스 테두리, 인용의 세로선에 쓴다. `accent-soft` 는 그 바탕이다 (인용, 표 줄 hover).
- 상태색 (`verified` 초록, `unverified` amber) 은 알약에만 쓴다. 본문 강조에 쓰지 않는다.
- 새 색을 만들지 않는다. 필요한 역할이 없으면 `token.css` 에 역할을 더한다. 밝은 값과 어두운 값을 `light-dark()` 한 줄에 함께 적는다.
- 테마 분기는 컴포넌트에 없다. `:root` 의 `color-scheme` 이 시스템 · 밝게 · 어둡게를 고르고, 토큰이 알아서 바뀐다.
- 대비 기준: 글색은 놓이는 바탕 위에서 4.5:1 이상. `text-muted` 도, 알약 글도 그렇다. 선은 장식이라 기준이 없다.

## 글꼴

- 본문은 `--app-font-sans` (Pretendard). 표지 · 코드 · 흐름도 · 표 머리 · 절 번호 · 눈썹 · 사이드바 이름은 `--app-font-mono` (JetBrains Mono).
- 코드 글꼴에 없는 한글은 본문 글꼴로 떨어진다. 토큰이 그렇게 잇는다.
- 글꼴 파일은 `src/asset/font` 에 들어 있고 빌드가 결과 폴더에 넣는다. 읽는 사람은 CDN 에 닿지 않는다.
- 크기는 사다리 아홉 칸에서 고른다. 칸 사이 값을 만들지 않는다.

| 칸        | 어디에                                                                      |
|-----------|-----------------------------------------------------------------------------|
| `label`   | 목록 위 작은 표지, 목차 묶음 이름, 카드 묶음                                |
| `mark`    | 줄 앞 표지 (절 번호, 첫 글자), 표 머리, 눈썹, 사이드바 이름, 테마 단추      |
| `detail`  | 곁들이는 글. 소제목 링크, 코드 상자, 알약, 카드 설명, 좁은 화면의 목차 알약 |
| `dense`   | 촘촘한 글. 목차, 표 본문, h5                                                |
| `body`    | 본문, h4                                                                    |
| `lead`    | 제목 밑 첫 문단, h3, 카드 제목                                              |
| `part`    | 가름 머리                                                                   |
| `section` | h2                                                                          |
| `title`   | h1. 화면 폭을 따라 늘고 준다                                                |

- 굵기는 셋이다. 모노 표지는 `mark`, 제목 · 굵은 글 · 지금 읽는 절은 `strong`, h1 만 `title`.
- 행간은 글자가 클수록 좁다. 본문 `body`, 목록과 h3 와 카드 제목 `tight`, h2 `heading`, h1 `title`, 코드 상자 `code`.
- 자간은 작은 모노 표지에서 벌리고 (`label`, 사이드바 이름은 더 넓게 `brand`), 큰 제목에서 좁힌다 (`heading`, `title`).
- 코드는 합자를 끈다. `>=` 가 한 글자로 붙으면 옮겨 적을 때 헷갈린다.

## 간격

리듬 토큰은 넷이다. 여러 부품이 같은 박자로 쓰는 값만 토큰이고, 한 부품 안의 보정 (상자 안 여백, 목록 들여쓰기, 표 칸, 제목 위아래) 은 그 자리에 값으로 둔다.

| 토큰      | 박자                                             |
|-----------|--------------------------------------------------|
| `inline`  | 한 줄 안. 표지와 이름 사이, 눈썹 줄의 낱말 사이  |
| `stack`   | 본문 흐름. 문단 · 목록 아래, h1 아래             |
| `block`   | 본문 속 상자. 코드 · 표 · 흐름도 · 인용의 위아래 |
| `section` | 절 사이. h2 위                                   |

쪽의 틀은 `page-top` (위), `gutter` (좌우), `column` (사이드바와 본문 사이), `size-sidebar`, `size-page` 다.
좁은 화면 값은 `token.css` 가 같은 조건에서 바꾸므로 컴포넌트는 폭 조건 없이 토큰만 쓴다.
`anchor` 는 목차로 옮겼을 때 제목이 서는 높이이자 목차가 읽는 절을 정하는 선이다.

## 모양

- 선은 셋이다. 상자와 목록의 `1px` `border`, 문서 머리와 가름 밑의 `2px` `text-strong` 굵은 선, 인용의 `3px` `accent` 세로선. 셋 다 그 부품만의 것이라 토큰이 아니다.
- 모서리는 다섯이다. 본문 속 상자 `box`, 첫 화면 카드 `card`, 줄 안 코드와 알약 `inline`, 색 칩과 링크 포커스 `mark`, 단추와 좁은 화면의 목차 알약 `pill`.
- 그림자는 쓰지 않는다. 면은 선으로 가른다.
- 층 (`z-index`) 은 없다. 겹치는 요소가 생기면 `values-declare-stacking-layers-as-tokens` 의 네 층을 `token.css` 에 더한다.

## 상태

- hover: 색만 바뀐다. 글은 `text-strong` 으로, 테두리는 `accent` 로. 움직임 (transition) 은 없다. 넣게 되면 `--app-duration-*` 토큰을 먼저 만든다. `prefers-reduced-motion`
  은 `base.css` 가 이미 처리한다.
- focus-visible: 상호작용 요소 모두에 `--app-outline-focus` 와 `--app-outline-focus-offset`. 마우스 클릭에는 뜨지 않는다.
- 지금 (연 문서, 읽는 절): `accent` 왼선, `text-strong`, `strong` 굵기. 좁은 화면의 알약은 `accent` 테두리.
- 상태는 수정자 클래스 (`--active`, `--open`) 로 표현한다. `aria-*` 나 `data-*` 를 선택자로 잡지 않는다.

## 화면 폭

| 조건        | 무엇이 바뀌나                                                                                              |
|-------------|------------------------------------------------------------------------------------------------------------|
| 1024px 미만 | 한 칸. 사이드바가 위, 본문이 아래. 목차는 알약 줄이 되고 소제목은 접는다. `page-top`, `gutter` 가 줄어든다 |
| 640px 미만  | `page-top`, `gutter` 가 더 줄어든다                                                                        |

두 숫자는 CSS 변수로 쓸 수 없어 `wg-shell.css`, `_wg-shell-nav.css`, `token.css` 세 곳에 같은 값으로 있다. 찾을 때는 `width <` 로 찾는다.

## 코드 강조

Shiki 가 `--app-code-*` 이름으로 색을 칠한다. 새 색은 없다. 키워드는 `text-strong`, 함수는 `accent`, 문자열은 `verified`, 숫자와 상수는 `unverified`, 주석과 문장부호는 `text-muted`
다.
색을 바꾸려면 `token.css` 의 그 줄만 바꾼다.

## 새 부품을 만들 때

1. 색 · 글꼴 · 크기 · 모서리는 토큰만 쓴다. 파일에 색 코드나 새 글자 크기를 적지 않는다.
2. 여러 부품이 같은 값을 쓰게 되면 그때 토큰을 더한다. 한 부품 안의 값은 그 자리에 둔다.
3. 색을 더하면 `light-dark()` 로 두 값을 함께 적고, 글색은 4.5:1 을 확인한다.
4. 테마 · 화면 폭 분기를 컴포넌트에 두지 않는다. 폭 조건은 배치 (칸 수, 쌓는 방향) 에만 쓴다.
5. 상호작용 요소에는 hover 와 focus-visible 을 다 준다.
6. 표지는 모노 · `label` 또는 `mark` · 자간 `label`. 이 셋이 같이 간다.
7. 그림자, 그라데이션, 새 글꼴, 움직임을 더하지 않는다. 필요하면 이 문서를 먼저 고친다.
