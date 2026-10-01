---
name: Settings
label: 사이트 설정
group: Writing
---

문서 폴더의 `for-humanity.config.mjs`. 제목, 소개, status badge 설정.
설정 파일과 각 항목 모두 선택. 생략한 값은 기본값 적용.

## Overview

```js
export default {
    title: "for humanity",
    description: "사람이 읽는 문서를 위한 Markdown 문서 도구",
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

설정을 생략하면 기본 이름 `for humanity`와 픽셀 얼굴 아이콘.
`title`을 지정하면 탭·사이드바·문서 머리에 같은 사이트 이름 적용.
아이콘은 탭의 favicon과 같은 파일, 사이드바에서는 32px 크기.

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
