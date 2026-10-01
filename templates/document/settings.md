---
name: Settings
label: 사이트 설정
group: 작성
---

문서 폴더의 `for-humanity.config.mjs`. 제목, 소개, 상태 표지 설정.
설정 파일과 각 항목 모두 선택. 생략한 값은 기본값 적용.

## 한눈에

```js
export default {
  title: "for-humanity",
  description: "사람이 읽는 문서를 위한 Markdown 킷",
  status: [
    {phrase: "확인됨", kind: "verified", date: true},
    {phrase: "확인되지 않았다", kind: "unverified"},
  ],
};
```

검증은 명령 시작 시 한 번. 개발 중 설정 변경은 서버 재시작 필요.

::part[항목]

## 사이트

| Key | Use | Default |
| --- | --- | --- |
| `title` | 사이드바 이름 · 탭 제목 | `Documents` |
| `description` | 첫 화면 소개 | 생략 |

## 상태 표지

| Key | Value | Use |
| --- | --- | --- |
| `phrase` | 비어 있지 않은 상태 문구 | 본문에서 찾을 글 |
| `kind` | `verified` / `unverified` | 초록 / amber |
| `date` | 선택 boolean | 뒤의 `YYYY-MM-DD` 날짜 포함 여부 |

- 기본 문구: `확인됨`, `확인되지 않았다`
- `status` 지정 시 기본 목록 전체 교체
- `status: []` = 상태 표지 없음
- 괄호로 감싼 문구 → 괄호 없이 표지 표시
- 제목, 링크, 코드 안 문구 → 원문 유지

### 표시 예시

| Source | Result |
| --- | --- |
| `확인됨 2026-10-01` | 확인됨 2026-10-01 |
| `(확인되지 않았다)` | (확인되지 않았다) |

::part[표현]

## 테마와 글꼴

테마는 읽는 사람의 선택. 시스템 → 밝게 → 어둡게 순환, 브라우저에 저장.

- 본문: Pretendard Variable
- 코드·절 번호·라벨·흐름도: JetBrains Mono Variable
- 글꼴 파일: 빌드 결과 포함 · CDN 요청 없음
- 색과 간격: `src/style/token.css` · [Design](design.md)
