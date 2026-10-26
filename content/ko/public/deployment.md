---
name: Deployment
label: 작성한 문서를 정적 사이트로 배포
group: Start
order: 20
---

문서를 빌드한 뒤 생성된 결과 폴더를 정적 호스팅에 배포합니다. 배포 후에는 별도 Node.js 서버가 필요하지 않습니다.

## Build and preview

프로젝트 루트에서 실행합니다.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

`http://localhost:4321/`에서 홈, 문서 직접 링크, 이미지가 열리는지 확인합니다.
공개 결과는 `content/dist`에 생성됩니다. `content.root`를 바꿨다면 그 폴더 아래의 `dist`를 사용합니다.

`build`는 이전 출력 폴더를 지우고 새 결과를 만듭니다. 직접 관리할 파일을 `dist` 안에만 보관하지 않습니다.
공개 문서와 홈이 private 자료를 참조하면 빌드가 실패합니다. 배포 대상은 원본 content 전체가 아니라 생성된 `dist`입니다.

## Hosting settings

`for-humanity init`은 GitHub Pages, Cloudflare Workers, Cloudflare Pages, 나중에 설정을 지원합니다. Workers 초기화는 `0.19.0`부터 지원합니다. 직접 설정하려면 아래 값을 사용합니다.
초기화를 사용했다면 생성된 `docs:build` 스크립트와 완료 메시지의 출력 경로를 사용합니다. 선택만으로 원격 서비스에 배포되지는 않습니다.

`0.20.0`부터 `build`가 모든 호스팅에 사용할 공통 `404.html`을 생성합니다. 이미지 교체는 [Status screen](settings.md#status-screen)을 참고합니다. 이전 버전은 아래 호스팅별 404 준비 단계를 사용합니다.

호스팅 서비스에 문서 프로젝트를 연결하고 다음 값을 지정합니다.

| Setting | Value |
| --- | --- |
| 프로젝트 경로 | `package.json`과 설정 파일이 있는 폴더 |
| 빌드 명령 | `pnpm exec for-humanity build` |
| 출력 폴더 | `content/dist` |
| Node.js | 22.12.0 이상 |

호스팅의 설치 단계에서 프로젝트의 의존성을 설치할 수 있어야 합니다. 패키지 버전과 lockfile을 함께 저장합니다.

## Deployment path

`basePath`로 사이트를 제공할 경로를 지정합니다. 생략하면 사이트 루트(`/`)에 배포합니다.
하위 경로 배포는 `0.17.0`부터 지원합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    url: "https://username.github.io",
    basePath: "/project/",
} satisfies SiteConfig;
```

위 설정의 홈은 `https://username.github.io/project/`, 문서는 `/project/guide/`에 표시됩니다.
`url`에는 도메인 주소만 적고 배포 경로는 `basePath`에 지정합니다. `basePath`는 `/`로 시작하며 끝 슬래시는 자동으로 추가합니다.
경로 조각에는 영문, 숫자, `-`, `.`, `_`, `~`를 사용할 수 있습니다. 빈 조각, `.`과 `..`, 쿼리와 해시는 사용할 수 없습니다.

문서 링크와 자원, 탐색, 글꼴, Mermaid에 같은 배포 경로를 적용합니다. 본문의 `/guide/` 같은 루트 상대 URL도 사이트 안의 주소로 처리합니다.
외부 URL, `//example.com/image.png`와 `#heading`은 유지합니다. Markdown의 상대 파일 링크는 원본 폴더 기준으로 작성합니다.

출력 폴더는 계속 `content/dist`입니다. 그 안에 `project` 폴더를 추가하지 않습니다.
`dev`와 `preview`도 `/project/`에서 열립니다. 설정을 바꿨다면 서버를 다시 시작하고 다시 빌드합니다.

## GitHub Pages

`init --deploy github-pages`는 저장소와 브랜치를 확인해 설정과 `.github/workflows/docs.yml`을 만듭니다.
초기화 후 안내한 설치 명령으로 lockfile을 만들고, 문서, 설정, package.json, lockfile, 워크플로를 커밋합니다. `Settings → Pages`에서 `GitHub Actions`를 선택하고 배포 브랜치에 push합니다.
별도 도메인을 입력했다면 저장소의 Pages 설정에서도 해당 도메인을 연결합니다.

직접 설정하는 방법:

프로젝트 사이트는 저장소마다 하나씩 만들 수 있습니다. `username/project` 저장소는 기본 주소가 `https://username.github.io/project/`이므로 `basePath: "/project/"`를 지정합니다.
사용자 사이트 `username.github.io`나 사이트 루트에 연결한 별도 도메인은 `basePath: "/"`를 사용합니다.
[GitHub의 사이트 유형](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)을 참고합니다.

