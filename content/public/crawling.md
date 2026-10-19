---
name: Crawling
label: 검색 엔진에 공개 문서 주소 알리기
group: Guide
parent: settings
order: 10
---

사이트 주소를 `url`로 설정하면 `robots.txt`와 `sitemap.xml`을 생성합니다.
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

`url`에는 HTTP(S) 도메인의 루트 주소를 사용합니다. 하위 경로·사용자 이름·비밀번호·query·hash는 넣지 않습니다.
예를 들어 `https://docs.example.com`은 가능하고 `https://example.com/docs/`는 사용할 수 없습니다.

## Build the files

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

기본 출력은 `content/dist/robots.txt`와 `content/dist/sitemap.xml`입니다. 두 파일을 나머지 빌드 결과와 함께 배포합니다.

`url`을 생략하면 두 파일을 생성하지 않습니다. 설정을 바꾼 뒤에는 다시 빌드합니다.

## What is included

`robots.txt`는 크롤링 안내와 사이트맵 주소를 포함합니다.

```text
User-agent: *
Allow: /

Sitemap: https://docs.example.com/sitemap.xml
```

사이트맵에는 홈과 공개 문서의 URL을 포함합니다. 제목 앵커·이미지·글꼴은 포함하지 않습니다.
공개 빌드에서는 private 문서를 제외합니다. 로컬 dev에서는 양쪽 문서가 표시됩니다.

`url`을 사용하면 `robots.txt`·`sitemap.xml`은 생성 파일 전용 경로입니다. `robots.txt.md`처럼 같은 출력 경로를 만드는 문서 이름은 사용할 수 없습니다.

## Verify the deployment

브라우저나 다음 명령으로 배포 결과를 확인합니다.

```sh
curl -i https://docs.example.com/robots.txt
curl -i https://docs.example.com/sitemap.xml
```

두 주소가 `200`을 반환하는지, 사이트맵의 주소가 실제 배포 주소와 일치하는지 확인합니다.
호스팅 서비스가 robots.txt를 추가하거나 수정한다면 배포된 응답을 기준으로 확인합니다.

두 파일은 크롤러에게 문서 위치를 알려 주며 검색 결과 노출을 보장하지 않습니다. `robots.txt`는 접근 제어 수단도 아닙니다. 공개하지 않을 문서는 배포 결과에서 제외합니다.
