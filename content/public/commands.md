---
name: Commands
label: init, dev, build, preview 명령과 문제 해결
group: Guide
order: 40
---

프로젝트 루트에서 `pnpm exec for-humanity`로 실행합니다. 설치는 [Installation](installation.md)을 참고합니다.

```text
for-humanity <init|dev|build|preview> [project-dir]
```

| Command | Result |
| --- | --- |
| `init` (Unreleased) | 사이트 정보와 배포 방식 선택, 첫 문서와 실행 스크립트 생성 |
| `dev` | 공개 문서와 내부 문서를 함께 확인, 변경 시 새로고침, 명령을 생략하면 실행 |
| `build` | 홈과 공개 문서를 `content/dist`에 생성 |
| `preview` | 마지막 빌드 결과 확인 |
| `--help` 또는 `-h` | 명령 도움말 |
| `--version` 또는 `-v` | 설치 버전 |

`project-dir`는 설정 파일이 있는 프로젝트 루트이며 생략하면 현재 폴더입니다. 다른 폴더에서 실행하려면 `for-humanity dev ../my-project`처럼 **프로젝트 경로**를 지정합니다.
`content.root`를 바꿨다면 출력은 그 폴더 아래의 `dist`입니다. `init`은 개발 버전에 추가되었으며 npm `0.17.0`에는 포함되지 않습니다.

## Initialize a project (Unreleased)

```sh
pnpm exec for-humanity init
pnpm exec for-humanity init my-docs
# npm
npx for-humanity init
```

질문은 명시하지 않은 값에만 표시합니다. 사이트 이름은 프로젝트 이름, 폴더는 `content`·`docs`, 언어는 한국어·English를 추천값으로 제공합니다.
추천값에서 바로 타이핑하거나 `Custom` 행으로 이동해 직접 입력할 수 있습니다. Enter 한 번으로 답변을 확정합니다. 감지한 GitHub 저장소와 브랜치도 추천값 또는 직접 입력으로 확인합니다.
생성 전에 선택한 설정과 파일 목록을 확인합니다. Ctrl+C나 마지막 확인의 No로 취소하면 파일을 만들지 않고 종료 코드 `130`으로 끝납니다.

| Option | Value |
| --- | --- |
| `--title` | 사이트 이름, 기본값은 기존 package.json의 name 또는 Project notes |
| `--content` | 프로젝트 안의 문서 폴더, 기본값 content |
| `--lang` | 문서 언어 태그, 기본값 ko |
| `--deploy` | none, github-pages, cloudflare-pages |
| `--repository` | GitHub 저장소 owner/name, 로컬 Git에서 하나로 확인되면 제안 |
| `--branch` | GitHub 배포 브랜치, 로컬 main/master 또는 main |
| `--url` | 공개 HTTP(S) 도메인, 별도 도메인을 쓰는 GitHub 사이트는 루트 경로로 생성 |
| `--manager` | npm 또는 pnpm, 선언·lockfile·실행 환경에서 감지 |
| `--yes` | 질문과 확인 생략, 미지정 배포 방식은 none |

자동 실행 예시:

```sh
pnpm exec for-humanity init --yes --deploy none
pnpm exec for-humanity init --yes --deploy github-pages --repository username/project --branch main
npx for-humanity init --yes --deploy cloudflare-pages --manager npm
```

비대화형 환경에서는 `--yes` 또는 `--deploy`를 명시합니다. GitHub Pages에는 저장소 정보가 필요합니다. 제공한 옵션은 `--yes`에서도 검증합니다.
패키지 매니저는 명시 옵션, packageManager, lockfile, 실행 환경 순서로 선택합니다. 선언과 옵션이 충돌하거나 lockfile 둘 중 하나를 고를 수 없으면 수정 방법을 안내합니다.

기존 `dev`·`build` 스크립트와 for-humanity 의존성 버전을 유지하고 `docs:*`만 추가합니다. 기존 설정, 문서 또는 호스팅 파일을 덮어쓰지 않습니다.
이미 초기화한 프로젝트는 설정을 직접 수정합니다. 기존 문서를 옮길 때는 [Migration](migration.md)을 따릅니다.

## While editing

`dev`는 Markdown, 홈, 그림, 스니펫의 변경을 반영합니다. 잘못된 문서를 저장하면 터미널에 오류를 표시하고 직전 정상 문서를 유지합니다. 오류를 고쳐 저장하면 다시 반영됩니다.
설정 파일을 바꾼 경우에는 서버를 종료하고 다시 실행합니다.

`preview`는 마지막 빌드 결과를 보여 줍니다. 문서를 수정했다면 다시 `build`해야 합니다.
두 서버는 기본적으로 localhost와 포트 `4321`을 사용합니다. 포트가 사용 중이면 기존 서버를 종료하거나 설정의 `port`로 다른 포트를 지정합니다.

## Help and troubleshooting

```sh
pnpm exec for-humanity --help
pnpm exec for-humanity build --help
pnpm exec for-humanity --version
```

| 상황 | 확인할 내용 |
| --- | --- |
| 문서 폴더를 찾을 수 없음 | 설치 버전, 명령의 위치 인자, `content.root` 설정 |
| frontmatter 오류 | 오류에 표시된 문서의 YAML 문법과 `name`, `label`, `group` 존재 여부 |
| 설정 파일 중복 | 같은 위치에 `.ts`와 `.mjs`를 함께 두었는지 |
| private 참조 오류 | 홈이나 공개 문서가 내부 자료를 링크하는지 |
| preview에 수정 내용이 없음 | 수정 후 다시 빌드했는지 |
