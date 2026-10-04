# Commit rules

- 커밋 제목은 영어 동사로 시작하고 변경 내용을 간단히 설명한다.
- AI 도움을 받은 커밋은 제목 끝에 ` | aa`를 붙인다. `aa`는 AI assistance를 받은 작업이라는 표시다.
- 예: `Update favicon and add cursor face | aa`
- 커밋 전 `pnpm test`, `pnpm check`, `pnpm build`, `git diff --check`를 실행하고 요청 범위의 파일만 포함한다.

# Release rules

- 버전·호환성·공개 시점은 [Releases](templates/document/releases.md), 검증·배포 절차는 [Maintenance](templates/document/maintenance.md#packaging-and-release)를 따른다. 버전 정책은 Releases에서 관리한다.
- 검증한 작은 변경을 `main`에 반영한다. `main` push에 따른 사이트 배포만으로 `package.json`이나 README의 설치 버전을 올리지 않는다.
- 커밋·push·사이트 배포만 요청된 작업에서는 릴리스 태그와 npm 공개를 자동으로 추가하지 않는다. 패키지 릴리스가 요청되거나 기존에 합의한 작업 범위에 포함됐을 때 공개 절차를 수행한다.
- 사용자에게 영향을 주는 변경은 `CHANGELOG.md`의 `Unreleased`에 모은다. 공개한 버전의 기록에 새 작업을 추가하지 않는다.
- 패키지 릴리스 준비 시 마지막 공개 이후 전체 변경으로 버전을 한 번 결정하고, 미공개 기록·README·태그를 같은 버전으로 맞춘다.
- 공개한 버전과 태그는 유지한다. 완료 보고에서 사이트 배포와 npm·GitHub Release 결과를 구분한다.
