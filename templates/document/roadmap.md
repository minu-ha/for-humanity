---
name: Roadmap
label: 다음 작업과 완료 기준
group: Development
order: 40
---

사람이 읽는 문서를 Markdown으로 작성하고 정적 사이트로 공유하는 문서 도구.
현재는 prototype. 이 사이트는 라이브러리 사용법·작성 가이드·API·가상 프로젝트 예시를 제공.
첫 npm 패키지 `0.1.0` 공개와 별도 프로젝트 설치 검증을 완료. 다음 구현 방향은 일반 Markdown을 보완하는 시각화·테마 모듈과 목적별 작성 견본.

## Overview

| Order | Stage                                     | Status  | Result                                |
|-------|-------------------------------------------|---------|---------------------------------------|
| 1     | [Foundation](#foundation)                 | Done    | 기존 샘플의 표현과 사용성             |
| 2     | [Parts and syntax](#parts-and-syntax)     | Done    | 필요한 부품과 Markdown 작성 계약      |
| 3     | [Visualization modules](#visualization-modules) | Next | 읽기 목적에 맞는 그림·비교·참조와 테마 |
| 4     | [Init](#init)                             | Planned | 새 문서 프로젝트의 시작 명령          |
| 5     | [Release](#release)                       | Done    | npm 패키지 공개와 설치 검증 완료       |
| 6     | [Search](#search)                         | Planned | 문서·section 탐색                     |
| 7     | [Writing skill](#writing-skill)           | Planned | 검토 가능한 문서를 쓰는 에이전트 스킬 |
| 8     | [Subpath deployment](#subpath-deployment) | Planned | 하위 URL 경로의 정적 배포             |
| 9     | [Vite integration](#vite-integration) | Done | 패키지 빌드·사용자 dev·preview 통합 |
| 10    | [Server features](#server-features) | Planned | API·인증·사용자 저장소 연결 |

각 단계의 체크박스는 작업 완료와 검증 후 Markdown 원본에서 갱신.
일정은 부품·문법과 배포 대상이 정해질 때 추가.

::part[Completed]

## Foundation

현재의 폭과 사이드바 배치에서 글과 링크 중심의 표현 기준 정리.
표현은 [Design](design.md), 작성 기준은 [Writing](writing.md), 검증은 [Maintenance](maintenance.md#browser-checks).

- [x] 흰 바탕·진회색 본문·파란 링크·얇은 점선
- [x] 사이트 폭 유지 · 본문·사이드바 링크 12px 통일
- [x] 문서 아이콘 제거 · 문서 탐색 아래 TOC · 중립색 1px 중첩 트리 · 자동 번호 없는 제목·첫 줄의 가지 연결·활성 경로 강조 · 소제목 전체 표시
- [x] 넓은 화면의 본문 중앙 정렬·축소 시 오른쪽 여백 우선 해제·양쪽 1px 보더·32px 패딩 · 사이드바 200px · 열 간격 32px · 사이드바 자체 패딩 제거
- [x] 문서 탐색 첫 묶음·본문의 시작선 정렬 · 모든 데스크톱의 문서 탐색 아래 TOC·공유 스크롤
- [x] Architects Daughter 사이트 이름 · 데스크톱의 고정 사이트 이름과 목록 스크롤
- [x] 방문한 문서의 보라색 · 현재 문서 강조 · 문서 탐색·사이트 이름 hover의 밑줄 · 가로 가지와 세로 경로의 hover·키보드 포커스 강조
- [x] 현재 문서·TOC의 공통 active 굵기 `500`
- [x] 모바일 고정 헤더·문서 탐색 드로어 · 목차 선택 후 제목 이동 · 글자 시작선 정렬
- [x] 작은 탭에서도 읽히는 favicon
- [x] 시스템 설정을 따르는 밝게·어둡게 테마 · 본문 최대 폭 900px
- [x] 공통 간격 토큰 재사용과 정적 폰트 선언
- [x] Light·Dark·모바일·목차·폰트·키보드 검증

완료 기준: `dev`, `build`, `preview`에 같은 표현이 반영되고 문서 전체에서 링크·목차·테마가 동작.

## Parts and syntax

샘플: [Design example](blueprint.md) · 가상 독서 목록 앱의 흐름·결정·질문·API.
선정: [Note·Details](parts.md). Decision·Question·API reference는 section·표·링크.

- [x] 본문·표·흐름도로 표현되는 부분과 새 부품이 필요한 부분 확인
- [x] 부품별 목적·입력·허용 중첩·기본값 정의
- [x] Markdown 작성 예와 렌더링 결과를 나란히 정리
- [x] 지원하지 않는 입력과 잘못된 문법의 오류 기준 정의
- [x] 선택한 부품의 HTML·CSS·접근성 구현
- [x] [Writing](writing.md)에 실제 지원 문법과 예시 반영

산출물: 가상 프로젝트 예시, 부품 목록, 작성 문법, 렌더링 결과.
완료 기준: 작성자가 소스를 보지 않고 예시만으로 같은 결과를 만들 수 있고, 두 테마·좁은 화면에서 내용이 읽힘.

::part[Next]

## Vite integration

저장소 개발과 설치 패키지의 `for-humanity dev`·`preview`까지 Vite로 통합했습니다. 아직 npm에는 공개하지 않았습니다. 설계 기준은 [Runtime direction](architecture.md#runtime-direction).
Vite를 런타임 의존성에 포함하고 Node 최소 버전을 22.12.0으로 올리는 변경을 허용합니다. 공개 버전은 릴리스 준비 때 결정합니다.

1. 설계 문서: 개발·운영 역할, 정적 생성 범위, 향후 DB·인증 책임 기록
2. 패키지 빌드: `vite.config.ts`의 서버·브라우저·Mermaid 빌드와 `tsc` 선언 생성으로 `script/build-kit.ts` 대체. 브라우저 fixture의 esbuild 호출도 전환
3. 개발 서버: CLI 밖의 Hono 앱과 문서 준비 단계 분리. Vite watcher·갱신 통신으로 파일 감시·SSE 대체. 저장소 소스와 설치 번들의 개발 경로 검증
4. 배포 계약: 설치 패키지의 dev·build·preview, 공개 설정 타입, Node 최소 버전, Windows CI, 문서·변경 기록 검증

- [x] 개발·운영 구조와 향후 API·검색·로그인·DB 책임 문서화
- [x] Vite 패키지 빌드와 실제 포함 모듈의 라이선스 고지 검증
- [x] 직접 esbuild 의존성과 브라우저 fixture의 별도 빌드 설정 제거
- [x] 공통 Hono 앱과 CLI·Vite 진입점 분리
- [x] Vite 개발 서버·문서 감시·갱신 통신 통합
- [x] 문서·README·이미지·스니펫 추가·수정·삭제와 실패 후 복구 검증
- [x] 저장소 TSX·CSS 변경 반영과 개발 서버 종료 시 자원 정리 검증
- [x] 첫 화면의 동기 브라우저 초기화·Mermaid 지연 수신·로컬 자원 출력 유지
- [x] 설치 패키지·공개 타입·Node 최소 버전 검증과 Windows CI 구성
- [x] 정적 preview를 Vite로 통합, 사이트 출력 경로·404·캐시·설치 CLI 검증

Node 22.12.0과 24.3.0에서 설치 패키지의 공개 타입·build·dev·preview와 실제 브라우저 갱신을 검증했습니다. Windows 검증은 CI에 구성했으며 첫 원격 실행 결과는 아직 확인하지 않았습니다.

공개 전 남은 작업:

- [ ] Ubuntu·Windows CI의 단위·브라우저·설치 검사 원격 실행 결과 확인
- [ ] 마지막 공개 이후 전체 변경을 기준으로 버전 결정, Node 지원 범위와 설치 안내·변경 기록·태그 일치 확인
- [ ] 패키지 릴리스 요청 시 npm·GitHub Release 공개와 공개 패키지 설치 검증

검색·로그인·DB 연결은 이 전환의 미완료 작업에 포함하지 않으며 아래 후속 단계에서 별도로 설계합니다. 코드·문서 개선과 로컬 검증만 진행한 상태에서는 버전·태그·공개 기록을 변경하지 않습니다.

각 단계는 `pnpm test`, `pnpm check`, `pnpm build`, `git diff --check` 통과 후 별도 커밋으로 남깁니다. 번들·브라우저·개발 서버 변경 단계에서는 관련 Playwright 검사와 설치 패키지 검사도 실행합니다.
완료 기준: 기존 정적 출력 계약을 유지하면서 저장소·설치 패키지의 개발과 정적 미리보기가 Vite로 실행되고, 별도 파일 감시·SSE·esbuild 실행 코드와 Hono 정적 미리보기 서버가 제거된 상태.

## Visualization modules

설계·메모·참조·조사는 같은 Markdown 렌더러를 사용합니다. 별도 Blueprint 문서 타입을 추가하지 않습니다.
일반 Markdown으로 충분한 내용과 시각화가 필요한 내용을 구분하며 작은 모듈부터 검증합니다.

- [x] 로컬 그림·첨부의 파일 기준 경로·dev·정적 빌드 전달
- [x] 목적별 [작성 기준](authoring.md)과 가상 설계·조사 견본
- [ ] 그림의 캡션·출처·접근성 계약과 편집 가능한 주석 검토
- [ ] 긴 값의 정의 목록·비교·단계·카드의 실제 필요 확인과 작은 문법 설계
- [ ] 명시적 ID·참조의 검증과 많은 하위 문서의 탐색 개선
- [ ] 의미 토큰에 기반한 테마·사용자 모듈의 공개 입력 계약

질문 대화상자·역참조·의존성 자동 집계는 데이터 모델이 필요한 별도 후보입니다.
제품 전용 UI·차트·실행형 데모를 기본 기능으로 자동 이식하지 않습니다.
완료 기준: 모듈별 사용 이유·문법·오류와 두 테마·좁은 화면·키보드의 읽기 결과를 Guide에서 확인할 수 있음.

## Init

새 프로젝트에 문서 폴더·설정·시작 문서를 준비하는 `for-humanity init` 명령.
현재 명령은 `dev`, `build`, `preview`. `init`은 아직 미구현.

명령 등록·도움말은 Citty, 로그와 향후 대화형 입력은 Consola를 사용합니다. 미공개 변경에 기존 세 명령의 Citty 전환과 공통 로그를 반영했습니다.

- [ ] 대상 폴더 지정과 생성할 파일 목록 확정
- [ ] 사이트 이름 입력 · 미지정 시 `for humanity`와 기본 favicon
- [ ] 설정·일반 문서·목적별 최소 견본 준비
- [ ] 기존 파일과 충돌할 때의 처리 기준 구현
- [ ] 생성 직후 `dev`, `build`, `preview` 실행 확인
- [ ] [Commands](commands.md)에 명령·결과·오류 예시 반영

산출물: `init` 명령, 시작 템플릿, 사용법.
완료 기준: 별도 프로젝트의 빈 폴더에서 시작해 첫 문서를 작성하고 정적 사이트를 만들 수 있음.

## Release

프로젝트 소스 밖에서도 설치와 실행이 가능한 패키지 준비.
prototype의 첫 버전 `0.1.0`은 `dev`, `build`, `preview`를 지원. `init`은 별도 예정 작업이며 첫 공개의 필수 조건에서 분리.
공개 패키지: [for-humanity@0.1.0](https://www.npmjs.com/package/for-humanity/v/0.1.0).
이후 공식 공개 버전은 [Releases](releases.md), 변경 사항은 [Changelog](changelog.md)에서 확인.

- [x] 버전·지원 Node.js·라이선스·배포 파일 확인
- [x] `pack` 결과를 별도 폴더에 설치
- [x] `dev`, `build`, `preview`와 폰트·favicon·클라이언트 자원 확인
- [x] 시작 방법과 변경 기록 작성
- [x] npm 공개와 첫 릴리스 확인

산출물: npm 패키지, 릴리스 기록, 설치 가이드.
완료 기준: npm에 공개한 패키지를 저장소를 복제하지 않은 환경에 설치하고, 작성한 문서의 개발·빌드·미리보기가 동작.

::part[Later]

## Server features

검색·로그인·사용자별 데이터가 필요한 프로젝트를 위한 선택적 확장. 현재 패키지는 공개 정적 문서 도구이며 운영 API·인증·DB 어댑터는 아직 제공하지 않습니다.

- [ ] 공개 검색과 권한별 검색의 데이터·응답 계약 구분
- [ ] 로그인·세션·권한의 요구사항과 인증 서비스 연결 방식 결정
- [ ] 첫 지원 저장소 선정과 연결 설정·어댑터 타입·스키마·마이그레이션 계약 제공
- [ ] 기존 사내 API를 쓰는 경우의 서버 어댑터 범위 결정
- [ ] 문서 URL과 충돌하지 않는 API 경로·요청·응답·오류 명세 제공
- [ ] 공통 Hono 앱의 운영 진입점과 배포 플랫폼 검증
- [ ] 개발 명령 하나로 문서·API를 같은 포트에서 실행, API 변경 반영과 종료 시 연결 정리 검증
- [ ] 개발용 DB 연결·로컬 실행 안내와 플랫폼 전용 기능의 개발 환경 검증
- [ ] 비공개 문서·첨부·검색 인덱스의 권한 검사와 정적 출력 제외 검증

사용자가 DB·인증 서비스·배포 환경을 소유하고 운영합니다. 패키지의 HTTP API 명세와 서버 내부의 저장소 연결 계약은 별개입니다. 공개 정적 문서 사용자는 DB를 설치하지 않아도 됩니다.
개발·미리보기·운영의 실행 방식과 플랫폼별 책임은 [Development, preview and production](architecture.md#development-preview-and-production). 운영 배포에는 `dev`나 `preview` 대신 지원 플랫폼의 Hono 실행 진입점을 사용합니다.
완료 기준: 지원하는 환경에 패키지를 설치하고 사용자 소유 서비스에 연결한 뒤, 인증·권한·저장·검색을 실제 요청으로 검증할 수 있음.

## Search

문서가 늘어났을 때 제목·section·본문에서 필요한 내용을 찾는 기능.
정적 배포 환경에서 사용하는 검색 인덱스와 브라우저 동작 검토.

- [ ] 검색 대상·결과 항목·한국어와 코드 식별자의 검색 기준 정의
- [ ] 빌드 시 인덱스 생성과 브라우저 검색 구현
- [ ] 검색 결과의 문서·section 링크 연결
- [ ] 키보드 이동·빈 결과·좁은 화면 확인
- [ ] 문서 규모별 인덱스 크기와 응답 시간 측정

완료 기준: 실제 문서 모음에서 원하는 section으로 이동할 수 있고 검색 결과와 hash가 일치.

## Writing skill

확정된 작성 문법으로 일반 문서와 설계 문서를 만드는 에이전트 스킬.
문법·표현·완료 기준이 안정된 뒤 작성 가이드와 함께 관리.

- [ ] 언제 일반 문서·blueprint를 쓸지와 필요한 입력 정의
- [ ] 한국어 본문·영어 용어·사실과 미결 사항의 작성 규칙 반영
- [ ] 실제 문서 생성·수정 사례로 결과 검토
- [ ] frontmatter·링크·부품 문법의 검증 절차 반영
- [ ] [Writing](writing.md)과 스킬 규칙의 변경 기준 연결

완료 기준: 생성된 문서가 빌드되고, 사람이 사실·결정·미결 사항을 확인할 수 있음.

## Subpath deployment

현재 정적 사이트는 루트 URL 기준.
`/docs/` 같은 하위 경로의 배포가 필요할 때 base path 설정 추가.

- [ ] base path의 설정 형식·기본값·정규화 기준 정의
- [ ] 문서 링크·자원·폰트·favicon의 URL을 같은 기준으로 생성
- [ ] 루트와 하위 경로에서 직접 접속·새로고침·hash 이동 확인
- [ ] [Settings](settings.md)와 [Commands](commands.md)에 배포 예시 반영

완료 기준: 동일한 문서가 루트와 하위 경로의 정적 서버에서 모든 자원을 포함해 동작.

::part[Workflow]

## Progress

1. `Next` 단계의 실제 샘플과 범위 확정
2. 작성 계약·표현·오류 기준 기록
3. 구현 후 [Maintenance](maintenance.md#browser-checks)의 검증 수행
4. 체크박스와 상태 갱신 · 다음 단계 지정

새 요청은 영향을 받는 단계에 추가. 다음 단계의 구현은 현재 단계의 완료 기준을 충족한 뒤 시작.
