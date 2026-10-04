/*
 * 프로젝트 문서 설정 · 모든 항목 선택
 */
export default {
    title: "for humanity",
    url: "https://for-humanity.fyi",
    description: "Markdown으로 문서를 작성하고 정적 사이트로 공유하는 문서 도구. 설치와 사용법, 작성 가이드, API와 가상 프로젝트 예시.",
    navigation: ["Getting started", "Guide", "Reference", "Releases", "Examples", "Development"],
    // 상태 표지 문구 · date: 뒤의 YYYY-MM-DD 날짜 포함
    status: [
        {phrase: "확인됨", kind: "verified", date: true},
        {phrase: "확인되지 않았다", kind: "unverified"},
    ],
};
