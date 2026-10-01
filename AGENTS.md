# Commit rules

- 커밋 제목은 영어 동사로 시작하고 변경 내용을 간단히 설명한다.
- AI 도움을 받은 커밋은 제목 끝에 ` | aa`를 붙인다. `aa`는 AI assistance를 받은 작업이라는 표시다.
- 예: `Update favicon and add cursor face | aa`
- 커밋 전 `pnpm test`, `pnpm check`, `pnpm build`, `git diff --check`를 실행하고 요청 범위의 파일만 포함한다.
