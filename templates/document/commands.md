---
name: Commands
label: 설치와 실행
group: Getting started
---

Markdown 폴더에서 정적 사이트까지. 설치, 개발 서버, 빌드, 미리보기.
문서 형식은 [Writing](writing.md), 사이트 설정은 [Settings](settings.md).

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

Node.js 22 이상과 pnpm.

```sh
git clone https://github.com/minu-ha/for-humanity.git
cd for-humanity
pnpm install
pnpm dev
```

접속: `http://localhost:4321/`. 기본 문서: 이 폴더의 for-humanity 문서.

```sh
pnpm build
pnpm preview
```

### Use in another project

현재 npm 공개 전. 저장소에서 만든 패키지를 문서 프로젝트에 설치.

```sh
# for-humanity 저장소
pnpm pack

# 문서 프로젝트
pnpm add -D /path/to/for-humanity-0.1.0.tgz
pnpm exec for-humanity dev docs
```

::part[Commands]

## dev

```sh
pnpm exec for-humanity dev docs
```

- 포트: `4321`
- Markdown 추가·수정·삭제 → 문서 재처리 → 열린 페이지 새로고침
- 잘못된 문서 → 터미널 오류 · 직전 정상 문서 유지
- 설정 변경 → 서버 재시작
- 패키지 소스 변경 → `pnpm dev` 재실행

## build

```sh
pnpm exec for-humanity build docs
```

출력: `docs/dist`. 이전 결과 삭제 후 새 HTML, CSS, 스크립트, 폰트, favicon 출력.
배포 대상은 이 폴더 전체. URL 기준은 사이트 루트 `/`.

### Errors and warnings

| Kind    | Trigger                                                                   | Result                  |
| ------- | ------------------------------------------------------------------------- | ----------------------- |
| Error   | 설정·frontmatter 오류, 문서 id·표지 중복, 모르는 블록 지시문, 흐름도 실패 | 종료 코드 `1`           |
| Warning | 없는 Markdown 링크, 설정에 없는 날짜 상태 문구                            | 터미널 경고 · 빌드 계속 |

## preview

```sh
pnpm exec for-humanity preview docs
```

빌드 결과만 제공. 문서 수정 반영은 다시 `build`.

### Default arguments

명령 생략 = `dev`. 문서 폴더 생략 = 현재 폴더.

```sh
pnpm exec for-humanity
pnpm exec for-humanity build
```
