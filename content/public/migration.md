---
name: Migration
label: 버전별 이전 방법
group: Updates
order: 20
---

`0.14.0`부터 설정 위치와 문서 수집 방식이 바뀝니다. `0.13.1` 이하에서 업데이트할 때 이 절차를 따릅니다. `0.14.x`에서 `0.15.0`으로 업데이트할 때는 [Update to 0.15.0](#update-to-0150)을 확인합니다. 새 프로젝트는 [Installation](installation.md#your-first-site)에서 시작합니다.

## Before and after

기존에는 `docs` 같은 문서 폴더 안에서 설정, 홈, 일반 문서를 함께 읽었습니다. 새 구조는 프로젝트 루트 설정, 공개 문서 폴더, 내부 문서 폴더를 구분합니다.

```text
project/
├── for-humanity.config.ts
└── content/
    ├── README.md
    ├── public/
    │   └── guide.md
    ├── private/
    │   └── maintenance.md
    ├── asset/
    └── dist/                 # 빌드할 때 생성
```

| Item | Previous | New default |
| --- | --- | --- |
| 설정 | `docs/for-humanity.config.ts` | `for-humanity.config.ts` |
| 홈 | `docs/README.md` | `content/README.md` |
| 공개 문서 | `docs/guide.md` | `content/public/guide.md` |
| 내부 문서 | `docs/maintenance.md` | `content/private/maintenance.md` |
| 공용 이미지와 첨부 | `docs/images` | `content/asset` |
| 출력 | `docs/dist` | `content/dist` |
| 명령 | `for-humanity build docs` | 프로젝트 루트에서 `for-humanity build` |

기존 평면 폴더를 자동으로 공개 수집하지 않습니다. 공개 폴더가 없으면 실행이 실패하므로 이전 누락을 확인할 수 있습니다.

## Move the files

1. 설정 파일을 프로젝트 루트로 옮깁니다. `.ts` 또는 `.mjs` 하나만 유지합니다. 이웃 모듈을 import했다면 그 경로도 맞춥니다.
2. 홈 README를 `content/README.md`로 옮깁니다. 프로젝트 소개용 루트 README는 따로 유지할 수 있습니다.
3. 배포할 문서는 `content/public`, 로컬에서만 읽을 문서는 `content/private`으로 나눕니다. 각 폴더 안의 Markdown에는 기존 frontmatter가 필요합니다.
4. 공용 자원을 `content/asset`, 내부 자원을 `content/private/asset`에 둡니다. 링크, 스니펫, 그림의 경로를 새 파일 위치에 맞춥니다.
5. 실행 스크립트에서 문서 폴더 인자를 제거합니다. 다른 곳에서 실행한다면 **프로젝트 루트**를 지정합니다.
6. `.gitignore`와 호스팅 출력 경로를 `content/dist`로 맞춥니다. 새 빌드 확인 후 예전 출력 폴더를 정리합니다.

기본형은 패키지의 `template/`에 포함됩니다. 기존 파일을 덮어쓰지 말고 필요한 구조만 가져옵니다.

## Keep custom names

폴더명을 `content`, `public`, `private`으로 바꾸기 어려우면 프로젝트 설정에서 지정합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    content: {root: "docs", public: "published", private: "internal"},
} satisfies SiteConfig;
```

이 구성의 홈은 `docs/README.md`, 공개 문서는 `docs/published`, 내부 문서는 `docs/internal`, 출력은 `docs/dist`입니다. 설정 파일은 여전히 프로젝트 루트에 둡니다.
문서 루트를 프로젝트와 같게 하려면 `content.root: "."`를 사용할 수 있습니다. 공개 폴더와 내부 폴더는 각각 별도 하위 폴더여야 합니다. `public: "."`로 예전 평면 수집을 복원할 수는 없습니다.
경로 검증 규칙은 [Settings](settings.md#content-paths)를 참고합니다.

## Update links and parent references

공개 폴더 안에서 기존 상대 위치를 유지하면 공개 URL도 유지됩니다. `content/public/guide.md`는 `/guide/`이며 `/public/guide/`가 아닙니다.
내부 문서는 로컬 `/private/maintenance/`로 이동하고 공개 사이트에서는 사라집니다. 폴더명을 `internal`로 지정해도 로컬 URL은 `/private/`을 사용합니다.

- 홈 → 공개 문서: `[Guide](public/guide.md)`
- 공개 문서 → 홈: `[Home](../README.md)`
- 공개 문서 → 공용 자원: `![Screen](../asset/screen.png)`
- 내부 문서 → 공개 문서: `[Guide](../public/guide.md)`
- `parent: guide`: 사이트 문서 ID입니다. `public/`을 붙이지 않습니다.
- `parent: ../guide`: 원본 파일 위치를 기준으로 합니다. 파일을 옮기면 경로도 다시 확인합니다.

홈과 공개 문서는 공개 빌드에 항상 포함됩니다. 여기에서 private Markdown, 그림, 첨부, 스니펫을 참조하면 빌드가 실패합니다. HTML 참조와 symlink 대상도 검사합니다. 함께 보여야 하는 내용은 공개 자료로 분리합니다.

## Verify the result

```sh
pnpm exec for-humanity dev
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

