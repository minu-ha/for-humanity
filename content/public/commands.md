---
name: Commands
label: 설치하고 첫 문서 실행하기
group: Getting started
order: 10
---

for humanity는 Markdown 파일로 문서 사이트를 만듭니다. 작성 중에는 `dev`, 배포할 때는 `build`, 배포 결과를 확인할 때는 `preview`를 사용합니다.
Node.js 22.12.0 이상과 pnpm이 필요합니다.

## Install the package

`package.json`이 있는 프로젝트에서 설치합니다.

```sh
pnpm add -D --save-exact for-humanity@0.14.0
```

`0.13.1` 이하에서 업데이트한다면 먼저 [Migration](migration.md)을 따라 문서와 설정 위치를 변경합니다.

## Your first site

`content/public` 폴더를 만들고, `content/README.md`에 홈에 표시할 내용을 작성합니다. 기본 파일을 복사해서 시작하려면 아래 [Content layout](#content-layout)을 참고합니다.

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

## Getting started

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

설정은 프로젝트 루트에 두고, 문서는 공개·내부 폴더로 구분합니다. 기존 사용자는 [Migration](migration.md)의 순서대로 이전합니다.

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
- `asset`: 공개 문서에서 사용할 이미지·첨부

프로젝트 루트에서 실행합니다. `.gitignore`에 `content/dist/`를 추가합니다.

| Command | Result |
| --- | --- |
| `pnpm exec for-humanity dev` | 공개·내부 문서를 함께 확인 |
| `pnpm exec for-humanity build` | 공개 문서를 `content/dist`에 생성 |
| `pnpm exec for-humanity preview` | 생성된 공개 사이트 확인 |

`dist`는 빌드할 때 생성됩니다. 다른 폴더에서 실행하려면 `for-humanity dev ../my-project`처럼 **프로젝트 경로**를 지정합니다. 경로를 바꾸는 설정은 [Settings](settings.md#content-paths)를 참고합니다.
`init` 명령은 아직 지원하지 않습니다.

## While editing

`dev`는 Markdown·홈·그림·스니펫의 변경을 반영합니다. 잘못된 문서를 저장하면 터미널에 오류를 표시하고 직전 정상 문서를 유지합니다. 오류를 고쳐 저장하면 다시 반영됩니다.
설정 파일을 바꾼 경우에는 서버를 종료하고 다시 실행합니다. 포트는 `port`로 바꿀 수 있습니다.

`preview`는 마지막 빌드 결과를 보여 줍니다. 문서를 수정했다면 다시 `build`해야 합니다.
두 서버는 기본적으로 localhost와 포트 `4321`을 사용합니다. 포트가 사용 중이면 기존 서버를 종료하거나 다른 포트를 지정합니다.

## Help and troubleshooting

```sh
pnpm exec for-humanity --help
pnpm exec for-humanity build --help
pnpm exec for-humanity --version
```

| 상황 | 확인할 내용 |
| --- | --- |
| 문서 폴더를 찾을 수 없음 | 설치 버전, 명령의 위치 인자, `content.root` 설정 |
| frontmatter 오류 | 문서의 `name`·`label`·`group` 존재 여부 |
| 설정 파일 중복 | 같은 위치에 `.ts`와 `.mjs`를 함께 두었는지 |
| private 참조 오류 | 홈이나 공개 문서가 내부 자료를 링크하는지 |
| preview에 수정 내용이 없음 | 수정 후 다시 빌드했는지 |

문서 작성은 [Writing](writing.md), 결과 공개는 [Deployment](deployment.md)로 이어집니다.
