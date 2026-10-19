---
name: Getting started
label: 문서 작성과 공개 범위
group: Guide
order: 10
---

# Getting started

`content/public`은 공개 문서, `content/private`는 로컬 전용 문서입니다.
공용 이미지와 첨부는 `content/asset`, 내부 자료는 `content/private/asset`에 보관합니다.

프로젝트 루트에서 실행합니다.

```sh
pnpm exec for-humanity dev
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

`dev`는 전체 문서, `build`와 `preview`는 공개 결과를 제공합니다.
배포할 폴더는 `content/dist`입니다. `content` 전체를 업로드하지 않습니다.
`private`는 사이트 배포 제외이며 Git 저장소 접근 제어가 아닙니다.

설정은 프로젝트 루트의 `for-humanity.config.ts`, 홈은 `content/README.md`입니다.
공개 문서의 URL에는 `public`이 붙지 않습니다. 이 문서는 `/getting-started/`에서 확인할 수 있습니다.
