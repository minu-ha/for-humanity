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
| `pnpm lint`      | Biome · Stylelint                  |
| `pnpm typecheck` | TypeScript                         |
| `pnpm build:kit` | 서버·브라우저 번들                 |
| `pnpm build`     | 패키지 번들 · 프로젝트 문서 사이트 |
| `pnpm build:pages` | 문서 사이트 · Cloudflare 배포 파일 |
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

::part[Verification]

## Browser checks

- 문서 전체: `1600px` Light·Dark, `1024px`, `390px`
- 가로 넘침 · 끊긴 문서·section 링크 · 처리되지 않은 흐름도 · 콘솔 오류
- 시스템 테마 변경 반영 · TOC의 현재 section·subsection
- 데스크톱의 문서 탐색 첫 묶음 라벨·h1 글자 위쪽 시작선 · 사이트 이름은 그 위
- Architects Daughter Regular의 실제 표시 · 로컬 글꼴 선요청·캐시 · 긴 사이트 이름의 한 줄 말줄임
- 데스크톱의 사이트 이름 고정 · 이름 아래 문서 목록 스크롤 · 공유 사이드바의 목차 끝까지 이동해도 사이트 이름 유지
- 본문 최대 폭 `900px` · 넓은 화면의 중앙 정렬 · 화면 축소 시 오른쪽 여백을 먼저 줄인 뒤 본문 축소 · 짧은 화면에서도 사이드바 마지막 링크와 키보드 포커스가 보이는지 확인
- 모든 화면에서 문서 탐색 아래 TOC · 데스크톱의 공유 사이드바 스크롤 · 모든 subsection 표시
- 1px 트리의 가지·줄기 연결 · 마지막 항목의 줄기 종료 · 중첩·긴 제목의 첫 줄 연결 · 현재 항목까지 가로 가지·세로 경로 강조 · 아래 항목과 다른 묶음은 기본 선색 유지
- 본문·TOC 자동 번호 없음 · 직접 쓴 번호는 유지 · 긴 제목 첫 줄의 트리 연결
- 현재 문서·TOC의 공통 굵기 `500` · hover·키보드 포커스의 세로 경로와 밑줄 · 탐색 종료 후 현재 경로 유지 · 하위 목차의 상위 경로 연결
- 본문 양쪽 1px 보더·32px 패딩 · 사이드바와 간격 32px · 사이드바 자체 패딩·세로 보더 없음 · 긴 제목의 줄바꿈과 컬럼 폭 유지
- 스크롤 중 본문 끝까지 양쪽 보더 유지 · 모든 데스크톱의 문서 탐색·TOC 공유 스크롤 · 작은 화면의 세로선·본문 패딩 해제
- 한국어 hash · 폰트 로드 후 위치 · 키보드 포커스
- 문서 묶음: 읽는 순서 · 모든 문서 공개 · 아이콘 없는 텍스트 · 키보드 링크 이동
- 방문한 문서의 보라색 · 현재 문서 강조 우선 · 새로고침과 뒤로 가기 후 방문색 유지
- 문서 탐색·사이트 이름 hover의 글색·굵기 유지와 밑줄 · hover 링크색의 레일 · 현재 문서의 레일 유지
- Note·Details: 기본 접힘·`{open}`·중첩 · Enter·Space · 숨은 제목의 hash 공개
- 부품 문법 오류: 제목·본문·닫힘·속성 · 파일·줄 표시
- 모바일: 첫 화면에서 본문 표시 · 스크롤 중 메뉴 버튼 유지 · 드로어 열기·닫기·Escape·배경 클릭
- 드로어: Tab 포커스 범위 · 닫기 후 버튼 복귀 · 내부 스크롤과 배경 잠금 · 1024px 전환 시 모달·포커스·잠금 정리
- 드로어 목차: 닫은 뒤 제목 포커스·강조 · 고정 헤더 아래 도착 · 같은 hash 재클릭·Details 공개
- JavaScript 비활성 상태의 본문·TOC와 모바일 기본 목록
- 상대 Markdown 링크: query·hash 보존 · README 홈·참조 링크·중첩 경로
- dev: 추가·수정·삭제 · 잘못된 문서 후 정상 복구

## Packaging and release

```sh
pnpm pack
```

패키지 설치 후 별도 폴더에서 `dev`, `build`, `preview` 확인.
정적 사이트는 문서 폴더의 `dist` 전체 배포. 사이트 루트 경로 기준 · [Deployment](deployment.md).
첫 공개 버전 `0.1.0`의 지원 범위는 `dev`, `build`, `preview`. `init`은 별도 예정 작업.

공개 전 위 검증 명령을 모두 통과하고, 패키지에 CLI·CSS·클라이언트 스크립트·폰트·favicon·라이선스가 포함되는지 확인.

```sh
npm whoami
npm publish --dry-run --access public
npm publish --access public
npm view for-humanity version
```

공개 후 npm에서 패키지를 새 프로젝트에 설치해 같은 명령을 확인. 다음 공개에는 새 버전 사용.

::part[Next]

## Roadmap

진행 순서, 단계별 산출물과 완료 기준은 [Roadmap](roadmap.md).
다음 작업은 [Blueprint](blueprint.md) 샘플을 기준으로 blueprint의 전용 정보 구조와 표현 정의.
