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
- 본문 `main` 최대 폭 900px · 넓은 화면에서는 본문 중앙 · 1536px 이상에서는 문서 탐색·TOC가 양쪽에 같은 폭
- 본문 경계: 양쪽에 옅은 1px 세로선 · 본문 패딩 양쪽 32px · 사이드바와 본문 사이 32px
- 색의 선택: 역할별 토큰 · 시스템 설정에 따라 밝게·어둡게 적용
- favicon: 여백을 줄인 픽셀 얼굴 · 검은 점 눈·작은 미소 · 투명 배경 · 두 가지 색
- Brand: 기본 이름 `for humanity` · 사이드바 상단의 텍스트 · 이름은 `title` 설정
- 커서 장식: 24px 픽셀 얼굴 · 기본 커서에서 16px 간격 · 클릭·드래그·문서 이동에서도 표시 유지
- 문서 탐색: 목적별 묶음 · 읽는 순서 · 중립색 텍스트와 1px 트리 선
- 모바일 탐색: 고정된 브랜드·메뉴 버튼 · 왼쪽 드로어의 문서 목록
- TOC: 1536px 이상에서만 오른쪽에 표시 · 중립색 제목 · 중첩 트리 · 모든 section·subsection 표시
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
| `font-size`      | `group` · `label` · `detail` · `dense` · `body` · `lead` · `part` · `section` · `title` |
| `font-weight`    | `mark` · `active` · `strong` · `title`                                                 |
| `line-height`    | `title` · `heading` · `tight` · `code` · `body`                                        |
| `letter-spacing` | `label` · `brand` · `heading` · `title`                                                |
| `space`          | `inline` · `stack` · `block` · `group` · `section` · 페이지 틀                         |
| `size`           | `sidebar` · `main` · `page` · `brand` · `mobile-header` · `menu-button` · `drawer`                                         |
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
| `text-muted`              | 라벨·클릭할 수 없는 탐색 묶음                    |
| `anchor-highlight`        | 앵커로 도착한 제목의 형광펜 바탕       |
| `backdrop`                | 모바일 탐색 모달의 배경 가림          |
| `border` / `border-soft`  | 상자·목록·점선 / 표 구분선             |
| `border-layout`          | 본문 양쪽 경계           |
| `accent` / `accent-soft`  | 현재 section·코드 / 행 hover 바탕 |
| `link`                    | 본문·탐색 링크·포커스                  |
| `link-visited`            | 방문한 본문 링크              |
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
| `group`   | 클릭할 수 없는 문서·TOC 묶음 · 11px |
| `label`   | On this page 라벨 · 12px |
| `detail`  | subsection 링크 · 코드 블록 · status badge          |
| `dense`   | TOC · 표 · h5                           |
| `body`    | 본문 · h4                 |
| `lead`    | 소개 · h3                                           |
| `part`    | part                                                |
| `section` | h2                                                  |
| `title`   | h1 · 사이드바 사이트 이름                            |

