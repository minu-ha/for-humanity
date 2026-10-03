---
name: Releases
label: 공식 릴리스
group: Releases
order: 0
---

공식 npm 패키지와 GitHub 릴리스. 버전별 변경 사항은 [Changelog](changelog.md).

## Latest release

[![npm version](https://img.shields.io/npm/v/for-humanity?style=flat-square)](https://www.npmjs.com/package/for-humanity)

[npm 패키지](https://www.npmjs.com/package/for-humanity) · [최신 GitHub Release](https://github.com/minu-ha/for-humanity/releases/latest) · [전체 릴리스](https://github.com/minu-ha/for-humanity/releases)

정식 버전은 npm과 같은 `vX.Y.Z` 태그로 공개. GitHub Release에는 해당 버전의 변경 기록, 설치 명령, npm 링크와 같은 패키지 `.tgz` 첨부.
지원 명령은 `dev`, `build`, `preview`. Node.js 22 이상 필요. `init`, 검색과 URL 하위 경로 배포는 [Roadmap](roadmap.md)의 예정 작업.

## Install and update

최신 공개 버전을 설치하고 프로젝트에 정확한 버전으로 저장:

```sh
pnpm add -D --save-exact for-humanity@latest
```

이미 사용하는 프로젝트도 같은 명령으로 업데이트. 새 버전의 [Changelog](changelog.md)를 읽고 문서 빌드 확인:

```sh
pnpm exec for-humanity build docs
pnpm exec for-humanity preview docs
```

새 npm 버전의 공개만으로 다른 프로젝트의 고정된 의존성 버전이 바뀌지는 않음.
설치 버전의 명령과 설정은 [Commands](commands.md) · [Settings](settings.md).

## Documentation and versions

| Channel | Published content |
| ------- | ----------------- |
| 이 문서 사이트 | `main`의 최신 문서 · 변경 시 자동 배포 |
| npm | 정식 버전 태그의 패키지 · 버전마다 README와 변경 기록 포함 |
| GitHub Release | 같은 버전의 배포 기록 · 변경 사항과 패키지 파일 |

사이트에는 다음 릴리스에서 반영할 문서가 먼저 표시될 수 있음. 설치한 버전의 지원 범위와 변경 사항은 해당 npm 버전과 GitHub Release에서 확인.
npm의 README와 홈페이지 주소는 새 패키지 버전을 배포할 때 갱신 · [npm README 규칙](https://docs.npmjs.com/about-package-readme-files/).

## Version policy

- 문서·메타데이터 갱신과 버그 수정: patch 버전 증가.
- 새 기능과 지원 범위 확장: minor 버전 증가.
- 호환성에 영향을 주는 변경: Changelog에 변경 내용과 필요한 이전 작업 명시.

현재 `0.x` prototype 단계. 명령·문서 문법·설정의 호환성 변경 여부를 버전별 기록에서 확인.
기여와 공개 절차는 [Maintenance](maintenance.md#packaging-and-release).
