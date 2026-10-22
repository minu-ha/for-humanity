---
name: Installation
label: 설치하고 첫 문서 실행하기
group: Start
order: 10
---

for humanity는 Markdown 파일로 문서 사이트를 만듭니다. 작성 중에는 `dev`, 배포할 때는 `build`, 배포 결과를 확인할 때는 `preview`를 사용합니다.
Node.js 22.12.0 이상이 필요합니다. 아래 예시는 pnpm을 사용하며 npm으로도 설치할 수 있습니다.

## Install the package

`package.json`이 있는 프로젝트에서 설치합니다.

```sh
pnpm add -D --save-exact for-humanity@0.17.0
```

`0.13.1` 이하에서 업데이트한다면 먼저 [Migration](migration.md)을 따라 문서와 설정 위치를 변경합니다.

## Initialize a site (Unreleased)

개발 버전에는 초기화 명령이 추가되어 있습니다. npm `0.17.0`은 아래 [Your first site](#your-first-site) 또는 템플릿 복사로 시작합니다.

초기화를 지원하는 버전을 설치한 뒤 프로젝트 루트에서 실행합니다.

```sh
pnpm exec for-humanity init
# npm
npx for-humanity init
```

사이트 이름, 문서 폴더, 언어와 배포 방식을 선택합니다. 추천값을 고르거나 같은 질문에서 바로 타이핑합니다. `Custom` 행으로 이동한 뒤 입력해도 됩니다. 기본 문서 폴더는 `content`, 언어는 `ko`, 배포는 나중에 설정입니다.
GitHub Pages를 선택하면 저장소와 배포 브랜치를 확인합니다. Cloudflare Pages는 Git 연동에 필요한 파일과 빌드 설정을 준비합니다.

생성할 파일을 확인하면 설정, 첫 문서와 `docs:*` 스크립트를 만듭니다. 초기화 후 `pnpm docs:dev` 또는 `npm run docs:dev`를 실행합니다.
필요한 의존성이 없으면 설치 명령부터 안내합니다. init은 패키지를 자동 설치하거나 호스팅 계정을 연결하지 않습니다.

새 폴더는 `for-humanity init my-docs`로 지정합니다. 기존 문서나 설정, 다른 내용의 `docs:*` 스크립트와 충돌하면 파일 생성 전에 중단합니다.
자세한 옵션은 [Commands](commands.md#initialize-a-project-unreleased), 배포 단계는 [Deployment](deployment.md)를 참고합니다.

## Your first site

`content/public` 폴더를 만들고 홈에 표시할 내용을 `content/README.md`에 작성합니다. 기본 파일을 복사해서 시작하려면 아래 [Content layout](#content-layout)을 참고합니다.

```markdown
# Project notes

프로젝트 소개와 사용 안내입니다.

[시작하기](public/guide.md)
```

`content/public/guide.md`에는 문서 정보와 본문을 작성합니다.

```markdown
---
name: Guide
label: 처음 사용하는 사람을 위한 안내
group: Guide
order: 10
---

## Overview

첫 번째 문서입니다.
```

프로젝트 루트에서 실행합니다.

```sh
pnpm exec for-humanity dev
```

`http://localhost:4321/`에서 홈과 Guide 문서를 확인합니다. Markdown을 저장하면 열린 페이지가 새로고침됩니다.
설정 없이도 기본 경로로 실행할 수 있습니다. 설정을 추가할 때는 프로젝트 루트에 `for-humanity.config.ts`를 둡니다.

배포할 결과를 만들고 확인합니다.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

출력은 `content/dist`입니다. 홈과 `content/public`의 문서만 배포 결과에 포함합니다.

## Content layout

설정은 프로젝트 루트에 두고 문서는 공개 폴더와 내부 폴더로 구분합니다.

설치된 `node_modules/for-humanity/template`에서 설정 파일과 `content` 폴더를 자신의 프로젝트로 복사합니다. 기존 파일이 있다면 필요한 항목만 병합합니다.

```text
project/
├── for-humanity.config.ts
└── content/
    ├── README.md
    ├── public/
    │   └── getting-started.md
    ├── private/
    └── asset/
```

- `README.md`: 사이트 홈에 표시할 소개
- `public`: 배포할 문서
- `private`: 로컬에서만 읽을 문서
- `asset`: 공개 문서에서 사용할 이미지와 첨부

`dist`는 빌드할 때 생성되므로 `.gitignore`에 `content/dist/`를 추가합니다. 폴더 이름을 바꾸는 설정은 [Settings](settings.md#content-paths)를 참고합니다.

문서 작성은 [Writing](writing.md), 명령의 자세한 동작은 [Commands](commands.md), 결과 공개는 [Deployment](deployment.md)로 이어집니다.
