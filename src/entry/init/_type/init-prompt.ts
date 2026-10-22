import type {TextOptions} from "@clack/core";
import type {z} from "zod";

/**
 * 실제 설정값과 화면 표시를 구분한 초기화 추천값
 */
interface InitPreset<T> {
    /**
     * 선택 시 사용할 설정값
     */
    value: T;
    /**
     * 선택 메뉴에 표시할 이름
     */
    label: string;
    /**
     * 기본 선택이나 후보 출처의 안내
     */
    hint?: string;
}

/**
 * Clack이 소유하는 입력 스트림과 취소 신호
 */
type InitPromptConnection = Pick<TextOptions, "input" | "output" | "signal">;

/**
 * 질문이 활성화된 동안 보존하는 선택과 입력 버퍼
 */
export interface InitPromptSelection {
    /**
     * 추천값 또는 마지막 직접 입력 행의 위치
     */
    index: number;
    /**
     * 방향키 이동과 실제 텍스트 수정을 구분하는 직전 입력
     */
    input: string;
}

/**
 * 한 질문 안의 추천값, 직접 입력과 필드 검증
 */
export interface InitPromptParams<T> extends InitPromptConnection {
    /**
     * 박스 제목으로 표시할 질문
     */
    message: string;
    /**
     * 빈 직접 입력의 예시
     */
    placeholder?: string;
    /**
     * 첫 항목을 기본 선택으로 사용하는 추천값
     */
    presets: readonly InitPreset<T>[];
    /**
     * 확정 전 검증과 반환값 정규화
     */
    schema: z.ZodType<T>;
    /**
     * 직접 입력 허용 여부, 미지정 시 허용
     */
    custom?: boolean;
}
