---
name: Release policy
label: 버전 선택과 패키지 공개 정책
group: Development
order: 50
---

버전, 호환성, 공개 시점의 내부 기준. 사용자 업데이트 안내는 [Changelog](../public/changelog.md), 검증과 배포 절차는 [Maintenance](maintenance.md#packaging-and-release).

## Development and release

Trunk-based development 사용. 검증한 작은 변경을 `main`에 자주 반영하고, `main`은 항상 빌드 가능한 상태로 유지.
상시 `develop`과 release 브랜치는 두지 않음. 필요한 짧은 작업 브랜치는 `main`에 합친 뒤 정리.
작은 변경의 잦은 통합과 지속적인 검증은 [DORA의 trunk-based development 안내](https://dora.dev/capabilities/trunk-based-development/) 참고.

`main` push마다 사이트 갱신. 커밋, push, 사이트 배포만으로 패키지 버전을 올리거나 npm에 공개하지 않음.
평소 `package.json`과 README 설치 명령은 마지막 공개 버전 유지. `main`에는 그 버전 이후의 미공개 변경이 포함될 수 있음.
외부 프로젝트에 설치할 패키지를 공개할 때, 배포할 커밋에서 버전을 한 번 결정하고 같은 버전 태그 생성.

### Release timing

| Change | Release timing |
| ------ | -------------- |
| 사이트 문서, 예시, 기여 지침 수정 | 사이트에 바로 반영, npm 릴리스는 필요에 따라 다음 공개에 포함 |
| 내부 정리와 개발 도구 수정 | `main`에 반영, 패키지 사용자의 동작이 바뀌지 않으면 다음 공개까지 모음 |
| 기능 추가와 일반 버그 수정 | 설치 사용자가 쓸 수 있는 기능 또는 수정 묶음이 준비되면 공개 |
| 설치 사용자에게 영향을 주는 긴급 오류 | 준비하고 검증한 수정으로 신속히 공개 |

정해진 커밋 수나 날짜에 따라 릴리스하지 않음. 설치 사용자가 받아야 하는 변경과 검증 결과를 기준으로 결정.
릴리스는 이전 태그 이후 배포할 커밋까지의 모든 변경을 포함. 긴급 수정도 함께 포함되는 기능과 호환성 변경을 기준으로 버전 결정.

### Unreleased changes

평소 `CHANGELOG.md`의 `Unreleased`에 설치와 업데이트 판단에 필요한 변경을 기록.
기능 추가, 사용자에게 보이는 수정, 호환성 변경, 런타임 요구사항 변경 포함. 단순 오타와 내부 정리까지 모든 커밋을 나열하지 않음.
호환성 변경에는 영향을 받는 명령, 문법, 설정과 이전 방법 명시.

릴리스 준비 시 모은 변경을 `X.Y.Z — YYYY-MM-DD` 항목으로 옮기고 `Unreleased`에서 제거.
같은 공개에 포함할 항목이 남지 않도록 확인. 다음 변경이 생기면 다시 `Unreleased`에 기록.
이미 공개한 버전의 항목에는 새 작업을 추가하지 않음. 기록의 오류는 정정할 수 있으나 해당 패키지와 태그는 유지.

## Version policy

[Semantic Versioning](https://semver.org/lang/ko/)의 `major.minor.patch` 형식 사용.
버전은 커밋마다 증가하지 않고 패키지 릴리스마다 증가. 마지막 공개 이후 전체 변경 중 가장 큰 영향을 기준으로 선택.

### Before 1.0

현재 `0.x` prototype 단계. SemVer는 이 단계의 공개 API 안정성을 보장하지 않으므로 다음 프로젝트 규칙 적용:

| Change in the release | Increment | Example |
| --------------------- | --------- | ------- |
| 기존 사용법을 유지하는 버그 수정, 동작을 유지하는 개선, 패키지 문서와 메타데이터 갱신 | Patch | `0.2.1 → 0.2.2` |
| 기존 사용법을 유지하는 기능 추가와 지원 범위 확장 | Minor 올림, patch는 0으로 초기화 | `0.2.1 → 0.3.0` |
| 기존 사용법의 호환성을 깨는 변경 | Minor 올림, patch는 0으로 초기화, 이전 안내 필수 | `0.2.1 → 0.3.0` |

호환성 판단 대상: 공개 CLI 명령과 옵션, Markdown 부품 문법, frontmatter와 사이트 설정, 요구하는 Node.js 버전, 문서 링크와 출력 경로.
기존 프로젝트가 빌드되려면 문서, 설정, 실행 환경을 고쳐야 하는 변경은 호환성 변경으로 기록.
일반적인 CSS 조정은 사용자에게 약속한 동작을 유지하는 범위에서 patch. 새 표현 기능을 추가하면 minor.

### From 1.0

명령, 문법, 설정의 공개 계약과 지원 범위를 정리하고, 그 호환성을 유지할 준비가 되면 `1.0.0` 공개.
이후 호환되는 버그 수정은 patch, 호환되는 기능 추가는 minor, 호환성을 깨는 변경은 major.

### Published artifacts

공개한 npm 버전과 Git 태그는 덮어쓰거나 다른 커밋으로 옮기지 않음. 수정은 새 버전으로 공개.
같은 태그의 재시도는 같은 패키지 파일임이 확인될 때만 허용.
현재 배포 자동화는 `vX.Y.Z` 태그만 지원. `beta`와 `rc` 같은 prerelease는 배포 정책과 워크플로를 추가한 뒤 사용.

정책 적용과 공개 순서는 [Maintenance](maintenance.md#packaging-and-release).
