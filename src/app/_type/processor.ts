import type {toProcessor} from "@/app/_function/to-processor/to-processor";

/**
 * 플러그인 조립을 마친 Markdown 처리기. 문서와 홈 읽기가 공유
 */
export type Processor = ReturnType<typeof toProcessor>;
