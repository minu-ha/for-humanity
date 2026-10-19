---
name: Content layout
label: 문서 공개 범위와 프로젝트 설정 전환 계약
group: Development
---

# Content layout

프로젝트 루트 설정과 `content/{public,private,asset}` 기본 구조. 설정으로 경로 변경 가능.
`dev`는 전체 문서, `build`와 `preview`는 공개 결과. `private`는 배포 제외이며 저장소 접근 제어가 아니다.

## Contracts

- CLI 위치 인자는 프로젝트 루트. 생략 시 현재 폴더. 설정 파일은 프로젝트 루트의 `.ts` 또는 `.mjs` 하나.
- `content.root` 기본 `content`, `content.public` 기본 `public`, `content.private` 기본 `private`.
- 공개 폴더 필수, 내부 폴더 선택. 경로 중첩, 루트 이탈, 출력 폴더 중첩과 symlink 우회 거부.
- 홈은 문서 루트의 README.md. 공개 문서는 공개 폴더 상대 URL, 내부 문서는 `/private/` URL.
- 공개 빌드에서 내부 문서의 렌더, 탐색, 사이트맵, 이미지와 스니펫 수집 제외.
- 공개 문서와 홈의 내부 파일 참조는 원본 위치를 포함한 오류. 내부 문서에서 공개 자료 참조 가능.
- 기본형은 `template/`에 보관, 향후 init에서 재사용. 실제 init 명령 추가는 범위 밖.
- 공개 버전과 태그 유지. 변경은 Unreleased에 기록하고 마이그레이션 안내 제공.

## Implementation plan

### 1. Configuration contract

- [x] `src/type/site-config.ts`에 content 입력과 기본값 추가.
- [x] `src/type/content-config.ts`에서 상대 경로와 중첩 검증.
- [x] 설정 테스트에서 기본값, 사용자 경로, 잘못된 경로의 실패 확인 후 구현.
- [x] `pnpm test`, `pnpm check`, `pnpm build`, `git diff --check` 후 커밋.

### 2. Collection and repository migration

- [x] `load-site`, `read-docs`, 링크/자원/스니펫 처리에 공개 범위 전달.
- [x] CLI와 개발 진입점에 프로젝트 설정과 content 루트 적용.
- [x] 실제 CLI 테스트에서 공개 출력 제외, 로컬 내부 문서, 잘못된 참조와 사용자 경로 검증.
- [x] `templates/document`를 content로 이전, 설정을 루트로 이전. 기존 공개 URL 유지.
- [x] 빌드, 동기화, 배포와 문서 링크 경로 갱신.
- [x] 필수 검증 후 커밋.

### 3. Consumer workflow

- [x] 기본형, 한영 README, 설정/CLI/이전 안내와 Unreleased 갱신.
- [x] 설치 패키지 테스트에서 기본 및 사용자 경로, 타입, dev와 preview 확인.
- [x] 브라우저 검사와 패키지 smoke 검사, 필수 검증 후 커밋.

## Verification

공개 결과의 파일 목록과 HTML/사이트맵/탐색 데이터에서 내부 표식 부재 확인.
내부 이미지와 스니펫의 직접 참조 및 symlink 우회 실패 확인.
설정 이름 변경, `.mjs`, 공개 URL 유지, parent 관계와 이미지 링크, dev 갱신과 preview 직접 접속 검증.


### Completed checks

- 단위·CLI 통합 검사: 24개 파일, 166개 검사 통과 (`pnpm test --maxWorkers=2`). 제한 없는 병렬 실행에서 기존 코드 강조 검사의 시간제한을 확인하여 워커 수를 제한.
- `pnpm check`, `pnpm build:pages`, `git diff --check` 통과. 공개 출력 18개 HTML 페이지와 크롤러 파일 2개, 내부 페이지·사이트맵 경로 제외.
- Playwright: 49개 검사 통과. 이 결과는 macOS 로컬 환경이며 Windows의 기존 간헐적 검사 이력을 대체하지 않음.
- 설치 패키지: dev·preview 실제 브라우저, 공개 설정 타입, TS·ESM 설정, 자원·Mermaid·탐색·크롤러 파일, 기본형과 사용자 경로 빌드 통과.
- 저장소 dev: maintenance·architecture·design·content-layout 페이지와 내부 사이트맵 확인.
- 읽기 전용 코드 리뷰의 content-root symlink 지적 수정. 예약 폴더 세 경로의 실패 재현 후 회귀 검사 통과.
- 다음 사이트 배포 전에 호스팅 출력 경로를 `content/dist`로 변경. 구조 전환 커밋에서는 npm 버전 `0.13.1` 유지. 릴리스 준비 시 전체 변경에 맞는 버전 선택.
