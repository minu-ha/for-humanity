---
name: Init implementation plan
label: 초기화 구현과 검증 순서
group: Development
order: 61
---

# Init Implementation Plan

> For agentic workers: execute the coupled generator and CLI in sequence. Use independent spec and code review before integration. Steps use checkbox syntax.

**Goal:** 설치한 패키지에서 안전한 init과 Consola 기반의 대화형 시작 화면 제공.

**Architecture:** 입력 경계에서 옵션·프로젝트 정보를 검증하고, 초기화 설정을 파일 생성 계획으로 변환한 뒤 충돌 검사와 적용. 기존 dev/build/preview는 유지하고 init만 별도 진입점으로 분리.

**Tech Stack:** TypeScript, Citty, Consola와 consola/utils, Zod, Node fs, Vitest, installed-package smoke.

## Task 1: 기존 동작과 초기화 계약

Files: `test/0-command/0.5-init.node.test.ts`, `src/entry/init/_constant/init.ts`, `src/entry/init/_type/init.ts`.

- [x] 기존 `pnpm test`, `pnpm check`, `pnpm build`, `git diff --check` 통과 확인.
- [x] CLI 프로세스를 실행하는 회귀 검사 먼저 추가. none 초기화, 기존 package.json 보존, 충돌과 잘못된 옵션에서 쓰기 없음, GitHub url/basePath와 YAML, Cloudflare 404 준비, 재실행과 CI 입력 검사.
- [x] `pnpm exec vitest run test/0-command/0.5-init.node.test.ts`에서 init 미지원으로 실패 확인.
- [x] 초기화 선택값과 파일 변경 계획의 입력/출력 계약 정의. 전체 JSON은 unknown으로 받고 스키마 검증 뒤 원래 키 유지.

검사 예시:

```ts
const result = spawnSync(process.execPath, [cli, "init", "--yes", "--deploy", "none"], {cwd: root, encoding: "utf8"});
expect(result.status, result.stderr).toBe(0);
expect(await readFile(join(root, "content/README.md"), "utf8")).toContain("Project notes");
expect(await readFile(join(root, "package.json"), "utf8")).toContain("docs:dev");
```

## Task 2: 초기화 파일 생성

Files: `src/entry/init/_function/read-init-project.ts`, `to-init-plan.ts`, `apply-init-plan.ts`, `src/config/env.ts`, `template/cloudflare/404.html`, `template/cloudflare/prepare.mjs`.

- [x] 로컬 manifest와 lockfile, packageManager, Git remote와 배포 브랜치 후보 읽기. npm/pnpm 선택 충돌은 명시적 옵션 안내.
- [x] 내용 루트가 프로젝트 안에 있는지, 링크 경유·기존 파일·기존 설정·스크립트 충돌 검사.
- [x] 기본 문서/설정, docs 스크립트, gitignore와 선택한 배포 파일 생성 계획 작성.
- [x] GitHub Actions의 브랜치·패키지 매니저·출력 경로를 구조적으로 생성. 저장소 정보로 사용자 사이트와 프로젝트 사이트 구분.
- [x] Cloudflare 404와 Node 복사 스크립트 준비. 사용자 지정 문서 루트로 복사하고 기존 Cloudflare 파일 보존.
- [x] 전체 검증 후 새 파일은 배타적으로 생성. 기존 JSON/gitignore는 읽은 내용과 재대조 후 교체. 실패 시 이 작업의 변경만 복구.
- [x] 실제 파일 기반 충돌·링크·쓰기 실패 검증 통과.

## Task 3: CLI와 터미널 흐름

Files: `src/entry/cli/cli.ts`, `_constant/command.ts`, `_constant/copy.ts`, `src/entry/init/run-init.ts`, `_function/to-init-options.ts`, `_function/print-init-result.ts`.

- [x] init 도움말과 옵션을 별도 등록. 루트·기존 명령의 알 수 없는 옵션 거부 유지.
- [x] Consola의 박스·색상·Clack 프롬프트로 시작 화면, 이름·폴더·언어·배포 질문과 생성 전 확인 연결.
- [x] `cancel: "symbol"`을 사용하고 취소값을 명시적으로 처리. 취소 시 파일 생성 전 종료.
- [x] 비대화형 환경은 --yes 또는 필요한 명시 옵션으로 실행. 누락 시 명령 예시와 함께 실패.
- [x] 생성 결과, dev/build/preview 실행 명령, 배포별 남은 설정 출력.
- [x] 실제 PTY에서 기본 입력, 선택 메뉴, 잘못된 입력, Ctrl+C와 좁은 폭 화면 확인.

