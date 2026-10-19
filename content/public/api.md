---
name: Reference
label: 명령·설정·문서 필드 빠른 참조
group: Reference
order: 10
---

작성 중에 자주 확인하는 명령, 설정 필드와 Markdown 문법을 모았습니다.
처음 시작한다면 [Commands](commands.md)의 첫 문서 예시를 따라 합니다.

**Unreleased:** 프로젝트 경로와 `content` 설정은 다음 릴리스 기준입니다. npm `0.13.1`의 실행 예시는 [Commands](commands.md#your-first-site), 이전 방법은 [Migration](migration.md).

## Commands

```text
for-humanity <dev|build|preview> [project-dir]
```

| Command | Use |
| --- | --- |
| `dev` | 전체 문서 확인 · 변경 시 새로고침 · 생략 시 기본 명령 |
| `build` | 공개 결과를 `<content.root>/dist`에 생성 |
| `preview` | 마지막 빌드 결과 확인 |
| `--help` · `-h` | 명령 도움말 |
| `--version` · `-v` | 설치 버전 |

`project-dir`는 설정 파일이 있는 프로젝트 루트이며 생략하면 현재 폴더입니다.

## Site configuration

`for-humanity.config.ts` 또는 `.mjs`에서 객체를 기본 내보내기로 지정합니다. 타입은 `import type {SiteConfig} from "for-humanity"`로 가져옵니다.

| Field | Value | Default |
| --- | --- | --- |
| `title` | string | `for humanity` |
| `description` | string | 없음 |
| `url` | HTTP(S) 도메인 루트 URL | 없음 |
| `port` | 1부터 65535까지 정수 | `4321` |
| `cursorFace` | boolean | `false` |
| `content` | `{root?: string, public?: string, private?: string}` | `content` · `public` · `private` |
| `navigation` | 그룹 이름 또는 이름 배열로 구성한 경로 목록 | 그룹 이름순 |
| `status` | `{phrase, kind, date?}` 목록 | 기본 상태 문구 |

모든 설정은 선택 사항입니다. 예시와 값의 제한은 [Settings](settings.md)를 참고합니다.

## Frontmatter

문서 맨 앞의 `---` 사이에 YAML로 작성합니다. 사이트 홈인 `content/README.md`에는 필요하지 않습니다.

| Field | Value | Required |
| --- | --- | --- |
| `name` | 비어 있지 않은 제목 | 필수 |
| `label` | 문서 설명 문자열 | 필수 |
| `group` | 비어 있지 않은 그룹 이름 또는 이름 배열 | 필수 |
| `order` | 0 이상의 정수 · 작은 값부터 표시 | 선택 |
| `parent` | 같은 그룹의 부모 문서 ID 또는 파일 상대 참조 | 선택 |
| `type` | 이전 문서의 `document`·`blueprint` 호환 필드 · 새 문서에서는 생략 | 선택 |

파일·링크 규칙은 [Writing](writing.md), 그룹·부모 구성은 [Navigation](navigation.md)에 설명합니다.

## Markdown features

| Syntax | Result | Guide |
| --- | --- | --- |
| `##` · `###` | 절·소제목과 목차 | [Writing](writing.md#sections-and-parts) |
| `::part[Title]` | 여러 절의 묶음 | [Writing](writing.md#sections-and-parts) |
| `:::note[Title]` | 항상 보이는 보충 설명 | [Parts](parts.md#note) |
| `:::details[Title]` · `{open}` | 펼치고 접는 상세 | [Parts](parts.md#details) |
| Mermaid 코드 블록 | 다이어그램 | [Diagrams](diagrams.md) |
| 코드 블록 메타·줄 주석 | 줄 강조·줄 번호·파일 이름 | [Writing](writing.md#code-notation) |
| `<<< ./file.ext#region` | 파일 또는 region을 코드로 표시 | [Writing](writing.md#code-snippets) |
| 상대 `.md` 링크 | 사이트 문서 링크 | [Writing](writing.md#links) |
| `![설명](../asset/image.png)` | 로컬 그림 | [Images](images.md) |

`.mdx` 파일도 Markdown으로 읽으며 JSX는 실행하지 않습니다.
