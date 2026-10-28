---
name: Crawling
label: 검색 엔진에 공개 문서 주소 알리기
group: Guide
parent: settings
order: 10
---

사이트 주소를 `url`로 설정하면 `robots.txt`와 `sitemap.xml`을 생성합니다. 각 페이지에는 대표 주소와 링크 미리보기 태그도 추가합니다.
프로젝트 루트의 설정 파일에 배포 주소를 지정합니다.

## Public site URL

`for-humanity.config.ts`에 배포할 주소를 지정합니다.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    url: "https://docs.example.com",
} satisfies SiteConfig;
```

`url`에는 HTTP(S) 도메인의 루트 주소를 사용합니다. 하위 경로, 사용자 이름, 비밀번호, query, hash는 넣지 않습니다.
예를 들어 `https://docs.example.com`은 가능하고 `https://example.com/docs/`는 사용할 수 없습니다.

하위 경로 배포는 `url: "https://example.com"`, `basePath: "/docs/"`로 지정합니다. `basePath`는 `0.17.0`부터 지원합니다.
대표 주소, 링크 미리보기 이미지와 사이트맵에 배포 경로가 함께 적용됩니다.

## Build the files

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

기본 출력은 `content/dist/robots.txt`와 `content/dist/sitemap.xml`입니다. 두 파일을 나머지 빌드 결과와 함께 배포합니다.

`basePath: "/docs/"`라면 두 파일의 배포 주소는 `/docs/robots.txt`와 `/docs/sitemap.xml`입니다.
검색 엔진은 도메인 루트의 `/robots.txt`를 조회하므로 하위 경로의 robots 파일만으로 도메인 정책을 제어할 수는 없습니다.
GitHub 프로젝트 사이트에서는 생성한 사이트맵 URL을 검색 엔진에 직접 등록할 수 있습니다.

`url`을 생략하면 두 파일을 생성하지 않습니다. 설정을 바꾼 뒤에는 다시 빌드합니다.

## What is included

`robots.txt`는 크롤링 안내와 사이트맵 주소를 포함합니다.

```text
User-agent: *
Allow: /

Sitemap: https://docs.example.com/sitemap.xml
```

사이트맵에는 홈과 공개 문서의 URL을 포함합니다. 제목 앵커, 이미지, 글꼴은 포함하지 않습니다.
frontmatter의 마지막 날짜(`revised`, 없으면 `created`)를 `2026-10-05`처럼 날까지 적은 문서는 그 날짜를 `<lastmod>`로 받습니다. 사이트맵 형식은 날까지 적은 날짜가 필요하므로 `2026-10`처럼 달까지만 적은 날짜는 넣지 않습니다. 날짜는 파일 수정 시각이 아니라 frontmatter에 적은 값이며 홈에는 `<lastmod>`가 없습니다. [Writing](writing.md#dates)을 참고합니다.
`locales`를 설정하면 각 언어의 홈 주소도 포함합니다. 두 언어 이상으로 존재하는 페이지에는 언어별 `xhtml:link` 대체 링크를 넣고 기본 언어는 `x-default`로도 표시합니다. 같은 대체 링크를 페이지 head의 `<link rel="alternate" hreflang>`으로도 출력합니다. [Settings](settings.md#languages)를 참고합니다.
공개 빌드에서는 private 문서를 제외합니다. 로컬 dev에서는 양쪽 문서가 표시됩니다.

각 페이지의 `<head>`에는 사이트맵과 같은 주소의 `<link rel="canonical">`과 링크 미리보기용 Open Graph, Twitter 카드 태그를 추가합니다. 미리보기의 제목과 설명은 문서의 `name`과 `label`, 홈은 사이트의 `title`과 `description`입니다.

`image`를 지정하면 모든 페이지의 미리보기에 같은 이미지를 표시합니다. 경로는 `image: "asset/preview.png"`처럼 문서 루트를 기준으로 적습니다.
`image`가 있으면 Twitter 카드를 `summary_large_image`로 두어 Slack과 X도 작은 썸네일 대신 미리보기 너비로 이미지를 보여 줍니다. 대부분의 서비스에는 1200×630 이미지가 맞습니다. `image`가 없으면 카드는 `summary`로 남습니다.
PNG, JPEG, GIF, WebP 파일을 사용합니다. 미리보기 서비스 대부분은 SVG를 표시하지 않습니다. 공개 빌드에서는 private 폴더의 이미지를 사용할 수 없습니다.

`url`을 사용하면 `robots.txt`와 `sitemap.xml`은 생성 파일 전용 경로입니다. `robots.txt.md`처럼 같은 출력 경로를 만드는 문서 이름은 사용할 수 없습니다.

## Verify the deployment

브라우저나 다음 명령으로 배포 결과를 확인합니다.

```sh
curl -i https://docs.example.com/robots.txt
curl -i https://docs.example.com/sitemap.xml
```

두 주소가 `200`을 반환하는지, 사이트맵의 주소가 실제 배포 주소와 일치하는지 확인합니다.
호스팅 서비스가 robots.txt를 추가하거나 수정한다면 배포된 응답을 기준으로 확인합니다.

두 파일은 크롤러에게 문서 위치를 알려 주지만 검색 결과 노출을 보장하지는 않습니다. `robots.txt`는 접근 제어 수단도 아닙니다. 공개하지 않을 문서는 배포 결과에서 제외합니다.
