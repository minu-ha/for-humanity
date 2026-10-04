---
name: Crawling
label: 공개 사이트의 robots.txt와 사이트맵
group: Guide
parent: settings
order: 10
---

검색 엔진과 AI 에이전트가 공개 문서의 위치를 찾도록 안내합니다.
`url`을 설정한 사이트에서만 `robots.txt`와 `sitemap.xml`을 생성합니다. **npm `0.6.0`부터 지원하는 기능입니다.**

## Public site URL

문서 폴더의 `for-humanity.config.mjs`에 배포할 사이트의 루트 URL을 지정합니다.

```js
export default {
    title: "My documentation",
    url: "https://docs.example.com",
};
```

`http:`·`https:` URL을 지원하고 끝의 `/`는 정규화합니다. 사용자 이름·비밀번호, 하위 경로, query, hash는 허용하지 않습니다. 현재 정적 출력은 도메인 루트(`/`) 배포만 지원합니다.

```sh
pnpm exec for-humanity build docs
pnpm exec for-humanity preview docs
```

빌드 결과의 `docs/dist/robots.txt`와 `docs/dist/sitemap.xml`을 다른 파일과 함께 배포합니다. `dev`에서도 같은 루트 주소로 확인할 수 있고, 문서 추가·삭제가 사이트맵에 반영됩니다. 설정 파일을 수정했다면 개발 서버를 다시 시작합니다.

`url`을 생략하면 두 파일을 생성하지 않습니다. 자신의 공개 URL을 명시하므로 다른 프로젝트의 도메인을 기본값으로 사용하지 않습니다. 파일 생략은 접근 제한이 아닙니다. 비공개 문서를 게시할 때는 별도의 인증·접근 제어가 필요합니다.

## Robots and sitemap

생성되는 `robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://docs.example.com/sitemap.xml
```

공개 페이지를 크롤링할 수 있음을 안내하고 사이트맵 위치를 제공합니다. 사이트맵에는 홈(`/`)과 실제 문서의 URL을 한 번씩 포함합니다. 중첩 폴더와 한글·공백 경로를 URL에 맞게 인코딩합니다.

그룹·부모 문서 관계는 파일 URL을 바꾸지 않으며, 헤딩 앵커와 CSS·글꼴·이미지는 사이트맵에 추가하지 않습니다. 수정 시각을 정확히 알 수 없으므로 빌드 날짜를 `lastmod`로 표시하지 않습니다.

`url`을 지정했다면 첫 경로 `robots.txt`·`sitemap.xml`은 생성 파일 전용입니다. `robots.txt.md`·`sitemap.xml/guide.md` 같은 문서는 출력 충돌로 오류가 납니다. `url`이 없는 기존 프로젝트에는 이 추가 예약을 적용하지 않습니다.

`robots.txt`는 크롤러에 전하는 요청이며 실제 접근을 차단하지 않습니다. [Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309) · [Sitemap XML 규격](https://www.sitemaps.org/protocol.html).

## Cloudflare settings

Cloudflare의 Managed robots.txt를 켰다면 Cloudflare가 자신의 내용과 사이트의 파일을 함께 제공할 수 있습니다. 배포 후 최종 응답에서 `Sitemap:` 줄이 있는지 확인합니다. [Cloudflare robots.txt 설정](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/).

| Diagnostic item | Where to configure |
| --- | --- |
| robots.txt · Sitemap | 라이브러리의 `url` 설정 · 자동 생성 |
| AI Crawler Rules | Cloudflare에서 허용·차단할 AI 봇 선택 |
| Content Signals | 사이트 소유자가 검색·AI 입력·학습 용도의 정책 선택 |
| Markdown Negotiation | Cloudflare Markdown for Agents 또는 호스팅 계층의 `Accept` 응답 분기 |
| API Catalog · Auth.md · OAuth · MCP · WebMCP | API·인증·도구를 제공하는 서비스에서 필요한 항목 선택 |

이 라이브러리는 학습 허용·차단 같은 콘텐츠 정책을 자동으로 선언하지 않습니다. Cloudflare 정책과 파일의 안내는 서로 다른 역할이며, 봇의 접근을 제한하려면 Cloudflare의 해당 설정을 함께 확인합니다. [AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/).

## Markdown for agents

Cloudflare의 Markdown for Agents는 `Accept: text/markdown` 요청에 HTML을 Markdown으로 변환해 응답하는 기능입니다. 단순히 `robots.txt`를 추가하거나 `.md` 파일을 배포하는 것과는 다릅니다. [Cloudflare 공식 안내](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).

현재 CLI의 페이지 응답은 HTML입니다. 원본 Markdown 내보내기, `llms.txt`, Markdown content negotiation은 이번 자동 생성 기능에 포함하지 않습니다. 정적 호스팅에서 요청 헤더에 따라 응답을 바꾸려면 호스팅 기능이나 Worker·Pages Functions 같은 처리가 필요합니다.

## Check the deployed output

```sh
curl -i https://docs.example.com/robots.txt
curl -i https://docs.example.com/sitemap.xml
curl -i -H 'Accept: text/markdown' https://docs.example.com/
```

첫 두 주소는 각각 텍스트와 XML로 `200` 응답하는지 확인합니다. Markdown 협상을 사용한다면 마지막 요청의 `Content-Type`이 `text/markdown`인지 확인합니다. Cloudflare 진단은 배포와 캐시 반영 후 다시 스캔합니다.