본문·묶음·사이트 이름의 `mark`는 `400`, 현재 문서·TOC의 `active`, On this page·제목·강조의 `strong`과 h1 `title`은 `600`.
문서 링크는 링크색, 목차의 절·소제목 링크는 본문 글색. 클릭할 수 없는 묶음은 회색과 작은 크기로 구분. `On this page` 제목도 같은 회색을 사용.
TOC는 작성한 제목을 그대로 표시하고 자동 번호를 붙이지 않음. 트리 가지는 제목 첫 줄의 가운데에 연결하며 여러 줄 제목에서도 같은 기준 유지.
코드 합자 비활성: `>=`, `!=` 원문 구분.
본문·사이드바 링크·목차·코드는 `12px`, 사이드바 묶음은 `11px`, h1과 사이트 이름은 `16px`, h2는 `14px`, part는 `13px`.
작은 묶음의 행 상자는 기존 탐색 링크와 같은 `18px`로 유지해 트리 줄기와 가지 정렬 보존.
본문 행간은 `1.7`(20.4px), 제목·탐색은 `1.5`, 코드 블록은 `1.65`. 작은 글자의 획이 붙지 않도록 본문·라벨·코드는 기본 자간 유지.
h1 자간은 `-0.015em`, h2·part는 `-0.01em`. 작성자가 붙인 번호도 제목과 같은 글꼴·크기 사용.
h1과 문서 묶음 라벨에는 `text-box: trim-start cap alphabetic` 적용. 크기가 달라도 대문자 위쪽 시작선을 맞추며, 미지원 브라우저는 기존 행 상자로 표시. [MDN text-box](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box).
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
사이드바는 묶음 간격 10px, 라벨 아래 4px, 행 위·아래 2px로 배치. 데스크톱의 한 줄 항목 높이는 22px. 모바일에서는 위·아래 여백 7px로 32px 높이를 확보하며 행 사이 별도 간격 없음. 홈 이동은 사이트 이름 하나로 제공.
사이트 이름은 사이드바 상단. 제목의 행 높이·페이지 위 여백·목록 전 `group` 20px를 합친 `size-brand` 사용.
사이트 이름은 한 줄, 긴 이름은 말줄임. 데스크톱에서는 이름을 고정하고 아래 목록만 스크롤.
사이트 이름은 `page-top`에서 시작. 데스크톱의 본문은 `size-brand`만큼 위 여백을 두고 문서 탐색의 첫 묶음과 정렬.
본문은 양쪽 보더와 패딩을 포함해 최대 900px. 넓은 화면에서는 본문 중앙 정렬. 화면이 줄면 오른쪽의 남는 공간부터 축소하고, 사이드바·간격·본문이 함께 들어가지 않을 때만 본문 폭을 줄임. 오른쪽 여백의 최소 폭은 0.
본문의 `column` 패딩은 양쪽 32px. 별도의 `sidebar-gap` 32px로 사이드바와의 간격을 확보하며 본문 패딩과 최대 폭은 유지.
사이드바 자체에는 패딩과 세로 보더 없음. 본문 양쪽에 `border-layout` 1px 보더를 배치.
문서 탐색과 TOC는 각각 폭 240px. 1536px 아래에서는 TOC를 숨기고 문서 목록만 표시. 제목이 길면 줄바꿈하며 가지는 첫 줄의 가운데에 연결. 각 묶음의 마지막 줄기는 마지막 항목의 첫 줄 가운데에서 종료.
트리 가지 길이와 하위 목차 들여쓰기는 `tree-indent` 12px. 기본 선은 `border-soft`, 현재 문서·절·소제목의 가로 가지와 묶음 시작부터 이어지는 세로 경로는 글자와 같은 진한 색. 현재 항목의 첫 줄 아래와 다른 묶음은 기본 선색 유지. hover·키보드 포커스에서도 해당 항목까지의 세로 경로를 함께 강조하며, 하위 목차는 상위 절의 경로도 연결. 탐색이 끝나면 현재 위치의 경로만 유지.
앵커 도착점은 데스크톱 80px, 모바일에서는 고정 헤더 56px와 여백 14px를 합친 70px. 제목 위 여백을 남기고 아래 본문을 바로 읽는 기준.
TOC의 현재 위치와 마지막 절의 끝 여백도 같은 `anchor` 토큰 사용.

문서 탐색과 목차의 묶음 안쪽 여백은 `tree-inset` 4px로 공유. 한 소유자에만 필요한 보정은 지역 값. 예: 하위 목록 아래 여백 4px.
같은 숫자여도 아이콘 크기·글자 크기·페이지 폭은 간격과 별도 역할.
모서리 토큰의 기본값은 `0`. 표·흐름도는 바깥 상자 없이 표현.
겹침 요소 추가 시 `z-index` 역할 토큰 먼저 정의. 사이드바 사이트 이름은 `--app-z-index-sticky`, 커서 장식은 `--app-z-index-popper` 층.

## Responsive layout

