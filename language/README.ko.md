<div align="center">

<img src="../src/asset/favicon.svg" width="96" height="96" alt="for humanity 픽셀 얼굴">

# for humanity

**사람이 읽는 문서를 위한 Markdown 문서 도구**

Markdown으로 작성하고, 맥락을 남기고, 정적 사이트로 공유.

[Documentation](https://for-humanity.fyi) · [npm](https://www.npmjs.com/package/for-humanity) · [Releases](https://github.com/minu-ha/for-humanity/releases)

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](../LICENSE)
[![npm](https://img.shields.io/npm/v/for-humanity?style=flat-square)](https://www.npmjs.com/package/for-humanity)
![Node 22.12.0+](https://img.shields.io/badge/node-22.12.0%2B-444444?style=flat-square)
![Hono JSX](https://img.shields.io/badge/Hono-JSX-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) · [Guide](../content/public/writing.md) · [API](../content/public/api.md) · [Deployment](../content/public/deployment.md) · [English](../README.md)

</div>

## A little structure. Room to read.

- **Navigation** — 목적별 문서 묶음·읽는 순서·part별 트리 TOC·현재 읽는 위치
- **Context** — 보충 설명은 Note, 구현 상세는 Details. 접힌 section도 링크로 바로 이동
- **Content** — 표·코드 강조·Mermaid·status badge·color swatch
- **Static output** — 정적 HTML·자체 호스팅 폰트·작은 브라우저 스크립트. 본문은 서버 HTML로 유지하고 탐색은 Hono JSX로 동작
- **Reading** — 시스템 설정을 따르는 밝은·어두운 테마, 키보드 이동, 좁은 화면의 배치

## Quick start

Node.js 22.12.0 이상과 pnpm.

**이 브랜치의 content 구조는 다음 릴리스 준비 내용입니다.** 현재 npm 공개 버전은 `0.13.1`입니다.

```sh
pnpm add -D --save-exact for-humanity@0.13.1
```

공개된 `0.13.1`은 Markdown 폴더를 직접 지정하는 기존 방식입니다. 아래 구조를 사용하려면 다음 릴리스 전까지 현재 체크아웃에서 만든 패키지를 설치합니다. [Commands](../content/public/commands.md)의 로컬 패키지 설치와 [Migration](../content/public/migration.md)의 이전 절차를 참고합니다.

새 패키지의 `node_modules/for-humanity/template`에 설정과 기본 문서 구조가 포함됩니다. 기존 설정을 보존하면서 프로젝트에 복사합니다. 루트 `.gitignore`에 `content/dist/`를 추가합니다.

```text
for-humanity.config.ts
content/
├── README.md
├── public/
│   └── getting-started.md
├── private/
└── asset/
```

프로젝트 루트에서 실행합니다.

```sh
pnpm exec for-humanity dev       # 전체 문서 읽기와 작성
pnpm exec for-humanity build     # content/dist에 공개 사이트 생성
pnpm exec for-humanity preview   # 공개 빌드 확인
```

접속은 [localhost:4321](http://localhost:4321). 공개 문서는 `content/public`, 로컬 문서는 `content/private`, 홈은 `content/README.md`에 작성합니다. 배포 대상은 `content/dist`만입니다. `private`는 사이트 배포 제외이며 Git 저장소 접근 제어가 아닙니다.

`init`은 아직 예정 작업입니다. 기본형은 향후 init에서도 재사용합니다. 정적 호스팅은 [Deployment](../content/public/deployment.md), 공개 사이트 주소는 [Crawling](../content/public/crawling.md)을 참고합니다.

이 저장소를 로컬에서 읽고 개발하려면:

```sh
git clone https://github.com/minu-ha/for-humanity.git
cd for-humanity
pnpm install
pnpm dev
```

## Make it yours

`content/public` 폴더로 시작. 사이트 설정을 생략하면 사이드바에 **for humanity**. 픽셀 얼굴은 탭 아이콘으로 표시하고, 설정에 `cursorFace: true`를 두면 데스크톱 마우스 옆에도 따라다님.
`content/README.md`는 홈(`/`)으로 표시하며 frontmatter 불필요. 사이트 이름을 누르면 홈으로 이동.
이 사이트의 홈은 [최상위 README](../README.md), [변경 기록](../content/public/changelog.md)은 최상위 CHANGELOG.md와 동기화. 원본 수정 후 `pnpm sync:docs` 실행.
`pnpm dev`와 `pnpm build`도 시작할 때 [문서 폴더 README](../content/README.md)와 변경 기록 동기화.
프로젝트 루트의 `for-humanity.config.ts`의 `title`로 자신의 사이트 이름 지정. 공개 `SiteConfig` 타입으로 편집기 자동완성과 정적 타입 검사 지원.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    content: {root: "content", public: "public", private: "private"},
    description: "결정·작업 기록·구현의 근거를 담는 문서.",
    navigation: ["Getting started", "Guide", "Reference", "Examples"],
} satisfies SiteConfig;
```

기존 `for-humanity.config.mjs`도 지원합니다. TypeScript로 전환할 때는 기존 파일을 `.ts` 파일로 교체합니다.
프로젝트 루트에는 설정 파일을 하나만 둡니다. CLI는 시작할 때 값을 검증하며, 정적 타입 검사는 프로젝트에서 `tsc --noEmit`으로 실행합니다.

다른 프로젝트 폴더의 실행은 [Commands](../content/public/commands.md), 설정은 [Settings](../content/public/settings.md).
루트 README를 제외한 문서마다 `group`과 선택 `order`로 묶음·읽는 순서 지정. 하위 폴더나 부모 문서 없이 각 페이지는 독립적으로 유지.
같은 첫 글자로 시작하는 문서도 허용.
단일 묶음은 `group: Guide`, 중첩 탐색은 `group: [Projects, Example project, Research]`처럼 이름 배열 사용. 묶음 경로를 바꿔도 문서 URL은 유지.
같은 그룹의 문서 아래에 다른 문서를 두려면 `parent: writing` 지정. `parent: ./readme` 같은 파일 위치 기준 참조도 지원. 부모도 클릭 가능한 독립 페이지이며 각 URL 유지 · [Navigation](../content/public/navigation.md).

## Write with context

```markdown
:::note[Scope]
문서의 범위와 아직 결정이 필요한 내용.
:::

:::details[Implementation]
화면 뒤의 계약·코드·판단 근거.
:::
```

[Parts](../content/public/parts.md)에 소스와 실제 결과.
[Design example](../content/public/blueprint.md)은 가상 독서 목록 앱. 화면 흐름·결정·미결 질문·예시 API 계약의 작성 방법.

## Documentation

| Group | Read |
| ----- | ---- |
| Getting started | [Commands](../content/public/commands.md) · [Deployment](../content/public/deployment.md) |
| Guide | [Writing](../content/public/writing.md) · [Parts](../content/public/parts.md) · [Settings](../content/public/settings.md) |
| Reference | [API](../content/public/api.md) |
| Releases | [공식 릴리스](../content/public/releases.md) · [변경 기록](../content/public/changelog.md) |
| Examples | [가상 Blueprint](../content/public/blueprint.md) |

## License

[MIT](../LICENSE) © 2026 [minu-ha](https://github.com/minu-ha)
