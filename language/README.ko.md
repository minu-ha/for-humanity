<div align="center">

<img src="../src/asset/favicon.svg" width="96" height="96" alt="for humanity 픽셀 얼굴">

# for humanity

**사람이 읽는 문서를 위한 Markdown 문서 도구**

Markdown으로 작성하고, 맥락을 남기고, 정적 사이트로 공유.

[Documentation](https://for-humanity.fyi) · [npm](https://www.npmjs.com/package/for-humanity) · [Releases](https://github.com/minu-ha/for-humanity/releases)

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](../LICENSE)
[![npm](https://img.shields.io/npm/v/for-humanity?style=flat-square)](https://www.npmjs.com/package/for-humanity)
![Node 22+](https://img.shields.io/badge/node-22%2B-444444?style=flat-square)
![Hono + React](https://img.shields.io/badge/Hono-%2B%20React-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) · [Guide](../templates/document/writing.md) · [API](../templates/document/api.md) · [Deployment](../templates/document/deployment.md) · [English](../README.md)

</div>

## A little structure. Room to read.

- **Navigation** — 목적별 문서 묶음·읽는 순서·part별 트리 TOC·현재 읽는 위치
- **Context** — 보충 설명은 Note, 구현 상세는 Details. 접힌 section도 링크로 바로 이동
- **Content** — 표·코드 강조·Mermaid·status badge·color swatch
- **Static output** — 정적 HTML·자체 호스팅 폰트·작은 브라우저 스크립트. React hydration 없음
- **Reading** — 시스템 설정을 따르는 밝은·어두운 테마, 키보드 이동, 좁은 화면의 배치

## Quick start

Node.js 22 이상과 pnpm. 자신의 문서 프로젝트에 CLI 설치.

```sh
pnpm add -D --save-exact for-humanity@0.4.1
mkdir docs
```

홈으로 사용할 `docs/README.md`를 작성한 뒤 개발 서버 실행.

```sh
pnpm exec for-humanity dev docs
```

[localhost:4321](http://localhost:4321)에서 확인. 정적 사이트 빌드와 미리보기.

```sh
pnpm exec for-humanity build docs    # docs/dist 생성
pnpm exec for-humanity preview docs
```

프로젝트 루트에 Markdown을 두었다면 `docs` 대신 `.` 사용. 루트 `README.md`는 홈으로 표시하며, 루트 `AGENTS.md`·`CLAUDE.md`는 사이트에서 제외.

`0.4.1`은 `dev`, `build`, `preview` 지원. `init`은 예정 작업 · [Roadmap](../templates/document/roadmap.md) · [Changelog](../CHANGELOG.md).
Cloudflare Pages에 빌드 결과 배포 가능. 설정은 [Deployment](../templates/document/deployment.md).

### Develop the kit

CLI를 개발하거나 이 라이브러리의 가이드·예시를 로컬에서 읽으려면 소스 저장소에서 실행.

```sh
git clone https://github.com/minu-ha/for-humanity.git
cd for-humanity
pnpm install
pnpm dev
```

[localhost:4321](http://localhost:4321)에서 이 라이브러리의 사용법·API·가상 프로젝트 예시 확인.

```sh
pnpm build      # templates/document/dist 생성
pnpm preview    # 정적 사이트 미리보기
pnpm build:pages # Cloudflare Pages 헤더·404 페이지 포함
```

`main`에 push하면 문서 사이트 갱신. `v0.4.1` 같은 정식 버전 태그를 push하면 검증 후 npm 배포와 GitHub Release 생성. 두 곳에 같은 패키지 파일 사용.
npm의 README는 새 패키지 버전을 배포할 때 반영. 공개 절차는 [Maintenance](../templates/document/maintenance.md#packaging-and-release).

## Make it yours

문서 폴더로 시작. 사이트 설정을 생략하면 사이드바에 **for humanity**. 픽셀 얼굴은 탭 아이콘과 데스크톱 마우스 옆의 장식으로 표시.
문서 폴더의 `README.md`는 홈(`/`)으로 표시하며 frontmatter 불필요. 사이트 이름을 누르면 홈으로 이동.
이 사이트의 홈은 [최상위 README](../README.md), [변경 기록](../templates/document/changelog.md)은 최상위 CHANGELOG.md와 동기화. 원본 수정 후 `pnpm sync:docs` 실행.
`pnpm dev`와 `pnpm build`도 시작할 때 [문서 폴더 README](../templates/document/README.md)와 변경 기록 동기화.
`for-humanity.config.mjs`의 `title`로 자신의 사이트 이름 지정.

```js
export default {
    title: "Project notes",
    description: "결정·작업 기록·구현의 근거를 담는 문서.",
    navigation: ["Getting started", "Guide", "Reference", "Examples"],
};
```

다른 문서 폴더의 실행은 [Commands](../templates/document/commands.md), 설정은 [Settings](../templates/document/settings.md).
루트 README를 제외한 문서마다 `group`과 선택 `order`로 묶음·읽는 순서 지정. 하위 폴더나 부모 문서 없이 각 페이지는 독립적으로 유지.
같은 첫 글자로 시작하는 문서도 허용.
단일 묶음은 `group: Guide`, 중첩 탐색은 `group: [Projects, Example project, Research]`처럼 이름 배열 사용. 묶음 경로를 바꿔도 문서 URL은 유지.
같은 그룹의 문서 아래에 다른 문서를 두려면 `parent: writing` 지정. `parent: ./readme` 같은 파일 위치 기준 참조도 지원. 부모도 클릭 가능한 독립 페이지이며 각 URL 유지 · [Navigation](../templates/document/navigation.md).

## Write with context

```markdown
:::note[Scope]
문서의 범위와 아직 결정이 필요한 내용.
:::

:::details[Implementation]
화면 뒤의 계약·코드·판단 근거.
:::
```

[Parts](../templates/document/parts.md)에 소스와 실제 결과.
[Design example](../templates/document/blueprint.md)은 가상 독서 목록 앱. 화면 흐름·결정·미결 질문·예시 API 계약의 작성 방법.

## Documentation

| Group | Read |
| ----- | ---- |
| Getting started | [Commands](../templates/document/commands.md) · [Deployment](../templates/document/deployment.md) |
| Guide | [Writing](../templates/document/writing.md) · [Parts](../templates/document/parts.md) · [Settings](../templates/document/settings.md) |
| Reference | [API](../templates/document/api.md) |
| Releases | [공식 릴리스](../templates/document/releases.md) · [변경 기록](../templates/document/changelog.md) |
| Examples | [가상 Blueprint](../templates/document/blueprint.md) |
| Development | [Architecture](../templates/document/architecture.md) · [Design](../templates/document/design.md) · [Maintenance](../templates/document/maintenance.md) · [Roadmap](../templates/document/roadmap.md) |

## License

[MIT](../LICENSE) © 2026 [minu-ha](https://github.com/minu-ha)
