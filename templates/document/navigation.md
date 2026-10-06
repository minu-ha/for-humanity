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
부모와 자식 모두 클릭 가능한 문서. 현재 페이지에만 굵은 글씨를 적용하며, 자식은 부모 아래에 들여써서 표시.
하위 문서는 별도 최상위 링크로 중복 표시하지 않음. 처음 방문할 때 모든 가지를 펼쳐 표시.

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

## Expand and collapse

하위 항목이 있는 그룹·부모 문서에는 `− / +` 버튼을 표시. 문서 제목은 해당 페이지로 이동하고, 옆 버튼은 자식 목록만 접거나 펼침. 자식이 없는 문서에는 버튼 없음.
On this page에서도 가름 묶음과 하위 헤딩이 있는 절에 같은 버튼 제공. 목차를 접어도 본문은 그대로이며, 제목 링크는 항상 기존 앵커로 이동.

기본값은 전체 펼침. 사용자가 바꾼 가지 선택은 `localStorage`에 저장하며 새로고침·페이지 이동·브라우저 재실행 후에도 유지. 문서 가지는 ID, 그룹은 전체 경로, 목차는 페이지 ID와 헤딩으로 구분하므로 같은 제목이라도 선택이 섞이지 않음.
버튼은 트리선과 같은 옅은 색으로 표시하고 hover·키보드 포커스에서 강조. 탐색 초기화는 첫 화면 표시 전에 완료하므로 페이지마다 버튼이 뒤늦게 나타나지 않음.
Tab으로 버튼에 이동하고 Enter·Space로 조작. 접힌 자식은 Tab 순서에서 빠지고, 현재 문서·헤딩의 굵기는 접힘 선택과 독립적으로 유지.

## Sidebar layout

1536px 이상에서는 같은 폭 240px의 왼쪽 문서 목록·오른쪽 목차가 각각 화면 높이를 사용. 본문 최대 폭 900px, 본문과 각 사이드바의 간격 32px 유지.
1536px 미만에서는 목차를 숨기고 왼쪽 문서 목록에 전체 탐색 높이 제공. 1024px 미만의 모바일 드로어에도 문서 목록만 표시.

스크롤 위치는 같은 탭의 `sessionStorage`에 넓은 화면·좁은 데스크톱·드로어를 나누어 저장. 문서 목록은 페이지 사이에서 유지하고, 목차는 같은 페이지에서만 복원. 저장소 차단·손상 시에도 현재 페이지의 접기·펼치기와 탐색은 작동.
JavaScript 없이도 전체 펼침 상태의 문서 링크를 사용 가능하며, 와이드 화면에서는 목차도 표시. 이 경우 동작 연결이 필요한 접기 버튼은 표시하지 않음.
