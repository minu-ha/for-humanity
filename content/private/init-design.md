---
name: Init design
label: 설치와 대화형 초기화 설계
group: Development
order: 60
---

# for-humanity 설치와 init 설계 초안

상태: 승인된 설계. 초기화 구현과 검증 대상.

## 목적

설치 사용자가 템플릿을 직접 복사하지 않고, 프로젝트 루트에서 `for-humanity init`을 실행해 문서 사이트를 시작할 수 있는 흐름.
새 문서 프로젝트와 기존 애플리케이션 저장소 모두 대상.

## 접근 방식

1. 권장: 기존 for-humanity 패키지에 init 추가. 설치한 버전의 CLI와 템플릿을 함께 사용하고 기존 프로젝트에도 적용.
2. 대안: create-for-humanity를 별도 공개해 새 프로젝트와 의존성 설치까지 한 명령으로 처리. 별도 패키지와 버전 관리 필요.

첫 구현은 1번. 기존 CLI의 Citty와 Consola에 Clack의 박스와 입력 기능을 연결.

## 사용자 흐름

패키지 설치 → init 실행 → 사이트 정보와 배포 방식 선택 → 생성할 파일 확인 → 생성 → docs:dev 실행.

초기 질문:

- 사이트 이름: 프로젝트 이름 또는 Project notes 추천값과 Custom 선택. 기존 이름이 비어 있거나 한 줄 제목으로 사용할 수 없으면 Project notes 제안.
- 문서 폴더: content / docs / Custom 선택. 기본값은 content.
- 문서 언어: 한국어(ko) / English(en) / Custom 선택. 기본값은 ko.
- 배포 방식: 나중에 설정 / GitHub Pages / Cloudflare Workers / Cloudflare Pages. 기본 선택은 나중에 설정.
- GitHub 선택 시 저장소와 배포 브랜치 확인. GitHub와 Cloudflare는 알고 있는 공개 주소를 선택 입력.

추천값에서 타이핑하면 Custom으로 이동해 같은 질문 안에서 직접 입력. Custom 행을 먼저 고른 뒤 추가 Enter 없이 입력 가능. 추천값과 직접 입력 모두 Enter 한 번으로 확정하고 다음 질문으로 이동.
저장소 정보는 로컬 Git 설정에서 제안하되 사용자가 확인. 후보가 없으면 바로 입력. 브랜치는 추천값과 main/master, Custom을 제공.
공개 주소는 GitHub 기본 주소 또는 나중에 설정을 선택하고, Custom에서 알고 있는 주소를 입력. 원격 서비스 조회 없이 실행.
대화형 입력을 사용할 수 없는 환경은 명시적인 옵션 또는 --yes로 실행. --yes의 기본 배포 방식은 none.

## 공통 생성 결과

- 프로젝트 루트의 for-humanity.config.ts.
- 선택한 문서 폴더의 README.md, public/getting-started.md, private와 asset 폴더.
- package.json의 docs:dev, docs:build, docs:preview 스크립트.
- .gitignore의 문서 빌드 출력 경로.
- npm/pnpm 감지에 맞춘 다음 실행 명령.

기존 프로젝트의 패키지 이름, type, 일반 dev/build 스크립트와 다른 의존성은 유지.
for-humanity 의존성이 없으면 실행 중인 CLI 버전을 devDependencies에 기록하고 설치 명령 안내. 이미 있으면 기존 버전 유지.
빈 프로젝트는 최소 package.json을 준비하고 필요한 설치 명령 안내. init 자체는 외부 의존성을 자동 설치하지 않음.

## 배포 방식별 결과

### GitHub Pages

- 확인한 저장소에서 url과 basePath 제안. 프로젝트 사이트와 사용자 사이트 구분.
- 실제 배포 브랜치와 문서 출력 경로를 적용한 .github/workflows/docs.yml 생성.
- npm/pnpm과 lockfile에 맞는 설치 단계 생성.
- 완료 메시지에 Settings → Pages → GitHub Actions 설정과 예상 공개 주소 안내.

### Cloudflare Workers

- `0.19.0`부터 지원, 기존 Pages 옵션 유지.
- Worker 이름은 프로젝트 이름이나 폴더에서 유효한 후보를 제안. `--worker-name`으로 지정 가능.
- `wrangler.jsonc`에 선택한 문서 루트의 `dist`, 끝 슬래시 정규화와 `404-page` 설정. 서버 진입점과 도메인 연결 미포함.
- `.cloudflare/404.html`, `_headers`, 준비 스크립트 생성. 헤더는 `dist`에 복사하고, 공통 빌드의 404가 없을 때만 오류 템플릿 복사.
- `docs:build`와 `docs:deploy`, 기존 의존성이 없을 때 Wrangler 개발 의존성 추가.
- Workers Builds에서는 빌드와 배포를 분리하고, 로컬에서는 `docs:deploy` 실행.
- 기존 Wrangler 설정과 스크립트 충돌은 쓰기 전에 중단. 기존 Wrangler 의존성 위치와 버전 보존.
- 계정 연결과 원격 배포 없이 초기화 완료. `--url`은 크롤러 주소만 지정.

