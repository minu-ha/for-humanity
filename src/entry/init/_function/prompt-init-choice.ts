import {init_cancelled, init_copy, init_custom_choice} from "@/entry/init/_constant/init";
import {type InitTextParams, promptInitText} from "@/entry/init/_function/prompt-init-text";
import {logger} from "@/util/logger/logger";

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
 * 추천값 선택과 직접 입력이 공유하는 질문
 */
interface InitChoiceParams<T> extends InitTextParams<T> {
    /**
     * 첫 항목을 기본 선택으로 사용하는 추천값
     */
    presets: InitPreset<T>[];
}

/**
 * 추천값이 없으면 직접 입력, 있으면 선택 후 필요한 경우만 직접 입력
 */
export const promptInitChoice = async <T>(params: InitChoiceParams<T>): Promise<T> => {
    if (params.presets.length === 0) {
        return promptInitText(params);
    }

    const choices = params.presets.map((preset, index) => ({id: `preset-${index}`, preset}));
    const answer = await logger.prompt(params.message, {
        type: "select",
        initial: choices[0].id,
        options: [
            ...choices.map((choice) => ({value: choice.id, label: choice.preset.label, hint: choice.preset.hint})),
            {value: init_custom_choice, label: init_copy.custom, hint: init_copy.customHint},
        ],
        cancel: "symbol",
    });

    if (typeof answer === "symbol") {
        throw init_cancelled;
    }

    if (answer === init_custom_choice) {
        return promptInitText(params);
    }

    const selected = choices.find((choice) => choice.id === answer);

    if (selected === undefined) {
        throw new Error(`Unknown selection for ${params.message}. Run init again.`);
    }

    return params.schema.parse(selected.preset.value);
};
