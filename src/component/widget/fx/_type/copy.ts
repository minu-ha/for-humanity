/**
 * 조작부 문구 한 벌
 */
export interface FxCopy {
    /**
     * 재생 아이콘 버튼의 이름
     */
    play: string;

    /**
     * 멈춤 아이콘 버튼의 이름
     */
    pause: string;

    /**
     * 이전 단계 아이콘 버튼의 이름
     */
    previous: string;

    /**
     * 다음 단계 아이콘 버튼의 이름
     */
    next: string;

    /**
     * 스크러버의 이름
     */
    step: string;

    /**
     * 실행 상자의 실행 버튼
     */
    run: string;

    /**
     * 실행 상자의 코드 입력 열기
     */
    edit: string;

    /**
     * 실행 상자의 코드 입력 닫기
     */
    close: string;

    /**
     * 실행 상자의 처음 코드로 되돌리기
     */
    reset: string;

    /**
     * 코드 입력 상자의 이름
     */
    code: string;

    /**
     * 출력이 비었을 때의 안내
     */
    empty: string;
}
