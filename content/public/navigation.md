---
name: Navigation
label: 그룹과 부모 문서로 읽는 경로 구성
group: Guide
parent: writing
order: 10
---

그룹은 클릭할 수 없는 분류 제목입니다. 문서는 각각 본문과 URL이 있는 링크입니다.
`parent`는 문서를 다른 문서 아래에 배치하며 `0.3.0`부터 지원합니다.
이 안내도 사이드바에서 [Writing](writing.md) 아래에 있는 하위 문서입니다.

## Group and parent

`group`은 문서가 속한 분류 경로입니다. `parent`는 같은 분류 안의 부모 문서 ID입니다.
독자는 부모 문서를 눌러 소개를 읽고 하위 문서에서 자세한 내용을 읽습니다.

```text
Guide
├─ Writing
└─ Settings
   ├─ Site
   └─ Themes
```

예를 들어 `settings.md`의 머리말은 다음과 같습니다.

```yaml
name: Settings
label: 설정 안내
group: Guide
order: 20
```

`site.md`에는 부모 ID를 추가합니다.

```yaml
name: Site
label: 사이트 설정
group: Guide
parent: settings
order: 10
```

`themes.md`도 `parent: settings`로 지정하면 같은 부모 아래에 표시됩니다.
부모와 자식은 모두 클릭할 수 있는 문서입니다. 현재 페이지에만 굵은 글씨를 적용하고 자식은 부모 아래에 들여써서 표시합니다.
하위 문서는 별도 최상위 링크로 중복 표시하지 않고 부모 아래에 항상 표시합니다.

## Parent references

부모는 표시 이름이 아니라 확장자를 뺀 소문자 문서 ID로 지정합니다.
`content/public/guide/settings.md`의 ID는 `guide/settings`, URL은 `/guide/settings/`입니다.
기본 참조는 사이트 URL의 문서 ID를 기준으로 합니다. 공개 문서는 `guide`, 내부 문서는 `private/plan` 형태입니다. 앞뒤 공백은 제거합니다.

파일 위치 기준 참조는 `./` 또는 `../`로 시작합니다.

```yaml
# research/parts.md → research/README.md
parent: ./readme
```

```yaml
# guide/authoring.md → research/README.md
parent: ../research/readme
```

상대 참조도 확장자를 넣지 않습니다. 파일 위치를 기준으로 해석하므로 내부 문서에서 `../public/guide`처럼 공개 부모를 참조할 수 있습니다. 공개 문서의 부모는 공개 문서여야 합니다.
일반 ID는 URL이 아니므로 `/settings/`, `settings.md`, `#settings`를 사용하지 않습니다.
파일을 옮기거나 이름을 바꾸면 부모를 참조하는 문서도 확인합니다.

## Ordering and validation

부모와 자식의 전체 `group` 경로는 같아야 합니다. 중첩 그룹을 쓰면 양쪽에 같은 배열을 지정합니다.
같은 부모의 자식은 `order`가 작은 문서부터 표시합니다. 생략한 문서는 지정한 문서 뒤에 제목순으로, 제목도 같으면 ID순으로 표시합니다.
자식의 `order`는 그 부모의 자식 목록에만 적용하며 부모나 다른 가지의 위치를 바꾸지 않습니다.
자식도 부모가 될 수 있어 여러 단계로 중첩할 수 있습니다.

`parent`를 생략한 문서는 기존처럼 그룹 바로 아래에 표시합니다.
그룹이나 부모를 바꿔도 파일 ID, URL, 상대 Markdown 링크, 각 페이지 목차는 유지됩니다.

다음 경우에는 dev와 build에서 오류가 발생합니다.

- 빈 문자열 또는 문자열 외의 `parent`
- 존재하지 않는 부모 또는 홈 README 참조
- 자기 자신 참조와 부모 경로의 순환
- 부모와 자식의 전체 `group` 경로 불일치

`content/README.md`는 사이트 이름으로 연결하는 홈이므로 부모 문서가 될 수 없습니다.
하위 폴더의 README는 일반 문서이므로 frontmatter를 갖추면 부모로 사용할 수 있습니다.
