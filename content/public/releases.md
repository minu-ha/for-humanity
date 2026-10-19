---
name: Releases
label: 설치 버전 확인과 업데이트
group: Releases
order: 0
---

패키지를 업데이트하기 전에 설치 버전과 변경 내용을 확인합니다.
버전별 변경 사항과 설치 파일은 [GitHub Releases](https://github.com/minu-ha/for-humanity/releases)에서 확인할 수 있습니다.

## Check your version

```sh
pnpm exec for-humanity --version
```

이 문서는 `0.14.0` 기준입니다. Node.js 22.12.0 이상이 필요하며, 이전 Node.js를 사용한다면 먼저 업데이트합니다.

`0.14.0`은 설정을 프로젝트 루트로 옮기고 문서를 공개·내부 폴더로 구분합니다. `0.13.1` 이하에서 업데이트할 때는 [Migration](migration.md)을 먼저 따라야 합니다.

## Update the package

공개 버전을 정확한 버전으로 설치합니다.

```sh
pnpm add -D --save-exact for-humanity@0.14.0
```

다른 공개 버전으로 업데이트하려면 명령의 버전 번호를 해당 버전으로 바꿉니다. 릴리스 안내에서 Node.js 요구 사항과 설정·명령의 변경 여부를 먼저 확인합니다.

이전을 마쳤다면 프로젝트 루트에서 빌드하고 확인합니다.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

공개 문서 링크, 그림, 사이드바를 확인한 뒤 `content/dist`를 배포합니다. 호스팅의 출력 경로도 새 경로로 변경합니다.

## Compatibility

현재는 `0.x` 버전입니다. minor 버전 업데이트에는 기존 문서나 설정을 수정해야 하는 변경이 포함될 수 있습니다. 설치한 버전의 릴리스 안내와 이전 절차를 확인합니다.

문서 사이트의 업데이트가 프로젝트에 설치된 패키지를 자동으로 업데이트하지는 않습니다.
사용 가능한 명령은 [Commands](commands.md), 설정은 [Settings](settings.md)에서 확인합니다.