1. 위 설정과 문서, `package.json`, lockfile을 저장소에 커밋합니다.
2. `package.json`의 `packageManager`에 사용하는 pnpm 버전을 지정합니다. 예: `"packageManager": "pnpm@10.33.2"`.
3. 패키지의 `template/github-pages.yml`을 프로젝트의 `.github/workflows/docs.yml`로 복사합니다.
4. 워크플로의 브랜치를 실제 배포 브랜치로 맞춥니다. 기본값은 `main`입니다. 문서 루트를 바꿨다면 업로드 경로도 조정합니다.
5. 저장소의 `Settings → Pages → Build and deployment → Source`에서 `GitHub Actions`를 선택합니다.
6. 배포 브랜치에 push하거나 Actions의 `Documentation` 워크플로를 직접 실행합니다.

워크플로는 문서를 빌드하고 `content/dist` 전체를 배포합니다. 빌드 결과를 Git에 커밋할 필요는 없습니다.
선행 생성 작업이나 추가 파일 복사가 필요하다면 빌드 단계를 프로젝트의 문서 빌드 명령으로 교체합니다.
[GitHub Pages의 사용자 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 참고합니다.

## Cloudflare Workers

Cloudflare는 새 정적 사이트에 [Workers Static Assets](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#use-workers-static-assets-for-new-projects)를 권장합니다.
`for-humanity`의 빌드 결과를 그대로 배포하며 Worker 서버 코드는 필요하지 않습니다.

### Initialize for Workers

`0.19.0` 이상에서 실행합니다. 이전 버전은 아래 수동 설정을 사용합니다.

```sh
pnpm exec for-humanity init --deploy cloudflare-workers
# 질문 없이 실행
pnpm exec for-humanity init --yes --deploy cloudflare-workers --worker-name team-docs
```

Worker 이름은 계정 안에서 고유해야 합니다. 63자 이내의 소문자, 숫자와 하이픈을 사용하며, 프로젝트의 `package.json` 이름 또는 폴더 이름을 제안합니다. 사용할 수 없는 이름이면 `for-humanity-docs`를 제안합니다.
다른 Worker와 이름이 겹치면 해당 배포를 갱신하므로, 첫 배포 전에 이름을 확인합니다.

초기화가 생성하는 항목:

| File or setting | Purpose |
| --- | --- |
| `wrangler.jsonc` | Worker 이름과 선택한 문서 폴더 아래의 `dist`, 문서 경로와 404 처리 |
| `.cloudflare/404.html` | 없는 문서의 오류 화면 |
| `.cloudflare/_headers` | HTML 재검증과 원문 보존, 내용 지문이 붙은 자원의 장기 캐시 |
| `.cloudflare/prepare.mjs` | 빌드 후 호스팅 파일 준비 |
| `docs:build` | 문서 빌드와 배포 파일 복사 |
| `docs:deploy` | 빌드 후 `wrangler deploy` |
| `wrangler` 개발 의존성 | 기존 의존성이 없을 때 검증한 버전 추가 |

초기화 후 안내한 의존성 설치 명령을 실행하고 문서, 설정, 배포 파일과 lockfile을 커밋합니다.
`0.20.0`의 보조 스크립트는 빌드가 생성한 404를 유지하고, 없는 경우에만 기본 템플릿을 복사합니다. 이전에 생성한 스크립트가 404를 덮어쓴다면 `.cloudflare/prepare.mjs`의 404 복사 단계를 제거합니다. `_headers` 복사는 유지합니다.
기존 `wrangler.jsonc`, `wrangler.json` 또는 `wrangler.toml`이 있으면 덮어쓰지 않고 초기화를 중단합니다. 기존 프로젝트는 아래 수동 설정으로 자산을 연결합니다.

### Workers Builds

Cloudflare의 Worker에서 Builds에 Git 저장소를 연결하고 배포 브랜치를 선택합니다.

| Setting | pnpm | npm |
| --- | --- | --- |
| Build command | `pnpm docs:build` | `npm run docs:build` |
| Deploy command | `pnpm exec wrangler deploy` | `npx wrangler deploy` |
| Preview command | `pnpm exec wrangler preview` | `npx wrangler preview` |
| Root directory | `package.json`이 있는 폴더 | `package.json`이 있는 폴더 |

Worker 이름은 `wrangler.jsonc`와 대시보드에서 같아야 합니다. Node.js는 `22.12.0` 이상을 선택하고, pnpm 버전은 `package.json`의 `packageManager`와 일치시킵니다.
Builds에서는 빌드와 배포 명령을 각각 지정합니다. `docs:deploy`는 로컬에서 두 단계를 함께 실행할 때 사용합니다.
브랜치 미리보기를 사용할 경우 운영 브랜치는 `wrangler deploy`, 나머지 브랜치는 `wrangler preview`로 지정합니다. Workers 초기화가 생성한 설정에는 `previews: {}`와 미리보기 URL이 포함됩니다.
연결 절차는 [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)를 참고합니다.

### Manual setup

기존 프로젝트에는 Wrangler를 개발 의존성으로 설치합니다.

```sh
pnpm add -D --save-exact wrangler@4.152.0
```

프로젝트 루트에 `wrangler.jsonc`를 만듭니다. 기존 파일이 있다면 다른 설정을 보존하면서 `assets`를 병합합니다.
문서 루트를 바꿨다면 `assets.directory`도 맞춥니다.

```json
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "team-docs",
    "compatibility_date": "2026-10-23",
    "assets": {
        "directory": "./content/dist",
        "html_handling": "force-trailing-slash",
        "not_found_handling": "404-page"
    }
}
```

```sh
pnpm exec for-humanity build
pnpm exec wrangler dev
pnpm exec wrangler login
pnpm exec wrangler deploy
```

`0.20.0`부터 공통 빌드가 만든 404를 유지하고 `_headers`만 빌드 후 출력 폴더에 복사합니다. 그림은 `statusImage`로 교체합니다. 이전 버전에서는 사용자 지정 `404.html`과 `_headers`를 `dist` 밖에 보관한 뒤 빌드 후 복사합니다.
초기화가 생성한 프로젝트는 다음 명령이 빌드와 복사를 함께 처리합니다.

```sh
pnpm exec wrangler login
pnpm docs:deploy
# npm
npx wrangler login
npm run docs:deploy
```

### Site URL and custom domains

첫 배포에서 확인한 `workers.dev` 주소 또는 실제 사용자 도메인을 사이트 설정의 `url`에 넣고 다시 빌드합니다.
`--url`은 canonical URL과 크롤러 파일의 주소이며 도메인을 자동 연결하지 않습니다.
별도 도메인은 Cloudflare의 Worker Custom Domains에서 연결합니다. 자세한 절차는 [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)를 참고합니다.

기존 Pages에서 옮긴다면 새 Worker의 기본 주소를 검증한 뒤 도메인을 전환하고 Pages 자동 배포를 중단합니다.
`pages.dev` 주소는 Worker의 주소로 자동 이전되지 않습니다. [Pages 이전 가이드](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)를 참고합니다.

## Cloudflare Pages

`init --deploy cloudflare-pages`는 `.cloudflare/404.html`과 `.cloudflare/prepare.mjs`를 만들고 `docs:build`에 빌드 후 복사를 연결합니다.
Git 연동의 빌드 명령은 `pnpm docs:build` 또는 `npm run docs:build`, 출력은 선택한 문서 폴더 아래의 `dist`입니다. 생성 후 안내한 Node.js와 패키지 매니저 설정을 적용합니다.
공개 주소를 아직 모르면 생략하고, 배포 후 `url`을 설정합니다.

Pages에서 문서 프로젝트의 Git 저장소를 연결하고 Framework preset을 `None`으로 선택한 뒤 위 빌드 명령과 출력 폴더를 설정합니다.
기존 프로젝트가 다른 출력 경로를 사용했다면 새 경로로 변경합니다.
자세한 연결 절차는 [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)을 참고합니다.

없는 문서가 홈으로 표시되지 않도록 출력 루트에 `404.html`을 포함합니다.
`0.20.0`부터 공통 빌드가 만든 404를 그대로 사용합니다. 이전 버전에서는 별도로 관리한 파일을 빌드 후 `content/dist`에 복사합니다. [Cloudflare의 정적 페이지 제공 규칙](https://developers.cloudflare.com/pages/configuration/serving-pages/)을 참고합니다.

## Verify the deployment

- 홈과 문서의 개별 URL이 열리는지 확인합니다.
- 그림과 글꼴이 정상으로 표시되는지 확인합니다.
- 없는 경로와 내부 문서 경로가 `404`를 반환하는지 확인합니다.
- 검색 엔진용 파일이 필요하면 [Crawling](crawling.md)에 따라 `url`을 설정하고 `/robots.txt`와 `/sitemap.xml`을 확인합니다.

`preview`는 로컬 빌드 확인용입니다. 운영 사이트에는 빌드 결과를 정적 호스팅으로 제공합니다.
