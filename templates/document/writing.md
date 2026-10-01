---
name: Writing
label: 문서 작성
group: Guide
order: 10
---

문서 한 장 = Markdown 파일 하나. frontmatter, section, part, 본문 기능의 작성 기준.
부품의 계약과 소스·결과 예시는 [Parts](parts.md), 설계 문서 샘플은 [Blueprint](blueprint.md).

## Overview

```markdown
---
name: Guide
label: 사용 안내
group: Guide
order: 10
---

문서의 범위와 핵심.

## Overview

::part[Setup]

## Installation

### Requirements
```

문서 폴더에는 Markdown과 선택 설정 파일. 루트 `README.md`, `node_modules`, `dist`는 문서 대상에서 제외.
하위 폴더도 지원. `.mdx`는 Markdown으로 처리 · JSX 실행 미지원.

::part[Structure]

## Frontmatter

| Key     | Use                               | Required                   |
| ------- | --------------------------------- | -------------------------- |
| `name`  | 제목 · 목록 · 카드                 | 필수 · 비어 있지 않은 이름 |
| `label` | 짧은 문서 설명 · 카드 · 목록 툴팁 | 필수                       |
| `group` | 사이드바 묶음 · 카드 · header     | 필수 · 비어 있지 않은 이름 |
| `order` | 묶음 안의 읽는 순서               | 선택 · 0 이상의 정수       |
| `type`  | `document` / `blueprint`          | 기본 `document`            |

같은 첫 글자로 시작하는 이름도 허용. `API`와 `Architecture`는 각각 별도 문서.
`blueprint` 전용 표현은 아직 미구현.
파일 경로는 확장자를 뺀 소문자 id로 사용. `.md`와 `.mdx`, 대소문자만 다른 경로의 id 중복 금지.
빈 경로와 예약 문자 `#`, `?`, `%`, `*`, `:`, `\`는 사용 불가. 첫 경로 `/_fh/`는 패키지 자원 전용.
`.`·`..`·`index.html` 경로 조각, 제어문자, 첫 경로 `/favicon.svg/`는 정적 출력과 충돌하므로 사용 불가.

### Navigation groups

하위 폴더를 만들지 않아도 `group`으로 문서를 묶음. 묶음은 페이지가 아닌 탐색 제목.
그 안의 각 문서는 독립적인 파일·URL·목차를 가짐.

| File              | Name         | Group       | Order |
| ----------------- | ------------ | ----------- | ----- |
| `writing.md`      | Writing      | Guide       | 10    |
| `parts.md`        | Parts        | Guide       | 20    |
| `api.md`          | API          | Reference   | 10    |
| `architecture.md` | Architecture | Development | 10    |

묶음 순서는 [Settings](settings.md#navigation)의 `navigation`. 묶음 안은 작은 `order` 먼저.
`order`를 생략한 문서는 순서를 지정한 문서 뒤에서 제목순, 제목도 같으면 파일 id순.
파일 이름에 번호나 알파벳을 붙여 순서를 맞출 필요 없음.
현재 문서의 묶음은 자동으로 펼침. `Contents`는 현재 문서 안의 절만 표시.

## Sections and parts

- `##` → section 번호 `00`, `01`, `02`
- `###` → subsection 번호 `01.A`, `01.B` · section당 최대 26개
- 첫 section 앞의 글 → 문서 header
- `::part[Setup]` → 여러 section을 묶는 part · TOC 그룹
- 제목 id → GitHub 방식 · 같은 제목은 `-1`, `-2` 접미사

### Links

```markdown
[Settings](settings.md)
[Status badges](settings.md#status-badges)
```

상대 Markdown 링크 → 사이트 문서 URL. GitHub에서도 같은 파일로 이동.
외부 URL, 절대 URL, 같은 문서의 hash는 원문 유지.

::part[Content]

## Flowcharts

````markdown
```mermaid
flowchart LR
    a("작성") --> b("확인")
    b --> c("배포")
```
````

