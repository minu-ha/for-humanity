---
name: Parts
label: 부품의 목적과 작성 문법
group: Guide
order: 20
---

보충 설명에는 Note, 구현 상세에는 Details를 사용합니다. 본문, 비교, 결정, 질문은 Markdown의 글, 목록, 표, section으로 작성합니다.
아래 예시는 바로 복사해서 사용할 수 있는 Note와 Details입니다.
문서 전체 구조는 [Writing](writing.md)을 참고합니다.

## Overview

| Content       | Format                  | Use                              |
|---------------|-------------------------|----------------------------------|
| 본문과 절차   | 문단과 목록             | 먼저 읽어야 하는 내용            |
| 비교와 계약   | 표와 코드               | 선택지, 값, 입출력               |
| 흐름, 관계, 계층 | [Mermaid](diagrams.md)  | 절차, 요청 왕복, 상태, 데이터 관계, 폴더 구조 |
| 결정과 질문   | section, 표, hash 링크  | 식별자, 상태, 이유, 남은 판단    |
| 보충 설명     | `:::note[제목]`         | 읽는 범위, 제약, 확인할 사항     |
| 구현 상세     | `:::details[제목]`      | 필요할 때 펼쳐 보는 규칙과 계약  |

기본 블록은 Note와 Details이며 모든 문서에서 같은 문법을 사용합니다.
[로컬 이미지와 첨부](images.md), 각주, 체크 목록, 표, 코드, 흐름도를 함께 사용합니다.

::part[Components]

## Note

Note는 본문과 구분할 보충 설명입니다. 제목과 본문은 필수이며 별도 속성은 없습니다.
기본 표현은 제목과 왼쪽 선입니다. 여러 항목은 목록으로, 근거는 링크로 적습니다.

#### Source

```markdown
:::note[Scope]
공개 문서를 빌드하기 전에 다음 내용을 확인합니다.

- 홈과 문서의 링크가 올바른지 확인합니다.
- 추가 설명은 [Details](#details)에 작성할 수 있습니다.
:::
```

#### Result

:::note[Scope]
공개 문서를 빌드하기 전에 다음 내용을 확인합니다.

- 홈과 문서의 링크가 올바른지 확인합니다.
- 추가 설명은 [Details](#details)에 작성할 수 있습니다.
:::

## Details

Details의 제목은 항상 표시되고 본문은 기본으로 접혀 있습니다. 제목과 본문은 필수입니다.
`{open}`을 붙이면 처음부터 펼칩니다. `open=true`, `open=false`는 사용할 수 없습니다.
값을 붙인 `open=""`와 중복 `open`도 오류입니다. `{open}`은 값 없는 단일 속성입니다.

#### Source

```markdown
:::details[Implementation]
### Supported files

| Field          | Use                |
|----------------|--------------------|
| `.md`         | Markdown 문서      |
| `.mdx`        | Markdown으로 처리  |
:::
```

#### Result

:::details[Implementation]
### Supported files

| Field          | Use                |
|----------------|--------------------|
| `.md`         | Markdown 문서      |
| `.mdx`        | Markdown으로 처리  |
:::

#### Default open

```markdown
:::details[검토 기준]{open}
입력, 오류, 미결 사항을 확인한 뒤 구현 범위를 확정합니다.
:::
```

:::details[검토 기준]{open}
입력, 오류, 미결 사항을 확인한 뒤 구현 범위를 확정합니다.
:::

::part[Contract]

## Nesting

본문에는 문단, 목록, 표, 코드, Mermaid와 `###` 이하 제목을 쓸 수 있습니다.
Note와 Details는 중첩할 수 있습니다. `##` section과 `::part`는 부품 밖에 작성합니다.
문서의 구획은 부품 밖에, 부연과 구현 상세는 해당 section 안에 배치합니다.

바깥 fence는 안쪽 fence보다 `:`의 수가 많아야 합니다. 코드에 `:::`가 들어가는 경우에도 같은 기준을 적용합니다.

````markdown
::::details[구현 상세]
:::note[확인할 사항]
설정 파일을 수정했다면 개발 서버를 다시 시작합니다.
:::

```text
pnpm exec for-humanity --version
```
::::
````

::::details[구현 상세]
:::note[확인할 사항]
설정 파일을 수정했다면 개발 서버를 다시 시작합니다.
:::

```text
pnpm exec for-humanity --version
```
::::

## Titles and links

제목은 비어 있지 않은 일반 텍스트여야 합니다. 제목에는 링크, 강조, 인라인 코드를 사용할 수 없습니다.
본문은 일반 Markdown입니다. 부품 안의 `###`도 TOC와 hash 대상입니다.

[Supported files](#supported-files)로 이동하면 해당 Details가 펼쳐집니다.
상위 Details가 여러 개면 함께 펼칩니다. 같은 링크를 다시 눌러도 접힌 대상을 펼칩니다.
접힌 제목은 현재 읽는 section과 subsection을 판정할 때 제외합니다.

Details 제목에서 Enter나 Space로 펼칠 수 있습니다.
JavaScript 없이도 제목과 본문을 읽고 펼칠 수 있습니다.

## Errors

지원하지 않는 입력은 빌드 오류입니다. 잘못된 입력을 다른 부품으로 대체하지 않습니다.

| Input                           | Reason                         | Fix                            |
|---------------------------------|--------------------------------|--------------------------------|
| `::note[Scope]`                  | 본문 없는 형태                 | `:::note[...]` 블록             |
| `:details[Implementation]`       | 인라인 형태                    | `:::details[...]` 블록          |
| 제목 생략 또는 빈 제목          | 읽는 범위와 동작 이름 부재     | `[제목]` 작성                  |
| 제목의 링크, 강조, 코드         | 일반 텍스트 제목 계약          | 서식은 본문에 작성             |
| 본문 생략 또는 참조 정의, 주석, 빈 코드, 빈 목록만 있는 본문 | 읽을 내용 부재 | 문단, 이미지, 표 등 본문 작성 |
| Note 속성 또는 Details 미지원 속성 | 공개 입력에 없는 값            | 속성 제거                      |
| `open=false`, `open=true`, `open=""`, 중복 `open` | 값 없는 단일 속성 계약 | 생략 또는 `{open}` |
| 닫는 fence 생략 또는 길이 부족  | 부품의 끝 불명확               | 여는 fence 이상의 길이로 닫기 |
| 부품 안의 `#`, `##`, `::part`   | 문서 구획과 부품 내용의 혼합   | 제목과 part를 부품 밖에 작성   |

등록하지 않은 블록 이름은 작성 오류입니다. 일반 문장에서 미등록 인라인 지시문으로 오인한 부분은 원문을 유지합니다.
원시 HTML의 사용 범위는 [Writing](writing.md#content-features)을 참고합니다.
