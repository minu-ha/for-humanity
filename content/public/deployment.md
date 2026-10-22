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

## Cloudflare Pages

Pages에서 문서 프로젝트의 Git 저장소를 연결하고 Framework preset을 `None`으로 선택한 뒤 위 빌드 명령과 출력 폴더를 설정합니다.
기존 프로젝트가 다른 출력 경로를 사용했다면 새 경로로 변경합니다.
자세한 연결 절차는 [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)을 참고합니다.

없는 문서가 홈으로 표시되지 않도록 출력 루트에 `404.html`을 포함합니다.
별도로 관리한 파일은 빌드가 끝난 뒤 `content/dist`에 복사하도록 배포 명령에 추가합니다. [Cloudflare의 정적 페이지 제공 규칙](https://developers.cloudflare.com/pages/configuration/serving-pages/)을 참고합니다.

## Verify the deployment

- 홈과 문서의 개별 URL이 열리는지 확인합니다.
- 그림과 글꼴이 정상으로 표시되는지 확인합니다.
- 없는 경로와 내부 문서 경로가 `404`를 반환하는지 확인합니다.
- 검색 엔진용 파일이 필요하면 [Crawling](crawling.md)에 따라 `url`을 설정하고 `/robots.txt`와 `/sitemap.xml`을 확인합니다.

`preview`는 로컬 빌드 확인용입니다. 운영 사이트에는 빌드 결과를 정적 호스팅으로 제공합니다.
