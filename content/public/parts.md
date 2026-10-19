---
name: Parts
label: 부품의 목적과 작성 문법
group: Guide
order: 20
---

보충 설명은 Note, 구현 상세는 Details. 본문·비교·결정·질문은 Markdown의 글·목록·표·section.
아래 예시는 바로 복사해서 사용할 수 있는 Note와 Details입니다.
문서 전체 구조는 [Writing](writing.md).

## Overview

| Content       | Format                  | Use                              |
|---------------|-------------------------|----------------------------------|
| 본문·절차     | 문단·목록               | 먼저 읽어야 하는 내용            |
| 비교·계약     | 표·코드                 | 선택지·값·입출력                 |
| 흐름·관계·계층 | [Mermaid](diagrams.md)  | 절차·요청 왕복·상태·데이터 관계·폴더 구조 |
| 결정·질문     | section·표·hash 링크    | 식별자·상태·이유·남은 판단       |
| 보충 설명     | `:::note[제목]`         | 읽는 범위·제약·확인할 사항       |
| 구현 상세     | `:::details[제목]`      | 필요할 때 펼쳐 보는 규칙·계약    |

기본 블록은 Note·Details이며 모든 문서에서 같은 문법을 사용합니다.
[로컬 이미지·첨부](images.md), 각주·체크 목록·표·코드·흐름도를 함께 사용합니다.

::part[Components]

## Note

본문과 구분할 보충 설명. 제목·본문 필수, 별도 속성 없음.
기본 표현은 제목과 왼쪽 선. 여러 항목은 목록, 근거는 링크.

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

제목은 항상 표시, 본문은 기본 접힘. 제목·본문 필수.
`{open}`을 붙이면 처음부터 펼침. `open=true`, `open=false`는 사용 불가.
값을 붙인 `open=""`와 중복 `open`도 오류. `{open}`은 값 없는 단일 속성.

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
입력·오류·미결 사항 확인 후 구현 범위 확정.
:::
```

:::details[검토 기준]{open}
입력·오류·미결 사항 확인 후 구현 범위 확정.
:::

::part[Contract]

## Nesting

본문에는 문단·목록·표·코드·Mermaid와 `###` 이하 제목.
Note·Details 중첩 가능. `##` section과 `::part`는 부품 밖에 작성.
문서의 구획은 밖에, 부연과 구현 상세는 해당 section 안에 배치.

바깥 fence는 안쪽보다 긴 `:` 사용. 코드에 `:::`가 들어가는 경우에도 같은 기준.

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

제목은 비어 있지 않은 일반 텍스트. 제목의 링크·강조·인라인 코드는 사용 불가.
본문은 일반 Markdown. 부품 안의 `###`도 TOC·hash 대상.

[Supported files](#supported-files)로 이동하면 해당 Details가 펼쳐짐.
상위 Details가 여러 개면 함께 펼침. 같은 링크를 다시 눌러도 접힌 대상 공개.
접힌 제목은 현재 읽는 section·subsection 판정에서 제외.

Details 제목에서 Enter·Space로 펼칠 수 있습니다.
JavaScript 없이도 제목과 본문을 읽고 펼칠 수 있음.

## Errors

지원하지 않는 입력은 빌드 오류. 잘못된 입력을 다른 부품으로 대체하지 않음.

| Input                           | Reason                         | Fix                            |
|---------------------------------|--------------------------------|--------------------------------|
| `::note[Scope]`                  | 본문 없는 형태                 | `:::note[...]` 블록             |
| `:details[Implementation]`       | 인라인 형태                    | `:::details[...]` 블록          |
| 제목 생략·빈 제목               | 읽는 범위·동작 이름 부재       | `[제목]` 작성                  |
| 제목의 링크·강조·코드           | 일반 텍스트 제목 계약          | 서식은 본문에 작성             |
| 본문 생략·참조 정의·주석·빈 코드·빈 목록만 있는 본문 | 읽을 내용 부재 | 문단·이미지·표 등 본문 작성 |
| Note 속성·Details 미지원 속성   | 공개 입력에 없는 값            | 속성 제거                      |
| `open=false`·`open=true`·`open=""`·중복 `open` | 값 없는 단일 속성 계약 | 생략 또는 `{open}` |
| 닫는 fence 생략·길이 부족       | 부품의 끝 불명확               | 여는 fence 이상의 길이로 닫기 |
| 부품 안의 `#`·`##`·`::part`     | 문서 구획과 부품 내용의 혼합   | 제목·part를 부품 밖에 작성     |

등록하지 않은 블록 이름은 작성 오류. 일반 문장에서 오인한 미등록 인라인 지시문은 원문 유지.
원시 HTML의 사용 범위는 [Writing](writing.md#content-features).