### Cloudflare Pages

- 기본 basePath는 /.
- 404.html과 빌드 후 출력으로 복사할 최소 준비 파일 생성. 공통 빌드가 만든 404는 유지하고 없는 경우에만 템플릿 복사.
- docs:build에 Cloudflare 출력 준비 단계를 연결.
- Git 연동에 입력할 빌드 명령, 출력 경로, Node 버전과 선택한 패키지 매니저 설정 안내.
- 공개 주소가 확인되지 않았으면 url을 추측해 저장하지 않음.
- 계정 연결과 첫 배포는 사용자가 Cloudflare에서 수행.

### 나중에 설정

- 공통 문서 파일과 실행 스크립트 생성.
- 호스팅 파일은 생성하지 않음. 후속 배포는 Deployment 안내를 따라 설정.

## 터미널 표시

Citty는 명령과 도움말, Consola는 일반 로그와 색상 담당. @clack/prompts의 box로 안내, 질문, 확정 답변을 표시하고, @clack/core의 TextPrompt로 추천값과 직접 입력을 같은 화면에서 수집.
시작 화면은 도구 이름, 현재 버전, 브랜드 문구. 청록색 박스로 사이트 설정, 배포, 생성 전 확인의 세 단계 표시.
질문은 체크 표시 대신 박스 안에서 선택과 Custom 입력. Custom 뒤 생략 부호 없음. 위아래 방향키는 추천값과 Custom 사이 이동, 좌우 방향키와 삭제는 텍스트 편집. 입력 오류는 같은 박스 안에서 수정. 마지막 확인 전에 제목, 폴더, 언어, 호스팅, 패키지 매니저와 파일 목록을 표시.
완료는 녹색 박스, 다음 명령은 청록색 박스. docs:dev를 강조하고 build와 preview는 별도 묶음으로 안내.
기본 박스 폭은 64열, 좁은 터미널에서는 화면 폭에 맞춰 축소. 긴 질문과 한글과 경로는 줄바꿈해 보존. 12열 미만은 테두리 없이 원문을 줄바꿈. 색을 끈 터미널과 CI에서도 같은 정보와 오류 원인 제공.
Ctrl+C는 취소로 처리하고 기본 선택값으로 진행하지 않음. --yes는 기본값을 적용하고 배포를 선택하지 않으면 none.

## 파일 충돌과 취소

- 쓰기 전에 전체 생성과 변경 목록, 경로와 충돌 검사.
- 기존 문서, 설정, 워크플로와 충돌하는 스크립트는 자동 덮어쓰기 금지.
- package.json은 새 스크립트만 병합. 이미 같은 스크립트가 있으면 유지하고 다른 내용이면 충돌로 안내.
- .gitignore는 기존 내용을 유지하고 중복 없는 출력 경로만 추가.
- 설정 파일이 이미 있는 프로젝트의 재실행은 자동 재설정하지 않고 현재 설정과 배포 안내를 제공.
- 취소 또는 입력과 충돌 검사 실패 시 파일 변경 없음.
- 생성 중 쓰기 실패 시 이 실행이 만든 파일과 변경을 복구하고 오류 경로 안내. 그 뒤 다른 작업이 수정한 파일은 덮어쓰지 않고 별도 안내.

## 내부 구조

CLI 입력과 대화형 질문 → 검증된 초기화 설정 → 파일 생성 계획과 충돌 검사 → 계획 적용 → 완료 안내.
입력 수집, 생성 계획, 파일 적용과 배포별 템플릿을 구분. dev/build/preview 실행 경로는 유지.

## 검증과 문서

- CLI 도움말, 기본 실행, GitHub/Cloudflare/none 선택, 명시적 옵션과 비대화형 실행 확인.
- 취소, 잘못된 입력, 기존 설정, 문서, 스크립트, 재실행, 쓰기 실패에서 기존 파일 보존 확인.
- 실제 패키지 tarball을 설치한 별도 npm/pnpm 프로젝트에서 init → dev/build/preview 확인.
- GitHub의 저장소 하위 경로, Cloudflare 404 출력, 공개/내부 문서 분리 확인.
- Linux와 Windows 경로, pnpm test/check/build 및 git diff --check 확인.
- Installation, Commands, Deployment와 내부 Roadmap/Maintenance, CHANGELOG Unreleased 갱신.
- 설치 안내의 버전 표기와 기존 배포 안내를 현재 정책에 맞게 정리.

이번 범위는 구현과 검증. 새 npm 버전 공개와 사이트 실배포는 검증 결과를 바탕으로 별도 결정.

## 참고

- VitePress: https://vitepress.dev/guide/getting-started
- Docusaurus: https://docusaurus.io/docs/installation
- Cloudflare: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Cloudflare 404: https://developers.cloudflare.com/pages/configuration/serving-pages/
