import {z} from "zod";
import {doc_type} from "@/constant/doc";

/**
 * 문서 frontmatter 스키마 · 검증 실패 시 빌드 중단
 */
export const docDataSchema = z.object({
    /**
     * 영어 이름 · 제목·목록·카드 · 첫 글자 표지는 문서 간 고유
     */
    name: z.string().trim().min(1),
    /**
     * 짧은 문서 설명 · 카드와 사이드바 툴팁
     */
    label: z.string(),
    /**
     * 문서 종류 · blueprint 전용 표현 미구현
     */
    type: z.enum(doc_type).default(doc_type.document),
    /**
     * 첫 화면 카드와 문서 머리의 묶음
     */
    group: z.string(),
});

/**
 * 기본값을 적용한 문서 frontmatter
 */
export type DocData = z.infer<typeof docDataSchema>;
