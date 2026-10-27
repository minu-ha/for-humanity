---
name: Images
label: 로컬 이미지와 첨부, 경로 규칙
group: Guide
parent: writing
order: 20
---

로컬 이미지, 영상, 소리, 첨부를 문서 파일 위치 기준으로 참조합니다. 같은 파일을 dev와 정적 빌드에서 같은 내용 지문 URL로 제공합니다.
이미지의 설명과 출처는 일반 Markdown으로 작성합니다. 별도 Figure directive는 아직 없습니다.

## Relative paths

```mermaid
treeView-beta
content/
├── README.md
├── asset/
│   └── sample.svg
└── public/
    └── guide/
        └── screen.md
```

`content/public/guide/screen.md`에서는 다음과 같이 작성합니다.

```markdown
![가상 책 목록의 선택 상태](../../asset/sample.svg)

책장 이름과 선택 표시가 있는 가상 그림입니다.
[그림 크게 보기](../../asset/sample.svg)
```

아래 그림은 이 저장소의 가상 예시 자원입니다.

![가상 책 목록의 선택 상태](../../asset/sample.svg)

선택 책장을 이름과 강조선으로 구분하는 가상 그림입니다.
[그림 크게 보기](../../asset/sample.svg)

참조식 이미지와 원시 HTML의 `<img src="...">`에도 같은 상대 경로 규칙을 적용합니다. `srcset`의 각 후보와 `<video>`의 `poster`도 같은 규칙을 따릅니다. `<video>`, `<audio>`, `<source>`, `<track>`, `<embed>`의 `src`와 `<object>`의 `data`도 마찬가지입니다.
content의 README와 하위 문서를 동일하게 처리합니다. 참조하는 파일은 content 루트 안에 있어야 합니다. 공용 자료는 `content/asset`, 내부 자료는 `content/private/asset`에 보관합니다. 공개 빌드에서 private 자료를 참조하면 오류가 발생합니다.

## Narrow screens

문단에 이미지 하나만 있으면 그림으로 배치하고 표, 코드 블록과 같은 위아래 간격을 둡니다. SVG 그림은 Mermaid 다이어그램과 같은 테두리와 안쪽 여백이 있는 상자 가운데에 놓습니다.
640px보다 좁은 화면에서는 SVG 그림이 SVG 파일에 적은 `width`와 `height`를 유지하며 본문보다 넓으면 넓은 표처럼 가로로 스크롤합니다. 키보드로 그림에 초점을 옮겨 화살표 키로 스크롤할 수 있습니다. 더 넓은 화면에서는 원래 크기로 표시하고 본문보다 넓으면 본문 폭에 맞춰 줄입니다.
`viewBox`만 있는 SVG는 자체 크기가 없어 본문 폭을 채웁니다. 글자를 읽을 크기로 `width`와 `height`를 적습니다.
PNG, JPEG 같은 래스터 이미지는 촬영 배율에 따라 픽셀 크기가 달라서 항상 본문 폭에 맞춰 줄입니다. 문장 안의 이미지, 링크로 감싼 이미지, 속성을 적은 원시 HTML 문단의 이미지는 그림으로 배치하지 않습니다.

위 예시 그림은 너비가 560px이라 휴대폰에서는 가로로 스크롤해서 봅니다.

## Build and dev

참조된 파일만 `content/dist/_fh/media/`로 복사합니다. 전체 이미지 폴더나 주변 개인 파일을 자동으로 복사하지 않습니다.
URL에는 파일 내용 지문을 포함합니다. 내용과 확장자가 같은 파일은 같은 URL을 공유합니다. 파일을 바꾸면 URL도 바뀝니다.
상대 URL의 query와 hash 접미사는 유지합니다. 파일명에 공백이 있으면 링크에서 `%20`으로 쓸 수 있습니다.
로컬 PNG, JPEG, GIF, WebP, AVIF 이미지에는 원본 크기를 `width`와 `height`로 넣어 이미지를 불러오는 동안 본문이 밀리지 않게 합니다. `<img>`에 크기를 직접 적었다면 그대로 두고 SVG에는 넣지 않습니다.

문서 폴더에서 지원하는 그림과 첨부를 수정하거나 추가하면 dev가 다시 처리하고 페이지를 갱신합니다.
처음 참조할 때 없던 그림을 나중에 저장한 경우도 다시 확인합니다. 출력 폴더와 설치 폴더의 변경은 제외합니다.
새 이미지 링크를 추가했다면 Markdown을 저장합니다. 잘못된 경로를 저장하면 오류를 표시하고 직전 정상 페이지를 유지합니다.

## Supported files

이미지는 SVG, PNG, JPG/JPEG, GIF, WebP, AVIF 형식을 지원합니다. Markdown 이미지, `<img>`, `srcset`, `poster`에는 이 형식만 사용할 수 있습니다.
영상과 소리는 원시 HTML `<video>`, `<audio>`, `<source>`의 `src`에 MP4, WebM, MP3 형식으로 지정합니다.
자막은 `<track>`의 `src`에 WebVTT(`.vtt`) 형식으로 지정합니다. `<embed>`의 `src`와 `<object>`의 `data`에는 PDF와 위 이미지 형식을 사용할 수 있습니다.
첨부 링크에는 위 형식과 PDF, CSV, TXT, ZIP을 사용할 수 있습니다. 실행 파일, 프로젝트 소스, 설정 파일을 자동으로 배포하지 않습니다.
배포하지 않는 형식의 로컬 파일을 링크하면 빌드를 멈추지 않고 터미널에 파일과 줄 번호를 경고로 표시합니다. 로컬 파일을 가리키는 `<iframe>`도 배포할 수 없으므로 같은 경고를 표시합니다.

없는 로컬 이미지, 영상, 소리, 자막, 삽입 파일, 첨부는 빌드 오류입니다. 루트 밖 경로와 바깥을 가리키는 symlink도 마찬가지입니다.
이미지, 영상, 소리, 자막, 삽입 파일 자리에 지원하지 않는 형식을 넣어도 빌드가 실패합니다. PDF처럼 이미지가 아닌 파일은 첨부 링크로 연결합니다.
외부 URL, data URL, 사이트 루트 기준 절대 URL은 바꾸거나 내려받지 않습니다. 절대 URL의 파일은 작성자가 별도로 제공합니다.
Markdown 안의 CSS와 JS, SVG 내부의 외부 파일, CSS `url()` 의존성을 재귀 수집하지 않습니다. SVG는 그 자체로 표시할 수 있는 파일을 사용합니다.
