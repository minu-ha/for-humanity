---
name: Settings
label: 사이트 이름·문서 경로·탐색 순서 설정
group: Guide
order: 30
---

`for-humanity.config.ts`에서 사이트 이름과 문서 경로, 탐색 순서를 설정합니다. 파일과 각 항목은 선택 사항이며 생략한 항목에는 기본값을 사용합니다.

## Create a configuration

프로젝트 루트에 `for-humanity.config.ts`를 만듭니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    description: "프로젝트 사용 안내와 참고 문서",
    content: {root: "content", public: "public", private: "private"},
    navigation: ["Getting started", "Guide", "Reference"],
} satisfies SiteConfig;
```

`SiteConfig`를 사용하면 편집기에서 설정 항목을 자동완성하고 잘못된 타입을 확인할 수 있습니다. 설정 값은 명령을 실행할 때 검사합니다. **개발 중 설정을 수정했다면 서버를 다시 시작합니다.**

JavaScript를 사용한다면 `for-humanity.config.mjs`에 같은 객체를 내보냅니다.

```js
// @ts-check
/** @satisfies {import("for-humanity").SiteConfig} */
export default {title: "Project notes"};
```

한 프로젝트에는 `.ts`와 `.mjs` 중 하나만 둡니다.

## Site

| Key | Use | Default |
| --- | --- | --- |
| `title` | 사이드바와 브라우저 탭의 사이트 이름 | `for humanity` |
| `description` | 검색 결과 등에 사용할 사이트 설명 | 없음 |
| `url` | 배포한 사이트의 루트 주소 | 없음 |
| `port` | dev·preview 포트 · 1부터 65535까지 정수 | `4321` |
| `cursorFace` | 데스크톱에서 마우스를 따라다니는 픽셀 얼굴 | `false` |

사이트 홈의 제목과 본문은 `content/README.md`에 작성합니다. `url`을 지정하면 검색 엔진용 파일을 생성합니다. URL 형식과 출력은 [Crawling](crawling.md)을 참고합니다.

## Content paths

| Key | Relative to | Default |
| --- | --- | --- |
| `content.root` | 프로젝트 루트 | `content` |
| `content.public` | content 루트 | `public` |
| `content.private` | content 루트 | `private` |

기본값을 사용하면 홈은 `content/README.md`, 공개 문서는 `content/public`, 내부 문서는 `content/private`입니다.
공개 폴더는 필수입니다. 내부 문서가 없으면 private 폴더는 생략할 수 있습니다.

다른 이름을 사용하려면:

```ts
import type {SiteConfig} from "for-humanity";

export default {
    content: {root: "knowledge", public: "published", private: "internal"},
} satisfies SiteConfig;
```

이 경우 홈은 `knowledge/README.md`, 문서는 `knowledge/published`와 `knowledge/internal`, 출력은 `knowledge/dist`입니다. 설정 파일은 계속 프로젝트 루트에 둡니다.
공개 문서 `published/guide.md`의 URL은 `/guide/`, 내부 문서 `internal/plan.md`의 로컬 URL은 `/private/plan/`입니다.

경로는 프로젝트 내부의 상대 경로를 사용합니다. `content.root: "."`도 가능하지만 public과 private은 서로 다른 하위 폴더여야 합니다. 두 경로가 같거나 한쪽이 다른 쪽 안에 들어갈 수 없습니다.
`..`, `dist`, `.git`, `node_modules`가 포함된 경로는 사용할 수 없습니다. 공개·내부 폴더 자체를 symlink로 지정하거나, symlink로 프로젝트 밖 또는 예약 폴더를 가리킬 수도 없습니다.

### Public and private content

`dev`는 양쪽 문서를 보여 줍니다. `build`는 홈과 공개 문서만 생성하며 `preview`로 그 결과를 확인합니다.
홈이나 공개 문서에서 private 문서·이미지·첨부·스니펫을 참조하면 빌드가 실패합니다.

공용 자료는 `content/asset`, 내부 자료는 `content/private/asset`에 보관합니다. `asset` 이름은 자유롭게 바꿀 수 있으며 링크를 수정하면 됩니다. 별도 설정은 필요하지 않습니다.
`private`는 사이트 배포 제외 규칙입니다. Git 저장소에 올린 파일의 접근 권한을 바꾸지는 않습니다.

## Navigation

`navigation`에는 사이드바 그룹을 표시할 순서를 적습니다. 각 이름은 문서 frontmatter의 `group`과 일치해야 합니다.

```ts
export default {
    navigation: ["Getting started", "Guide", "Reference"],
};
```

설정에 없는 그룹은 지정한 그룹 뒤에서 이름순으로 표시합니다. 문서가 없는 그룹은 표시하지 않습니다. 같은 그룹을 두 번 지정하면 오류입니다.
그룹 안의 문서 순서는 문서의 `order`로 지정합니다.

중첩 그룹의 순서는 이름 배열로 지정합니다.

```ts
export default {
    navigation: [
        "Projects",
        ["Projects", "Research"],
        ["Projects", "Decisions"],
        "Guide",
    ],
};
```

위 설정은 Projects 안에서 Research를 Decisions보다 먼저 표시합니다. 같은 이름이라도 전체 경로가 다르면 별도 그룹입니다.
문서의 `group`과 `parent`를 작성하는 방법은 [Navigation](navigation.md)을 참고합니다.

## Status badges

본문의 특정 문구를 상태 표지로 표시할 수 있습니다. 기본 문구는 `확인됨`과 `확인되지 않았다`입니다.

```ts
export default {
    status: [
        {phrase: "검토 완료", kind: "verified", date: true},
        {phrase: "확인 필요", kind: "unverified"},
    ],
};
```

| Key | Use |
| --- | --- |
| `phrase` | 본문에서 찾을 비어 있지 않은 문구 |
| `kind` | `verified`: 초록 · `unverified`: amber |
| `date` | `true`이면 뒤의 `YYYY-MM-DD` 날짜도 함께 표시 |

위 설정을 사용한 문서에 `검토 완료 2026-10-01`을 쓰면 날짜까지 하나의 표지로 표시합니다.
괄호로 감싼 문구도 인식합니다. 제목·링크·코드 안의 문구는 바꾸지 않습니다.
`status`를 지정하면 기본 목록을 교체합니다. 표지를 끄려면 `status: []`를 사용합니다.

## Appearance

밝은 테마와 어두운 테마는 독자의 시스템 설정을 따릅니다. 글꼴은 빌드 결과에 포함됩니다.
사이트 테마나 글꼴을 교체하는 설정은 현재 제공하지 않습니다.
