---
name: Settings
label: 사이트 설정
group: Guide
order: 30
---

문서 폴더의 `for-humanity.config.mjs`. 제목, 소개, 공개 URL, 문서 묶음 순서, status badge 설정.
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
| `url`         | 공개 HTTP(S) 루트 URL · robots.txt와 sitemap.xml 생성 · 0.6.0+ | 생략 · 생성하지 않음 |

`url`은 npm `0.6.0`부터 지원합니다. 설정·출력·Cloudflare 정책은 [Crawling](crawling.md).

설정을 생략하면 기본 이름 `for humanity`.
`title`을 지정하면 탭·사이드바에 같은 사이트 이름 적용. 홈의 제목과 소개는 `README.md`에서 작성.
픽셀 얼굴은 탭의 favicon과 데스크톱 커서 옆 장식에 같은 파일 사용.
사이트 이름과 문서 목록은 왼쪽 사이드바에 텍스트로 표시.
데스크톱에서는 사이트 이름을 고정하고 아래 목록만 스크롤. 사이트 이름은 Architects Daughter Regular, 미지원 글자는 본문 폰트로 표시.
1536px 이상에서는 문서 목록은 왼쪽, 현재 문서 목차는 오른쪽에 같은 폭 240px로 배치. 1536px 미만에서는 목차를 숨김. 와이드 화면의 두 목록은 각각 독립 스크롤.
데스크톱의 본문 제목과 문서 목록 첫 묶음 라벨은 글자의 위쪽 시작선을 맞춤. 사이드바와 본문 사이의 간격은 32px이며 본문 좌우 패딩은 32px 유지.
본문 `main`은 양쪽 보더와 패딩을 포함해 최대 `900px`. 넓은 화면에서는 본문을 중앙에 배치하고, 화면이 줄어들면 오른쪽 여백부터 0까지 축소. 사이드바와 본문이 함께 들어가지 않을 때 본문 폭을 줄임. 사이드바 자체의 패딩과 세로 보더는 없음.

모바일에서는 브랜드와 메뉴 버튼만 위에 고정. 버튼을 누르면 문서 목록만 왼쪽 드로어에 표시. 닫기·Escape·배경 클릭 또는 문서 선택으로 닫음. JavaScript가 없으면 목록을 본문 위에서 표시.

## Navigation

`navigation`은 frontmatter의 `group` 이름 또는 경로를 읽는 순서대로 나열한 배열.
사이드바의 각 단계에서 형제 묶음의 순서에 적용. 홈은 `README.md`에 작성한 내용으로 표시.

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

중첩 묶음의 순서는 이름 배열로 지정. 최상위는 기존 문자열 문법도 사용 가능.

```js
export default {
    navigation: [
        "Projects",
        ["Projects", "Example project", "Research"],
        ["Projects", "Example project", "Decisions"],
        "Personal",
    ],
};
```

위 설정은 Projects 안의 Example project에서 Research를 Decisions보다 먼저 표시.
하위 경로를 지정하면 조상 묶음도 그 경로의 최초 설정 위치를 사용. 지정하지 않은 형제는 지정한 형제 뒤에서 이름순.
`"Guide"`와 `["Guide"]`는 같은 경로이므로 둘을 함께 지정하면 중복 오류. 이름이 같은 하위 묶음도 부모 경로가 다르면 별도로 정렬.

하위 문서 없이도 묶음 안에 여러 페이지 배치 가능. 탐색 영역에서는 모든 묶음과 문서 링크를 표시.
문서는 이름으로 표시하고 하위 문서는 들여쓰기. 클릭할 수 없는 묶음은 회색 `11px`, 문서 링크는 방문 여부와 무관하게 링크색 `12px`. 현재 문서는 링크색을 유지하고 굵기 `600`으로 구분.
문서 링크와 사이트 이름은 hover 시 글색·굵기를 유지하고 밑줄 표시.
사이트 이름·문서 탐색·TOC·하위 TOC는 Tab 포커스에도 각 링크의 hover와 같은 밑줄·색을 사용하며 박스 테두리는 표시하지 않음.
`parent`로 연결한 하위 문서는 부모 아래에 표시. 부모 문서는 링크색을 유지하며, 현재 문서 한 곳만 굵게 표시 · [Navigation](navigation.md).
목차 제목은 `On this page` · 문서 탐색의 묶음 라벨과 같은 회색 `11px`. 클릭할 수 없는 part 묶음도 같은 표현, 절·소제목 링크는 본문 글색 `12px`로 구분.
목차는 작성한 제목과 들여쓴 소제목으로 표시하며 자동 번호 없음. 현재 절·소제목 하나만 진한 글·굵기 `600`, 상위 절은 기본 굵기 유지.
한 줄 항목의 높이는 데스크톱 16.8px, 모바일 드로어 약 31px. 긴 제목은 여러 줄로 줄바꿈.

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

- 본문·라벨·코드·흐름도: Monoplex KR
- 폰트 파일: 빌드 결과 포함 · CDN 요청 없음
- 색과 간격: `src/style/token.css` · [Design](design.md)
