---
name: Design
label: 표현과 토큰
group: Development
---

meepin·Pinboard의 텍스트 중심 구성. 흰 바탕, 진회색 글, 파란 링크, 얇은 점선.
값의 단일 출처는 `src/style/token.css`. 이 문서는 역할과 사용 기준.

## Overview

- 본문: 한국어 산세리프 · 넉넉한 행간 · 낱말 단위 줄바꿈
- 라벨: 작은 산세리프 · 코드·번호·흐름도는 모노
- Header: 첫 화면과 문서의 공통 라벨·제목·얇은 점선
- 면의 구분: 가는 선 · 직각 모서리 · 그림자·그라데이션 없음
- 페이지 폭과 사이드바 배치는 기존 기준 유지
- 색의 선택: 역할별 토큰 · System·Light·Dark
- favicon: 16×16 픽셀 얼굴 · 검은 점 눈·작은 미소 · 투명 배경 · 두 가지 색
- Brand: 기본 이름 `for humanity` · 사이드바의 32px favicon · 이름은 `title` 설정

::part[Tokens]

## Token naming

`--app-<kind>-<role>`. 값보다 역할 이름.
예: `--app-color-surface`, `--app-space-stack`.
컴포넌트의 공통 토큰은 대체값 없이 사용. 외부 변수와 문서별 색 값만 대체값 허용.

| Kind             | Roles                                                                                  |
|------------------|----------------------------------------------------------------------------------------|
| `color`          | 바탕 · 글 · 선 · 강조 · 링크 · 상태                                                    |
| `font`           | `sans` 본문·라벨 · `mono` 코드·번호·흐름도                                             |
| `font-size`      | `label` · `mark` · `detail` · `dense` · `body` · `lead` · `part` · `section` · `title` |
| `font-weight`    | `mark` · `strong` · `title`                                                            |
| `line-height`    | `title` · `heading` · `tight` · `code` · `body`                                        |
| `letter-spacing` | `label` · `brand` · `heading` · `title`                                                |
| `space`          | `inline` · `stack` · `block` · `group` · `section` · 페이지 틀                         |
| `size`           | `sidebar` · `page`                                                                     |
| `radius`         | `pill` · `card` · `box` · `inline` · `mark`                                            |
| `outline`        | `focus` · `focus-offset`                                                               |
| `code`           | Shiki의 `foreground` · `background` · `token-*`                                        |

## Colors

| Role                      | Use                                    |
|---------------------------|----------------------------------------|
| `ground`                  | 페이지 바탕                            |
| `surface`                 | 부품의 기본 바탕                       |
| `code`                    | 코드 상자                              |
| `text`                    | 본문                                   |
| `text-strong`             | 제목·굵은 글·현재 section              |
| `text-muted`              | 라벨·번호·카드 설명                    |
| `border` / `border-soft`  | 상자·목록·점선 / 표 구분선             |
| `accent` / `accent-soft`  | 번호·현재 section·코드 / 행 hover 바탕 |
| `link`                    | 본문·탐색 링크·포커스                  |
| `link-visited`            | 방문한 본문 링크                       |
| `link-hover`              | 링크 hover                             |
| `verified` / `unverified` | 확인 / 미확인 status badge             |

색은 `light-dark()` 한 줄에 밝은 값과 어두운 값.
테마 분기는 토큰 파일의 `color-scheme`에 한정. 컴포넌트 CSS에는 테마 분기 없음.
글색 대비 목표: 실제 바탕 위 `4.5:1` 이상. status badge의 글색도 포함.

## Typography

Pretendard 본문·라벨, JetBrains Mono 코드·번호·흐름도. 내장 파일 사용.
코드 폰트의 미지원 한글은 본문 폰트로 fallback.

| Size      | Use                                                 |
|-----------|-----------------------------------------------------|
| `label`   | 목록 라벨 · TOC 묶음 · 카드 묶음 · 문서 header 라벨 |
| `mark`    | TOC 번호 · 문서 이름 첫 글자                        |
| `detail`  | subsection 링크 · 코드 블록 · status badge          |
| `dense`   | TOC · 표 · h5 · 카드 설명                           |
| `body`    | 본문 · h4 · 카드 제목 · 사이트 이름                 |
| `lead`    | 소개 · h3                                           |
| `part`    | part                                                |
| `section` | h2                                                  |
| `title`   | h1 · 화면 폭에 따른 크기                            |

