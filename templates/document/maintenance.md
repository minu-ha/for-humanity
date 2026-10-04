---
name: Maintenance
label: 기여와 유지보수
group: Development
order: 30
---

코드 변경, 컨벤션, 검증, 패키지 배포 기준.
엔진은 [Architecture](architecture.md), 표현 기준은 [Design](design.md), 다음 작업은 [Roadmap](roadmap.md).

## Overview

```sh
pnpm test
pnpm check
pnpm build
git diff --check
```

| Command          | Scope                              |
| ---------------- | ---------------------------------- |
| `pnpm test`      | 문서 경로·묶음·순서 · 글꼴 정책     |
| `pnpm test:navigation` | 실제 브라우저의 탐색·저장 복원·드로어·포커스 |
| `pnpm lint`      | Biome · Stylelint                  |
| `pnpm typecheck` | TypeScript                         |
| `pnpm build:kit` | 서버·브라우저 번들                 |
| `pnpm build`     | 패키지 번들 · 프로젝트 문서 사이트 |
| `pnpm build:pages` | 문서 사이트 · Cloudflare 배포 파일 |
| `pnpm sync:docs` | README 홈 · Changelog 문서 동기화 |
| `pnpm lint:fix`  | 자동 린트·포맷 수정                |

::part[Code]

## Conventions

