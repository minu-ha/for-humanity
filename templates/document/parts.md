---
name: Parts
label: 부품의 목적과 작성 문법
group: Guide
order: 20
---

보충 설명은 Note, 구현 상세는 Details. 본문·비교·결정·질문은 Markdown의 글·목록·표·section.
가상 독서 목록 앱의 사용 예는 [Blueprint](blueprint.md). 아래 데이터·API도 같은 가상 예시.
문서 전체 구조는 [Writing](writing.md).

## Overview

| Content       | Format                  | Use                              |
|---------------|-------------------------|----------------------------------|
| 본문·절차     | 문단·목록               | 먼저 읽어야 하는 내용            |
| 비교·계약     | 표·코드                 | 선택지·값·입출력                 |
| 흐름          | Mermaid                 | 조회·선택·상태의 연결            |
| 결정·질문     | section·표·hash 링크    | 식별자·상태·이유·남은 판단       |
| 보충 설명     | `:::note[제목]`         | 읽는 범위·제약·확인할 사항       |
| 구현 상세     | `:::details[제목]`      | 필요할 때 펼쳐 보는 규칙·계약    |

Decision·Question·API reference의 전용 부품은 실제 샘플에서 추가 표현이 필요할 때 선정.
이번 기본 부품은 Note·Details. 일반 문서와 blueprint에서 같은 문법 사용.

::part[Components]

## Note

본문과 구분할 보충 설명. 제목·본문 필수, 별도 속성 없음.
기본 표현은 제목과 왼쪽 선. 여러 항목은 목록, 근거는 링크.

#### Source

```markdown
:::note[Scope]
책장 탐색과 책 상세 읽기가 예시 범위.

- 현재 검토 범위: 책장 목록·읽기 상태·책 상세
- 미결 사항: [Questions](blueprint.md#questions)
:::
```

#### Result

:::note[Scope]
책장 탐색과 책 상세 읽기가 예시 범위.

- 현재 검토 범위: 책장 목록·읽기 상태·책 상세
- 미결 사항: [Questions](blueprint.md#questions)
:::

## Details

제목은 항상 표시, 본문은 기본 접힘. 제목·본문 필수.
`{open}`을 붙이면 처음부터 펼침. `open=true`, `open=false`는 사용 불가.
값을 붙인 `open=""`와 중복 `open`도 오류. `{open}`은 값 없는 단일 속성.

#### Source

```markdown
:::details[Implementation]
### Response contract

| Field          | Use                |
|----------------|--------------------|
| `bookCount`    | 책장에 담긴 책 수  |
| `name`         | 책장 표시 이름     |
:::
```

#### Result

:::details[Implementation]
### Response contract

| Field          | Use                |
|----------------|--------------------|
| `bookCount`    | 책장에 담긴 책 수  |
| `name`         | 책장 표시 이름     |
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
첫 책장을 자동 선택할지는 Q1 확인 후 결정.
:::

```text
GET /api/shelves
```
::::
````

::::details[구현 상세]
:::note[확인할 사항]
첫 책장을 자동 선택할지는 Q1 확인 후 결정.
:::

```text
GET /api/shelves
```
::::

## Titles and links

제목은 비어 있지 않은 일반 텍스트. 제목의 링크·강조·인라인 코드는 사용 불가.
본문은 일반 Markdown. 부품 안의 `###`도 번호·TOC·hash 대상.

[Response contract](#response-contract)로 이동하면 해당 Details가 펼쳐짐.
상위 Details가 여러 개면 함께 펼침. 같은 링크를 다시 눌러도 접힌 대상 공개.
접힌 제목은 현재 읽는 section·subsection 판정에서 제외.

Details는 native `details`·`summary`. 제목에서 Enter·Space로 펼침, 키보드 포커스 표시.
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

참조: [remark-directive](https://github.com/remarkjs/remark-directive), [HTML Details](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element).
