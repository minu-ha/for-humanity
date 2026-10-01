---
name: Maintenance
label: 기여와 유지보수
group: 개발
---

코드 변경, 컨벤션, 검증, 패키지 배포 기준.
엔진은 [Architecture](architecture.md), 표현 기준은 [Design](design.md).

## 한눈에

```sh
pnpm check
pnpm build
git diff --check
```

| Command | Scope |
| --- | --- |
| `pnpm lint` | Biome · Stylelint |
| `pnpm typecheck` | TypeScript |
| `pnpm build:kit` | 서버·브라우저 번들 |
| `pnpm build` | 킷 번들 · 프로젝트 문서 사이트 |
| `pnpm lint:fix` | 자동 린트·포맷 수정 |

::part[코드]

## 컨벤션

- 파일: kebab-case · 컴포넌트: `Pg`, `Wg`, `Ui` 레이어 접두사
- import: `@/` · 같은 폴더 CSS 부수효과 import만 `./`
- 소유자 전용 파일: `_` · `_function`, `_type`, `_constant` 역할 폴더
- 함수: 이름 붙인 `const` 화살표 · 블록 본문 · 명시적 반환
- Props: 구조분해 없이 `props.*` 접근
- 클래스: `범위_식별자__요소--수정자` · 조합은 `clsx`
- 주석: 명사구 · 목적·계약·제약 · 구현 반복 설명 제거

### 검사 범위

Biome: 포맷, import, 타입·이름·레이어 규칙.
Stylelint: CSS 클래스, 선택자, 중첩, 토큰 규칙.
`no-literal-fallback.grit`: 리터럴 기본값 `??` 검사.

의미·소유권·주석·접근성은 수동 리뷰 대상. 린트만으로 컨벤션 충족 판정 불가.

### 격자 렌더러

`src/util/mermaid/render-flow.js`: blueprint 계열과 공유한 JS 구현.
Biome 제외 이유: 기존 렌더링 알고리즘과 diff 대조.
주석은 프로젝트 문체 사용 · 실행 로직 변경 시 별도 확인.

::part[검증]

## 브라우저 확인

- 문서 전체: `1600px` 밝게·어둡게, `1024px`, `390px`
- 가로 넘침 · 끊긴 문서·절 링크 · 처리되지 않은 흐름도 · 콘솔 오류
- 테마 변경과 저장 · 목차의 읽는 절·소제목
- 한국어 hash · 글꼴 로드 후 위치 · 키보드 포커스
- JavaScript 비활성 상태의 본문·목차
- dev: 추가·수정·삭제 · 잘못된 문서 후 정상 복구

## 패키지와 배포

```sh
pnpm pack
```

패키지 설치 후 별도 폴더에서 `dev`, `build`, `preview` 확인.
정적 사이트는 문서 폴더의 `dist` 전체 배포. 사이트 루트 경로 기준.
현재 상태: prototype · npm 공개 전.

::part[다음]

## 미구현 범위

- `blueprint` 전용 문서 표현
- `for-humanity init`
- 검색
- 문서 작성용 에이전트 스킬
- 하위 URL 경로 배포 설정