| Width | Layout |
|-------|--------|
| `1536px` 이상 | 왼쪽 문서 240px · 본문 최대 900px · 오른쪽 TOC 240px · 양쪽 간격 32px |
| `1024–1535px` | 문서 탐색 240px · TOC 숨김 · 본문 최대 900px · 오른쪽 남는 여백부터 축소 |
| `1024px` 미만 | 고정 브랜드·메뉴 버튼 · 문서 탐색만 있는 드로어 · 바로 시작하는 본문 |
| `640px` 미만 | 위·좌우 여백 축소 |

양쪽 탐색 480px·본문 900px·간격 64px·바깥 여백 56px의 합은 1500px. 스크롤바를 수용하도록 1536px에서 3열 전환. 넓은 화면의 본문은 같은 폭의 양쪽 사이드바 사이에서 중앙 정렬.
사이트 이름은 데스크톱의 왼쪽 사이드바, 모바일의 56px 고정 헤더에 배치. 넓은 화면의 양쪽 목록은 `size-brand` 아래부터 남은 뷰포트 높이를 각각 사용.
좁은 데스크톱에서는 목차를 숨기고 문서 목록이 전체 탐색 높이를 사용. 오른쪽 목차를 왼쪽 목록에 합치거나 이동하지 않음.
실제 남은 내용이 있는 위·아래 끝만 `size-navigation-fade` 28px로 흐리게 표시. `ResizeObserver`로 글꼴·접힘·화면 크기 변경을 추적. 강제 색상 환경과 JavaScript 미사용 환경은 네이티브 스크롤바 제공.
모바일에서는 같은 문서 탐색 컴포넌트를 네이티브 `dialog` 안에 렌더. 드로어에서는 문서 목록만 스크롤하며 닫기 버튼은 고정. 본문 세로 보더·열 패딩·열 간격은 해제. JavaScript가 없으면 전체 펼침 목록을 본문 위에 제공.
문서·목차 모두 기본 전체 펼침. 자식이 있는 항목의 `− / +` 버튼은 제목 링크와 독립 조작이며 접힘 선택은 `localStorage`에 저장. 버튼 폭은 `size-tree-toggle` 24px, 높이는 기존 트리 행 높이와 같음.
폭 기준의 CSS 변수 사용 불가. `shell/wg-shell.css`, `navigation/wg-navigation.css`, `token.css`, `navigation/_constant/navigation.ts`의 적용 구간 일치 필요. 기존 1440px 기준 대신 실제 1500px 기본 폭에 맞춰 1536px 사용.

## Interaction

- hover: 문서 탐색은 글색·굵기 유지와 밑줄·같은 색의 가지 · 사이트 이름은 밑줄 · 본문 링크는 색 변경과 밑줄 · TOC는 strong 글·가지와 밑줄 · 트리는 항목까지 이어지는 세로 경로도 강조
- visited: 본문 링크는 보라색 · 문서 탐색은 링크색 유지 · TOC는 본문 글색 유지
- Theme: 시스템 설정에 따라 밝게·어둡게 자동 적용
- focus-visible: 사이트 이름·문서 탐색·TOC·하위 TOC는 hover와 같은 밑줄·색으로 표시하며 박스 outline 생략 · 트리의 세로 경로도 강조 · 나머지 상호작용 요소는 공통 outline
- 현재 문서: 링크색 가로 가지·위로 이어지는 세로 경로와 글 · active 굵기 `600`
- TOC: 중립색 제목·1px 중첩 트리 · 현재 제목 하나만 active 굵기 `600` · 부모 글은 기본 굵기 유지 · 가로 가지와 위로 이어지는 세로 경로는 부모까지 연결 · 클릭으로 문서 안에서 이동
- 모바일 드로어: 닫기·Escape·배경 클릭 · 외부 포커스 차단·배경 스크롤 잠금 · 닫으면 메뉴 버튼으로 포커스 복원
- 드로어에는 문서 목록만 표시 · 문서 선택 후 닫기 · 데스크톱 전환 시 모달과 잠금 해제
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
