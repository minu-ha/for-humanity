/**
 * 문서 종류 · document 글 정리, blueprint 화면 설계
 * blueprint 전용 표현 미구현
 */
export const doc_type = {
    document: "document",
    blueprint: "blueprint",
} as const;

/**
 * 순서 미지정 문서는 번호가 있는 문서 뒤에서 이름순 배치
 */
export const doc_order_default = Number.MAX_SAFE_INTEGER;
