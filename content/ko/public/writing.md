---
name: Writing
label: Markdown으로 홈과 문서 작성하기
group: Guide
order: 10
---

문서 한 장을 Markdown 파일 하나로 작성합니다. 파일 앞에는 문서 정보를, 그 아래에는 본문을 적습니다.

## Your first document

`content/public/guide.md`를 만들고 다음 내용을 작성합니다.

```markdown
---
name: Guide
label: 프로젝트 시작 안내
group: Guide
order: 10
---

프로젝트를 처음 사용하는 사람을 위한 안내입니다.

## Installation

설치에 필요한 준비 사항을 적습니다.

## Usage

### First step

첫 번째 작업을 설명합니다.
```

`dev`를 실행하면 사이드바의 Guide 그룹에 문서가 나타납니다. 문서 주소는 `/guide/`입니다.
`##`와 `###` 제목은 페이지 목차에 표시됩니다. 문서 제목은 `name`으로 표시하므로 본문에 같은 `#` 제목을 반복할 필요가 없습니다.

public은 배포할 문서, private은 로컬에서만 읽을 문서를 담습니다. 두 폴더 밖의 일반 Markdown은 자동으로 문서 목록에 추가하지 않습니다.

## Home page

`content/README.md`는 사이트 홈(`/`)입니다. frontmatter 없이 제목과 소개를 작성합니다.

```markdown
# Project notes

프로젝트 소개와 문서 안내입니다.

[시작하기](public/guide.md)
```

사이트 이름을 누르면 홈으로 이동합니다. README가 없으면 홈 작성 안내가 표시됩니다.
public과 private 안의 README는 일반 문서이므로 다른 문서처럼 frontmatter를 작성합니다.

## Frontmatter

| Field | Use | Required |
| --- | --- | --- |
| `name` | 본문과 사이드바에 표시할 제목 | 필수, 비어 있지 않은 문자열 |
| `label` | 사이드바 툴팁, 검색 결과, 링크 미리보기에 표시할 문서 설명 | 필수 |
| `group` | 사이드바 그룹 이름 또는 이름 배열 | 필수, 비어 있지 않은 값 |
| `order` | 같은 그룹 안에서 읽을 순서 | 선택, 0 이상의 정수 |
| `parent` | 같은 그룹 안의 부모 문서 ID | 선택 |
| `created` | 문서를 처음 작성한 날짜, 제목 아래에 표시 | 선택, `YYYY-MM` 또는 `YYYY-MM-DD` |
| `revised` | 문서를 수정한 날짜, 제목 아래에 표시 | 선택, 같은 형식, `created`보다 앞설 수 없음 |

새 문서는 `type`을 지정할 필요가 없습니다. 기존 `document`와 `blueprint` 값은 계속 읽으며 같은 문서로 표시합니다.
제목과 그룹에는 원하는 언어를 사용할 수 있습니다.

### Dates

```yaml
created: 2022-12
revised: 2026-10
```

