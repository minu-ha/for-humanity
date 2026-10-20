/**
 * 기본 문서 루트와 공개 범위 폴더
 */
export const content_default = {root: "content", public: "public", private: "private"};

/**
 * 문서와 참조에서 제외하는 생성물, 저장소, 설치 폴더. 대소문자 무시
 */
export const content_reserved_dirs: readonly string[] = ["dist", ".git", "node_modules"];

/**
 * 내부 문서 URL의 첫 경로 조각. 문서 id 생성과 공개 문서의 링크 검사가 공유
 */
export const content_private_segment = "private";
