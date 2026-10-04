---
name: Deployment
label: Cloudflare Pages로 정적 사이트 공개
group: Getting started
order: 20
---

for humanity의 라이브러리 문서도, 이 도구로 만든 자신의 문서도 정적 사이트로 배포 가능.
Cloudflare Pages는 구매한 도메인 없이 `<project>.pages.dev` 주소를 제공.
이 안내는 [공식 Git integration 문서](https://developers.cloudflare.com/pages/get-started/git-integration/) 기준.

이 저장소의 문서 주소는 [for-humanity.fyi](https://for-humanity.fyi).
Pages 프로젝트는 `for-humanity`, 기본 주소는 [for-humanity-1i2.pages.dev](https://for-humanity-1i2.pages.dev).

## Overview

공개 사이트의 `robots.txt`와 `sitemap.xml`을 생성하려면 문서 설정에 배포할 루트 `url`을 지정합니다. npm `0.6.0`부터 지원하며, 설정과 Cloudflare 진단 항목은 [Crawling](crawling.md).

| Target             | Build                     | Output                   |
| ------------------ | ------------------------- | ------------------------ |
| 이 저장소의 문서   | `pnpm build:pages`        | `templates/document/dist` |
| 자신의 문서        | `pnpm exec for-humanity build docs` | `docs/dist`     |

로컬 서버를 인터넷에 계속 켜 두는 방식이 아니라, 빌드한 HTML·CSS·스크립트·폰트를 정적 호스팅에 업로드.
for humanity의 CLI는 빌드할 때만 Node.js에서 실행. 배포 후에는 별도 Node.js 서버 불필요.

::part[Cloudflare Pages]

## Repository setup

이 저장소를 Cloudflare Pages에 연결할 때 사용할 값.

| Setting                | Value                       |
| ---------------------- | --------------------------- |
| Repository             | `minu-ha/for-humanity`       |
| Production branch      | `main`                      |
| Framework preset       | `None`                      |
| Root directory         | 저장소 루트                 |
| Build command          | `pnpm build:pages`          |
| Build output directory | `templates/document/dist`   |
| `NODE_VERSION`          | `22`                        |
| `PNPM_VERSION`          | `10.33.2`                   |

빌드 이미지에서 Node.js·pnpm 버전은 환경 변수로 지정 가능.
위 pnpm 버전은 이 저장소에서 검증한 버전 · [Build image](https://developers.cloudflare.com/pages/configuration/build-image/).

### Connect and deploy

1. Cloudflare의 `Workers & Pages`에서 `Create application → Pages → Connect to Git` 선택
2. GitHub 계정 연결 후 이 저장소 선택
3. 위 빌드 설정 입력
4. `Save and Deploy`로 첫 배포 실행
5. 생성된 `<project>.pages.dev` 주소에서 README 홈과 각 문서 직접 접속 확인

프로젝트 이름으로 기본 주소 생성. 사용할 수 있는 이름은 생성 시 결정.
연결 후 `main`에 push하면 문서를 다시 빌드해 배포 · [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/).
나중에 별도 도메인을 연결할 수도 있음.

### Custom domain

이 문서 사이트는 `for-humanity.fyi`를 사이트 루트에 연결.
Pages 프로젝트의 `Custom domains → Set up a domain`에서 도메인을 추가하고 DNS 레코드를 확인.
최상위 도메인을 쓰려면 Pages와 같은 Cloudflare 계정에 해당 도메인의 zone이 있어야 하며, 네임서버도 Cloudflare를 사용.
도메인 활성화 후 HTTPS, 문서 직접 접속, 없는 경로의 404 응답을 확인 · [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Pages output

```sh
pnpm build:pages
pnpm preview
```

`build:pages`는 사이트 빌드 후 이 저장소의 `.cloudflare` 파일을 결과 폴더에 복사.

| File        | Purpose                                             |
| ----------- | --------------------------------------------------- |
| `_headers`  | HTML 원문 보존 · 내용 지문이 붙은 `/_fh/*` 자원의 장기 브라우저 캐시 |
| `404.html`  | 없는 문서에 표시할 페이지                            |

HTML은 매번 재검증. CSS·브라우저 스크립트·폰트는 파일명에 내용 지문을 붙여 장기 캐시.
CSS·스크립트의 내용이 바뀌면 URL도 바뀌므로 새 HTML이 이전 배포의 자원을 재사용하지 않음. 내용이 같으면 URL도 유지.
홈과 문서 경로의 `Cache-Control: no-transform`은 Cloudflare가 설치 명령의 패키지 이름과 버전을 이메일 주소로 바꾸지 않도록 원문을 보존 · [Email Address Obfuscation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/).
헤더 규칙은 [Headers](https://developers.cloudflare.com/pages/configuration/headers/), 없는 경로의 처리는 [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/) 기준.
로컬 `preview`는 정적 파일 미리보기. Cloudflare의 `_headers` 해석과 없는 경로 처리는 배포 후 확인.

::part[Your documents]

## Another project

자신의 문서 프로젝트에서 CLI로 빌드한 `docs/dist` 전체를 배포.
그 프로젝트의 Cloudflare 설정은 build command `pnpm exec for-humanity build docs`, output `docs/dist`.
CLI 설치는 [Commands](commands.md#use-in-another-project).

HTML 원문 보존과 내용 지문이 붙은 자원의 장기 캐시가 필요하면 빌드 후 `docs/dist/_headers`에 다음 내용을 추가.

```text
/
  Cache-Control: public, max-age=0, must-revalidate, no-transform

/*/
  Cache-Control: public, max-age=0, must-revalidate, no-transform

/_fh/*
  Cache-Control: public, max-age=31536000, immutable
```

없는 문서가 README 홈으로 보이지 않도록 `docs/dist/404.html`도 배포 결과에 포함.
두 파일은 빌드가 지우는 `dist` 밖에 보관하고, 자신의 배포 명령에서 빌드 후 복사.

## Other hosts

정적 호스팅이면 같은 결과 폴더 사용 가능. 현재 모든 문서·자원의 URL은 사이트 루트 `/` 기준.
GitHub Pages의 프로젝트 사이트는 보통 `/<repository>/` 경로를 사용하므로 현재 출력 그대로는 링크와 자원이 맞지 않음.
계정 사이트처럼 루트에서 제공하는 방법이나 base path 지원이 필요 · [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
하위 경로 지원 계획은 [Roadmap](roadmap.md#subpath-deployment).
