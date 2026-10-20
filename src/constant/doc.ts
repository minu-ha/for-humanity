/**
 * 기존 frontmatter type의 호환 값. 모두 같은 Markdown 렌더링
 *
 *   - 새 문서는 type 생략 권장
 */
export const doc_type = {
    document: "document",
    blueprint: "blueprint",
} as const;

/**
 * frontmatter가 없는 문서의 메타 입력. 필수 항목 누락으로 검증 실패
 */
export const doc_data_absent = {};

/**
 * 순서 미지정 문서는 번호가 있는 문서 뒤에서 이름순 배치
 */
export const doc_order_default = Number.MAX_SAFE_INTEGER;
