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
| `pnpm test`      | Vitest · 문서 조립·자원 등록·탐색 상태·글꼴·릴리스 검사 |
| `pnpm test:watch` | 변경한 테스트의 Vitest 반복 실행 |
| `pnpm test:browser` | Playwright · 실제 브라우저 검사 전체 |
| `pnpm test:navigation` | 실제 브라우저의 탐색·저장 복원·드로어·포커스 |
| `pnpm test:mermaid` | 실제 브라우저의 다이어그램·테마·Details·실패·수명 정리 |
| `pnpm lint`      | Biome · Stylelint                  |
| `pnpm typecheck` | TypeScript                         |
| `pnpm build:kit` | 서버·브라우저 번들                 |
| `pnpm build`     | 패키지 번들 · 프로젝트 문서 사이트 |
| `pnpm build:pages` | 문서 사이트 · Cloudflare 배포 파일 |
| `pnpm sync:docs` | README 홈 · Changelog 문서 동기화 |
| `pnpm lint:fix`  | 자동 린트·포맷 수정                |

## Repository development

```sh
git clone https://github.com/minu-ha/for-humanity.git
cd for-humanity
pnpm install
pnpm dev
```

개발 서버는 `content/public`과 `content/private`를 함께 읽습니다. 소스 변경은 개발 서버에 반영하고, 배포 결과는 `pnpm build` 후 `pnpm preview`로 확인합니다.
홈의 정본은 루트 `README.md`, 상세 변경 기록의 정본은 루트 `CHANGELOG.md`입니다. `pnpm sync:docs`는 각각 `content/README.md`와 `content/public/changelog.md`를 생성합니다. dev·build 시작 시에도 동기화합니다.

공개 전 패키지를 소비 프로젝트에 설치하려면 저장소에서 `pnpm pack`을 실행하고, 별도 프로젝트에서 `pnpm add -D /path/to/for-humanity-X.Y.Z.tgz`로 설치합니다. 평소에는 마지막 공개 버전을 유지하고, 릴리스 준비 시 선택한 버전으로 올립니다.
공식 사이트의 Cloudflare 프로젝트·출력 경로·헤더 운영은 [Site deployment](site-deployment.md)를 따릅니다.

### Documentation audience

