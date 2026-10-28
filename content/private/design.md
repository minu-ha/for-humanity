---
name: Design
label: 표현과 토큰
group: Development
order: 20
---

라이브러리의 표현을 수정하는 사람을 위한 토큰과 레이아웃 참고 문서.
흰 바탕, 진회색 글, 파란 링크, 회색 실선.
값의 단일 출처는 `src/style/token.css`. 이 문서는 역할과 사용 기준.

## Overview

- 본문: 한글과 영문 모두 IBM Plex Sans KR, 넉넉한 행간, 낱말 단위 줄바꿈
- 라벨: 작은 회색 글자, 본문과 같은 글꼴, 인라인 코드도 본문 글꼴, 문서 탐색, 목차, 코드 블록은 영문 고정폭 Monoplex KR에 본문과 같은 IBM Plex Sans KR 한글
- 페이지 시작선: 문서 탐색의 첫 묶음과 h1의 위쪽 정렬, 사이트 이름은 그 위
- 본문 머리: README 홈과 문서의 제목, 작성 날짜, 소개, 회색 실선
- 면의 구분: 가는 선, 직각 모서리, 그림자와 그라데이션 없음
- 본문 `main`: 양쪽 사이드바를 뺀 나머지 전체, 페이지 최대 1600px, 1360px 이상에서는 문서 탐색과 TOC가 양쪽에 같은 폭
- 본문 경계: 양쪽에 옅은 1px 세로선, 본문 패딩 양쪽 32px, 사이드바와 본문 사이 32px
- 색의 선택: 역할별 토큰, 시스템 설정에 따라 밝거나 어둡게 적용
- favicon: 여백을 줄인 픽셀 얼굴, 검은 점 눈과 작은 미소, 투명 배경, 두 가지 색
- Brand: 기본 이름 `for humanity`, 사이드바 상단의 텍스트, 이름은 `title` 설정
- 커서 장식: 설정 `cursorFace`로 켬, 기본 꺼짐, 24px 픽셀 얼굴, 기본 커서에서 16px 간격, 클릭, 드래그, 문서 이동에서도 표시 유지
- 문서 탐색: 목적별 묶음, 읽는 순서, 중립색 텍스트와 들여쓰기
- 모바일 탐색: 고정된 브랜드와 메뉴 버튼, 왼쪽 드로어의 문서 목록
- TOC: 1360px 이상에서만 오른쪽에 표시, 중립색 제목, 중첩 트리, 모든 section과 subsection 표시
- 홈 소개: README의 얼굴, 슬로건, 배지, 바로가기를 가운데 정렬

::part[Tokens]

## Token naming

`--app-<kind>-<role>`. 값보다 역할 이름.
예: `--app-color-ground`, `--app-space-stack`.
컴포넌트의 공통 토큰은 대체값 없이 사용. 외부 변수와 문서별 색 값만 대체값 허용.

| Kind             | Roles                                                                                  |
|------------------|----------------------------------------------------------------------------------------|
| `color`          | 바탕, 글, 선, 강조, 링크, 상태                                                         |
| `font`           | `body` 본문, 라벨, 인라인 코드, `mono` 코드 블록, `brand` 사이트 이름      |
| `font-size`      | `group`, `detail`, `dense`, `body`, `lead`, `part`, `subsection`, `section`, `title`, `brand` |
| `font-weight`    | `mark`, `active`, `strong`, `title`                                                    |
| `line-height`    | `title`, `heading`, `tight`, `code`, `body`                                            |
| `letter-spacing` | `body`, `brand`, `heading`, `title`                                                    |
| `space`          | `inline`, `stack`, `block`, `group`, `subsection`, `section`, 페이지 틀                |
| `size`           | `sidebar`, `page`, `brand`, `mobile-header`, `menu-button`, `drawer`                                                       |
| `z-index`        | `sticky` 모바일 고정 헤더, `popper` 커서 장식                                |
| `radius`         | `box`, `inline`, `mark`                                                                |
| `outline`        | `focus`, `focus-offset`                                                                |

## Colors

