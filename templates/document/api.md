---
name: API
label: CLI·설정·문서 형식의 공개 계약
group: Reference
order: 10
---

현재 제공하는 사용 인터페이스: CLI 명령, 사이트 설정, Markdown frontmatter와 작성 문법.
JavaScript용 공식 진입점은 아직 제공하지 않음. 내부 렌더러 함수는 공개 사용 계약에 포함하지 않음.

## Overview

| Interface   | Entry                     | Guide                            |
| ----------- | ------------------------- | -------------------------------- |
| CLI         | `for-humanity`            | [Commands](commands.md)          |
| 사이트 설정 | `for-humanity.config.mjs`  | [Settings](settings.md)          |
| 문서 형식   | `.md` · `.mdx`            | [Writing](writing.md)            |
| 본문 부품   | Note · Details            | [Parts](parts.md)                |
| 사이트 배포 | 문서 폴더의 `dist`        | [Deployment](deployment.md)      |

이 페이지는 라이브러리의 실제 계약. [Design example](blueprint.md)의 HTTP API는 가상 앱의 작성 예시.

::part[CLI]

## Commands

```text
for-humanity <dev|build|preview> [docs-dir]
```

| Input       | Default   | Behavior                                  |
| ----------- | --------- | ----------------------------------------- |
| command     | `dev`     | `dev` · `build` · `preview`만 지원         |
| `docs-dir`  | 현재 폴더 | 명령을 실행한 폴더 기준 경로              |

- `dev`: 포트 `4321` · 문서 변경 후 새로고침 · 잘못된 문서는 직전 정상 결과 유지
- `build`: `<docs-dir>/dist`를 새로 생성 · 기존 출력 전체 교체
- `preview`: 포트 `4321` · 이미 만든 `dist` 제공
- `init`: 아직 미구현

```sh
pnpm exec for-humanity build docs
pnpm exec for-humanity preview docs
```

::part[Configuration]

## Site configuration

설정 파일의 `export default` 객체. 파일과 각 항목 모두 선택.

| Field         | Type                               | Default                   |
| ------------- | ---------------------------------- | ------------------------- |
| `title`       | string                             | `for humanity`            |
| `description` | string · HTML 설명 메타데이터        | 생략                      |
| `url`         | HTTP(S) 루트 URL · 0.6.0+           | 생략 · 크롤러 파일 생성하지 않음 |
| `navigation`  | 이름 또는 이름 배열로 구성한 경로 목록 · 중복 경로 금지 | 묶음 이름순 |
| `status`      | 상태 문구 객체 배열                | 기본 상태 문구            |

`navigation: []`도 허용. 지정하지 않은 묶음은 마지막에서 이름순 배치.
문자열은 최상위 묶음, 이름 배열은 중첩 경로. 배열의 각 이름은 비어 있지 않은 string이며 경로 배열은 빈 배열 불가.
경로의 첫 설정 위치를 조상에도 적용. 같은 이름이라도 전체 경로가 다르면 별도 묶음. `"Guide"`와 `["Guide"]`는 같은 경로로 처리.
상태 객체: `phrase`는 빈칸만 있지 않은 string, `kind`는 `verified` 또는 `unverified`, `date`는 선택 boolean.
`status`를 지정하면 기본 목록 전체 교체. `status: []`는 상태 표지 비활성.
설정 검증은 시작 시 수행. 변경한 설정을 반영하려면 서버 재시작.

`url`은 npm `0.6.0`부터 지원합니다. 사용자 정보·하위 경로·query·hash를 거부하고, 도메인 루트로 정규화합니다. 지정하면 홈과 문서의 사이트맵 및 `robots.txt`를 dev·build에서 제공합니다. [Crawling](crawling.md).

## Frontmatter

일반 문서에 적용. 루트 `README.md`는 frontmatter 없이 홈(`/`)으로 렌더링.
파일 이름의 대소문자는 구분하지 않으며, 없으면 README 작성 안내 표시.

```yaml
name: API
label: 사용 계약
group: Reference
order: 10
type: document
```

| Field   | Type                    | Default                          |
| ------- | ----------------------- | -------------------------------- |
| `name`  | 비어 있지 않은 string   | 필수                             |
| `label` | string                  | 필수                             |
| `group` | 비어 있지 않은 string 또는 비어 있지 않은 string 배열 | 필수 |
| `parent` | 비어 있지 않은 string · 같은 그룹의 부모 문서 ID | 없음 · 그룹에 직접 표시 |
| `order` | 0 이상의 정수           | 순서 지정 문서 뒤에서 제목순      |
| `type`  | 기존 `document` · `blueprint` 값 허용 · 생략 권장 | `document` · 렌더링 차이 없음 |

같은 첫 글자로 시작하는 문서도 지원. 문서 id는 확장자를 제외한 소문자 파일 경로.
예: `api.md` → `/api/`, `architecture.md` → `/architecture/`.
이름·순서가 같은 문서도 파일 id로 구분. id가 겹치는 파일은 빌드 오류.
`group: [Projects, Example project, Research]`는 최상위부터 중첩한 탐색 경로. 고정된 깊이 제한 없음.
각 이름의 앞뒤 공백은 제거. 빈 이름·빈 배열은 오류. 쉼표·슬래시는 경로 구분자로 해석하지 않음.
단일 문자열과 배열을 내부에서는 같은 경로 배열로 정규화하며, 파일 위치와 URL은 그룹 설정과 독립적.
예약 경로·문자의 전체 목록은 [Writing](writing.md#frontmatter).

`parent`는 `0.3.0`부터 지원. 기본값 없이 생략 가능. 문서 루트 기준 ID 또는 `./`·`../`로 시작하는 파일 위치 기준 참조.
확장자와 앞뒤 `/`를 제외한 소문자 경로 사용. 예: `parent: guide/settings`, `parent: ./readme`.
부모·자식은 같은 전체 `group` 경로를 사용. 형제는 `order`·제목·ID 순으로 정렬하며 URL은 파일 경로 그대로 유지.
빈 값·부모 누락·홈 README·자기 참조·순환·다른 그룹의 부모는 오류. [Navigation](navigation.md)의 예시 참고.

::part[Content]

## Markdown features

| Syntax                 | Result                       |
| ---------------------- | ---------------------------- |
| `##` · `###`           | 절·소제목과 On this page      |
| `::part[Title]`         | 본문과 On this page의 절 묶음    |
| `:::note[Title]`        | 보충 설명                    |
| `:::details[Title]`     | 접힌 구현 상세               |
| Details의 `{open}`     | 처음부터 펼친 상세           |
| Mermaid 코드 블록      | 빌드 시 흐름도 SVG           |
| GFM 표 · 코드 블록     | 표와 코드 강조               |
| 상대 `.md` 링크        | 문서 URL로 변환              |

부품의 입력·닫힘·중첩·오류 계약은 [Parts](parts.md).
`.mdx`도 Markdown으로 읽음. JSX 실행은 지원하지 않음.

## Failure behavior

- 시작·빌드 오류: 설정, frontmatter, 문서 id, 블록 문법, 흐름도 렌더링 · 종료 코드 `1`
- 문서 변경 오류: 개발 서버는 이전 정상 문서를 유지하고 터미널에 오류 표시
- 링크 경고: 없는 Markdown 파일은 경고 후 빌드 계속
- 배포 기준: 사이트 루트 `/` · 하위 URL 경로의 base path 설정은 아직 미구현

실행 예시는 [Commands](commands.md), 향후 지원 범위는 [Roadmap](roadmap.md).