## Task 4: 설치 소비자와 문서

Files: `util/smoke-package.ts`, `README.md`, `language/README.ko.md`, `content/public/installation.md`, `commands.md`, `deployment.md`, `content/private/roadmap.md`, `maintenance.md`, `site-deployment.md`, `CHANGELOG.md`.

- [x] 실제 tarball에 init 코드와 모든 호스팅 템플릿 포함 확인.
- [x] 별도 npm/pnpm 프로젝트에서 초기화한 사이트의 dev/build/preview, GitHub 경로와 Cloudflare 출력 확인.
- [x] 공개 중인 0.17.0과 미공개 init 기능을 구분해 사용법 작성. 설치 문서의 오래된 버전과 내부 배포 안내 정리.
- [x] CHANGELOG Unreleased 기록. package.json 버전과 공개 태그 유지.
- [x] `pnpm test`, `pnpm check`, `pnpm build`, 전체 브라우저 검사, publint와 설치 패키지 smoke 통과.
- [x] 검증 후 요청 범위만 `Add interactive project initialization | aa` 같은 영어 동사 제목으로 커밋. 이번 작업에서는 push나 새 npm 공개를 수행하지 않음.

## Completion

- [x] 요구사항 검토와 코드 검토의 지적 해결.
- [x] 최종 변경과 현재 브랜치, 검증 결과, 실제 터미널 예시 보고.

## Verification record

로컬 검증 환경: macOS, Node.js 24.3.0. 기존 261개 검사에서 시작해 init CLI·입력 경계·호스팅 파일·중간 실패 복원 검사를 추가.
별도 npm/pnpm tarball 설치에서 생성한 docs 스크립트와 dev/build/preview, GitHub 하위 경로와 Cloudflare 404, 공개·내부 문서 경계를 브라우저로 확인.
실제 PTY에서 기본 질문, 잘못된 경로 재입력, GitHub 선택과 생성, Ctrl+C, 마지막 No, 44열과 색상 없는 화면 확인.
독립 검토의 GitHub 브랜치 필터 이스케이프, remote 없는 master 감지, 설정 이름과 문서 폴더 중첩, BOM manifest 지적은 재현 검사 후 수정.

새 npm 공개와 원격 사이트 배포는 이번 구현 범위 밖. package.json과 README 설치 버전은 마지막 공개인 0.17.0 유지.
Windows와 Linux에서의 새 init 실행은 저장소 CI에서 추가 확인 대상. 이번 로컬 검증을 해당 OS의 실행 결과로 간주하지 않음.

## Prompt and terminal refinement

사이트 이름, 문서 폴더, 언어, 감지한 GitHub 저장소와 브랜치, 공개 주소에 추천값과 Custom 선택을 제공.
추천값 선택은 바로 다음 질문으로 이동하고, Custom은 기존 스키마 검증과 재입력을 사용. 후보가 없는 저장소는 바로 입력.
기존 프로젝트 이름이 비어 있거나 한 줄 제목으로 사용할 수 없으면 Project notes를 제안.

청록색 시작 박스에 브랜드 문구를 더하고 사이트 설정, 배포, 생성 전 확인의 세 단계 표시.
파일을 쓰기 전에 선택한 설정과 파일 수·목록을 확인하고, 완료는 녹색 박스로 표시. 박스가 실제 터미널 폭에 맞으면 좁은 화면에서도 유지.

16개 선택 입력 검사에서 추천값, Custom, 잘못된 입력 재시도, 취소, 비대화형 실행과 기존 이름 검증 확인.
실제 44열 PTY에서 기본값 생성과 빌드, 한글 제목·사용자 지정 언어·GitHub 정보 입력, Ctrl+C와 마지막 No의 쓰기 없음 확인.
독립 검토에서 발견한 잘못된 프로젝트 이름의 추천값 실패는 재현 검사 후 수정하고 다시 검토.
