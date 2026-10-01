---
name: Design
label: 표현과 토큰
group: 개발
---

종이에 인쇄한 기술 문서의 리듬. 회색 글, 가는 선, 강조색 하나.
값의 단일 출처는 `src/style/token.css`. 이 문서는 역할과 사용 기준.

## 한눈에

- 본문: 한국어 산세리프 · 넉넉한 행간 · 낱말 단위 줄바꿈
- 라벨: 작은 모노 · 넓은 자간
- 머리: 첫 화면과 문서의 공통 라벨·제목·굵은 선
- 면의 구분: 선 · 그림자·그라데이션 없음
- 색의 선택: 역할별 토큰 · 시스템·밝게·어둡게

::part[토큰]

## 이름과 출처

`--app-<종류>-<쓰임>`. 값보다 역할 이름.
예: `--app-color-surface`, `--app-space-stack`.
컴포넌트의 공통 토큰은 대체값 없이 사용. 외부 변수와 문서별 색 값만 대체값 허용.

| Kind | Roles |
| --- | --- |
| `color` | 바탕 · 글 · 선 · 강조 · 상태 |
| `font` | `sans` 본문 · `mono` 코드·라벨 |
| `font-size` | `label` · `mark` · `detail` · `dense` · `body` · `lead` · `part` · `section` · `title` |
| `font-weight` | `mark` · `strong` · `title` |
| `line-height` | `title` · `heading` · `tight` · `code` · `body` |
| `letter-spacing` | `label` · `brand` · `heading` · `title` |
| `space` | `inline` · `stack` · `block` · `section` · 페이지 틀 |
| `size` | `sidebar` · `page` |
| `radius` | `pill` · `card` · `box` · `inline` · `mark` |
| `outline` | `focus` · `focus-offset` |
| `code` | Shiki의 `foreground` · `background` · `token-*` |

## 색

| Role | Use |
| --- | --- |
| `ground` | 페이지 바탕 |
| `surface` | 카드·표·흐름도 상자 |
| `code` | 코드 상자 |
| `text` | 본문 |
| `text-strong` | 제목·굵은 글·현재 절 |
| `text-muted` | 라벨·소제목 링크·카드 설명 |
| `border` / `border-soft` | 상자·목록 / 표 구분선 |
| `accent` / `accent-soft` | 링크·번호·포커스 / 인용·행 hover 바탕 |
| `verified` / `unverified` | 확인 / 미확인 상태 표지 |

색은 `light-dark()` 한 줄에 밝은 값과 어두운 값.
테마 분기는 토큰 파일의 `color-scheme`에 한정. 컴포넌트 CSS에는 테마 분기 없음.
글색 대비 목표: 실제 바탕 위 `4.5:1` 이상. 상태 표지의 글색도 포함.

## 글꼴과 크기

Pretendard 본문, JetBrains Mono 코드·라벨·흐름도. 내장 파일 사용.
코드 글꼴의 미지원 한글은 본문 글꼴로 fallback.

| Size | Use |
| --- | --- |
| `label` | 목록 라벨 · 목차 묶음 · 카드 묶음 |
| `mark` | 절 번호 · 표 머리 · 문서 머리 라벨 · 사이트 이름 · 테마 버튼 |
| `detail` | 소제목 링크 · 코드 블록 · 상태 표지 · 카드 설명 |
| `dense` | 목차 · 표 본문 · h5 |
| `body` | 본문 · h4 |
| `lead` | 소개 · h3 · 카드 제목 |
| `part` | 가름 |
| `section` | h2 |
| `title` | h1 · 화면 폭에 따른 크기 |

본문 기본 굵기 `400`. 라벨 `mark`, 제목·강조 `strong`, h1 `title`.
코드 합자 비활성: `>=`, `!=` 원문 구분.
Shiki는 기존 역할색 참조: 키워드 strong, 함수 accent, 문자열 verified, 숫자 unverified, 주석 muted.

::part[배치]

## 간격과 모서리

| Space | Use |
| --- | --- |
| `inline` | 한 줄 안의 라벨·이름 |
| `stack` | 문단·목록 흐름 |
| `block` | 코드·표·흐름도·인용 |
| `section` | 절 사이 |
| `page-top` · `gutter` · `column` | 페이지 위·좌우·열 간격 |
| `anchor` | hash 제목 위치 · 목차 읽는 선 |

여러 부품의 공통 리듬만 토큰. 표 칸·상자 내부 보정은 지역 값.
모서리 역할: box 본문 상자, card 첫 화면 카드, inline 코드·표지, mark 칩·포커스, pill 버튼·모바일 목차.
겹침 요소 추가 시 `z-index` 역할 토큰 먼저 정의. 현재 겹침 층 없음.

## 화면 폭

| Width | Layout |
| --- | --- |
| `1024px` 이상 | 사이드바와 본문 2열 |
| `1024px` 미만 | 사이드바 → 본문 1열 · 알약형 목차 · 소제목 숨김 |
| `640px` 미만 | 위·좌우 여백 축소 |

폭 기준의 CSS 변수 사용 불가. `token.css`, `wg-shell.css`, `_wg-shell-nav.css` 값 일치 필요.
카드 열은 intrinsic sizing 우선. 새 breakpoint는 배치 변경에 한정.

## 상호작용

- hover: 글·테두리 색 변경
- focus-visible: 모든 상호작용 요소에 공통 outline
- 현재 문서·절: accent 선 · strong 글
- 도메인 상태: `--active`, `--open` 수정자
- DOM 상태: 기본 클래스 안의 pseudo-class
- 움직임 감소: 전역 `prefers-reduced-motion`

::part[변경]

## 새 부품 확인

1. 색·글꼴·크기·모서리의 기존 토큰 선택
2. 공통으로 반복되는 값만 토큰 추가
3. 새 색의 두 테마와 실제 대비 확인
4. 클래스 소유자·역할·수정자 확인
5. hover와 키보드 포커스 확인
6. 작은 라벨의 모노·크기·자간 일치 확인
7. 밝게·어둡게·좁은 화면 확인
