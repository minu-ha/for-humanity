import type {FxCopy} from "@/component/widget/fx/_type/copy";

/**
 * 조작부 문구. 페이지 언어의 기본 하위 태그가 ko면 한국어, 그 밖은 영어
 */
export const copy_fx: Record<"en" | "ko", FxCopy> = {
    en: {
        play: "Play",
        pause: "Pause",
        previous: "Previous step",
        next: "Next step",
        step: "Step",
        run: "Run",
        edit: "Edit code",
        close: "Close editor",
        reset: "Reset code",
        code: "Code to run",
        empty: "Console output appears here after you run the code",
    },
    ko: {
        play: "재생",
        pause: "멈춤",
        previous: "이전 단계",
        next: "다음 단계",
        step: "단계",
        run: "실행",
        edit: "코드 고치기",
        close: "고치기 닫기",
        reset: "처음 코드로",
        code: "실행할 코드",
        empty: "실행하면 콘솔 출력이 여기에 나온다",
    },
};
