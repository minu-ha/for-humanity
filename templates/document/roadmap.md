---
name: Roadmap
label: 다음 작업과 완료 기준
group: Development
order: 40
---

사람이 읽는 문서를 Markdown으로 작성하고 정적 사이트로 공유하는 문서 도구.
현재는 prototype. 이 사이트는 라이브러리 사용법·작성 가이드·API·가상 프로젝트 예시를 제공.
다음 작업은 blueprint의 전용 정보 구조와 표현.

## Overview

| Order | Stage                                     | Status  | Result                                |
|-------|-------------------------------------------|---------|---------------------------------------|
| 1     | [Foundation](#foundation)                 | Done    | 기존 샘플의 표현과 사용성             |
| 2     | [Parts and syntax](#parts-and-syntax)     | Done    | 필요한 부품과 Markdown 작성 계약      |
| 3     | [Blueprint](#blueprint)                   | Next    | 화면·결정·질문을 담는 설계 문서       |
| 4     | [Init](#init)                             | Planned | 새 문서 프로젝트의 시작 명령          |
| 5     | [Release](#release)                       | Planned | 설치 가능한 npm 패키지                |
| 6     | [Search](#search)                         | Planned | 문서·section 탐색                     |
| 7     | [Writing skill](#writing-skill)           | Planned | 검토 가능한 문서를 쓰는 에이전트 스킬 |
| 8     | [Subpath deployment](#subpath-deployment) | Planned | 하위 URL 경로의 정적 배포             |

각 단계의 체크박스는 작업 완료와 검증 후 Markdown 원본에서 갱신.
일정은 부품·문법과 배포 대상이 정해질 때 추가.

::part[Completed]

## Foundation

현재의 폭과 사이드바 배치에서 글과 링크 중심의 표현 기준 정리.
표현은 [Design](design.md), 작성 기준은 [Writing](writing.md), 검증은 [Maintenance](maintenance.md#browser-checks).

- [x] 흰 바탕·진회색 본문·파란 링크·얇은 점선
- [x] 사이트 폭 유지 · 본문·사이드바 링크 13.5px 통일
- [x] 문서 아이콘 제거 · 오른쪽 독립 TOC · 중립색과 소제목 전체 표시
- [x] 탐색·본문·TOC의 1px 열 경계 · 본문 양쪽 48px 패딩 · nav·TOC 224px · 경계 쪽 16px 여백
- [x] 작은 탭에서도 읽히는 favicon
- [x] System·Light·Dark 아이콘과 접근 가능한 테마 버튼
- [x] 공통 간격 토큰 재사용과 정적 폰트 선언
- [x] Light·Dark·모바일·목차·폰트·키보드 검증

완료 기준: `dev`, `build`, `preview`에 같은 표현이 반영되고 문서 전체에서 링크·목차·테마가 동작.

## Parts and syntax

샘플: [Blueprint](blueprint.md) · 가상 독서 목록 앱의 흐름·결정·질문·API.
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

## Blueprint

현재 `type: blueprint`는 frontmatter에서 선택 가능. 렌더링은 일반 문서와 동일.
전용 표현은 Parts and syntax 단계의 샘플과 부품을 바탕으로 결정.

- [ ] 일반 문서와 설계 문서의 정보 구조·표현 차이 확정
- [ ] 화면 설명·결정 사항·미결 질문·참조의 배치 기준 정의
- [ ] 기존 문서와 같은 방식으로 링크·TOC·hash 이동 연결
- [ ] 가상 blueprint 샘플과 일반 문서 가이드 비교
- [ ] [Writing](writing.md)에 `document`·`blueprint`의 사용 기준 반영

산출물: blueprint 표현, 가상 프로젝트 예시, 작성 가이드.
완료 기준: 한 문서에서 현재 설계·결정 이유·남은 질문을 구분해 읽을 수 있고 일반 문서도 동일하게 동작.

## Init

새 프로젝트에 문서 폴더·설정·시작 문서를 준비하는 `for-humanity init` 명령.
현재 명령은 `dev`, `build`, `preview`. `init`은 아직 미구현.

- [ ] 대상 폴더 지정과 생성할 파일 목록 확정
- [ ] 사이트 이름 입력 · 미지정 시 `for humanity`와 기본 favicon
- [ ] 설정·일반 문서·blueprint의 최소 샘플 준비
- [ ] 기존 파일과 충돌할 때의 처리 기준 구현
- [ ] 생성 직후 `dev`, `build`, `preview` 실행 확인
- [ ] [Commands](commands.md)에 명령·결과·오류 예시 반영

산출물: `init` 명령, 시작 템플릿, 사용법.
완료 기준: 별도 프로젝트의 빈 폴더에서 시작해 첫 문서를 작성하고 정적 사이트를 만들 수 있음.

## Release

프로젝트 소스 밖에서도 설치와 실행이 가능한 패키지 준비.
prototype의 첫 공개 버전은 지원 범위와 알려진 제약을 함께 고정.

- [ ] 버전·지원 Node.js·라이선스·배포 파일 확인
- [ ] `pack` 결과를 별도 폴더에 설치
- [ ] `init`, `dev`, `build`, `preview`와 폰트·favicon·클라이언트 자원 확인
- [ ] 시작 방법과 변경 기록 작성
- [ ] npm 공개와 첫 릴리스 확인

산출물: npm 패키지, 릴리스 기록, 설치 가이드.
완료 기준: 저장소를 복제하지 않은 환경에서 문서 생성·개발·빌드·미리보기가 동작.

::part[Later]

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