public은 라이브러리를 설치하고 사용하는 독자를 위한 안내입니다. 설치·설정·문서 문법·배포·업데이트를 설명하며 실행 가능한 예시와 필요한 제한을 함께 적습니다.
내부 함수·CSS 치수·라이브러리 선택 근거·개발 명령·릴리스 절차·로드맵·가상 업무 사례는 private에서 관리합니다. 사용자 문서에 내부 구현을 이해해야만 사용할 수 있는 설명을 추가하지 않습니다.
공개 전 변경은 Unreleased로 구분하고 현재 공개 버전의 사용법을 함께 안내합니다. 변경 이력은 원본 CHANGELOG에서 생성한 공개 Changelog로 제공합니다.

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
- Language: 제목·짧은 라벨은 영어 우선 · 본문·설명은 한국어 · [Authoring](authoring.md#language)
- Commits: 영어 동사로 시작 · AI 도움을 받은 제목의 마지막은 ` | aa` · 저장소 루트 `AGENTS.md`·`CLAUDE.md`

주석 앞에는 빈 줄을 둡니다. 블록·객체·배열·JSX의 첫 줄과 연속 주석은 예외입니다. 선언 설명은 여러 줄 JSDoc, 본문의 의도·절차 설명은 `//`를 사용합니다. JSDoc의 본문은 제목 다음 빈 줄과 들여쓴 목록으로 작성하고, 직접 선언한 타입·스키마에는 헤더와 필드 설명을 남깁니다. 테스트의 GIVEN·WHEN·THEN은 [테스트 작성 기준](https://github.com/minu-ha/for-humanity/blob/main/test/README.md)에 따른 별도 블록을 사용합니다.

### Lint coverage

Biome: 포맷, import, 타입·이름·레이어 규칙.
Stylelint: CSS 클래스, 선택자, 중첩, 토큰 규칙.
`no-literal-fallback.grit`: `??`, `||` 오른쪽의 리터럴 검사.
Biome와 Grit의 커스텀 진단 메시지는 영어.

의미·소유권·주석·접근성은 수동 리뷰 대상. 린트만으로 컨벤션 충족 판정 불가.

공통 문서 읽기·Markdown 조립·Hono 앱은 `src/app`, 인자·정적 출력·실행기 선택은 `src/entry/cli`, Vite 개발 서버 연결은 `src/entry/dev`, 정적 미리보기 설정은 `src/entry/preview`가 소유합니다. 문서 그룹과 부모 트리 계산은 `navigation` 위젯, 서버와 브라우저가 공유하는 제어 UI는 `shell-controls` 위젯이 소유합니다. `src/entry/browser`는 자료 검증·스토어 생성·root 마운트를 연결하며 위젯의 생명주기를 복제하지 않습니다. 실행 시점과 폴더 경계는 [Architecture](architecture.md#document-processing-lifetime)를 참고합니다.

### Mermaid renderer

`src/component/widget/mermaid`가 원문 마크업·브라우저 렌더·스타일 격리·수명 정리를 소유합니다.
Mermaid는 개발 의존성이며 `build:kit`이 패키지에 포함할 ESM 그래프를 생성합니다. 패키지 소비자는 Mermaid나 Chromium을 별도 설치하지 않습니다.
번들에 실제 포함한 패키지의 라이선스와 고지는 `dist/mermaid/THIRD-PARTY-NOTICES.txt`에 함께 생성합니다.
공통 앱의 `load-mermaid-assets`가 내용 지문이 붙은 진입 파일과 청크를 조회하고, Markdown 처리기가 실제 다이어그램을 발견했을 때 자원 목록에 등록합니다.
다이어그램이 하나라도 있으면 전체 모듈 그래프를 사이트 출력에 복사합니다. 브라우저에서는 펼쳐진 다이어그램이 있을 때만 진입 모듈을 `import()`하고, Mermaid 내부의 동적 import가 문법별 렌더러를 추가로 요청합니다. 진입 모듈의 정적 공유 의존성은 처음 import할 때 함께 요청되므로 청크 하나와 문법 하나가 대응하지는 않습니다. 화면 아래쪽의 펼쳐진 다이어그램도 렌더하며, 접힌 Details는 공개할 때 렌더합니다.
Vite의 Mermaid library 빌드는 ESM 형식과 동적 import 경계를 유지합니다. 파일명의 `[hash]`는 내용이 바뀔 때 URL도 바꾸며 Oxc 압축으로 전송할 코드를 줄입니다. `to-notices-plugin`은 실제 출력 청크의 모듈 목록에서 추가 라이선스와 NOTICE까지 수집합니다.
버전 갱신 때 `pnpm test:mermaid`로 공식 유형·한글·테마·실패 대체 표시를 확인하고 설치 패키지도 검증합니다.

### Repository utilities

`vite.config.ts`는 CLI·CSS, 동기 브라우저 번들, Mermaid ESM의 세 빌드 모드를 관리합니다. `tsconfig.package.json`으로 공개 타입 선언을 별도 생성합니다. 저장소 도구는 `tsx`로 실행하며 모두 `pnpm typecheck`에 포함합니다. `vitest.config.ts`는 제품 Vite 설정과 분리해 Node 테스트를 실행하며 `playwright.config.ts`는 Chromium 검사를 실행합니다. 제품과 브라우저 fixture는 같은 `to-browser-config.ts`의 Hono DOM 설정을 사용합니다. 직접 esbuild 의존성은 없으며 `tsx` 같은 도구의 전이 의존성은 남을 수 있습니다. `0.13.0`부터 개발·설치 패키지 모두 Node 22.12.0 이상이 필요합니다.

CI는 Ubuntu의 Node 22.12.0·24와 Windows의 Node 22.12.0에서 같은 단위·브라우저·설치 검사를 실행하도록 구성합니다. Windows의 npm 실행은 Node 배포본의 `npm-cli.js`를 사용하고, 재귀 파일 목록은 URL 경로와 비교하기 전에 구분자를 정규화합니다.

`smoke-package.ts`는 설치한 CLI를 `dev .`와 `preview .`로 실행하고 Chromium에서 갱신 연결·문서 수정·Mermaid·이미지를 확인합니다. 실행 전에 `pnpm exec playwright install chromium`으로 브라우저를 준비합니다.

설치 CLI의 도움말·버전도 소비 프로젝트에서 검증합니다. head 검사는 제목·설명의 텍스트 보존, 요청 간 격리, 자원 중복 제거와 CSS 순서를 포함합니다. 브라우저에서는 소스·설치 번들의 JavaScript 비활성 상태에서도 메타데이터와 첫 화면 스타일을 확인합니다.

preview의 HTTP 검사는 `test/cli/preview.integration.test.ts`에서 빌드 누락·포트 충돌·중첩 문서·원본 비공개·404·폰트 캐시를 확인합니다. Mermaid·탐색 브라우저 fixture도 CLI와 같은 Vite preview 설정을 사용하며, 설치 검사는 실제 배포 CLI에서 원본 변경 후 빌드 결과 유지·캐시·404·종료까지 확인합니다.

루트 `util/`은 저장소 개발·문서 동기화·배포 검증용. npm 패키지에는 포함하지 않음.
CSS 규칙 본문은 타입 검사하는 `util/stylelint.config.ts`에 둡니다. 루트 `stylelint.config.mjs`는 현재 cosmiconfig의 TypeScript 5 API 의존을 피하기 위한 Jiti 로더만 제공합니다.

| Script | Purpose |
| ------ | ------- |
| `sync-readme.ts` | 최상위 README를 문서 홈으로 변환 · 사이트용 링크 조정 |
| `sync-changelog.ts` | 최상위 CHANGELOG를 공식 변경 기록 문서로 생성 |
| `prepare-pages.ts` | Pages용 캐시 헤더와 404 페이지를 배포 폴더에 복사 |
| `prepare-release.ts` | 태그·버전·README·변경 기록·배포 파일 확인 · Release 본문 생성 |
| `prepare-release.test.ts` | 버전 불일치·변경 기록 누락·이전 설치 버전·필수 파일 누락 검사 |
| `smoke-package.ts` | 패키지를 별도 프로젝트에 설치 · 실제 dev·preview 브라우저와 종료, 공개 타입의 정상·오류 입력, TS·ESM 설정, 페이지·Mermaid·자원·README·크롤러 파일, 기본형·사용자 content 경로와 내부 문서 배포 제외 확인 |

`test/`의 구조와 작성 기준은 [테스트 안내](https://github.com/minu-ha/for-humanity/blob/main/test/README.md)를 따릅니다. 함수 검증은 소스 옆 `*.test.ts`, 파일 시스템을 연결하는 검사는 `test/cli/*.integration.test.ts`, 브라우저 검사는 `test/mermaid/*.spec.ts`와 `test/navigation/*.spec.ts`, 개발 서버 검사는 `test/dev/*.spec.ts`에 둡니다. 한글 시나리오·GIVEN/WHEN/THEN·독립 fixture를 사용하며, 브라우저에는 케이스 번호와 우선순위 태그를 붙입니다.

::part[Verification]

## Browser checks

Hono 브라우저 셸·탐색·커서를 변경하면 자동 브라우저 검사를 실행합니다. Playwright Chromium이 필요하며 이미 설치한 Chrome으로도 실행할 수 있습니다.

### Known Windows check issue

`0.13.0` 릴리스 검증에서 Windows Node 22.12.0의 `[NAV-010]`이 새로고침 후 커서 장식을 `visible` 대신 `hidden`으로 확인하는 간헐적 실패가 남아 있습니다. [검증 실행](https://github.com/minu-ha/for-humanity/actions/runs/38868716242)에서 브라우저 검사 47개는 통과했고 이 검사 1개가 실패했습니다. 단위 검사·린트·타입 검사·빌드·별도 프로젝트 설치 후 dev/preview 검사는 통과했습니다.

같은 변경의 macOS 브라우저 검사 48개와 Linux Node 22.12.0·24 검사는 통과했습니다. 커서 저장·복원과 포커스 이벤트 순서의 추가 확인은 후속 작업으로 남기며, 이 Windows 검사 실패를 기록한 상태로 `0.13.0` 공개를 진행합니다.

```sh
pnpm exec playwright install chromium
pnpm test:navigation
pnpm test:mermaid
pnpm test:browser

# 설치된 Chrome 사용
FH_TEST_BROWSER_CHANNEL=chrome pnpm test:navigation
FH_TEST_BROWSER_CHANNEL=chrome pnpm test:mermaid

# 한 케이스 실행 · 실패 trace와 보고서
pnpm test:mermaid --grep MRM-019
pnpm exec playwright show-report .cache/playwright/report
```

검사는 임시 문서를 빌드하고 빈 포트의 로컬 서버를 시작합니다. 넓고 좁은 데스크톱·모바일, Dark·강제 색상·JavaScript 비활성, 스크롤 저장, 외부 스크립트 없는 첫 프레임, 정확한 앵커·Details 공개, 드로어의 모달 상태·포커스와 본문 DOM 유지, 커서 입력·좌표 복원·reduced motion, Effect 해제 시 이벤트·타이머·dev 연결 정리를 확인합니다. 실행 후 임시 파일·서버·브라우저를 정리합니다. 브라우저 설치가 필요하므로 기본 `pnpm test`와 분리합니다.

- 문서 전체: `1600px` Light·Dark, `1024px`, `390px`
- 가로 넘침 · 끊긴 문서·section 링크 · 처리되지 않은 흐름도 · 콘솔 오류
- 시스템 테마 변경 반영 · TOC의 현재 section·subsection
- 데스크톱의 문서 탐색 첫 묶음 라벨·h1 글자 위쪽 시작선 · 사이트 이름은 그 위
- Architects Daughter Regular의 실제 표시 · 로컬 글꼴 선요청·캐시 · 긴 사이트 이름의 한 줄 말줄임
- 데스크톱의 사이트 이름 고정 · 이름 아래 문서 목록 스크롤 · 와이드 화면의 오른쪽 목차 끝까지 이동해도 사이트 이름 유지
- 본문이 사이드바 사이의 나머지 폭 전체 · 1920px보다 넓은 화면의 페이지 가운데 정렬 · 짧은 화면에서도 사이드바 마지막 링크와 키보드 포커스가 보이는지 확인
- 1360px 이상에서만 오른쪽 TOC · 같은 폭의 독립 스크롤 · 1360px 미만과 모바일 드로어에는 목차 없음
- 중첩 문서·소제목의 들여쓰기 · 긴 제목의 줄바꿈 · 문서 탐색과 TOC의 같은 묶음 간격·라벨 위치
- 본문·TOC 자동 번호 없음 · 직접 쓴 번호는 유지
- 문서·TOC 묶음과 On this page: 회색 11px · 문서 링크: 링크색 12px · 목차 링크: 본문 글색 12px
- 현재 문서·TOC의 공통 굵기 `600` · hover·키보드 포커스의 밑줄
- `parent` 하위 문서: 부모·자식 링크를 한 번씩 표시 · 현재 페이지만 `aria-current`와 굵기
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
- 와이드 목차: 제목 이동·강조 · 같은 hash 재클릭·Details 공개 · 단일 브라우저 번들에서 탐색 즉시 작동
- JavaScript 비활성 상태의 본문·TOC와 모바일 기본 목록
- 상대 Markdown 링크: query·hash 보존 · README 홈·참조 링크·중첩 경로
- dev: 추가·수정·삭제 · 잘못된 문서 후 정상 복구

## Packaging and release

버전 선택·공개 시점·호환성 정책의 기준은 [Releases](release-policy.md). 이 문서는 검증과 공개 작업 절차 담당.
버전별 변경 기록은 [Changelog](../public/changelog.md).
변경 기록은 최상위 `CHANGELOG.md`에 작성. npm 패키지·GitHub Release·사이트에서 같은 기록 사용.

```sh
pnpm pack
```

패키지 설치 후 별도 폴더에서 `dev`, `build`, `preview` 확인.
정적 사이트는 `<content.root>/dist` 전체 배포. 기본 경로는 `content/dist`. dev는 내부 문서를 포함하므로 배포 결과 확인은 build 후 preview로 수행. 사이트 루트 경로 기준 · [Deployment](../public/deployment.md).
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
GitHub-hosted runner, Node.js 24와 npm 12.2.0으로 배포. `0.13.0`부터 패키지 사용자의 Node.js 최소 버전은 22.12.0.
설정 기준은 [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

### Daily development

1. 작은 변경을 구현하고 필요한 검증 실행.
2. 사용자에게 영향을 주는 변경은 `CHANGELOG.md`의 `Unreleased`에 기록. 아직 npm에 없는 기능의 문서에는 미공개 상태 표시.
3. 위 검증 명령을 통과한 뒤 변경 파일만 커밋하고 `main`에 push. CI와 Pages 결과 확인.

평소 `package.json`과 README의 설치 버전 유지. `main` push는 사이트 갱신이며 npm 공개를 실행하지 않음.
CI가 실패하면 다른 작업보다 실패 원인 수정 우선. 현재 Pages Git 배포와 CI는 별도로 실행되므로 로컬 검증과 두 결과 모두 확인.

### Release steps

패키지 릴리스가 작업 범위에 포함됐을 때 실행:

1. 마지막 공개 태그 이후의 전체 변경을 검토하고 [Version policy](release-policy.md#version-policy)에 따라 버전 선택.
2. `package.json` 버전을 올리고 `CHANGELOG.md`의 `Unreleased`를 해당 버전·공개 날짜 항목으로 옮김. 이번 공개에 포함될 미공개 기록이 남지 않았는지 확인.
3. 최상위 `README.md`와 `language/README.ko.md`의 설치 버전·지원 버전 갱신. 공개하는 기능 문서의 미공개 표시 제거.
4. 검증 명령 실행. `pnpm build`가 `content/README.md`와 `content/public/changelog.md`도 동기화.
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