dev에서 양쪽 문서가 표시되는지 확인합니다. build 후에는 private 페이지, 메뉴, 사이트맵 항목, 내부 자원이 없는지 확인합니다. preview에서는 공개 문서를 직접 열어 봅니다.
배포에는 생성된 `dist`만 사용합니다. 기존 호스팅이 예전 출력 경로를 보고 있다면 다음 배포 전에 변경합니다. 호스팅 설정은 [Deployment](deployment.md#hosting-settings)를 참고합니다.

`private`은 배포 제외 규칙입니다. 공개 Git 저장소에 넣은 파일은 Git에서 읽을 수 있습니다. 로그인으로 비공개 문서를 제공하는 기능은 이번 구조에 포함하지 않습니다.

## Update to 0.15.0

`0.15.0`부터는 이전 버전에서 빌드되던 일부 입력이 빌드 오류가 됩니다. 업데이트한 뒤 `build`를 실행하고 오류에 표시된 파일과 줄을 차례로 고칩니다.
터미널에는 파일과 줄 번호에 이어 `Invalid part syntax`, `Invalid code snippet`, `Invalid asset` 문구가 나옵니다.

| Input | Fix |
| --- | --- |
| 제목이 없거나 빈 `::part` | `::part[제목]` 작성 |
| 제목에 링크, 강조, 인라인 코드를 쓰거나 속성을 붙인 `::part` | 서식과 속성 없이 일반 텍스트 제목 작성 |
| `##` 절 없이 다음 `::part`나 문서 끝이 오는 `::part` | `::part` 뒤에 `##` 절 작성 |
| `<<<`로 지정했지만 끝 표시가 없는 region | region 끝에 `#endregion` 같은 끝 표시 추가 |
| Markdown 이미지, `<img>`, `srcset`, `poster`의 PDF처럼 이미지가 아닌 파일 | 이미지 파일로 교체하거나 첨부 링크로 연결 |
| `<video>`, `<audio>`, `<source>`의 `src`가 가리키는 없는 로컬 파일 | 파일 추가 또는 경로 수정 |
| `<video>`, `<audio>`, `<source>`의 `src`가 가리키는 MP4, WebM, MP3 외의 로컬 파일 | 지원 형식으로 변환하거나 직접 제공하는 절대 URL로 지정 |

없는 문서나 배포하지 않는 로컬 파일을 가리키는 링크에는 경고만 표시하고 빌드를 계속합니다.
작성 규칙은 [Parts](parts.md#errors), [Code snippets](writing.md#code-snippets), [Supported files](images.md#supported-files)를 참고합니다.
