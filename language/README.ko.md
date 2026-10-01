<div align="center">

<img src="../src/asset/favicon.svg" width="96" height="96" alt="for humanity 픽셀 얼굴">

# for humanity

**사람이 읽는 문서를 위한 Markdown 문서 도구**

Markdown으로 작성하고, 맥락을 남기고, 정적 사이트로 공유.

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](../LICENSE)
![Node 22+](https://img.shields.io/badge/node-22%2B-444444?style=flat-square)
![Hono + React](https://img.shields.io/badge/Hono-%2B%20React-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) · [Guide](../templates/document/writing.md) · [API](../templates/document/api.md) · [Deployment](../templates/document/deployment.md) · [English](../README.md)

</div>

## A little structure. Room to read.

- **Navigation** — 목적별 문서 묶음·읽는 순서·part별 TOC·자동 section 번호·현재 읽는 위치
- **Context** — 보충 설명은 Note, 구현 상세는 Details. 접힌 section도 링크로 바로 이동
- **Content** — 표·코드 강조·Mermaid·status badge·color swatch
- **Static output** — 정적 HTML·자체 호스팅 폰트·작은 브라우저 스크립트. React hydration 없음
- **Reading** — System·Light·Dark, 키보드 이동, 좁은 화면의 배치

## Quick start

Node.js 22 이상과 pnpm. 현재는 소스 저장소에서 실행.

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

현재는 prototype. `init`과 첫 npm 공개는 [Roadmap](../templates/document/roadmap.md)의 예정 작업.
Cloudflare Pages는 도메인 구매 없이 `pages.dev` 주소로 배포 가능. 설정은 [Deployment](../templates/document/deployment.md).

## Make it yours

문서 폴더로 시작. 사이트 설정을 생략하면 사이드바에 **for humanity**. 픽셀 얼굴은 탭 아이콘과 데스크톱 마우스 옆의 장식으로 표시.
문서 폴더의 `README.md`는 홈(`/`)으로 표시하며 frontmatter 불필요. 사이트 이름을 누르면 홈으로 이동.
이 사이트의 홈은 [최상위 README](../README.md)와 동기화. 원본 수정 후 `pnpm sync:readme` 실행.
`pnpm dev`와 `pnpm build`도 시작할 때 [문서 폴더 README](../templates/document/README.md)를 동기화.
`for-humanity.config.mjs`의 `title`로 자신의 사이트 이름 지정.

```js
export default {
    title: "Project notes",
    description: "결정·작업 기록·구현의 근거를 담는 문서.",
    navigation: ["Getting started", "Guide", "Reference", "Examples"],
    repository: {provider: "github", url: "https://github.com/you/your-project"},
};
```

다른 문서 폴더의 실행은 [Commands](../templates/document/commands.md), 설정은 [Settings](../templates/document/settings.md).
루트 README를 제외한 문서마다 `group`과 선택 `order`로 묶음·읽는 순서 지정. 하위 폴더나 부모 문서 없이 각 페이지는 독립적으로 유지.
같은 첫 글자로 시작하는 문서도 허용.

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
[Blueprint sample](../templates/document/blueprint.md)은 가상 독서 목록 앱. 화면 흐름·결정·미결 질문·예시 API 계약의 작성 방법.

## Documentation

| Group | Read |
| ----- | ---- |
| Getting started | [Commands](../templates/document/commands.md) · [Deployment](../templates/document/deployment.md) |
| Guide | [Writing](../templates/document/writing.md) · [Parts](../templates/document/parts.md) · [Settings](../templates/document/settings.md) |
| Reference | [API](../templates/document/api.md) |
| Examples | [가상 Blueprint](../templates/document/blueprint.md) |
| Development | [Architecture](../templates/document/architecture.md) · [Design](../templates/document/design.md) · [Maintenance](../templates/document/maintenance.md) · [Roadmap](../templates/document/roadmap.md) |

## License

[MIT](../LICENSE) © 2026 [minu-ha](https://github.com/minu-ha)
