# 테스트

제품 빌드는 Vite, Node 환경 검사는 독립 설정의 Vitest, 실제 브라우저 검사는 Playwright가 담당합니다. React 설치는 필요하지 않습니다. 브라우저 fixture는 제품과 같은 Vite 설정과 Hono JSX DOM 런타임을 사용합니다.

개발 환경은 Node 22.12 이상인 22.x 또는 Vitest가 지원하는 상위 버전을 사용합니다. CI는 Ubuntu의 Node 22.12.0·24와 Windows의 Node 22.12.0에 구성합니다. 패키지 소비자의 Node 요구 사항은 `package.json`의 `engines`를 따릅니다.

## 실행

```sh
pnpm test
pnpm test:watch
pnpm exec vitest run src/component/widget/mermaid/_function/remark-mermaid.test.ts
pnpm exec vitest run -t '홈의 다이어그램'

pnpm exec playwright install chromium
pnpm test:browser
pnpm test:mermaid
pnpm test:mermaid --grep MRM-019
pnpm test:mermaid --grep @high
FH_TEST_BROWSER_CHANNEL=chrome pnpm test:mermaid

pnpm exec playwright show-report .cache/playwright/report
pnpm exec playwright show-trace .cache/playwright/results/<case>/trace.zip
```

`pnpm test:mermaid`와 `pnpm test:browser`는 최신 제품 번들을 먼저 생성합니다. CI는 앞 단계에서 빌드한 뒤 `pnpm exec playwright test`로 같은 검사를 실행합니다. 실패하면 `.cache/playwright/`에 trace·스크린샷·HTML 보고서를 남깁니다. 재시도로 실패를 숨기지 않습니다.

탐색 검사는 `pnpm test:navigation`으로 따로 실행할 수 있으며 `pnpm test:browser`에도 포함합니다. 탐색도 같은 Playwright fixture와 실패 보고서를 사용합니다.

개발 서버 검사는 `pnpm build:kit` 이후 `pnpm exec playwright test test/dev`로 실행합니다. 임시 문서 루트를 사용하며 소스 변경 검사는 격리한 복사본에서 실행합니다.

## 위치와 책임

| 위치 | 실행기 | 책임 |
| --- | --- | --- |
| `src/**/*.test.ts` | Vitest · Node | 소유 함수·자료 변환·상태·자원 조회 |
| `test/cli/*.integration.test.ts` | Vitest · Node | 실제 파일과 Markdown 처리기를 연결한 문서 조립 |
| `util/*.test.ts` | Vitest · Node | 저장소 릴리스 도구의 입출력 |
| `test/mermaid/*.e2e.spec.ts` | Playwright | 실제 CLI 출력의 문법·지연 수신·모바일·앵커·실패 대체 표시 |
| `test/mermaid/*.integration.spec.ts` | Playwright | Hono 위젯의 테마·툴팁·접힘·마운트와 해제 |
| `test/navigation/*.e2e.spec.ts` | Playwright | 화면별 배치·스크롤 복원·앵커·키보드·저장소 실패 |
| `test/navigation/*.integration.spec.ts` | Playwright | 셸의 구독·타이머 정리 |
| `test/dev/*.e2e.spec.ts` | Playwright | Vite의 문서·스니펫·자원 갱신, 소스 TSX·CSS 반영, 오류 복구·종료 |
| `test/_fixture/` | 공통 준비 | 임시 루트·로컬 서버·케이스별 실행 자료 |
| `test/mermaid/_gallery/` | 브라우저 전용 | 공개 번들 밖의 위젯 마운트·해제 |
| `test/mermaid/_constant/` | 입력 자료 | 공식 문법별 원문과 기대 라벨 |

함수 검증과 브라우저 검증의 같은 조건을 중복 작성하지 않습니다. 예를 들어 HTML 이스케이프는 변환 검사에서, 스크립트 비활성 상태의 가독성은 실제 브라우저에서 확인합니다. jsdom으로 SVG 배치·폰트·Shadow DOM·시스템 테마를 대신 판정하지 않습니다.

Vitest는 `vitest.config.ts`에서 `@/`와 `@test/` 별칭을 설정합니다. Playwright는 `tsconfig.json`의 같은 별칭을 읽습니다. 브라우저 fixture는 워커마다 임시 사이트를 만들고 빈 포트로 서버를 시작하며, 각 테스트에는 새 브라우저 컨텍스트를 제공합니다. 성공과 실패에 관계없이 fixture가 임시 파일과 서버를 정리합니다.

## 작성

새 테스트는 `workspace/sk-ax-gas-pp/test/README.md`에서 사용하는 한글 시나리오와 GIVEN·WHEN·THEN 기준을 따릅니다. 앱 전용 라우트 번호·인증·MSW·Vite gallery는 가져오지 않습니다. 기존 검사는 Vitest API로 전환하면서 기존 입력과 판정을 유지합니다.

- 파일명은 영어, `describe`와 테스트 제목은 한국어
- 제목은 조건과 관찰 가능한 결과 한 문장
- 본문은 `/**` 블록의 GIVEN·WHEN·THEN과 한국어 명사구 설명
- GIVEN은 테스트 안에서 만든 상태나 입력이 있을 때만 사용
- 함수 검사는 WHEN에서 결과를 이름 붙인 값에 저장하고 THEN에서 `expect`로 비교
- 값은 `toBe`, 구조는 `toStrictEqual`로 비교
- 브라우저 제목은 `[MRM-001]`·`[NAV-001]`·`[DEV-001]` 형식의 고유 번호, `@high`·`@mid`·`@low` 중 하나 필수
- 실패 조건은 같은 흐름 안에서 `@negative` 태그 추가
- 여러 동작과 검증이 필요하면 시나리오별 `test.step`으로 구분
- role·정확한 접근성 이름을 우선하고, SVG·그림 영역은 CSS와 `data-mermaid-*` 계약으로 조회
- 렌더 완료는 `toHaveCount`·`toHaveAttribute` 등 자동 재시도 단언으로 확인
- 치수·계산값은 필요한 경우에만 `expect.poll` 사용
- 고정 시간 대기·외부 CDN·개인 문서·실행 중인 개발 서버에 의존하지 않음
- 스크린샷은 실패 조사 자료이며 승인된 기준 이미지 없이 시각 회귀 검사로 간주하지 않음

`@high`는 문법 렌더·조건부 모듈 수신·원문 대체 표시·수명 정리처럼 배포에 필요한 계약입니다. `@mid`는 모바일 폭·툴팁 등 주요 표현과 상호작용입니다. CI는 현재 모든 케이스를 실행합니다.

```ts
test('[MRM-010] 접힌 다이어그램을 열면 모듈을 요청하고 표시한다', {tag: '@high'}, async ({page}) => {
    /**
     * GIVEN
     * 접힌 다이어그램만 있는 문서
     */
    await page.goto('/hidden/');

    /**
     * WHEN
     * 접힌 다이어그램 공개
     */
    await page.getByText('Hidden diagram', {exact: true}).click();

    /**
     * THEN
     * 공개한 다이어그램 표시
     */
    await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(1);
});
```