본문 기본 굵기 `400`. 번호 `mark`, 제목·강조 `strong`, h1 `title`.
코드 합자 비활성: `>=`, `!=` 원문 구분.
본문은 `15px`, h1은 `24–28px`. 라벨의 대문자 변환과 자간 확대 없음.
Shiki는 기존 역할색 참조: 키워드 strong, 함수 accent, 문자열 verified, 숫자 unverified, 주석 muted, 링크 link.

글꼴 이름과 fallback은 `token.css`에 정적 선언. CLI는 내장 `@font-face`와 자원 URL만 생성.
공통 폰트 토큰의 정의를 IDE에서도 같은 소스로 확인 가능.

::part[Layout]

## Spacing and radius

| Space                            | Use                          |
|----------------------------------|------------------------------|
| `inline`                         | 한 줄 안의 라벨·이름         |
| `stack`                          | 문단·목록 흐름               |
| `block`                          | 코드·표·흐름도·인용          |
| `group`                          | 제목·목차 묶음·첫 화면 목록  |
| `section`                        | section 사이                 |
| `page-top` · `gutter` · `column` | 페이지 위·좌우·열 간격       |
| `anchor`                         | hash 제목 위치 · TOC 읽는 선 |

공통 리듬: `inline` 8px · `stack` 12px · `block` 16px · `group` 24px · `section` 40px.
같은 역할의 간격은 `margin`, `padding`, `gap`에서 공통 토큰 재사용.

한 소유자에만 필요한 간격·보정은 지역 값. 예: 목차 들여쓰기 14px·26px, 목록 행의 위·아래 5px.
같은 숫자여도 아이콘 크기·글자 크기·페이지 폭은 간격과 별도 역할.
모서리 토큰의 기본값은 `0`. 표·흐름도·첫 화면 목록은 바깥 상자 없이 표현.
겹침 요소 추가 시 `z-index` 역할 토큰 먼저 정의. 현재 겹침 층 없음.

## Responsive layout

| Width         | Layout                                                  |
|---------------|---------------------------------------------------------|
| `1024px` 이상 | 사이드바와 본문 2열                                     |
| `1024px` 미만 | 사이드바 → 본문 1열 · 텍스트 링크 TOC · subsection 숨김 |
| `640px` 미만  | 위·좌우 여백 축소                                       |

폭 기준의 CSS 변수 사용 불가. `token.css`, `wg-shell.css`, `_wg-shell-nav.css` 값 일치 필요.
카드 열은 intrinsic sizing 우선. 새 breakpoint는 배치 변경에 한정.

## Interaction

- hover: 링크색 변경과 밑줄
- visited: 본문 링크만 방문색 · 탐색 링크는 현재 문서·section 기준
- Theme: System 모니터 · Light 해 · Dark 달 · 현재 모드의 tooltip·접근 가능한 이름
- focus-visible: 모든 상호작용 요소에 공통 outline
- 현재 문서·section: accent 선 · strong 글
- Note: 보충 설명의 제목·왼쪽 선 · 기본 본문 토큰
- Details: native marker·파란 제목·얇은 점선 · 접힌 본문의 hash 이동 시 공개
- 도메인 상태: `--active`, `--open` 수정자
- DOM 상태: 기본 클래스 안의 pseudo-class
- 움직임 감소: 전역 `prefers-reduced-motion`

::part[Review]

## Component review

1. 색·폰트·크기·모서리의 기존 토큰 선택
2. 공통으로 반복되는 값만 토큰 추가
3. 새 색의 두 테마와 실제 대비 확인
4. 클래스 소유자·역할·수정자 확인
5. hover와 키보드 포커스 확인
6. 라벨·번호의 글꼴·크기·자간 일치 확인
7. Light·Dark·좁은 화면 확인
