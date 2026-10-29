import type {FxCopy} from "@/component/widget/fx/_type/copy";

/**
 * 그림 하나를 살리는 입력
 */
export interface FxEnhanceParams {
    /**
     * data-fx를 가진 .fx 상자
     */
    root: HTMLElement;

    /**
     * 페이지 언어의 조작부 문구
     */
    copy: FxCopy;

    /**
     * 위젯 해제에서 끊는 이벤트 구독
     */
    signal: AbortSignal;
}

/**
 * 종류별 enhance. 되돌리는 함수를 돌려줌
 */
export type FxEnhance = (params: FxEnhanceParams) => () => void;
