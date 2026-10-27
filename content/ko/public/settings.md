---
name: Settings
label: 사이트 이름, 문서 경로, 탐색 순서 설정
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
    navigation: ["Start", "Guide", "Updates"],
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
| `description` | 홈 페이지의 검색 결과와 링크 미리보기 설명 | 없음 |
| `lang` | 문서 언어 태그, 예: `en`, `en-US` | `ko` |
| `locales` | 번역 언어, [Languages](#languages) 참고. `0.22.0`부터 지원 | 없음 |
| `basePath` | 배포할 URL 경로, 예: `/project/`. `0.17.0`부터 지원 | `/` |
| `url` | 배포한 사이트의 루트 주소 | 없음 |
| `image` | 링크 미리보기 이미지의 문서 루트 기준 경로 | 없음 |
| `statusImage` | 404 화면 이미지의 문서 루트 기준 경로. `0.20.0`부터 지원 | 기본 픽셀 얼굴의 슬픈 표정 |
| `port` | dev와 preview 포트, 1부터 65535까지 정수 | `4321` |
| `host` | dev와 preview 수신 주소. `0.21.0`부터 지원 | `localhost` |
| `cursorFace` | 데스크톱에서 마우스를 따라다니는 픽셀 얼굴 | `false` |

사이트 홈의 제목과 본문은 `content/README.md`에 작성합니다. 문서 페이지의 설명에는 각 문서의 `label`을 사용합니다. `url`을 지정하면 검색 엔진용 파일, 대표 주소, 링크 미리보기 태그를 생성합니다. `image`는 `url`과 함께 사용하며 PNG, JPEG, GIF, WebP 파일을 지정합니다. URL 형식과 출력은 [Crawling](crawling.md)을 참고합니다.

## Local server

`host`는 `0.21.0`부터 지원합니다.

같은 네트워크의 다른 기기에서도 접속하려면 다음과 같이 설정합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    host: true,
    port: 9999,
} satisfies SiteConfig;
```

| Value | Binding |
| --- | --- |
| 생략 또는 `false` | `localhost`에서만 수신 |
| `true` | 모든 네트워크 인터페이스에서 수신 |
| `"0.0.0.0"` | 모든 IPv4 인터페이스에서 수신 |
| IP 또는 hostname 문자열 | 지정한 주소에서 수신, 예: `"192.168.1.144"`, `"::1"`, `"localhost"` |

주소에는 `http://` 같은 프로토콜이나 `:9999` 같은 포트를 붙이지 않습니다. 포트는 `port`에 따로 지정합니다. 변경 후에는 서버를 다시 시작합니다.
이 설정은 `dev`와 `preview`에 적용됩니다. 한 번만 바꾸려면 CLI의 `--host`를 사용하며 CLI 옵션이 설정보다 우선합니다. 브라우저 접속 주소와 공개 문서만 공유하는 방법은 [Commands](commands.md#connect-over-a-local-network)를 참고합니다.

## Status screen

공통 404 화면과 `statusImage`는 `0.20.0`부터 지원합니다.

없는 문서는 중앙의 픽셀 얼굴과 404 번호, 안내, 홈 복귀 링크로 표시합니다. 밝은 테마와 어두운 테마를 따르며 JavaScript 없이도 읽고 이동할 수 있습니다.
`build`는 같은 화면을 `<content.root>/dist/404.html`에 생성하고, `dev`와 `preview`는 없는 문서에 이 화면과 HTTP 404를 반환합니다. 오류 화면은 검색 색인에서 제외합니다.
`404.html`은 생성되는 오류 파일의 예약 경로입니다. `404.html.md`처럼 같은 경로를 만드는 문서 이름은 사용할 수 없습니다.

이미지를 교체하려면 파일을 `content/asset/status.svg`처럼 문서 루트 안에 두고 설정합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    statusImage: "asset/status.svg",
} satisfies SiteConfig;
```

경로는 `content.root` 기준입니다. SVG, PNG, JPEG, GIF, WebP, AVIF를 지원하며 `url` 없이도 사용할 수 있습니다.
공개 빌드에서는 private 폴더나 문서 루트 밖의 파일을 사용할 수 없습니다. 파일을 바꿨다면 다시 빌드합니다.
이 설정은 404의 그림만 바꾸며 favicon과 커서 얼굴은 유지합니다. 생략하면 기본 슬픈 픽셀 얼굴을 사용합니다.

## Content paths

| Key | Relative to | Default |
| --- | --- | --- |
| `content.root` | 프로젝트 루트 | `content` |
| `content.public` | content 루트 | `public` |
| `content.private` | content 루트 | `private` |

기본값을 사용하면 홈은 `content/README.md`, 공개 문서는 `content/public`, 내부 문서는 `content/private`입니다.
공개 폴더는 필수입니다. 내부 문서가 없으면 private 폴더는 생략할 수 있습니다.

다른 이름을 사용하려면 다음과 같이 지정합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    content: {root: "knowledge", public: "published", private: "internal"},
} satisfies SiteConfig;
```

이 경우 홈은 `knowledge/README.md`, 문서는 `knowledge/published`와 `knowledge/internal`, 출력은 `knowledge/dist`입니다. 설정 파일은 계속 프로젝트 루트에 둡니다.
공개 문서 `published/guide.md`의 URL은 `/guide/`, 내부 문서 `internal/plan.md`의 로컬 URL은 `/private/plan/`입니다.

