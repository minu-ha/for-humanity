import type {createProcessor} from "@/app/_function/create-processor/create-processor";

/**
 * 플러그인 조립을 마친 Markdown 처리기. 문서와 홈 읽기가 공유
 */
export type Processor = ReturnType<typeof createProcessor>;
