---
name: Locales
label: 번역 문서 폴더, URL 접두, 언어 전환 계약
group: Development
---

# Locales

기본 언어 하나와 번역 언어 여럿을 한 사이트에서 제공하는 계약. VitePress의 방식과 같이 기본 언어는 루트 URL, 번역은 `/<code>/` 접두 폴더에 같은 파일명으로 둔다.
문서 영역만 번역 대상이다. 사이드바와 상태 화면의 UI 문구는 언어 중립이거나 영어이며 별도 번역 계층을 두지 않는다.
예외는 문서 머리의 날짜 라벨이다. 본문 첫 줄의 일부라 페이지 언어의 기본 하위 태그가 `ko`면 `처음 작성`, `다시 정리`, 그 밖은 `Created`, `Revised`를 쓴다. 날짜 값은 적은 그대로 둔다.

상태: 구현과 검증 완료(2026-10-26). 공식 사이트는 영어가 기본 언어, 한국어가 `/ko/` 번역.

## Contracts

- 기본 언어는 기존 설정 그대로. `lang`, `description`, `content/README.md`, `content/<public>`, `content/<private>`.
- `locales`는 번역 언어 설정. 키는 소문자 BCP 47 언어 태그이며 문서 폴더 이름, URL 접두, `html lang`을 겸한다. 값은 그 언어 홈의 `description` 하나. 생략 시 번역 없음.
- 번역 폴더는 `content/<code>/README.md`와 `content/<code>/<public>/`. 내부 문서는 미러링하지 않고 `content/asset`은 모든 언어가 공유한다. 폴더가 없는 번역 언어는 홈 안내만 표시한다.
- 번역 문서 id는 `<code>/<상대 id>`, URL은 `/<code>/<상대 id>/`, 홈은 `/<code>/`. 같은 상대 경로의 파일이 같은 문서의 번역이다. 별도 연결 메타데이터는 두지 않는다.
- 기본 언어 공개 문서의 첫 경로 조각은 언어 코드를 쓸 수 없다. `private`과 같은 예약이다.
- frontmatter `parent`의 일반 id는 같은 언어 안에서 해소한다. 상대 참조는 파일 위치 기준이며, 다른 언어 문서를 부모로 지정하면 오류다.
- 사이드바는 현재 언어의 문서만 보이고 사이트 이름은 현재 언어의 홈으로 연결한다. 언어판이 둘 이상인 페이지는 본문 제목 위의 언어 줄에서 각 언어판으로 이동하며 현재 언어는 링크 없이 표시한다. 번역이 없는 페이지에는 언어 줄이 없다.
- 페이지의 `html lang`은 언어 코드. 홈 설명은 언어별 `description`, 문서 설명은 각 문서의 `label`.
- `url`을 지정한 사이트는 번역이 둘 이상인 페이지에 `hreflang` 대체 링크를 head와 사이트맵에 출력한다. `x-default`는 기본 언어판이다. 사이트맵에는 번역 홈 주소도 포함한다.
- 공개 빌드와 dev는 번역 폴더를 기존 문서 루트 감시와 같은 방식으로 처리한다. 404, 자원, 크롤러 파일 경로는 바뀌지 않는다.

## Site plan

- 공식 사이트는 `lang: "en"`, `locales: {ko: {...}}`. 영어 문서는 `content/public`, 한국어 문서는 `content/ko/public`.
- 기존 한국어 URL은 같은 주소의 영어 문서로 응답한다. 리다이렉트는 두지 않는다.
- `README.md`는 영어 홈, `language/README.ko.md`는 `content/ko/README.md`로 동기화한다. `CHANGELOG.md`는 영어 본문 하나를 두 언어 폴더에 언어별 머리말로 생성한다.

## Implementation plan

### 1. Configuration and scope

- [x] `locales` 스키마와 공개 타입, 언어 코드 형식 오류 문구
- [x] `ContentScope.locales`와 번역 폴더의 실제 폴더 검사
- [x] `toContentId`의 번역 홈, 번역 공개 폴더, 기본 언어의 접두 예약

### 2. Collection and pages

- [x] `readDocs`의 번역 폴더 수집, `Doc.locale`, 같은 언어의 `parent` 해소와 언어 불일치 오류
- [x] 언어별 README 홈과 `/<code>/` 라우트
- [x] 셸의 `html lang`, 언어별 설명, `hreflang` 대체 링크
- [x] 현재 언어로 걸러낸 사이드바, 본문 위 언어 줄, 현재 언어 홈으로 가는 사이트 이름
- [x] 사이트맵의 번역 홈과 대체 링크

### 3. Site content

- [x] 한국어 공개 문서를 `content/ko/public`으로 이동, 영어 문서 작성
- [x] README와 변경 기록의 두 언어 동기화
- [x] Settings, Crawling, Content layout, Roadmap, CHANGELOG Unreleased 갱신

## Verification

- 설정 검증: 유효한 언어 코드, 대문자와 예약 이름 거부, 기본값 빈 목록.
- 문서 수집: 번역 id 접두, `locale` 값, 같은 언어 `parent`, 기본 언어의 접두 충돌 오류, 다른 언어 부모 오류.
- 페이지: 기본 홈과 번역 홈의 `lang`과 설명, 번역 문서의 `lang`, `url` 지정 시 `hreflang`과 `x-default`, 번역이 하나뿐인 문서의 대체 링크 생략.
- 탐색: 현재 언어 문서만 포함, 사이트 이름의 홈 경로. 본문 위 언어 줄은 언어판이 둘 이상일 때만, 현재 언어는 비링크 표시.
- 사이트맵: 번역 홈 주소, 문서별 대체 링크.
- 저장소: `pnpm test`, `pnpm check`, `pnpm build`, Playwright e2e, `git diff --check`, 가운뎃점 검사.

### Completed checks

- 단위와 node 검사: 36개 파일, 403개 검사 통과 (`pnpm test`). 새 검사는 DOC-015, DOC-016, DOC-017, HOM-003, CRW-006, SHL-013, NAV-028과 설정 스키마의 locales 검사.
- `pnpm check`, `pnpm build`, `git diff --check` 통과. 공개 출력 29개 HTML 페이지, `/ko/` 홈과 번역 12개, 사이트맵의 두 홈과 대체 링크.
- Playwright: 전체 65개 중 58개 통과 후 실패 7개를 수정하고 재실행해 16개 통과. 수정은 docs fixture의 `locales` 설정, DEV-003의 셸 치환 대상, 언어 줄 링크의 밑줄 고정(axe link-in-text-block). 언어 줄을 본문 위로 옮긴 뒤 셸, 탐색, 접근성, 상태 화면, 배포 경로 30개 재실행 통과.
- 가운뎃점 검사 0건.

## References

- VitePress i18n: https://vitepress.dev/guide/i18n
- Google의 다국어 페이지 안내: https://developers.google.com/search/docs/specialty/international/localized-versions
