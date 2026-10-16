---
name: Commands
label: 설치와 실행
group: Getting started
order: 10
---

Markdown 폴더에서 정적 사이트까지. 설치, 개발 서버, 빌드, 미리보기.
문서 형식은 [Writing](writing.md), 사이트 설정은 [Settings](settings.md), 배포는 [Deployment](deployment.md).

## Overview

```mermaid
flowchart LR
    a("Markdown") --> b("dev<br>작성과 확인")
    b --> c("build<br>정적 HTML")
    c --> d("preview<br>배포 전 확인")
```

| Command              | Result                                |
| -------------------- | ------------------------------------- |
| `dev <docs-dir>`     | 개발 서버 · Markdown 변경 시 새로고침 |
| `build <docs-dir>`   | `<docs-dir>/dist`에 HTML과 자원 출력  |
| `preview <docs-dir>` | 빌드 결과 미리보기                    |

::part[Setup]

## Local development

저장소 개발은 Node.js 22.12.0 이상과 pnpm.

```sh
git clone https://github.com/minu-ha/for-humanity.git
cd for-humanity
pnpm install
pnpm dev
```

접속: `http://localhost:4321/`. 기본 문서: 이 폴더의 for humanity 문서.

```sh
pnpm build
pnpm preview
```

### Use in another project

Node.js 22 이상과 pnpm이 있는 문서 프로젝트에서 npm 패키지 설치.

```sh
pnpm add -D --save-exact for-humanity@0.12.0
pnpm exec for-humanity dev docs
```

`docs/README.md`를 홈으로 작성. 다른 문서의 frontmatter는 [Writing](writing.md) 참고.
문서가 프로젝트 루트에 있다면 `docs` 대신 `.` 사용. 루트 `AGENTS.md`·`CLAUDE.md`는 문서 수집에서 제외.
`0.12.0`은 `dev`, `build`, `preview` 지원. `init`은 아직 미구현.

### Help and version

미공개 변경부터 Citty 기반 도움말과 버전 표시 지원. 설정 파일을 실행하거나 서버를 시작하지 않습니다.

```sh
pnpm exec for-humanity --help
pnpm exec for-humanity build --help
pnpm exec for-humanity --version
```

`-h`, `-v`도 사용 가능. 지원하지 않는 옵션과 문서 폴더를 여러 개 지정한 입력은 종료 코드 `1`로 실패합니다.

### Test a local package

공개 전 변경을 확인할 때는 저장소에서 만든 패키지를 별도 프로젝트에 설치.

```sh
# for humanity 저장소
pnpm pack

# 문서 프로젝트
pnpm add -D /path/to/for-humanity-0.12.0.tgz
pnpm exec for-humanity dev docs
```

::part[Commands]

## dev

```sh
pnpm exec for-humanity dev docs
```

- 포트: 설정 `port` · 기본 `4321` · [Settings](settings.md#site)
- Markdown·README·로컬 그림·스니펫 추가·수정·삭제 → 문서 재처리 → Vite 통신으로 열린 페이지 새로고침
- 잘못된 문서 → 터미널 오류 · 직전 정상 문서 유지
- 설정 변경 → 서버 재시작
- 저장소 `pnpm dev`: TS·TSX 변경은 페이지 갱신, CSS는 HMR로 반영
- 설치 패키지 변경 → 다시 설치한 뒤 서버 재시작
- 미공개 Vite 전환부터 Node 22.12.0 이상 필요. 별도 Vite 설정 파일은 만들지 않아도 됨

## build

```sh
pnpm exec for-humanity build docs
```

출력: `docs/dist`. 이전 결과 삭제 후 새 HTML, CSS, 스크립트, 폰트, favicon 출력.
배포 대상은 이 폴더 전체. URL 기준은 사이트 루트 `/`.

### Errors and warnings

| Kind    | Trigger                                                                   | Result                  |
| ------- | ------------------------------------------------------------------------- | ----------------------- |
| Error   | 설정·frontmatter 오류, 문서 id 중복, 모르는 블록 지시문, 흐름도 실패       | 종료 코드 `1`           |
| Warning | 없는 Markdown 링크, 설정에 없는 날짜 상태 문구                            | 터미널 경고 · 빌드 계속 |

미공개 변경부터 빌드 완료·문서 경고·실행 오류는 Consola로 표시합니다. 성공은 표준 출력, 경고·오류는 표준 오류로 출력하며 문서 경고의 파일·줄 위치를 유지합니다. Vite의 주소·HMR·변환 오류는 Vite 출력 방식을 사용합니다.

## preview

```sh
pnpm exec for-humanity preview docs
```

Vite preview가 `<문서 폴더>/dist`의 빌드 결과만 제공합니다. 문서 수정 반영은 다시 `build`. 원본 감시·HMR·Hono API 실행은 포함하지 않습니다.

- 접속: `localhost` · 설정 `port` 사용 · 기본 `4321`
- 빌드 결과가 없으면 `build` 안내와 종료 코드 `1`
- 설정 포트가 사용 중이면 다른 포트로 이동하지 않고 실패
- 없는 문서는 홈 화면 대신 `404`
- 별도 Vite 설정 불필요 · 프로젝트의 Vite 설정·환경 파일 자동 로드 제외

로컬 빌드 확인용이며 운영 서버로 사용하지 않습니다. 현재 정적 배포는 [Deployment](deployment.md), 향후 API 개발·운영 방식은 [Architecture](architecture.md#development-preview-and-production).

### Default arguments

명령 생략 = `dev`. 문서 폴더 생략 = 현재 폴더.

```sh
pnpm exec for-humanity
pnpm exec for-humanity build
```