경로는 프로젝트 내부의 상대 경로를 사용합니다. `content.root: "."`도 가능하지만 public과 private은 서로 다른 하위 폴더여야 합니다. 두 경로는 같을 수 없고 한쪽이 다른 쪽 안에 들어갈 수도 없습니다.
`..`, `dist`, `.git`, `node_modules`가 포함된 경로는 사용할 수 없습니다. 공개 폴더와 내부 폴더 자체를 symlink로 지정할 수 없습니다. symlink로 프로젝트 밖이나 예약 폴더를 가리킬 수도 없습니다.

### Public and private content

`dev`는 양쪽 문서를 보여 줍니다. `build`는 홈과 공개 문서만 생성합니다. 그 결과는 `preview`로 확인합니다.
홈이나 공개 문서에서 private 문서, 이미지, 첨부, 스니펫을 참조하면 빌드가 실패합니다.

공용 자료는 `content/asset`, 내부 자료는 `content/private/asset`에 보관합니다. `asset` 이름은 자유롭게 바꿀 수 있으며 링크를 수정하면 됩니다. 별도 설정은 필요하지 않습니다.
`private`은 사이트 배포 제외 규칙입니다. Git 저장소에 올린 파일의 접근 권한을 바꾸지는 않습니다.

## Languages

사이트는 기본 언어 하나와 여러 번역 언어를 가질 수 있습니다. 기본 언어는 `lang`, `description`, `content/README.md`, `content/public`을 사용합니다. 번역 언어는 언어 코드 이름의 폴더에 자체 `README.md` 홈과 기본 언어 구조를 그대로 따르는 `public` 폴더를 둡니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    lang: "en",
    description: "Project notes",
    locales: {
        ko: {description: "프로젝트 안내"},
    },
} satisfies SiteConfig;
```

| Key | Use | Default |
| --- | --- | --- |
| `locales` | 언어 코드를 키로 하는 번역 언어 목록. 각 값에는 그 언어 홈의 `description`을 지정할 수 있습니다 | 없음 |

키는 `ko`, `zh-hans`처럼 소문자 BCP 47 언어 태그입니다. 문서 루트 아래의 폴더 이름, URL 접두, 번역 페이지의 `lang` 속성으로 함께 사용합니다.

```text
content/
├── README.md             # /
├── public/
│   └── guide.md          # /guide/
└── ko/
    ├── README.md         # /ko/
    └── public/
        └── guide.md      # /ko/guide/
```

같은 상대 경로의 파일이 기본 언어 문서의 번역입니다. 사이드바에는 현재 언어의 문서만 표시하고 사이트 이름은 현재 언어의 홈으로 연결합니다. 두 언어 이상으로 존재하는 페이지는 본문 위의 언어 줄에서 각 번역으로 이동합니다. 현재 언어는 일반 글자로 표시하며 번역이 없는 페이지에는 언어 줄을 표시하지 않습니다.

내부 문서는 번역하지 않습니다. `content/asset`은 모든 언어가 공유합니다. 번역 문서에서 공용 자료를 참조할 때는 `../../asset/screen.png`처럼 `../`를 하나 더 씁니다. 번역 문서의 일반 `parent` id는 같은 언어의 문서를 가리키며 다른 언어의 부모는 오류입니다. 기본 언어의 공개 문서는 첫 경로 조각에 언어 코드를 쓸 수 없습니다.

`url`을 지정하면 두 언어 이상으로 존재하는 페이지에 `hreflang` 대체 링크를 HTML head와 사이트맵에 생성합니다. 기본 언어는 `x-default`로도 표시합니다. [Crawling](crawling.md)을 참고합니다.

## Navigation

`navigation`에는 사이드바 그룹을 표시할 순서를 적습니다. 각 이름은 문서 frontmatter의 `group`과 일치해야 합니다.

```ts
export default {
    navigation: ["Start", "Guide", "Updates"],
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
| `kind` | `verified`: 초록, `unverified`: 호박색, `blocked`: 빨강, `neutral`: 회색 |
| `date` | `true`이면 뒤의 `YYYY-MM-DD` 날짜도 함께 표시 |

`blocked`와 `neutral`은 `0.24.0`부터 지원합니다.

위 설정을 사용한 문서에 `검토 완료 2026-10-01`을 쓰면 날짜까지 하나의 표지로 표시합니다.
괄호로 감싼 문구도 인식합니다. 제목, 링크, 코드 안의 문구는 바꾸지 않습니다.
`status`를 지정하면 기본 목록을 교체합니다. 표지를 끄려면 `status: []`를 사용합니다.

## Reference chips

`0.24.0`부터 지원합니다.

`[Q3](questions.md#q3)`처럼 글자가 설정한 접두와 번호인 링크는 밑줄 링크 대신 작은 칩으로 표시합니다. 본문이 가리키는 번호 붙은 결정과 질문에 사용합니다.

```ts
export default {
    refs: [
        {prefix: "Q", color: "violet"},
        {prefix: "B", color: "amber"},
        {prefix: "D"},
    ],
};
```

| Key | Use |
| --- | --- |
| `prefix` | 대문자 1~3자. 접두마다 한 번 |
| `color` | `gray`(기본), `blue`, `violet`, `amber` |

링크 글자 전체가 접두와 숫자일 때만 칩이 되므로 `Q3`는 되고 `Q3a`나 `q3`는 되지 않습니다. 링크 주소는 바꾸지 않습니다. `refs`가 없으면 링크를 그대로 표시합니다.
`### Q3`처럼 제목 글자 전체가 접두와 번호면 제목 크기의 같은 칩으로 표시해, 본문의 칩과 그 앵커가 같은 모양으로 보입니다. `0.25.0`부터 지원합니다.

## Appearance

밝은 테마와 어두운 테마는 독자의 시스템 설정을 따릅니다. 글꼴은 빌드 결과에 포함됩니다.
사이트 테마나 글꼴을 교체하는 설정은 현재 제공하지 않습니다.
