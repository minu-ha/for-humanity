# for-humanity

사람이 읽는 문서를 위한 문서 킷이다. 요즘 문서는 AI가 Markdown으로만 만들고 관리한다. for-humanity는 그 Markdown을 **사람이 읽기 좋은 쪽**으로 바꾼다.

- 왼쪽 사이드바에 문서 목록과 이 문서의 목차가 있다. 목차는 가름마다 끊기고, 읽는 절이 켜진다
- 절 번호(00, 01, 01.A)를 빌드가 매긴다. 절을 옮겨도 손으로 번호를 고치지 않는다
- 흐름도는 beautiful-mermaid 격자 모양으로 빌드 때 그린다
- 확인 표시는 알약, 색 값은 색 칩, 넓은 표는 가로로 미는 상자가 된다
- 밝게 · 어둡게 · 시스템 테마가 있고, JS가 꺼져 있어도 다 보인다

엔진은 [Astro](https://astro.build)다. 쓰는 사람은 Astro 설정을 몰라도 된다. 문서 폴더에는 Markdown과 설정 파일 하나만 둔다.

## 지금 상태

시제품이다. 문서 종류 둘 가운데 **document**(문서 정리)만 있다. **blueprint**(화면 설계), `init` 명령, 빌드 검사, 검색, 에이전트 스킬은 다음 차례다.

## 해 보기

```sh
pnpm install
pnpm dev        # templates/document 를 http://localhost:4321 에 띄운다
pnpm build      # templates/document/dist 에 정적 사이트를 만든다
```

`templates/document`는 가상의 로그 검색 도구 Lantern의 문서다. 내용은 모두 지어낸 것이다.

## 문서 폴더

```
docs/
  for-humanity.config.mjs    (없어도 된다) 제목, 설명, 알약 문구
  commands.md                문서 한 장
  settings.md
```

```sh
for-humanity dev docs
for-humanity build docs
for-humanity preview docs
```

## 문서 한 장

```markdown
---
name: Commands           # 영어 이름. 제목(h1), 사이드바 문서 목록, 첫 화면 카드가 쓴다
label: 명령 모음          # 한글 이름. 카드의 둘째 줄, 사이드바 이름에 올리면 뜬다
type: document           # document | blueprint
group: 사용               # 첫 화면 카드와 문서 머리 윗줄의 묶음
---

첫 절 앞의 글은 문서 머리가 된다. 이 문서가 답하는 것을 한두 줄로 쓴다.

## 한눈에                 # 00 한눈에 (번호는 빌드가 붙인다)

::part[시작]              # 가름. 목차도 여기서 끊긴다

## 설치                   # 01 설치
### 요구 사항             # 01.A 요구 사항
```

- **이름의 첫 글자**가 사이드바 목록의 표지다. 다른 문서와 첫 글자가 겹치면 빌드가 멈춘다.
- **링크**는 GitHub에서도 열리는 꼴로 쓴다: `[Settings](settings.md#시간대)`. 사이트에서는 `/settings/#시간대`가 된다.
- **흐름도**는 ```` ```mermaid ```` 로 쓴다. 라벨에 괄호를 넣지 않고, 선 라벨은 한 낱말로 쓴다 (`-- 예 -->`). 긴 라벨은 `<br>`로 나눈다.
- **알약**은 설정의 문구를 그대로 쓰면 된다. 기본은 `확인됨 2026-09-30`과 `확인되지 않았다`다.
- **색 칩**은 색 값 하나만 든 코드다: `` `#e80030` ``.

## 설정

```js
// for-humanity.config.mjs
export default {
  title: 'Lantern',
  description: '첫 화면에 보일 한두 줄',
  status: [
    { phrase: '확인됨', kind: 'verified', date: true },
    { phrase: '확인되지 않았다', kind: 'unverified' },
  ],
}
```

## 폴더

```
bin/for-humanity.mjs     명령 (dev, build, preview)
src/astro-config.mjs     문서 폴더와 설정으로 Astro 설정을 만든다
src/markdown/            빌드 때 도는 플러그인과 흐름도 격자 렌더러
app/                     Astro 앱: 쪽, 레이아웃, 사이드바, 스타일, 브라우저 스크립트
templates/document/      가상 예시 (document 종류)
```