- Formatter: 공백 4칸 · `lineWidth: 180` · Biome와 EditorConfig
- Files: kebab-case · 컴포넌트 `Pg`, `Wg`, `Ui` 레이어 접두사
- Imports: `@/` · 같은 폴더 CSS 부수효과 import만 `./`
- Ownership: 소유자 전용 파일 `_` · `_function`, `_type`, `_constant` 역할 폴더
- Functions: 이름 붙인 `const` 화살표 · 블록 본문 · 명시적 반환
- Props: 구조분해 없이 `props.*` 접근
- Classes: `scope_slug__element--modifier` · 조합은 `clsx`
- Comments: 명사구 · 목적·계약·제약 · 구현 반복 설명 제거
- Language: 제목·짧은 라벨은 영어 우선 · 본문·설명은 한국어 · [Writing](writing.md#language)
- Commits: 영어 동사로 시작 · AI 도움을 받은 제목의 마지막은 ` | aa` · 저장소 루트 `AGENTS.md`·`CLAUDE.md`

### Lint coverage

Biome: 포맷, import, 타입·이름·레이어 규칙.
Stylelint: CSS 클래스, 선택자, 중첩, 토큰 규칙.
`no-literal-fallback.grit`: `??`, `||` 오른쪽의 리터럴 검사.
Biome와 Grit의 커스텀 진단 메시지는 영어.

의미·소유권·주석·접근성은 수동 리뷰 대상. 린트만으로 컨벤션 충족 판정 불가.

### Grid renderer

`src/util/mermaid/render-flow.js`: blueprint 계열과 공유한 JS 구현.
Biome 제외 이유: 기존 렌더링 알고리즘과 diff 대조.
주석은 프로젝트 문체 사용 · 실행 로직 변경 시 별도 확인.

### Repository utilities

루트 `script/`는 패키지 명령의 실행 절차를 관리합니다. `build-kit.mjs`는 esbuild API로 CLI·CSS·브라우저 번들을 생성하고, `test.mjs`는 TypeScript 테스트를 컴파일한 뒤 Node 테스트 러너를 실행합니다. `package.json`에는 진입 명령만 두며 두 스크립트 모두 npm 실행용 의존성이 아닙니다.

루트 `util/`은 저장소 개발·문서 동기화·배포 검증용. npm 패키지에는 포함하지 않음.

| Script | Purpose |
| ------ | ------- |
| `sync-readme.mjs` | 최상위 README를 문서 홈으로 변환 · 사이트용 링크 조정 |
| `sync-changelog.mjs` | 최상위 CHANGELOG를 공식 변경 기록 문서로 생성 |
| `prepare-pages.mjs` | Pages용 캐시 헤더와 404 페이지를 배포 폴더에 복사 |
| `prepare-release.mjs` | 태그·버전·README·변경 기록·배포 파일 확인 · Release 본문 생성 |
| `prepare-release.test.mjs` | 버전 불일치·변경 기록 누락·이전 설치 버전·필수 파일 누락 검사 |
| `smoke-package.mjs` | 패키지를 별도 프로젝트에 설치 · 페이지·Mermaid·자원·README 확인 |
| `navigation/check-navigation.test.mjs` | 임시 문서 사이트로 Hono JSX 탐색 검사 · 개인 문서와 실행 중인 서버를 사용하지 않음 |

::part[Verification]

## Browser checks

Hono 클라이언트 탐색을 변경하면 자동 브라우저 검사를 실행합니다. Playwright Chromium이 필요하며 이미 설치한 Chrome으로도 실행할 수 있습니다.

```sh
pnpm exec playwright install chromium
pnpm test:navigation

# 설치된 Chrome 사용
pnpm test:navigation chrome
```

검사는 임시 문서를 빌드하고 빈 포트의 로컬 서버를 시작합니다. 넓고 좁은 데스크톱·모바일, Dark·강제 색상·JavaScript 비활성, 접힘·스크롤 저장, 느린 본문 스크립트의 첫 프레임, 정확한 앵커·Details 공개, 드로어의 포커스와 본문 DOM 유지 여부를 확인합니다. 실행 후 임시 파일·서버·브라우저를 정리합니다. 브라우저 설치가 필요하므로 기본 `pnpm test`와 분리합니다.

- 문서 전체: `1600px` Light·Dark, `1024px`, `390px`
- 가로 넘침 · 끊긴 문서·section 링크 · 처리되지 않은 흐름도 · 콘솔 오류
- 시스템 테마 변경 반영 · TOC의 현재 section·subsection
- 데스크톱의 문서 탐색 첫 묶음 라벨·h1 글자 위쪽 시작선 · 사이트 이름은 그 위
- Architects Daughter Regular의 실제 표시 · 로컬 글꼴 선요청·캐시 · 긴 사이트 이름의 한 줄 말줄임
- 데스크톱의 사이트 이름 고정 · 이름 아래 문서 목록 스크롤 · 와이드 화면의 오른쪽 목차 끝까지 이동해도 사이트 이름 유지
- 본문 최대 폭 `900px` · 넓은 화면의 중앙 정렬 · 화면 축소 시 오른쪽 여백을 먼저 줄인 뒤 본문 축소 · 짧은 화면에서도 사이드바 마지막 링크와 키보드 포커스가 보이는지 확인
- 1536px 이상에서만 오른쪽 TOC · 같은 폭의 독립 스크롤 · 1536px 미만과 모바일 드로어에는 목차 없음
- 1px 트리의 가지·줄기 연결 · 마지막 항목의 줄기 종료 · 중첩·긴 제목의 첫 줄 연결 · 현재 항목까지 가로 가지·세로 경로 강조 · 아래 항목과 다른 묶음은 기본 선색 유지
- 본문·TOC 자동 번호 없음 · 직접 쓴 번호는 유지 · 긴 제목 첫 줄의 트리 연결
- 문서·TOC 묶음: 회색 11px · 문서 링크: 링크색 12px · 목차 링크: 본문 글색 12px · On this page: 같은 회색·굵기 600
- 현재 문서·TOC의 공통 굵기 `600` · hover·키보드 포커스의 세로 경로와 밑줄 · 탐색 종료 후 현재 경로 유지 · 하위 목차의 상위 경로 연결
- `parent` 하위 문서: 부모·자식 링크를 한 번씩 표시 · 현재 페이지만 `aria-current`와 굵기 · 부모 문서까지 active·hover·Tab 가지 연결
- 본문 양쪽 1px 보더·32px 패딩 · 사이드바와 간격 32px · 사이드바 자체 패딩·세로 보더 없음 · 긴 제목의 줄바꿈과 컬럼 폭 유지
- 스크롤 중 본문 끝까지 양쪽 보더 유지 · 문서 탐색과 와이드 TOC의 독립 스크롤 · 작은 화면의 세로선·본문 패딩 해제
- 탐색 스크롤: 페이지 이동·새로고침·뒤로/앞으로 · 드로어 재열기 · 데스크톱/드로어 별도 위치 · 문서 목록 변경·저장소 차단·손상 복구
- 탐색 넘침: 실제 남은 내용이 있는 위·아래 끝만 흐림 · 강제 색상·JavaScript 비활성에서는 네이티브 손잡이 · 밝게/어둡게 확인
- 한국어 hash · 폰트 로드 후 위치 · 키보드 포커스
- 문서 묶음: 읽는 순서 · 모든 문서 공개 · 아이콘 없는 텍스트 · 키보드 링크 이동
- 문서 탐색 링크는 방문 여부와 무관하게 링크색 유지 · 현재 문서 굵기 강조 · 본문 링크는 기존 방문색 유지
- 문서 탐색·사이트 이름 hover의 글색·굵기 유지와 밑줄 · hover 링크색의 레일 · 현재 문서의 레일 유지
- Note·Details: 기본 접힘·`{open}`·중첩 · Enter·Space · 숨은 제목의 hash 공개
- 부품 문법 오류: 제목·본문·닫힘·속성 · 파일·줄 표시
- 모바일: 첫 화면에서 본문 표시 · 스크롤 중 메뉴 버튼 유지 · 드로어 열기·닫기·Escape·배경 클릭
- 드로어: Tab 포커스 범위 · 닫기 후 버튼 복귀 · 내부 스크롤과 배경 잠금 · 1024px 전환 시 모달·포커스·잠금 정리
- 드로어: 문서 목록만 표시 · 문서 선택·Escape·배경 클릭으로 닫기 · 키보드 포커스 복원
- 와이드 목차: 제목 이동·강조 · 같은 hash 재클릭·Details 공개 · 느린 client module에서도 접기 버튼 즉시 작동
- JavaScript 비활성 상태의 본문·TOC와 모바일 기본 목록
- 상대 Markdown 링크: query·hash 보존 · README 홈·참조 링크·중첩 경로
- dev: 추가·수정·삭제 · 잘못된 문서 후 정상 복구

## Packaging and release

버전 선택·공개 시점·호환성 정책의 기준은 [Releases](releases.md). 이 문서는 검증과 공개 작업 절차 담당.
버전별 변경 기록은 [Changelog](changelog.md).
변경 기록은 최상위 `CHANGELOG.md`에 작성. npm 패키지·GitHub Release·사이트에서 같은 기록 사용.

```sh
pnpm pack
```

패키지 설치 후 별도 폴더에서 `dev`, `build`, `preview` 확인.
정적 사이트는 문서 폴더의 `dist` 전체 배포. 사이트 루트 경로 기준 · [Deployment](deployment.md).
첫 공개 버전 `0.1.0`의 지원 범위는 `dev`, `build`, `preview`. `init`은 별도 예정 작업.

공개 전 위 검증 명령을 모두 통과하고, 패키지에 CLI·CSS·클라이언트 스크립트·폰트·favicon·라이선스가 포함되는지 확인.

### Automatic publishing

| Event | Result |
| ----- | ------ |
| PR · `main` push | CI: 테스트 · 린트 · 타입 검사 · Pages 빌드 · 패키지 설치 후 빌드 |
| `main` push | Cloudflare Git 연동으로 문서 사이트 배포 |
| `vX.Y.Z` 태그 push | Release: 검증 · npm 배포 · 같은 `.tgz`를 첨부한 GitHub Release 생성 |

워크플로는 `.github/workflows/ci.yml`, `.github/workflows/release.yml`.
Release는 `main`에 포함된 커밋, 태그와 일치하는 `package.json` 버전, 해당 버전의 `CHANGELOG.md` 항목과 README 설치 명령 확인.
`vX.Y.Z` 정식 버전만 지원. prerelease는 별도 정책을 추가한 뒤 사용.
설치 검증은 저장소 밖의 새 프로젝트에서 실행. CLI·CSS·클라이언트·글꼴·favicon·라이선스와 README 포함 여부 확인.

### Trusted Publisher setup

[npm 패키지 설정](https://www.npmjs.com/package/for-humanity/access)의 Trusted Publisher에 한 번 등록.

| Field | Value |
| ----- | ----- |
| Publisher | GitHub Actions |
| Label | `GitHub release` · 선택 |
| Organization or user | `minu-ha` |
| Repository | `for-humanity` |
| Workflow filename | `release.yml` · 파일명만 입력 |
| Environment name | 비워둠 |
| Allow npm publish | 체크 |
| Allow npm dist-tag | 체크하지 않음 |

GitHub가 발급하는 OIDC 자격 증명 사용. 별도 `NPM_TOKEN`이나 매번의 로그인·2FA 입력 불필요.
GitHub-hosted runner, Node.js 24와 npm 12.2.0으로 배포. 패키지 사용자의 Node.js 최소 버전은 22 유지.
설정 기준은 [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

### Daily development

1. 작은 변경을 구현하고 필요한 검증 실행.
2. 사용자에게 영향을 주는 변경은 `CHANGELOG.md`의 `Unreleased`에 기록. 아직 npm에 없는 기능의 문서에는 미공개 상태 표시.
3. 위 검증 명령을 통과한 뒤 변경 파일만 커밋하고 `main`에 push. CI와 Pages 결과 확인.

평소 `package.json`과 README의 설치 버전 유지. `main` push는 사이트 갱신이며 npm 공개를 실행하지 않음.
CI가 실패하면 다른 작업보다 실패 원인 수정 우선. 현재 Pages Git 배포와 CI는 별도로 실행되므로 로컬 검증과 두 결과 모두 확인.

### Release steps

패키지 릴리스가 작업 범위에 포함됐을 때 실행:

1. 마지막 공개 태그 이후의 전체 변경을 검토하고 [Version policy](releases.md#version-policy)에 따라 버전 선택.
2. `package.json` 버전을 올리고 `CHANGELOG.md`의 `Unreleased`를 해당 버전·공개 날짜 항목으로 옮김. 이번 공개에 포함될 미공개 기록이 남지 않았는지 확인.
3. 최상위 `README.md`와 `language/README.ko.md`의 설치 버전·지원 버전 갱신. 공개하는 기능 문서의 미공개 표시 제거.
4. 검증 명령 실행. `pnpm build`가 `templates/document/README.md`와 `changelog.md`도 동기화.
5. 릴리스 준비 변경만 커밋하고 `main`에 push. 해당 커밋의 CI와 Pages 결과 확인.
6. 검증한 릴리스 준비 커밋에 같은 버전의 태그를 만들고 push. 태그를 만들기 전후에 다른 커밋으로 대상을 바꾸지 않음.

다음 공개 버전이 `0.2.2`인 경우:

```sh
git tag -a v0.2.2 -m "Release v0.2.2"
git push origin v0.2.2
```

태그 push 후 Release Actions 실행 결과 확인. npm 배포가 성공한 뒤 GitHub Release 생성.
완료 보고 전 npm에서 버전·패키지 공개를 확인하고 GitHub Release 확인. 사이트 갱신 성공만으로 npm 공개 완료를 판정하지 않음.
이미 npm에 같은 버전이 있다면 패키지의 integrity가 일치할 때만 재배포를 건너뛰고 GitHub Release 작업을 이어감.
내용이 다르면 실패. 게시한 버전은 수정하거나 덮어쓰지 않고 다음 버전으로 공개.

`main`의 README 변경은 GitHub와 문서 사이트에 먼저 반영. npm README와 홈페이지 주소는 새 패키지 버전을 배포할 때 반영.
공개 후 npm에서 패키지를 새 프로젝트에 설치해 같은 명령 확인. 다른 프로젝트의 고정된 의존성 버전은 별도 갱신.

::part[Next]

## Roadmap

진행 순서, 단계별 산출물과 완료 기준은 [Roadmap](roadmap.md).
다음 작업은 [Authoring](authoring.md)의 작성 기준과 [시각화·테마 모듈](roadmap.md#visualization-modules).
