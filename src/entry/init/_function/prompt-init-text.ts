import type {z} from "zod";
import {init_cancelled} from "@/entry/init/_constant/init";
import {logger} from "@/util/logger/logger";

/**
 * 초기화 질문과 필드별 검증 계약
 */
interface InitTextParams<T> {
    /**
     * 사용자에게 표시할 질문
     */
    message: string;
    /**
     * Enter로 선택할 제안값
     */
    initial?: string;
    /**
     * 기본값이 없을 때의 입력 안내
     */
    placeholder?: string;
    /**
     * 필드의 검증과 정규화
     */
    schema: z.ZodType<T>;
}

/**
 * 취소를 구분하고 잘못된 입력만 다시 묻는 텍스트 질문
 */
export const promptInitText = async <T>(params: InitTextParams<T>): Promise<T> => {
    while (true) {
        const answer = await logger.prompt(params.message, {type: "text", default: params.initial, placeholder: params.initial ?? params.placeholder, cancel: "symbol"});

        if (typeof answer === "symbol") {
            throw init_cancelled;
        }

        const result = params.schema.safeParse(answer);

        if (result.success) {
            return result.data;
        }

        logger.warn(result.error.issues.map((issue) => issue.message).join(" "));
    }
};
