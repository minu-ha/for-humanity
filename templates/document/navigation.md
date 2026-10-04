---
name: Navigation
label: 그룹과 부모 문서로 읽는 경로 구성
group: Guide
parent: writing
order: 10
---

그룹은 클릭하지 않는 분류 제목. 문서는 각각 본문과 URL을 가진 링크.
`parent`는 문서를 다른 문서 아래에 배치하며 `0.3.0`부터 지원.
이 안내도 사이드바에서 [Writing](writing.md) 아래에 있는 하위 문서.

## Group and parent

`group`은 문서가 속한 분류 경로, `parent`는 같은 분류 안의 부모 문서 ID.
부모 문서를 눌러 소개를 읽고, 하위 문서에서 자세한 내용을 읽는 구성.

```text
Guide
├─ Writing
└─ Settings
   ├─ Site
   └─ Themes
```

예를 들어 `settings.md`의 머리말:

```yaml
name: Settings
label: 설정 안내
group: Guide
order: 20
```

`site.md`에는 부모 ID를 추가:

```yaml
name: Site
label: 사이트 설정
group: Guide
parent: settings
order: 10
```

`themes.md`도 `parent: settings`로 지정하면 같은 부모 아래에 표시.
부모와 자식 모두 클릭 가능한 문서. 현재 페이지에만 굵은 글씨를 적용하며, 부모까지 이어지는 트리선으로 경로 표시.
하위 문서는 별도 최상위 링크로 중복 표시하지 않음. 모든 가지는 항상 펼쳐 표시.

## Parent references

부모는 표시 이름이 아닌 확장자를 뺀 소문자 문서 ID로 지정.
`guide/settings.md`의 ID는 `guide/settings`, URL은 `/guide/settings/`.
기본 참조는 CLI에 넘긴 문서 루트 기준. 앞뒤 공백은 제거.

파일 위치 기준 참조는 `./` 또는 `../`로 시작:

```yaml
# research/parts.md → research/README.md
parent: ./readme
```

```yaml
# guide/authoring.md → research/README.md
parent: ../research/readme
```

상대 참조도 확장자를 넣지 않음. 프로젝트 폴더만 문서 루트로 열 때는 상대 참조를 쓰면 같은 부모 관계를 유지할 수 있음.
일반 ID는 URL이 아니므로 `/settings/`, `settings.md`, `#settings`를 사용하지 않음.
파일 이동·이름 변경 시 부모를 참조하는 문서도 확인.

## Ordering and validation

부모·자식의 전체 `group` 경로는 같아야 함. 중첩 그룹을 쓰면 양쪽 모두 같은 배열 지정.
같은 부모의 자식은 작은 `order` 먼저. 생략한 문서는 지정한 문서 뒤에서 제목순, 제목도 같으면 ID순.
자식의 `order`는 그 부모의 자식 목록에만 적용하며 부모나 다른 가지의 위치를 바꾸지 않음.
자식도 부모가 될 수 있어 여러 단계로 중첩 가능.

`parent`를 생략한 문서는 기존처럼 그룹 바로 아래에 표시.
그룹·부모를 바꿔도 파일 ID·URL·상대 Markdown 링크·각 페이지 목차는 유지.

다음 경우 dev와 build에서 오류:

- 빈 문자열·문자열 외의 `parent`
- 존재하지 않는 부모 또는 홈 README 참조
- 자기 자신 참조와 부모 경로의 순환
- 부모와 자식의 전체 `group` 경로 불일치

루트 `README.md`는 사이트 이름으로 연결하는 홈이므로 부모 문서가 될 수 없음.
하위 폴더의 README는 일반 문서여서 frontmatter를 갖추면 부모로 사용 가능.
