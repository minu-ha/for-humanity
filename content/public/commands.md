---
name: Commands
label: dev, build, preview 명령과 문제 해결
group: Guide
order: 40
---

프로젝트 루트에서 `pnpm exec for-humanity`로 실행합니다. 설치는 [Installation](installation.md)을 참고합니다.

```text
for-humanity <dev|build|preview> [project-dir]
```

| Command | Result |
| --- | --- |
| `dev` | 공개 문서와 내부 문서를 함께 확인, 변경 시 새로고침, 명령을 생략하면 실행 |
| `build` | 홈과 공개 문서를 `content/dist`에 생성 |
| `preview` | 마지막 빌드 결과 확인 |
| `--help` 또는 `-h` | 명령 도움말 |
| `--version` 또는 `-v` | 설치 버전 |

`project-dir`는 설정 파일이 있는 프로젝트 루트이며 생략하면 현재 폴더입니다. 다른 폴더에서 실행하려면 `for-humanity dev ../my-project`처럼 **프로젝트 경로**를 지정합니다.
`content.root`를 바꿨다면 출력은 그 폴더 아래의 `dist`입니다. `init` 명령은 아직 지원하지 않습니다.

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
