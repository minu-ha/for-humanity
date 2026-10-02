---
name: Settings
label: 사이트 설정
group: Guide
order: 30
---

문서 폴더의 `for-humanity.config.mjs`. 제목, 소개, 문서 묶음 순서, status badge 설정.
설정 파일과 각 항목 모두 선택. 생략한 값은 기본값 적용.

## Overview

```js
export default {
    title: "for humanity",
    description: "사람이 읽는 문서를 위한 Markdown 문서 도구",
    navigation: ["Getting started", "Guide", "Reference", "Examples"],
    status: [
        {phrase: "확인됨", kind: "verified", date: true},
        {phrase: "확인되지 않았다", kind: "unverified"},
    ],
};
```

검증은 명령 시작 시 한 번. 개발 중 설정 변경은 서버 재시작 필요.

::part[Configuration]

## Site

| Key           | Use                     | Default        |
| ------------- | ----------------------- | -------------- |
| `title`       | 사이드바 이름 · 탭 제목 | `for humanity` |
| `description` | HTML 설명 메타데이터     | 생략           |

설정을 생략하면 기본 이름 `for humanity`.
`title`을 지정하면 탭·사이드바에 같은 사이트 이름 적용. 홈의 제목과 소개는 `README.md`에서 작성.
픽셀 얼굴은 탭의 favicon과 데스크톱 커서 옆 장식에 같은 파일 사용.
사이트 이름과 문서 목록은 왼쪽 사이드바에 텍스트로 표시.
데스크톱에서는 사이트 이름을 고정하고 아래 목록만 스크롤. 사이트 이름은 Architects Daughter Regular, 미지원 글자는 본문 폰트로 표시.
현재 문서 목차는 넓은 화면에서도 문서 목록 아래에 배치. 문서 탐색과 목차는 왼쪽 사이드바에서 함께 스크롤.
데스크톱의 본문은 문서 목록의 첫 묶음과 같은 높이에서 시작. 사이드바와 본문 사이의 간격은 32px이며 본문 좌우 패딩은 32px 유지.
본문 `main`은 양쪽 보더와 패딩을 포함해 최대 `900px`. 넓은 화면에서는 본문을 중앙에 배치하고, 화면이 줄어들면 오른쪽 여백부터 0까지 축소. 사이드바와 본문이 함께 들어가지 않을 때 본문 폭을 줄임. 사이드바 자체의 패딩과 세로 보더는 없음.

## Navigation

`navigation`은 frontmatter의 `group` 이름을 읽는 순서대로 나열한 배열.
사이드바의 묶음 순서에 적용. 홈은 `README.md`에 작성한 내용으로 표시.

```js
export default {
    navigation: ["Getting started", "Guide", "Reference", "Examples", "Development"],
};
```

- 묶음 이름: frontmatter의 `group`과 대소문자까지 일치
- 같은 묶음을 두 번 지정하면 설정 오류
- 설정에 없는 묶음: 지정한 묶음 뒤에서 이름순
- 문서가 없는 묶음: 표시하지 않음
- `navigation` 생략: 모든 묶음을 이름순
- 묶음 안의 순서: frontmatter의 `order` · [Writing](writing.md#navigation-groups)

하위 문서 없이도 묶음 안에 여러 페이지 배치 가능. 모든 묶음과 문서 링크를 항상 표시.
문서는 이름과 1px 트리 선으로 표시. 방문 여부와 무관하게 중립색을 사용하며 현재 페이지는 진한 글·굵기 `500`·가로 가지선으로 구분. 같은 묶음의 시작부터 현재 문서까지 이어지는 세로 줄기도 강조.
문서 링크와 사이트 이름은 hover 시 글색·굵기를 유지하고 밑줄 표시. 문서의 가로 가지는 hover한 링크색으로 표시하고, 묶음 시작부터 해당 항목까지의 세로 경로도 함께 강조.
사이트 이름·문서 탐색·TOC·하위 TOC는 Tab 포커스에도 각 링크의 hover와 같은 밑줄·색을 사용하며 박스 테두리는 표시하지 않음.
목차는 작성한 제목과 중첩 트리로 표시하며 자동 번호 없음. 현재 절·소제목은 진한 글·굵기 `500`, 가로 가지와 묶음 시작부터 이어지는 세로 경로는 같은 진한 색으로 구분. 선택한 항목 아래와 다른 묶음의 선은 기본색 유지. hover·키보드 포커스에서는 탐색 중인 경로를 추가로 강조하고, 벗어나면 현재 위치의 경로만 유지. 하위 목차를 탐색하면 상위 절의 경로도 표시. 모든 소제목은 항상 표시.
한 줄 항목의 높이는 22px. 긴 제목이 여러 줄이 되어도 가지는 첫 줄 가운데에 연결.

## Status badges

| Key      | Value                     | Use                              |
| -------- | ------------------------- | -------------------------------- |
| `phrase` | 비어 있지 않은 상태 문구  | 본문에서 찾을 글                 |
| `kind`   | `verified` / `unverified` | 초록 / amber                     |
| `date`   | 선택 boolean              | 뒤의 `YYYY-MM-DD` 날짜 포함 여부 |

- 기본 문구: `확인됨`, `확인되지 않았다`
- `status` 지정 시 기본 목록 전체 교체
- `status: []` = status badge 없음
- 괄호로 감싼 문구 → 괄호 없이 badge 표시
- 제목, 링크, 코드 안 문구 → 원문 유지

### Examples

| Source              | Result            |
| ------------------- | ----------------- |
| `확인됨 2026-10-01` | 확인됨 2026-10-01 |
| `(확인되지 않았다)` | (확인되지 않았다) |

::part[Appearance]

## Themes and fonts

테마는 읽는 사람의 시스템 설정에 따라 밝게·어둡게 자동 적용.

- 본문·라벨: Pretendard Variable
- 코드·흐름도: JetBrains Mono Variable
- 폰트 파일: 빌드 결과 포함 · CDN 요청 없음
- 색과 간격: `src/style/token.css` · [Design](design.md)