```mermaid
flowchart LR
    a("작성") --> b("확인")
    b --> c("배포")
```

빌드 시 격자 SVG 생성. 짧은 노드 이름, 한 단어 선 라벨 권장. 긴 라벨은 `<br>`로 분리.

## Content features

| Source                 | Result                     |
| ---------------------- | -------------------------- |
| GFM 표                 | 넓은 표의 내부 가로 스크롤 |
| 언어 지정 코드 블록    | Shiki 코드 강조            |
| 인라인 색 값 `#e80030` | swatch                     |
| 설정의 상태 문구       | status badge               |

상태 문구는 [Settings](settings.md#status-badges)에서 변경.
원시 HTML은 그대로 반영되는 작성 형식. 외부 콘텐츠의 실행·격리 환경은 제공하지 않음.

## Block components

```markdown
:::note[Scope]
보충 설명과 제약.
:::

:::details[Implementation]
### Response contract

필요할 때 펼쳐 보는 구현 상세.
:::
```

- Note: 항상 표시되는 보충 설명 · 제목·본문 필수 · 속성 없음
- Details: 기본 접힘 · 제목·본문 필수 · `{open}`으로 기본 펼침
- 속성의 값 표기·중복 `open`, 주석·빈 코드·빈 목록만 있는 본문은 오류
- 제목: 일반 텍스트 · 링크·강조·인라인 코드 미지원
- 본문: 일반 Markdown · `###` 이하 제목과 Note·Details 중첩
- 문서 구획: `##`와 `::part`는 부품 밖
- 닫는 fence: 필수 · 중첩하거나 코드에 `:::`가 있으면 바깥 fence를 더 길게 작성
- 부품 내부 제목: TOC·번호·hash 지원 · hash 이동 시 상위 Details 공개
- 미지원 형태·속성·빈 입력: 빌드 오류 · [Errors](parts.md#errors)

Decision·Question·API reference는 section·표·링크로 작성.
전용 부품의 필요성은 실제 샘플을 기준으로 판단.

## Writing conventions

- 한 줄 한 사실
- 제목과 요약은 명사구 중심
- 경위보다 현재 계약·결정·제약
- 식별자와 값은 코드, 절차는 목록, 비교는 표
- 실제 지원 범위와 미구현 범위 구분

### Language

- 독자: 한국어 사용자 · 기본적인 영어와 개발 용어 이해 가능
- 제목·내비게이션·짧은 라벨: 익숙한 영어 표현 우선
- 본문·소개·사용법·선택 이유·오류 설명: 가능한 한 한국어
- 기술 용어·명령·코드·식별자: 원래 표기 유지 · 어색한 직역 금지
- 같은 개념은 같은 용어 사용 · 문서마다 다른 번역이나 별칭 사용 금지
- 영어 제목은 sentence case · `Status badges`, `Writing conventions` · 제품명과 API 표기는 원형 유지

`name`과 `group`은 짧은 영어 이름. `label`은 문서 설명이므로 한국어가 기본.
코드 예시도 같은 기준 적용: 제목은 `Overview`, 설명문은 한국어.

### Terms

| Term         | Meaning                                  |
| ------------ | ---------------------------------------- |
| Overview     | 문서의 범위와 핵심을 모은 첫 section     |
| Frontmatter  | 파일 맨 앞의 YAML 메타데이터             |
| Section      | `##` 제목과 자동 번호가 붙는 본문 단위   |
| Subsection   | `###` 제목 · section 안의 하위 단위      |
| Part         | `::part[...]`로 여러 section을 묶는 그룹 |
| TOC          | 현재 문서의 section·subsection 목록      |
| Status badge | 설정의 상태 문구를 강조하는 표지         |
| Swatch       | 인라인 색 값 앞에 표시하는 색 견본       |
| Note         | 본문과 구분되는 보충 설명               |
| Details      | 제목을 눌러 펼치는 구현 상세             |
