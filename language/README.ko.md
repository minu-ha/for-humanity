<div align="center">

<img src="../src/asset/favicon.svg" width="96" height="96" alt="for humanity 픽셀 얼굴">

# for humanity

**사람이 읽는 문서를 위한 Markdown 문서 도구**

Markdown으로 쓰고 맥락을 남겨 정적 사이트로 공유합니다.

[Documentation](https://for-humanity.fyi) | [npm](https://www.npmjs.com/package/for-humanity) | [Releases](https://github.com/nomeehej/for-humanity/releases)

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](../LICENSE)
[![npm](https://img.shields.io/npm/v/for-humanity?style=flat-square)](https://www.npmjs.com/package/for-humanity)
![Node 22.12.0+](https://img.shields.io/badge/node-22.12.0%2B-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) | [Guide](../content/ko/public/writing.md) | [Commands](../content/ko/public/commands.md) | [Deployment](../content/ko/public/deployment.md) | [English](../README.md)

</div>

## Write, organize, publish

Markdown에 코드 예제, 표, Mermaid 다이어그램을 작성하고 이미지, 영상, 소리를 넣습니다. 문서를 그룹과 하위 문서로 정리합니다. 보충 설명은 Note에, 긴 설명은 접을 수 있는 Details에 담습니다.

빌드 결과는 글꼴이 포함된 정적 사이트입니다. 밝은 테마와 어두운 테마, 키보드 탐색, 좁은 화면에 맞는 배치를 제공합니다.

## Quick start

Node.js 22.12.0 이상과 pnpm이 필요합니다. `package.json`이 있는 프로젝트에서 패키지를 설치합니다.

```sh
pnpm add -D --save-exact for-humanity@0.27.0
```

`node_modules/for-humanity/template`의 `for-humanity.config.ts`와 `content` 폴더를 프로젝트로 복사합니다. 기존 문서가 있다면 파일을 옮기기 전에 [Migration](../content/ko/public/migration.md)을 확인합니다.

홈에 표시할 `content/README.md`를 수정합니다.

```markdown
# Project notes

프로젝트 문서에 오신 것을 환영합니다.
```

로컬 서버를 실행합니다.

```sh
pnpm exec for-humanity dev
```

[localhost:4321](http://localhost:4321)에 접속합니다. Markdown을 수정하고 저장하면 페이지가 갱신됩니다. [Installation](../content/ko/public/installation.md)의 예시를 따라 첫 문서를 추가할 수 있습니다.

배포 전에 결과를 만들고 확인합니다.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

생성된 `content/dist`를 배포하고 `.gitignore`에 추가합니다. 호스팅 설정은 [Deployment](../content/ko/public/deployment.md)를 참고합니다.

배포할 문서는 `content/public`, 로컬에서만 읽을 문서는 `content/private`에 둡니다. 로컬 서버는 양쪽을 보여 주고 빌드는 공개 문서와 홈만 포함합니다. 폴더 이름은 설정으로 바꿀 수 있습니다.

## Interactive setup

템플릿을 복사하는 대신 `pnpm exec for-humanity init`을 실행할 수 있습니다. npm에서는 `npx for-humanity init`을 사용합니다.

사이트 이름, 문서 폴더, 언어와 배포 방식(GitHub Pages / Cloudflare Workers / Cloudflare Pages / 나중에 설정)을 선택합니다. 설정과 첫 문서, `docs:dev`, `docs:build`, `docs:preview` 스크립트를 만들고, 호스팅 파일과 서비스에서 설정할 값을 안내합니다. Cloudflare Workers를 선택하면 Wrangler 설정과 `docs:deploy`도 생성합니다.

기존 앱의 스크립트와 의존성을 유지합니다. 생성할 파일 목록을 확인한 뒤 진행합니다. 옵션과 자동 실행은 [Commands](../content/ko/public/commands.md#initialize-a-project)를 참고합니다.

## Make it yours

사이트 이름과 탐색 그룹 순서를 지정합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    description: "프로젝트 사용 안내.",
    navigation: ["Start", "Guide", "Updates"],
} satisfies SiteConfig;
```

`package.json` 옆의 프로젝트 루트 `for-humanity.config.ts`에 저장합니다. 기존 `.mjs` 설정도 지원합니다. 설정 파일은 하나만 둡니다.

각 문서는 frontmatter에 제목, 설명, 그룹을 지정합니다. 완성된 문서 예시는 [Writing](../content/ko/public/writing.md), 설정 항목은 [Settings](../content/ko/public/settings.md)를 참고합니다.

## Keep useful detail

```markdown
:::note[Before you start]
작업을 시작하기 전에 준비 사항을 확인합니다.
:::

:::details[More information]
필요할 때 펼쳐 볼 예시나 추가 설명을 작성합니다.
:::
```

[Parts](../content/ko/public/parts.md)에서 작성 문법과 표시 결과를 함께 볼 수 있습니다.

## Documentation

| Task | Guide |
| --- | --- |
| 설치와 실행 | [Installation](../content/ko/public/installation.md), [Commands](../content/ko/public/commands.md) |
| 문서 작성과 정리 | [Writing](../content/ko/public/writing.md), [Navigation](../content/ko/public/navigation.md) |
| 표현 추가 | [Parts](../content/ko/public/parts.md), [Diagrams](../content/ko/public/diagrams.md), [Figures](../content/ko/public/figures.md), [Images](../content/ko/public/images.md) |
| 사이트 설정 | [Settings](../content/ko/public/settings.md) |
| 배포 | [Deployment](../content/ko/public/deployment.md), [Crawling](../content/ko/public/crawling.md) |
| 업데이트 | [Changelog](../content/ko/public/changelog.md), [Migration](../content/ko/public/migration.md) |

## License

[MIT](../LICENSE) © 2026 [nomeehej](https://github.com/nomeehej)
