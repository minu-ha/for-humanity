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
| `description` | 첫 화면 소개            | 생략           |

설정을 생략하면 기본 이름 `for humanity`.
`title`을 지정하면 탭·사이드바·문서 머리에 같은 사이트 이름 적용.
픽셀 얼굴은 탭의 favicon과 데스크톱 커서 옆 장식에 같은 파일 사용.
사이드바의 브랜드 영역에는 이름, 문서 목록에는 얼굴의 아웃라인 표지 표시.

## Navigation

`navigation`은 frontmatter의 `group` 이름을 읽는 순서대로 나열한 배열.
사이드바와 Overview 카드에 같은 순서 적용.

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
문서마다 기본 아웃라인 표지와 이름을 함께 표시하고, 현재 페이지는 왼쪽 선과 글자색으로 구분.

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

테마는 읽는 사람의 선택. System → Light → Dark 순환, 브라우저에 저장.

- 본문·라벨: Pretendard Variable
- 코드·section 번호·흐름도: JetBrains Mono Variable
- 폰트 파일: 빌드 결과 포함 · CDN 요청 없음
- 색과 간격: `src/style/token.css` · [Design](design.md)
