import type {SiteConfig} from "for-humanity";

/**
 * 프로젝트 문서 설정, 모든 항목 선택
 */
export default {
    content: {root: "content", public: "public", private: "private"},
    title: "for humanity",
    url: "https://for-humanity.fyi",

    // 링크 미리보기 이미지. favicon 픽셀 얼굴의 PNG
    image: "asset/preview.png",

    description: "Markdown으로 문서를 작성하고 정적 사이트로 공유하는 문서 도구. 설치와 실행, 문서 작성, 사이트 설정과 배포 방법.",
    navigation: ["Start", "Guide", "Updates", "Examples", "Development"],

    // 기본 비활성인 데스크톱 커서 장식 사용
    cursorFace: true,

    // 확인 문구 뒤의 YYYY-MM-DD 날짜까지 상태 표지에 포함
    status: [
        {phrase: "확인됨", kind: "verified", date: true},
        {phrase: "확인되지 않았다", kind: "unverified"},
    ],
} satisfies SiteConfig;
