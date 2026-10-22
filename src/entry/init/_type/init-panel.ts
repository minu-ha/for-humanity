import type {ColorName} from "consola/utils";

/**
 * 안내와 대화형 질문에 공유하는 터미널 박스
 */
export interface InitPanelParams {
    /**
     * 테두리 위에 표시할 제목
     */
    title: string;
    /**
     * 줄바꿈과 색상을 포함한 본문
     */
    message: string;
    /**
     * 실제 출력 터미널의 열 수
     */
    columns?: number;
    /**
     * 미지정 시 청록색 테두리
     */
    color?: ColorName;
}
