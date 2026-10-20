import type {z} from "zod";

/**
 * 스키마 검증 실패의 한 줄 요약. 항목 경로와 이유를 쉼표로 연결
 */
export const toIssueText = (error: z.ZodError) => {
    return error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join(", ");
};
