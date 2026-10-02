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
- 데스크톱의 문서 탐색 첫 묶음·본문·오른쪽 TOC 시작선 · 사이트 이름은 그 위
- Architects Daughter Regular의 실제 표시 · 로컬 글꼴 선요청·캐시 · 긴 사이트 이름의 한 줄 말줄임
- 데스크톱의 사이트 이름 고정 · 이름 아래 문서 목록 스크롤 · 공유 사이드바의 목차 끝까지 이동해도 사이트 이름 유지
- 본문 최대 폭 `900px` · 짧은 화면에서도 사이드바 마지막 링크와 키보드 포커스가 보이는지 확인
- `1440px` 이상 오른쪽 TOC · `1024px` 이상·`1440px` 미만 왼쪽 문서 탐색 아래 TOC · 모든 subsection 표시
- 레일 없는 TOC · 번호와 라벨의 시작선 정렬 · 현재 절·소제목의 번호와 제목 강조
- TOC 번호·제목의 첫 줄 정렬 · 긴 제목의 줄바꿈과 번호 위치 유지
- 현재 문서·TOC의 공통 굵기 `500` · 하단 아이콘의 중립색·hover·키보드 포커스
- 본문 양쪽의 1px 열 경계·32px 패딩 · 탐색 영역의 경계 쪽 12px 여백 · 긴 제목의 줄바꿈과 컬럼 폭 유지
- 스크롤 중 화면 높이의 선 유지 · 좁은 데스크톱의 문서 탐색·TOC 공유 스크롤 · 작은 화면의 세로선·본문 패딩 해제
- 한국어 hash · 폰트 로드 후 위치 · 키보드 포커스
- 문서 묶음: 읽는 순서 · 모든 문서 공개 · 아이콘 없는 텍스트 · 키보드 링크 이동
- 방문한 문서의 보라색 · 현재 문서 강조 우선 · 새로고침과 뒤로 가기 후 방문색 유지
- 문서 탐색·사이트 이름 hover의 글색·굵기 유지와 밑줄 · hover 링크색의 레일 · 현재 문서의 레일 유지
- Note·Details: 기본 접힘·`{open}`·중첩 · Enter·Space · 숨은 제목의 hash 공개
- 부품 문법 오류: 제목·본문·닫힘·속성 · 파일·줄 표시
- JavaScript 비활성 상태의 본문·TOC
- dev: 추가·수정·삭제 · 잘못된 문서 후 정상 복구

## Packaging and release

```sh
pnpm pack
```

패키지 설치 후 별도 폴더에서 `dev`, `build`, `preview` 확인.
정적 사이트는 문서 폴더의 `dist` 전체 배포. 사이트 루트 경로 기준 · [Deployment](deployment.md).
현재 상태: prototype · npm 공개 전.

::part[Next]

## Roadmap

진행 순서, 단계별 산출물과 완료 기준은 [Roadmap](roadmap.md).
다음 작업은 [Blueprint](blueprint.md) 샘플을 기준으로 blueprint의 전용 정보 구조와 표현 정의.
