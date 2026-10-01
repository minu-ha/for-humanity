# for humanity

**Documents, for humans.**

Markdown 폴더를 읽기 편한 정적 문서 사이트로 만듭니다.
목적별 탐색, 절 번호와 목차, 코드 강조와 흐름도를 제공하며 문서는 Markdown으로 유지합니다.

## Start here

Node.js 22 이상과 pnpm으로 저장소에서 시작합니다.

```sh
git clone https://github.com/minu-ha/for-humanity.git
cd for-humanity
pnpm install
pnpm dev
```

[localhost:4321](http://localhost:4321)에서 이 문서 사이트를 볼 수 있습니다.

- [Commands](commands.md): 설치, 개발 서버, 정적 빌드와 미리보기
- [Writing](writing.md): Markdown 문서, 탐색 묶음과 본문 작성
- [Settings](settings.md): 사이트 이름, 읽는 순서와 상태 표지
- [Deployment](deployment.md): 도메인 없이 Cloudflare Pages에 배포

## Write your own docs

CLI에 넘기는 문서 폴더의 `README.md`가 홈(`/`)입니다.
별도 frontmatter 없이 제목과 본문을 쓰면 됩니다. 사이트 이름을 누르면 홈으로 돌아옵니다.

일반 문서는 frontmatter의 `name`, `label`, `group`으로 제목·설명·묶음을 지정합니다.
`order`를 추가하면 묶음 안의 읽는 순서를 정할 수 있습니다.

```text
docs/
  README.md
  commands.md
  writing.md
  for-humanity.config.mjs
```

현재 npm 공개 전입니다. 다른 프로젝트에서 패키지를 사용하는 방법은 [Commands](commands.md#use-in-another-project)에 있습니다.

## Explore the library

- [API](api.md): CLI·설정·문서 형식의 사용 계약
- [Parts](parts.md): Note, Details, 표, 코드와 흐름도 예시
- [Blueprint](blueprint.md): 가상의 독서 기록 앱으로 작성한 설계 문서 예시
- [Architecture](architecture.md): 라이브러리 내부 구조

문서는 정적 HTML로 생성하며 글꼴을 함께 배포합니다.
Light·Dark·System 테마, 키보드 탐색과 좁은 화면을 지원합니다.

## Build and share

```sh
pnpm build
pnpm preview
```

Cloudflare Pages 빌드 명령은 `pnpm build:pages`, 출력 폴더는 `templates/document/dist`입니다.
연결 과정과 기본 `pages.dev` 주소는 [Deployment](deployment.md)에서 확인할 수 있습니다.

[GitHub 저장소](https://github.com/minu-ha/for-humanity) · [MIT 라이선스](https://github.com/minu-ha/for-humanity/blob/main/LICENSE)