위 문서는 제목 아래에 `작성일 2022-12, 수정일 2026-10`을 작은 회색 글자로 표시합니다. 한국어 페이지는 `작성일`과 `수정일`, 다른 언어의 페이지는 영어 라벨 `Created`와 `Revised`를 사용합니다. 두 날짜 중 하나만 적어도 됩니다.
달까지는 `YYYY-MM`, 날까지는 `YYYY-MM-DD`로 적습니다. 날짜는 적은 그대로 표시합니다. 다른 형식, 없는 날짜, `created`보다 앞선 `revised`는 빌드 오류입니다.
날까지 적은 날짜는 사이트맵의 `<lastmod>`로도 사용합니다. [Crawling](crawling.md#what-is-included)을 참고합니다.

### Navigation groups

같은 `group`을 지정한 문서는 함께 표시됩니다. `order`가 작을수록 먼저 표시됩니다. 생략한 문서는 순서를 지정한 문서 뒤에서 제목순으로 표시됩니다.

```yaml
group: [Projects, Research]
order: 10
```

위 문서는 Projects 안의 Research 그룹에 표시됩니다. 그룹의 표시 순서는 사이트 설정의 `navigation`으로 지정합니다.
그룹 이름이나 순서를 바꿔도 문서 URL은 바뀌지 않습니다. 문서 아래에 하위 문서를 배치하려면 [Navigation](navigation.md)의 `parent` 예시를 참고합니다.

### File names

공개 문서의 ID는 public 폴더 기준 경로에서 확장자를 뺀 소문자입니다. `public/guide/setup.md`는 `/guide/setup/`으로 표시됩니다.
private 문서에는 `/private/`이 붙습니다. `.mdx`도 Markdown으로 읽으며 JSX는 실행하지 않습니다.

같은 ID가 되는 파일 두 개는 함께 사용할 수 없습니다. 예를 들어 `Guide.md`와 `guide.mdx`는 충돌합니다.
파일 이름에는 `#`, `?`, `%`, `*`, `:`, `\`나 제어문자를 사용하지 않습니다. `.`, `..`, `index.html` 경로 조각도 사용할 수 없습니다.
첫 경로 `_fh`와 `favicon.svg`는 기본 자원용, `private`은 내부 문서용, `locales`의 언어 코드는 번역 문서용입니다. `url`을 설정하면 `robots.txt`와 `sitemap.xml`도 예약됩니다.

## Sections and parts

`##`는 큰 절, `###`는 그 아래 소제목입니다. 관련 절 여러 개를 묶으려면 `::part[제목]`을 앞에 둡니다.

```markdown
::part[Getting started]

## Installation

설치 안내.

## Usage

### First step

실행 안내.
```

part는 본문과 목차에서 절의 묶음을 표시합니다. 제목에 자동 번호는 붙지 않습니다. 번호가 필요하면 제목에 직접 적습니다.
제목을 생략하거나 비워 둔 `::part`는 빌드 오류입니다. 제목은 서식 없는 일반 텍스트이며 속성을 붙일 수 없습니다.
`::part` 뒤에는 다음 `::part`가 나오거나 문서가 끝나기 전에 Markdown `##` 절이 하나 이상 있어야 합니다.

### Links

`content/public/guide.md`에서 다른 문서와 홈을 연결하려면 다음과 같이 작성합니다.

```markdown
[설정](settings.md)
[탐색 설정](settings.md#navigation)
[홈](../README.md)
```

상대 `.md` 링크는 사이트 URL로 바뀌며 query와 hash를 유지합니다. 위의 `settings.md#navigation`은 `/settings/#navigation`으로 연결됩니다.
일반 문서의 README 링크는 해당 문서로, `content/README.md` 링크는 홈으로 연결됩니다.
없는 문서를 가리키는 링크가 있어도 빌드는 멈추지 않습니다. 터미널에 해당 파일과 줄 번호를 경고로 표시합니다. 원시 HTML의 `<a href="...">`에도 같은 변환과 경고를 적용합니다.
배포하지 않는 형식의 로컬 파일을 가리키는 링크에도 같은 경고를 표시합니다. 배포하는 형식은 [Images](images.md#supported-files)를 참고합니다.

제목 앵커는 제목으로부터 자동 생성됩니다. 같은 제목이 반복되면 `-1`, `-2`가 붙습니다.
같은 문서나 다른 문서의 없는 제목을 가리키는 `#hash`에도 파일과 줄 번호가 붙은 같은 경고를 표시합니다. 홈의 제목을 가리키는 링크는 검사하지 않습니다. `0.24.0`부터 지원합니다.
Details 안의 제목으로 이동하면 접힌 내용이 펼쳐집니다.
공개 문서와 홈에서는 private 파일이나 `/private/` 경로를 링크하지 않습니다.
`[Q3](questions.md#q3)`처럼 글자가 설정한 접두와 번호인 링크는 칩으로 표시합니다. [Reference chips](settings.md#reference-chips)를 참고합니다.

## Flowcharts

코드 블록의 언어를 `mermaid`로 지정합니다.

````markdown
```mermaid
flowchart LR
    Draft[작성] --> Review[확인]
    Review --> Publish[배포]
```
````

```mermaid
flowchart LR
    Draft[작성] --> Review[확인]
    Review --> Publish[배포]
```

순서, 상태, 관계, 폴더 구조에 맞는 작성 예시는 [Diagrams](diagrams.md)를 참고합니다.

## Code notation

코드 블록에 언어 이름을 적으면 문법을 강조합니다. `line-numbers`는 줄 번호, `[파일 이름]`은 파일 제목을 표시합니다.

````markdown
```ts line-numbers [example.ts]
const title = "Project notes"; // [!code highlight]
const count = 3;
```
````

```ts line-numbers [example.ts]
const title = "Project notes"; // [!code highlight]
const count = 3;
```

| Notation | Result |
| --- | --- |
| `// [!code highlight]` 또는 코드 블록 메타 `{2,4-6}` | 해당 줄 강조 |
| `// [!code error]`와 `// [!code warning]` | 오류와 주의 줄 표시 |
| `// [!code ++]`와 `// [!code --]` | 추가와 삭제 줄 표시 |
| `// [!code word:title]` | 해당 줄의 낱말 강조 |
| 메타 `line-numbers` | 줄 번호 |
| 메타 `bad`와 `good` | 잘못된 예와 올바른 예의 배경 구분 |
| 메타 `[파일 이름]` | 코드 위 파일 이름 |

표시용 주석은 결과에서 숨겨집니다. 언어별 주석 문법을 사용합니다.

## Code snippets

예제 코드를 별도 파일로 관리한다면 `<<<`로 가져올 수 있습니다.

```markdown
<<< ./example/response.ts
<<< ./example/response.ts#contract line-numbers [response.ts]
```

경로는 현재 Markdown 파일 기준입니다. 파일은 content 루트 안에 있어야 합니다. 공개 문서에서는 private 파일을 불러올 수 없습니다.
`#contract`를 붙이면 파일의 `// #region contract`와 `// #endregion contract` 사이만 표시합니다. 이름 없는 `// #endregion`은 가장 안쪽의 열린 region을 닫습니다.
region 표시는 `// #region contract`, `/* #region contract */`, `<!-- #region contract -->`처럼 주석 기호 뒤에 `#region`을 붙여 씁니다. 다음 확장자의 파일에서는 그 언어의 표기도 사용할 수 있습니다.

| Extension | Additional marker |
| --- | --- |
| `.py`, `.yml`, `.yaml`, `.sh`, `.bash`, `.zsh`, `.coffee`, `.cs`, `.ps1` | `# region contract`, `# #region contract` |
| `.c`, `.h`, `.cc`, `.cpp`, `.cxx`, `.hh`, `.hpp`, `.hxx` | `#pragma region contract` |

다른 확장자의 파일에서 `# region`, `## region`처럼 띄어 쓴 줄은 표시가 아닌 본문으로 남습니다.

끝 표시는 `region`을 `endregion`으로 바꿔 적습니다.
region 표시 줄과 공통 들여쓰기는 제거합니다. 없는 region이나 파일 끝까지 닫히지 않은 region을 지정하면 빌드 오류입니다.
언어는 파일 확장자로 정합니다. 경로 뒤에는 코드 블록과 같은 메타를 사용할 수 있습니다. dev에서는 불러온 파일의 변경도 반영합니다.

## Content features

표, 목록, 체크 목록, 링크, 인라인 코드와 일반 Markdown 서식을 사용할 수 있습니다.
그림과 첨부의 경로는 [Images](images.md), 본문 상태 문구의 강조는 [Status badges](settings.md#status-badges)를 참고합니다.
`#e80030`처럼 인라인 코드로 쓴 3, 4, 6, 8자리 hex 색 값은 색 견본과 함께 표시됩니다.
원시 HTML도 사용할 수 있지만 다른 사이트의 CSS와 JavaScript를 자동으로 가져오지는 않습니다.
원시 HTML의 `<h2>`와 `<h3>`에도 제목 앵커를 만들고 목차에 표시합니다. 원시 HTML 표도 Markdown 표와 같은 가로 스크롤 상자에 넣습니다.

## Block components

보충 설명을 계속 보여 주려면 Note, 필요할 때 펼치게 하려면 Details를 사용합니다.

```markdown
:::note[Before you start]
Node.js 22.12.0 이상이 필요합니다.
:::

:::details[More information]
설정 파일은 프로젝트마다 하나를 사용합니다.
:::
```

제목과 본문은 필수입니다. Details에 `{open}`을 붙이면 처음부터 펼칩니다.
작성 예시, 중첩 규칙, 오류 규칙은 [Parts](parts.md)를 참고합니다.
