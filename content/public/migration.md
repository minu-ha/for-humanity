---
name: Migration
label: 기존 문서 폴더를 content 구조로 이전
group: Getting started
order: 15
---

`0.14.0`부터 설정 위치와 문서 수집 방식이 바뀝니다. `0.13.1` 이하에서 업데이트할 때 이 절차를 따릅니다. 새 프로젝트는 [Commands](commands.md#your-first-site)에서 시작합니다.

## Before and after

기존에는 `docs` 같은 문서 폴더 안에서 설정·홈·일반 문서를 함께 읽었습니다. 새 구조는 프로젝트 루트 설정과 공개·내부 문서 폴더를 구분합니다.

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
| 공용 이미지·첨부 | `docs/images` | `content/asset` |
| 출력 | `docs/dist` | `content/dist` |
| 명령 | `for-humanity build docs` | 프로젝트 루트에서 `for-humanity build` |

기존 평면 폴더를 자동으로 공개 수집하지 않습니다. 공개 폴더가 없으면 실행이 실패하므로 이전 누락을 확인할 수 있습니다.

## Move the files

1. 설정 파일을 프로젝트 루트로 옮깁니다. `.ts` 또는 `.mjs` 하나만 유지합니다. 이웃 모듈을 import했다면 그 경로도 맞춥니다.
2. 홈 README를 `content/README.md`로 옮깁니다. 프로젝트 소개용 루트 README는 따로 유지할 수 있습니다.
3. 배포할 문서는 `content/public`, 로컬에서만 읽을 문서는 `content/private`로 나눕니다. 각 폴더 안의 Markdown에는 기존 frontmatter가 필요합니다.
4. 공용 자원을 `content/asset`, 내부 자원을 `content/private/asset`에 둡니다. 링크·스니펫·그림 경로를 새 파일 위치에 맞춥니다.
5. 실행 스크립트에서 문서 폴더 인자를 제거합니다. 다른 곳에서 실행한다면 **프로젝트 루트**를 지정합니다.
6. `.gitignore`와 호스팅 출력 경로를 `content/dist`로 맞춥니다. 새 빌드 확인 후 예전 출력 폴더를 정리합니다.

기본형은 패키지의 `template/`에 포함됩니다. 기존 파일을 덮어쓰지 말고 필요한 구조만 가져옵니다.

## Keep custom names

폴더명을 `content`, `public`, `private`로 바꾸기 어려우면 프로젝트 설정에서 지정합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    content: {root: "docs", public: "published", private: "internal"},
} satisfies SiteConfig;
```

이 구성의 홈은 `docs/README.md`, 공개 문서는 `docs/published`, 내부 문서는 `docs/internal`, 출력은 `docs/dist`입니다. 설정 파일은 여전히 프로젝트 루트에 둡니다.
문서 루트를 프로젝트와 같게 하려면 `content.root: "."`를 사용할 수 있습니다. 공개·내부 폴더는 각각 별도 하위 폴더여야 하며 `public: "."`로 예전 평면 수집을 복원할 수는 없습니다.
경로 검증 규칙은 [Settings](settings.md#content-paths).

## Update links and parent references

공개 폴더 안에서 기존 상대 위치를 유지하면 공개 URL도 유지됩니다. `content/public/guide.md`는 `/guide/`이며 `/public/guide/`가 아닙니다.
내부 문서는 로컬 `/private/maintenance/`로 이동하고 공개 사이트에서는 사라집니다. 폴더명을 `internal`로 지정해도 로컬 URL은 `/private/`를 사용합니다.

- 홈 → 공개 문서: `[Guide](public/guide.md)`
- 공개 문서 → 홈: `[Home](../README.md)`
- 공개 문서 → 공용 자원: `![Screen](../asset/screen.png)`
- 내부 문서 → 공개 문서: `[Guide](../public/guide.md)`
- `parent: guide`: 사이트 문서 ID. `public/`를 붙이지 않음
- `parent: ../guide`: 원본 파일 위치 기준. 파일을 옮기면 경로도 다시 확인

홈과 공개 문서는 공개 빌드에 항상 포함됩니다. 여기에서 private Markdown·그림·첨부·스니펫을 참조하면 빌드가 실패합니다. HTML 참조와 symlink 대상도 검사합니다. 함께 보여야 하는 내용은 공개 자료로 분리합니다.

## Verify the result

```sh
pnpm exec for-humanity dev
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

dev에서 양쪽 문서가 표시되는지 확인합니다. build 후에는 private 페이지·메뉴·사이트맵 항목·내부 자원이 없는지 확인하고, preview에서 공개 문서를 직접 열어 봅니다.
배포에는 생성된 `dist`만 사용합니다. 기존 호스팅이 예전 출력 경로를 보고 있다면 다음 배포 전에 변경합니다. 호스팅 설정은 [Deployment](deployment.md#hosting-settings).

`private`는 배포 제외 규칙입니다. 공개 Git 저장소에 넣은 파일은 Git에서 읽을 수 있습니다. 로그인을 통한 비공개 문서 제공은 이번 구조의 범위에 포함하지 않습니다.