| Role                      | Use                                    |
|---------------------------|----------------------------------------|
| `ground`                  | 페이지 바탕                            |
| `code`                    | 코드 상자                              |
| `text`                    | 본문                                   |
| `text-strong`             | 제목, 굵은 글, 현재 section            |
| `text-muted`              | 라벨과 클릭할 수 없는 탐색 묶음                  |
| `mermaid-tooltip-text`    | Mermaid 공식 툴팁의 고정 밝은 배경 위 글색 |
| `anchor-highlight`        | 앵커로 도착한 제목의 형광펜 바탕       |
| `backdrop`                | 모바일 탐색 모달의 배경 가림          |
| `border`                 | 상자, 목록, 표, 구분선, 본문 머리, part, Details의 선과 펼친 본문 세로선 |
| `border-layout`          | 본문 양쪽 경계           |
| `accent` / `accent-soft`  | 현재 section과 코드 / 행 hover 바탕 |
| `bad-soft` / `good-soft`, `bad-mark` / `good-mark` | 코드 블록 바탕 / 그 위의 줄 표기 |
| `warn-soft`               | 경고 줄 바탕                           |
| `link`                    | 본문 링크, 탐색 링크, 포커스           |
| `link-visited`            | 방문한 본문 링크              |
| `link-hover`              | 본문 링크 hover                        |
| `verified` / `unverified` | 확인 / 미확인 status badge             |

색은 `light-dark()` 한 줄에 밝은 값과 어두운 값.
테마 분기는 토큰 파일의 `color-scheme`에 한정. 컴포넌트 CSS에는 테마 분기 없음.
글색 대비 목표: 실제 바탕 위 `4.5:1` 이상. status badge의 글색도 포함.

## Typography

