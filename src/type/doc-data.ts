import {z} from "zod";
import {doc_order_default, doc_type} from "@/constant/doc";
import {groupPathSchema} from "@/type/group-path";

/**
 * 문서 frontmatter 스키마 · 검증 실패 시 빌드 중단
 */
export const docDataSchema = z.object({
    /**
     * 문서 이름 · 제목·목록 · 같은 첫 글자 허용
     */
    name: z.string().trim().min(1),
    /**
     * 짧은 문서 설명 · 사이드바 툴팁
     */
    label: z.string(),
    /**
     * 문서 종류 · blueprint 전용 표현 미구현
     */
    type: z.enum(doc_type).default(doc_type.document),
    /**
     * 사이드바의 문서 묶음 경로 · 문자열도 배열로 정규화
     */
    group: groupPathSchema,
    /**
     * 같은 묶음 안의 부모 문서 id · 확장자 제외, ./·../ 상대 경로도 허용
     */
    parent: z.string().trim().min(1).optional(),
    /**
     * 묶음 안의 읽는 순서 · 미지정 문서는 뒤에서 이름순
     */
    order: z.number().int().nonnegative().default(doc_order_default),
});

/**
 * 기본값을 적용한 문서 frontmatter
 */
export type DocData = z.infer<typeof docDataSchema>;
