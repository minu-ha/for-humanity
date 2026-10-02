---
name: Design
label: 표현과 토큰
group: Development
order: 20
---

라이브러리의 표현을 수정하는 사람을 위한 토큰·레이아웃 참고 문서.
흰 바탕, 진회색 글, 파란 링크, 얇은 점선.
값의 단일 출처는 `src/style/token.css`. 이 문서는 역할과 사용 기준.

## Overview

- 본문: 한국어 산세리프 · 넉넉한 행간 · 낱말 단위 줄바꿈
- 라벨: 작은 산세리프 · 코드·흐름도는 모노
- 페이지 시작선: 문서 탐색의 첫 묶음·h1의 위쪽 정렬 · 사이트 이름은 그 위
- 본문 머리: README 홈과 문서의 제목·소개·얇은 점선
- 면의 구분: 가는 선 · 직각 모서리 · 그림자·그라데이션 없음
- 본문 `main` 최대 폭 900px · 넓은 화면에서는 본문 중앙 · 문서 탐색·TOC는 그 왼쪽 한 열
- 본문 경계: 양쪽에 옅은 1px 세로선 · 본문 패딩 양쪽 32px · 사이드바와 본문 사이 32px
- 색의 선택: 역할별 토큰 · 시스템 설정에 따라 밝게·어둡게 적용
- favicon: 여백을 줄인 픽셀 얼굴 · 검은 점 눈·작은 미소 · 투명 배경 · 두 가지 색
- Brand: 기본 이름 `for humanity` · 사이드바 상단의 텍스트 · 이름은 `title` 설정
- 커서 장식: 24px 픽셀 얼굴 · 기본 커서에서 16px 간격 · 클릭·드래그·문서 이동에서도 표시 유지
- 문서 탐색: 목적별 묶음 · 읽는 순서 · 중립색 텍스트와 1px 트리 선
- TOC: 모든 화면에서 문서 탐색 아래 · 중립색 제목 · 중첩 트리 · 모든 section·subsection 표시
- 홈 소개: README의 얼굴·슬로건·배지·바로가기 · 가운데 정렬

::part[Tokens]

## Token naming

`--app-<kind>-<role>`. 값보다 역할 이름.
예: `--app-color-surface`, `--app-space-stack`.
컴포넌트의 공통 토큰은 대체값 없이 사용. 외부 변수와 문서별 색 값만 대체값 허용.

| Kind             | Roles                                                                                  |
|------------------|----------------------------------------------------------------------------------------|
| `color`          | 바탕 · 글 · 선 · 강조 · 링크 · 상태                                                    |
| `font`           | `sans` 본문·라벨 · `mono` 코드·흐름도 · `brand` 사이트 이름                      |
| `font-size`      | `label` · `detail` · `dense` · `body` · `lead` · `part` · `section` · `title` |
| `font-weight`    | `mark` · `active` · `strong` · `title`                                                 |
| `line-height`    | `title` · `heading` · `tight` · `code` · `body`                                        |
| `letter-spacing` | `label` · `brand` · `heading` · `title`                                                |
| `space`          | `inline` · `stack` · `block` · `group` · `section` · 페이지 틀                         |
| `size`           | `sidebar` · `main` · `page` · `brand`                                         |
| `z-index`        | `sticky` 사이드바 사이트 이름 · `popper` 커서 장식                           |
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
| `text-muted`              | 라벨·목차                    |
| `anchor-highlight`        | 앵커로 도착한 제목의 형광펜 바탕       |
| `border` / `border-soft`  | 상자·목록·점선 / 표 구분선             |
| `border-layout`          | 본문 양쪽 경계           |
| `accent` / `accent-soft`  | 현재 section·코드 / 행 hover 바탕 |
| `link`                    | 본문·탐색 링크·포커스                  |
| `link-visited`            | 방문한 본문·문서 탐색 링크              |
| `link-hover`              | 본문 링크 hover                        |
| `verified` / `unverified` | 확인 / 미확인 status badge             |

색은 `light-dark()` 한 줄에 밝은 값과 어두운 값.
테마 분기는 토큰 파일의 `color-scheme`에 한정. 컴포넌트 CSS에는 테마 분기 없음.
글색 대비 목표: 실제 바탕 위 `4.5:1` 이상. status badge의 글색도 포함.

## Typography

