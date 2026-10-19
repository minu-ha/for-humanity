---
name: Deployment
label: 작성한 문서를 정적 사이트로 배포
group: Getting started
order: 20
---

문서를 빌드한 뒤 생성된 결과 폴더를 정적 호스팅에 배포합니다. 배포 후에는 별도 Node.js 서버가 필요하지 않습니다.

## Build and preview

프로젝트 루트에서 실행합니다.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

`http://localhost:4321/`에서 홈, 문서 직접 링크, 이미지가 열리는지 확인합니다.
공개 결과는 `content/dist`에 생성됩니다. `content.root`를 바꿨다면 그 폴더 아래의 `dist`를 사용합니다.

`build`는 이전 출력 폴더를 지우고 새 결과를 만듭니다. 직접 관리할 파일을 `dist` 안에만 보관하지 않습니다.
공개 문서와 홈이 private 자료를 참조하면 빌드가 실패합니다. 배포 대상은 원본 content 전체가 아니라 생성된 `dist`입니다.

## Hosting settings

호스팅 서비스에 문서 프로젝트를 연결하고 다음 값을 지정합니다.

| Setting | Value |
| --- | --- |
| 프로젝트 경로 | `package.json`과 설정 파일이 있는 폴더 |
| 빌드 명령 | `pnpm exec for-humanity build` |
| 출력 폴더 | `content/dist` |
| Node.js | 22.12.0 이상 |

호스팅의 설치 단계에서 프로젝트의 의존성을 설치할 수 있어야 합니다. 패키지 버전과 lockfile을 함께 저장합니다.
현재 URL은 사이트 루트(`/`) 기준입니다. `/docs/` 같은 하위 경로 배포는 지원하지 않습니다.

## Cloudflare Pages

Pages에서 문서 프로젝트의 Git 저장소를 연결하고 Framework preset을 `None`으로 선택한 뒤 위 빌드 명령과 출력 폴더를 설정합니다.
기존 프로젝트가 다른 출력 경로를 사용했다면 새 경로로 변경합니다.
자세한 연결 절차는 [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)을 참고합니다.

없는 문서가 홈으로 표시되지 않도록 출력 루트에 `404.html`을 포함합니다.
별도로 관리한 파일은 빌드가 끝난 뒤 `content/dist`에 복사하도록 배포 명령에 추가합니다. [Cloudflare의 정적 페이지 제공 규칙](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Verify the deployment

- 홈과 문서의 개별 URL이 열리는지 확인합니다.
- 그림과 글꼴이 정상으로 표시되는지 확인합니다.
- 없는 경로와 내부 문서 경로가 `404`를 반환하는지 확인합니다.
- 검색 엔진용 파일이 필요하면 `url`을 설정하고 `/robots.txt`와 `/sitemap.xml`을 확인합니다. [Crawling](crawling.md).

`preview`는 로컬 빌드 확인용입니다. 운영 사이트에는 빌드 결과를 정적 호스팅으로 제공합니다.
