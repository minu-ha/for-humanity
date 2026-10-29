/**
 * 조작부 버튼 입력
 */
interface ButtonParams {
    /**
     * 보이는 글자. 아이콘 버튼은 빈 문자열
     */
    label: string;

    /**
     * 누름 처리
     */
    onClick: () => void;

    /**
     * 위젯 해제에서 끊는 구독
     */
    signal: AbortSignal;
}

/**
 * type=button인 조작부 버튼. 폼 제출 없음
 */
export const toButton = (params: ButtonParams): HTMLButtonElement => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = params.label;
    button.addEventListener("click", params.onClick, {signal: params.signal});

    return button;
};