Pretendard 본문·라벨, JetBrains Mono 코드·흐름도, Architects Daughter 사이트 이름. 내장 파일 사용.
사이트 이름은 Architects Daughter Regular `400`. 코드·사이트 이름 폰트의 미지원 글자와 한글은 본문 폰트로 fallback.
글꼴의 출처는 [Google Fonts](https://fonts.google.com/specimen/Architects+Daughter), OFL은 자원 폴더에 포함.

| Size      | Use                                                 |
|-----------|-----------------------------------------------------|
| `label`   | TOC 라벨 · 문서·TOC 묶음 |
| `detail`  | subsection 링크 · 코드 블록 · status badge          |
| `dense`   | TOC · 표 · h5                           |
| `body`    | 본문 · h4                 |
| `lead`    | 소개 · h3                                           |
| `part`    | part                                                |
| `section` | h2                                                  |
| `title`   | h1 · 사이드바 사이트 이름                            |

본문·목차 라벨·사이트 이름의 `mark`는 `400`, 현재 문서·TOC의 `active`는 `500`, 제목·강조 `strong`과 h1 `title`은 `600`.
TOC는 작성한 제목을 그대로 표시하고 자동 번호를 붙이지 않음. 트리 가지는 제목 첫 줄의 가운데에 연결하며 여러 줄 제목에서도 같은 기준 유지.
코드 합자 비활성: `>=`, `!=` 원문 구분.
본문·사이드바·목차·코드는 `12px`, h1과 사이트 이름은 `16px`, h2는 `14px`, part는 `13px`.
본문 행간은 `1.7`(20.4px), 제목·탐색은 `1.5`, 코드 블록은 `1.65`. 작은 글자의 획이 붙지 않도록 본문·라벨·코드는 기본 자간 유지.
h1 자간은 `-0.015em`, h2·part는 `-0.01em`. 작성자가 붙인 번호도 제목과 같은 글꼴·크기 사용.
README 홈의 소개 제목은 `24px`, 얼굴은 `72px`. Markdown 원문의 내용은 유지하고 사이트에서만 크기 조정.
Shiki는 기존 역할색 참조: 키워드 strong, 함수 accent, 문자열 verified, 숫자 unverified, 주석 muted, 링크 link.

글꼴 이름과 fallback은 `token.css`에 정적 선언. CLI는 내장 `@font-face`와 내용 지문이 붙은 자원 URL 생성.
공통 폰트 토큰의 정의를 IDE에서도 같은 소스로 확인 가능.
사이트 이름·본문 공통 조각·코드 글꼴은 선요청. `font-display: optional`로 늦게 받은 글꼴의 화면 중간 교체 방지.
느린 첫 방문은 대체 글꼴로 읽고, 받은 파일은 다음 문서에서 재사용. dev·preview의 글꼴 응답은 장기 캐시.

::part[Layout]

## Spacing and radius

| Space                            | Use                          |
|----------------------------------|------------------------------|
| `inline`                         | 한 줄 안의 라벨·이름         |
| `stack`                          | 문단·목록 흐름               |
| `block`                          | 코드·표·흐름도·인용          |
| `group`                          | 제목·본문 묶음  |
| `section`                        | section 사이                 |
| `page-top` · `gutter`             | 페이지 위·좌우 여백          |
| `column`                         | 본문 좌우 패딩               |
| `sidebar-gap`                    | 사이드바와 본문 사이의 간격 |
| `tree-row` · `tree-inset` · `tree-indent` | 트리 항목 위아래 여백 · 묶음 안쪽 여백 · 가지와 중첩 들여쓰기 |
| `anchor`                         | hash 제목 위치 · TOC 읽는 선 |

공통 리듬: `inline` 6px · `stack` 10px · `block` 14px · `group` 20px · `section` 32px.
같은 역할의 간격은 `margin`, `padding`, `gap`에서 공통 토큰 재사용.
사이드바는 묶음 간격 10px, 라벨 아래 4px, 행 위·아래 2px로 배치. 한 줄 항목의 높이는 22px이며 행 사이 별도 간격 없음. 홈 이동은 사이트 이름 하나로 제공.
사이트 이름은 사이드바 상단. 제목의 행 높이·페이지 위 여백·목록 전 `group` 20px를 합친 `size-brand` 사용.
사이트 이름은 한 줄, 긴 이름은 말줄임. 데스크톱에서는 이름을 고정하고 아래 목록만 스크롤.
사이트 이름은 `page-top`에서 시작. 데스크톱의 본문은 `size-brand`만큼 위 여백을 두고 문서 탐색의 첫 묶음과 정렬.
본문은 양쪽 보더와 패딩을 포함해 최대 900px. 넓은 화면에서는 본문 중앙 정렬. 화면이 줄면 오른쪽의 남는 공간부터 축소하고, 사이드바·간격·본문이 함께 들어가지 않을 때만 본문 폭을 줄임. 오른쪽 여백의 최소 폭은 0.
본문의 `column` 패딩은 양쪽 32px. 별도의 `sidebar-gap` 32px로 사이드바와의 간격을 확보하며 본문 패딩과 최대 폭은 유지.
사이드바 자체에는 패딩과 세로 보더 없음. 본문 양쪽에 `border-layout` 1px 보더를 배치.
문서 탐색과 TOC는 폭 200px의 왼쪽 사이드바 공유. 제목이 길면 줄바꿈하며 가지는 첫 줄의 가운데에 연결. 각 묶음의 마지막 줄기는 마지막 항목의 첫 줄 가운데에서 종료.
트리 가지 길이와 하위 목차 들여쓰기는 `tree-indent` 12px. 기본 선은 `border-soft`, 현재 문서·절·소제목의 가로 가지와 묶음 시작부터 이어지는 세로 경로는 글자와 같은 진한 색. 현재 항목의 첫 줄 아래와 다른 묶음은 기본 선색 유지. hover·키보드 포커스에서도 해당 항목까지의 세로 경로를 함께 강조하며, 하위 목차는 상위 절의 경로도 연결. 탐색이 끝나면 현재 위치의 경로만 유지.
앵커 도착점은 화면 상단에서 80px, `640px` 미만에서는 48px. 제목 위 여백을 남기고 아래 본문을 바로 읽는 기준.
TOC의 현재 위치와 마지막 절의 끝 여백도 같은 `anchor` 토큰 사용.

문서 탐색과 목차의 묶음 안쪽 여백은 `tree-inset` 4px로 공유. 한 소유자에만 필요한 보정은 지역 값. 예: 하위 목록 아래 여백 4px.
같은 숫자여도 아이콘 크기·글자 크기·페이지 폭은 간격과 별도 역할.
모서리 토큰의 기본값은 `0`. 표·흐름도는 바깥 상자 없이 표현.
겹침 요소 추가 시 `z-index` 역할 토큰 먼저 정의. 사이드바 사이트 이름은 `--app-z-index-sticky`, 커서 장식은 `--app-z-index-popper` 층.

## Responsive layout

| Width                  | Layout                                                     |
|------------------------|------------------------------------------------------------|
| `1024px` 이상          | 문서 탐색·TOC 공유 사이드바 200px · 간격 32px · 본문 최대 900px · 넓으면 중앙, 좁아지면 오른쪽 여백부터 축소 |
| `1024px` 미만          | 문서 탐색 → TOC → 본문 순서의 1열                            |
| `640px` 미만           | 위·좌우 여백 축소                                           |

TOC 유무와 화면의 넓이에 관계없이 문서 탐색과 TOC는 같은 사이드바에 배치. 한 열 배치에서는 본문과 바깥 여백의 합을 최대 폭으로 사용해 가운데 정렬 유지.
사이트 이름은 왼쪽 사이드바에만 배치.
데스크톱에서는 왼쪽 사이드바 전체가 sticky. 문서 탐색 다음에 가로선과 `group` 여백으로 구분한 TOC를 배치하고 두 목록을 함께 스크롤.
본문의 옅은 1px 양쪽 보더는 페이지 위쪽부터 문서 끝까지 유지.
사이트 이름은 공유 사이드바를 스크롤하는 동안에도 위쪽에 고정.
키보드 이동 시 고정된 사이트 이름을 피하도록 스크롤 여백 확보.
`1024px` 미만에서는 사이트 이름·문서 탐색·TOC를 본문 위 한 흐름으로 배치하고 본문의 세로 보더·좌우 패딩·열 간격 해제. 트리는 좁은 화면에서도 같은 계층으로 표시.
TOC의 소제목은 모든 폭에서 전체 표시.
폭 기준의 CSS 변수 사용 불가. `wg-shell.css`와 `token.css`의 적용 구간 일치 필요.
새 breakpoint는 배치 변경에 한정.

## Interaction

- hover: 문서 탐색은 글색·굵기 유지와 밑줄·같은 색의 가지 · 사이트 이름은 밑줄 · 본문 링크는 색 변경과 밑줄 · TOC는 strong 글·가지와 밑줄 · 트리는 항목까지 이어지는 세로 경로도 강조
- visited: 본문 링크는 보라색 · 문서 탐색과 TOC는 방문 여부와 무관하게 중립색
- Theme: 시스템 설정에 따라 밝게·어둡게 자동 적용
- focus-visible: 사이트 이름·문서 탐색·TOC·하위 TOC는 hover와 같은 밑줄·색으로 표시하며 박스 outline 생략 · 트리의 세로 경로도 강조 · 나머지 상호작용 요소는 공통 outline
- 현재 문서: strong 가로 가지·위로 이어지는 세로 경로와 글 · active 굵기 `500`
- TOC: 중립색 제목·1px 중첩 트리 · 현재 절·소제목은 active 굵기 `500` · 가로 가지와 위로 이어지는 세로 경로도 현재 글색 · 클릭으로 문서 안에서 이동
- 접힌 Details의 소제목: TOC에는 표시 · 현재 위치에서 제외 · 제목 클릭 시 본문 공개
- 앵커 제목: 3초 강조 후 600ms 해제 · 여러 줄의 글자 배경만 칠하고 배치 유지
- Note: 보충 설명의 제목·왼쪽 선 · 기본 본문 토큰
- Details: native marker·파란 제목·얇은 점선 · 접힌 본문의 hash 이동 시 공개
- 도메인 상태: 현재 위치 `--active`
- DOM 상태: 기본 클래스 안의 pseudo-class
- 움직임 감소: 전역 `prefers-reduced-motion`
- 커서 장식: 클릭·텍스트 선택을 가리지 않음 · 화면 이탈 시 숨김 · 터치와 움직임 감소 설정에서 비활성

::part[Review]

## Component review

1. 색·폰트·크기·모서리의 기존 토큰 선택
2. 공통으로 반복되는 값만 토큰 추가
3. 새 색의 두 테마와 실제 대비 확인
4. 클래스 소유자·역할·수정자 확인
5. hover와 키보드 포커스 확인
6. 라벨·목차의 글꼴·크기·자간 일치 확인
7. Light·Dark·좁은 화면 확인
