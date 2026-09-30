<div align="center">

# for-humanity

**사람이 읽는 문서를 위한 문서 킷**

Markdown 폴더 하나를 사이드바, 절 번호, 흐름도가 있는 정적 사이트로 만든다.

[![License: MIT](https://img.shields.io/badge/license-MIT-2e3f5e)](LICENSE)
![Node 22+](https://img.shields.io/badge/node-22%2B-2e3f5e)
![Astro 7](https://img.shields.io/badge/engine-Astro%207-2e3f5e)
![Biome](https://img.shields.io/badge/lint-Biome-2e3f5e)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400)

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/readme/commands-dark.png">
  <img src=".github/readme/commands-light.png" width="100%" alt="예시 문서 Lantern의 Commands 쪽. 왼쪽 사이드바에 문서 목록과 가름마다 끊긴 목차가 있고, 본문에 절 번호, 표, 흐름도, 확인 알약이 보인다">
</picture>

</div>

<br>

## 왜

요즘 문서는 AI가 Markdown으로 쓰고 AI가 읽는다. 그래도 읽고 판단하는 쪽은 결국 사람이다.
for-humanity는 같은 Markdown을 사람이 읽기 좋은 모양으로 보여 준다. 쓰는 사람은 글만 쓰고, 모양은 킷이 맡는다.

## 무엇이 되나

| 무엇                       | 어떻게                                                                                 |
|----------------------------|----------------------------------------------------------------------------------------|
| **사이드바**               | 문서 목록과 이 문서의 목차가 있다. 목차는 가름마다 끊기고, 지금 읽는 절이 켜진다       |
| **절 번호**                | 00, 01, 01.A를 빌드가 매긴다. 절을 옮겨도 번호를 손으로 고치지 않는다                  |
| **가름**                   | `::part[이름]` 한 줄로 여러 절을 한 묶음으로 가른다                                    |
| **흐름도**                 | ```` ```mermaid ````를 beautiful-mermaid 격자 모양 SVG로 빌드 때 그린다                |
| **알약 · 색 칩 · 표 상자** | 확인 표시는 알약, `#e80030`은 색 칩, 넓은 표는 가로로 미는 상자가 된다                 |
| **테마**                   | 시스템 · 밝게 · 어둡게. JS가 꺼져 있어도 다 보인다                                     |
| **빌드 검사**              | 머리말이 틀리거나, 모르는 부품을 쓰거나, 두 문서 이름의 첫 글자가 겹치면 빌드가 멈춘다 |

## 해 보기

```sh
pnpm install
pnpm dev      # templates/document 를 http://localhost:4321 에 띄운다
pnpm build    # templates/document/dist 에 정적 사이트를 만든다
```

`templates/document`는 가상의 로그 검색 도구 **Lantern**의 문서다. 내용은 모두 지어낸 것이다.

## 문서 폴더

문서 폴더에는 Markdown과 설정 파일 하나만 둔다. 쪽, 레이아웃, 스타일은 전부 킷에 있다.
폴더 맨 위의 `README.md`는 문서로 치지 않는다.

```text
docs/
├── for-humanity.config.mjs    설정 (없어도 된다)
├── commands.md                문서 한 장
└── settings.md
```

```sh
for-humanity dev docs        # 고치면서 본다
for-humanity build docs      # docs/dist 에 정적 사이트를 만든다
for-humanity preview docs    # 만든 사이트를 띄운다
```

> [!NOTE]
> 아직 npm에 올리지 않았다. 지금은 문서 폴더가 이 저장소 안에 있어야 한다 (예: `templates/` 아래).
> 저장소 밖에 두면 Vite가 문서 폴더에서 `astro`를 찾지 못한다.

## 문서 한 장

```markdown
---
name: Commands     # 영어 이름. 제목, 사이드바 목록, 첫 화면 카드가 쓴다. 첫 글자가 목록의 표지다
label: 명령 모음    # 한글 이름. 카드의 둘째 줄, 사이드바 이름에 올리면 뜬다
group: 사용         # 첫 화면 카드와 제목 윗줄의 묶음
type: document     # document | blueprint. 빼면 document
---

첫 절 앞의 글은 문서 머리가 된다. 이 문서가 답하는 것을 한두 줄로 쓴다.

## 한눈에            → 00 한눈에

::part[시작]         → 가름. 목차도 여기서 끊긴다

## 설치              → 01 설치
### 요구 사항        → 01.A 요구 사항
```

| 쓰는 것 | 이렇게 쓴다                            | 이렇게 보인다                                                                          |
|---------|----------------------------------------|----------------------------------------------------------------------------------------|
| 링크    | `[Settings](settings.md#시간대)`       | GitHub에서도 열리고, 사이트에서는 `/settings/#시간대`가 된다                           |
| 흐름도  | ```` ```mermaid ````                   | 격자 모양 SVG. 라벨에 괄호를 넣지 않고, 선 라벨은 한 낱말로, 긴 라벨은 `<br>`로 나눈다 |
| 알약    | `확인됨 2026-09-30`, `확인되지 않았다` | 초록 알약과 amber 알약. 문구는 설정에서 바꾼다                                         |
| 색 칩   | `` `#e80030` ``                        | 값 앞에 그 색의 칩이 붙는다                                                            |
| 가름    | `::part[이름]`                         | 굵은 선과 이름. 목차의 묶음이 된다                                                     |

## 설정

```js
// for-humanity.config.mjs. 모든 값은 빼도 된다
export default {
  title: "Lantern", // 사이드바 맨 위와 탭 제목. 빼면 Documents
  description: "첫 화면 제목 밑의 한두 줄",
  // 알약으로 바꿀 문구. date 가 true 면 뒤의 날짜 (YYYY-MM-DD) 까지 알약에 넣는다
  status: [
    {phrase: "확인됨", kind: "verified", date: true},
    {phrase: "확인되지 않았다", kind: "unverified"},
  ],
};
```

명령이 설정을 읽을 때 한 번 검사한다. 값이 틀리면 어디가 틀렸는지 적고 멈춘다.

## 짜임

엔진은 [Astro](https://astro.build)이고, 명령 뒤에 숨어 있어 쓰는 사람은 Astro를 몰라도 된다.
UI 프레임워크 없이 Astro 컴포넌트, CSS, 작은 브라우저 스크립트로만 짰다. 그래서 JS 없이도 다 보인다.

```text
src/
├── cli.ts                 명령. 설정을 읽고 쪽 · 플러그인 · 설정을 이어 Astro 를 돌린다
├── content.config.ts      문서 모음과 머리말 검사
├── page/
│   ├── home/              첫 화면
│   └── doc/               문서 한 장
├── component/widget/
│   ├── shell/             틀, 사이드바, 테마 단추, 읽는 절 표시
│   └── prose/             본문의 모양과 부품을 그리는 remark · rehype 플러그인
├── constant/ · type/      상수, 문구, 설정 스키마
├── style/                 토큰과 바탕
└── util/                  흐름도 렌더러, DOM 도우미
templates/document/        가상의 예시 문서
```

이름과 자리는 몇 가지 규칙을 따른다.

- 파일은 kebab-case로 짓고, 컴포넌트에는 레이어 접두사를 붙인다 (`pg-home.astro`, `wg-shell.astro`)
- 클래스는 `범위_식별자__요소--수정자` 꼴이다 (`wg_prose__pill--verified`)
- 가져오기는 `@/`로 쓴다. 자기만 쓰는 파일은 `_`로 시작하고, 함수 · 타입 · 상수는 `_function` · `_type` · `_constant`에 둔다
- 기계로 볼 수 있는 규칙은 Biome이 본다. `??` 오른쪽의 리터럴은 `no-literal-fallback.grit`이 잡는다
- `src/util/mermaid/render-flow.js`의 격자 렌더러는 다른 저장소와 diff로 맞춰 보려고 글자 그대로 둔다. 그래서 Biome 검사에서 뺐다

## 개발

```sh
pnpm check        # Biome: 린트, 포맷, import 차례
pnpm check:fix    # 고칠 수 있는 것은 고친다
pnpm typecheck    # tsc
pnpm build:cli    # src/cli.ts 를 dist/cli.js 로 묶는다 (esbuild)
```

## 다음 차례

- [ ] **blueprint** 종류 (화면 설계)
- [ ] `for-humanity init`으로 문서 폴더 만들기
- [ ] 저장소 밖의 문서 폴더, npm 배포
- [ ] 검색
- [ ] 이 모양대로 문서를 쓰는 에이전트 스킬

## 라이선스

[MIT](LICENSE) © 2026 하민우