본문, 라벨, 인라인 코드, 다이어그램은 한글과 영문 모두 IBM Plex Sans KR, 문서 탐색, 목차, 코드 블록, 코드 파일 제목, 참조 칩, 상태 코드는 한글 IBM Plex Sans KR과 영문 Monoplex KR, 사이트 이름은 Architects Daughter. 내장 파일 사용. 사이드바의 Monoplex KR은 본문 글과 구분되는 터미널 느낌의 틀. 목차는 고정폭 공백(0.53em) 때문에 한글 제목의 띄어쓰기가 본문(0.24em)보다 벌어져 `word-spacing: -0.2em`으로 그 사이에 맞춤, 문서 탐색은 영문 제목이 대부분이라 고정폭 공백 그대로.
Monoplex KR은 Regular `400`과 SemiBold `600` 두 파일. 영문 반각과 한글 전각의 폭은 1:2.
IBM Plex Sans KR도 Regular `400`과 SemiBold `600` 두 파일. Monoplex KR 한글의 원본이라 모양, 크기, 높이가 같고 폭만 원래 비례폭. 영문은 한글과 함께 설계된 IBM Plex Sans라 본문에서는 영문, 숫자, 기호까지 이 파일이 담당. 같은 파일을 `IBM Plex Sans KR Hangul` 이름으로 한 번 더 선언해 `unicode-range`로 한글 음절과 호환 자모만 맡기고 코드에서 Monoplex KR 앞에 둠. 코드 블록의 한글은 비례폭이라 영문 2칸에 맞지 않음. 코드의 한글은 대부분 주석이라 본문과 같은 모양을 우선. 인라인 코드는 본문과 같은 글꼴과 자간. 글꼴을 아직 못 받은 첫 표시는 시스템 산세리프.
Mermaid SVG는 공식 `base` 테마에 본문 글꼴과 사이트의 흑백 팔레트를 넣어 본문의 SVG 그림과 같은 모양으로 그림: `accent-soft` 바탕 상자, 한 색의 회색 테두리(밝은 `#888`, 어두운 `#777`, Mermaid 12 neo 모양의 그라데이션 끔), 페이지 바탕의 묶음, 직각 모서리, 그림자 없음, 1.2px 연결선과 끝의 작은 빈 꺾쇠(순서도와 시퀀스, 그린 SVG의 표식 교체), 형광펜 노랑 노트, 시퀀스까지 14px 본문 글꼴. 본문 폭보다 넓은 그림은 줄여서 맞추므로 글이 가로로 긴 흐름을 세로(`TB`)로 쓰거나 라벨에 `<br>`을 넣음. Mermaid 12의 기본 배치(ELK)는 `nodeSpacing`, `rankSpacing`을 받지 않음. Shadow DOM으로 본문 스타일과 격리합니다. 다이어그램 원문 대체 표시는 일반 코드 블록과 같은 글꼴을 사용합니다. [Diagrams](../public/diagrams.md#themes-and-rendering).
사이트 이름은 Architects Daughter Regular `400`. 사이트 이름 폰트의 미지원 글자와 한글은 본문 글꼴로 fallback.
글꼴의 출처는 [Monoplex](https://github.com/y-kim/monoplex), [IBM Plex](https://github.com/IBM/plex), [Google Fonts](https://fonts.google.com/specimen/Architects+Daughter). OFL은 자원 폴더에 포함.

| Size      | Use                                                 |
|-----------|-----------------------------------------------------|
| `group`   | 클릭할 수 없는 문서와 TOC 묶음, On this page 라벨, 11px |
| `detail`  | subsection 링크, 코드 블록, status badge, 제목 아래 작성 날짜 |
| `dense`   | TOC, 표, h5                             |
| `body`    | 본문, h4                  |
| `lead`    | 소개                                                |
| `subsection` | h3                                               |
| `part`    | part                                                |
| `section` | h2                                                  |
| `title`   | h1                                                  |
| `brand`   | 사이드바 사이트 이름, 사이트 이름 줄 높이의 기준       |

본문, 묶음, On this page, 사이트 이름의 `mark`는 `400`, 현재 문서와 TOC의 `active`, 제목과 강조의 `strong`과 h1 `title`은 `600`.
문서 링크는 링크색, 목차의 절과 소제목 링크는 본문 글색. 클릭할 수 없는 묶음은 회색과 작은 크기로 구분. `On this page` 제목도 묶음 라벨과 같은 표현.
TOC는 작성한 제목을 그대로 표시하고 자동 번호를 붙이지 않음.
Monoplex KR에는 코드 합자 없음: `>=`, `!=` 원문 그대로 표시.
본문은 `16px`, 사이드바 링크, 목차, 표, 코드, 날짜는 `14px`, 사이드바 묶음과 On this page는 `13px`, h1은 `26px`, h2는 `20px`, h3는 `18px`, part는 `17px`, 사이트 이름은 `20px`. 제목은 약 1.1배씩 커져 본문의 굵은 문장과 h3가 구분됨.
작은 묶음의 행 상자는 탐색 링크와 같은 `19.6px`(14px × 1.4).
본문 행간은 `1.7`(27.2px), 작은 제목과 탐색은 `1.4`, 코드 블록은 `1.65`.
본문, 라벨, 인라인 코드 자간은 `-0.02em`. 코드 블록은 영문 고정폭 칸을 위해 `0`, 사이트 이름과 Mermaid 측정과 표시 영역도 `0`.
h1 자간은 `-0.045em`, h2, h3와 part는 `-0.04em`으로 본문보다 조금 더 조임. 작성자가 붙인 번호도 제목과 같은 글꼴과 크기 사용.
h1, 문서와 목차 묶음 라벨, On this page에는 `text-box: trim-start cap alphabetic` 적용. 크기가 달라도 대문자 위쪽 시작선을 맞추며, 미지원 브라우저는 기존 행 상자로 표시. [MDN text-box](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box).
README 홈의 소개 제목은 `24px`, 얼굴은 `72px`. Markdown 원문의 내용은 유지하고 사이트에서만 크기 조정.
Shiki 토큰 색상은 GitHub 기본 테마 `github-light-default`, `github-dark-default`를 `light-dark()`로 적용. 주석과 보라 토큰은 github.com 현행 값 `#59636e`, `#6639ba`, 어두운 주석 `#9198a1`로 교체해 코드 상자 바탕 위 대비 4.5 이상 확보.
코드 상자와 파일 제목의 바탕은 `wg-article.css`에서 상태 수정자로 지정. `token.css`는 역할색과 테마 값만 소유하며 컴포넌트 클래스를 선언하지 않음. Shiki 토큰의 구문 색상은 유지하고 `pre`의 인라인 색상은 제거.

글꼴 이름과 fallback은 `token.css`에 정적 선언. CLI는 내장 `@font-face`와 내용 지문이 붙은 자원 URL 생성.
공통 폰트 토큰의 정의를 IDE에서도 같은 소스로 확인 가능.
사이트 이름, 본문 한글, 영문과 코드 글꼴은 선요청. `font-display: optional`로 늦게 받은 글꼴의 화면 중간 교체 방지.
느린 첫 방문은 대체 글꼴로 읽고, 받은 파일은 다음 문서에서 재사용. dev와 preview의 글꼴 응답은 장기 캐시.

::part[Layout]

## Spacing and radius

| Space                            | Use                          |
|----------------------------------|------------------------------|
| `inline`                         | 한 줄 안의 라벨과 이름       |
| `stack`                          | 문단과 목록 흐름             |
| `block`                          | 코드, 표, 흐름도, 그림, 인용 |
| `group`                          | 제목과 본문 묶음 |
| `section`                        | section 사이                 |
| `page-top`, `gutter`              | 페이지 위와 좌우 여백        |
| `column`                         | 본문 좌우 패딩               |
| `sidebar-gap`                    | 사이드바와 본문 사이의 간격 |
| `tree-row`, `tree-group`, `tree-label`, `tree-indent` | 트리 항목 위아래 여백, 묶음 사이, 묶음 라벨 아래, 중첩 들여쓰기 |
| `anchor`                         | hash 제목 위치, TOC 읽는 선 |

공통 리듬: `inline` 6px, `stack` 10px, `block` 14px, `group` 20px, `subsection` 28px, `section` 64px.
본문 제목: h2는 구분선 아래 `subsection`, 제목 아래 `block`. h3는 위 60px(본문 세 줄쯤), 아래 `stack`으로 앞 문단과 떼고 아래 본문에 붙임. h2 바로 아래 h3는 위 `block`. 구분선과 제목 사이는 제목과 본문 사이의 두 배, 제목을 아래 본문에 묶어 표시.
같은 역할의 간격은 `margin`, `padding`, `gap`에서 공통 토큰 재사용.
사이드바는 묶음 간격 `tree-group` 16px, 라벨 아래 `tree-label` 2px, 행 위아래 여백 없이 배치. 데스크톱의 한 줄 항목 높이는 16.8px. 모바일에서는 위아래 여백 7px로 약 31px 높이를 확보하며 행 사이 별도 간격 없음. 홈 이동은 사이트 이름 하나로 제공.
사이트 이름은 사이드바 상단. 제목의 행 높이, 페이지 위 여백, 목록 전 `group` 20px를 합친 `size-brand` 사용.
사이트 이름은 한 줄, 긴 이름은 말줄임. 데스크톱에서는 이름을 고정하고 아래 목록만 스크롤. 목록과 TOC는 넘칠 때만 끝의 휠을 가두고, 넘치지 않으면 그 위와 아래 빈 곳의 휠도 본문 스크롤.
사이트 이름은 `page-top`에서 시작. 데스크톱의 본문은 `size-brand`만큼 위 여백을 두고 문서 탐색의 첫 묶음과 정렬.
본문은 양쪽 보더와 패딩을 포함해 사이드바, 간격, 바깥 여백을 뺀 나머지 전체. 페이지는 최대 1600px, 더 넓은 화면에서는 페이지를 가운데 정렬. 화면이 줄면 본문이 함께 줄고, 목차를 보이는 구간에서 본문 최소 폭은 약 800px.
본문의 `column` 패딩은 양쪽 32px. 별도의 `sidebar-gap` 32px로 사이드바와의 간격을 확보하며 본문 패딩은 유지.
사이드바 자체에는 패딩과 세로 보더 없음. 본문 양쪽에 `border-layout` 1px 보더를 배치.
문서 탐색과 TOC는 각각 폭 200px. 1360px 아래에서는 TOC를 숨기고 문서 목록만 표시. 제목이 길면 줄바꿈.
하위 문서와 소제목 들여쓰기는 `tree-indent` 12px. 선 없이 들여쓰기만으로 계층 표시.
앵커 도착점은 데스크톱 80px, 모바일에서는 고정 헤더 56px과 여백 14px을 합친 70px. 제목 위 여백을 남기고 아래 본문을 바로 읽는 기준. 화면 높이 비율 기준은 사용하지 않음. 높은 화면에서는 첫 화면 위쪽의 둘째 제목까지 이미 지난 제목으로 판정.
TOC의 현재 위치도 같은 `anchor` 토큰 사용. 본문 끝은 `section` 여백만 둠. 읽는 선에 닿지 못하는 끝 절이 있으면 마지막 한 화면의 도착 위치를 문서 끝까지 비례 압축하고, 압축한 거리만큼 그 제목들의 `scroll-margin-top`을 늘려 앵커 도착 위치와 TOC 전환 위치를 일치. TOC는 남은 제목을 차례로 표시. 링크로 이동한 제목은 사용자 스크롤 전까지 TOC에 유지하며 링크를 누르는 동안에는 다시 계산하지 않음.

문서 탐색과 목차의 묶음 사이는 `tree-group` 16px로 공유. 문서 탐색은 묶음 목록의 `gap`, 목차는 이름 있는 가름의 위 여백. 한 소유자에만 필요한 보정은 지역 값. 예: 하위 목록 아래 여백 4px.
같은 숫자여도 아이콘 크기, 글자 크기, 페이지 폭은 간격과 별도 역할.
모서리 토큰의 기본값은 `0`. 표와 다이어그램의 바깥 경계는 얇은 선으로 구분.
겹침 요소 추가 시 `z-index` 역할 토큰 먼저 정의. 사이트 이름이 든 모바일 고정 헤더는 `--app-z-index-sticky`, 커서 장식은 `--app-z-index-popper` 층.

## Responsive layout

| Width | Layout |
|-------|--------|
| `1360px` 이상 | 왼쪽 문서 200px, 본문은 나머지 전체(페이지 최대 폭에서 1080px, 최소 약 800px), 오른쪽 TOC 200px, 양쪽 간격 32px |
| `1024–1359px` | 문서 탐색 200px, TOC 숨김, 본문은 나머지 전체(736–1071px) |
| `1024px` 미만 | 고정 브랜드와 메뉴 버튼, 문서 탐색만 있는 드로어, 바로 시작하는 본문 |
| `640px` 미만 | 위와 좌우 여백 축소 |

양쪽 탐색 400px, 간격 64px, 바깥 여백 56px의 합은 520px. 여기에 본문 최소 800px과 스크롤바 여유를 더해 1360px에서 3열 전환. 1600px보다 넓은 화면은 페이지 전체를 가운데 정렬.

없는 문서는 탐색 없이 전체 화면 가운데 이미지, 상태 번호와 안내, 복귀 링크를 표시. 기본 그림은 favicon과 같은 윤곽, 눈과 색을 유지하고 입만 바꾼 슬픈 얼굴. `UiStatus`는 이미지와 상태 내용을 받는 공통 표현, `PgStatus`는 사이트 글꼴과 테마를 적용하는 독립 문서. 기본 404 그림은 `statusImage` 설정으로 교체.
사이트 이름은 데스크톱의 왼쪽 사이드바, 모바일의 56px 고정 헤더에 배치. 넓은 화면의 양쪽 목록은 `size-brand` 아래부터 남은 뷰포트 높이를 각각 사용. 목록 끝에는 본문 끝과 같은 `section` 여백을 두어 끝까지 내리면 마지막 줄이 화면 바닥에서 떨어짐. 모바일 드로어는 자체 아래 여백 유지.
좁은 데스크톱에서는 목차를 숨기고 문서 목록이 전체 탐색 높이를 사용. 오른쪽 목차를 왼쪽 목록에 합치거나 이동하지 않음.
실제 남은 내용이 있는 위아래 끝만 `size-navigation-fade` 28px로 흐리게 표시. `ResizeObserver`로 글꼴과 화면 크기 변경을 추적. 강제 색상 환경과 JavaScript 미사용 환경은 네이티브 스크롤바 제공.
모바일에서는 같은 문서 탐색 컴포넌트를 네이티브 `dialog` 안에 렌더. 드로어에서는 문서 목록만 스크롤하며 닫기 버튼은 고정. 본문 세로 보더, 열 패딩, 열 간격은 해제. JavaScript가 없으면 문서 목록을 본문 위에 제공.
폭 기준의 CSS 변수 사용 불가. `shell/wg-shell.css`, `sidebar/wg-sidebar.css`, `token.css`, `sidebar/_constant/navigation.ts`의 적용 구간 일치 필요.

## Interaction

- hover: 문서 탐색은 글색과 굵기를 유지한 밑줄, 사이트 이름은 밑줄, 본문 링크는 색 변경과 밑줄, TOC는 strong 글과 밑줄
- visited: 본문 링크는 보라색, 문서 탐색은 링크색 유지, TOC는 본문 글색 유지
- Theme: 시스템 설정에 따라 밝거나 어둡게 자동 적용
- focus-visible: 사이트 이름, 문서 탐색, TOC, 하위 TOC는 hover와 같은 밑줄과 색으로 표시하며 박스 outline 생략, 나머지 상호작용 요소는 공통 outline
- 현재 문서: 링크색 글, active 굵기 `600`
- TOC: 중립색 제목과 들여쓴 소제목, 현재 제목 하나만 active 굵기 `600`, 부모 글은 기본 굵기 유지, 클릭으로 문서 안에서 이동
- 모바일 드로어: 닫기 버튼, Escape, 배경 클릭으로 닫힘, 외부 포커스 차단과 배경 스크롤 잠금, 닫으면 메뉴 버튼으로 포커스 복원
- 드로어에는 문서 목록만 표시, 문서 선택 후 닫기, 데스크톱 전환 시 모달과 잠금 해제
- 접힌 Details의 소제목: TOC에는 표시, 현재 위치에서 제외, 제목 클릭 시 본문 공개
- 앵커 제목: 3초 강조 후 600ms 해제, 여러 줄의 글자 배경만 칠하고 배치 유지
- Note: 보충 설명의 제목과 왼쪽 선, 기본 본문 토큰
- Details: 제목 앞 고정폭 한 칸의 `+`(접힘)와 `−`(펼침), 파란 제목, 회색 실선(`border`), 접힌 제목 줄은 위아래 `stack` 여백, 제목 줄 hover는 줄 전체에 `accent-soft` 바탕, 펼친 본문은 표시 아래 세로선과 제목 글자 시작선에 맞춘 들여쓰기(`::details-content`, 미지원 브라우저는 선 없이 표시), 이어진 Details는 선 하나를 공유하는 목록, 접힌 본문의 hash 이동 시 공개. 표시는 화면 낭독기에서 제외하고 열림 상태는 네이티브 Details가 전달
- 그림: 문단에 혼자 있는 이미지는 `block` 위아래 여백. SVG는 640px 미만에서 파일에 적은 크기를 유지하고 넘치면 표처럼 가로 스크롤, 래스터는 본문 폭에 맞춤
- 도메인 상태: 현재 위치 `--active`
- DOM 상태: 기본 클래스 안의 pseudo-class
- 움직임 감소: 전역 `prefers-reduced-motion`
- 커서 장식: 클릭과 텍스트 선택을 가리지 않음, 화면 이탈 시 숨김, 터치와 움직임 감소 설정에서 비활성

::part[Review]

## Component review

1. 색, 폰트, 크기, 모서리의 기존 토큰 선택
2. 공통으로 반복되는 값만 토큰 추가
3. 새 색의 두 테마와 실제 대비 확인
4. 클래스 소유자, 역할, 수정자 확인
5. hover와 키보드 포커스 확인
6. 라벨과 목차의 글꼴, 크기, 자간 일치 확인
7. Light, Dark, 좁은 화면 확인
