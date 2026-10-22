import {colors, stripAnsi} from "consola/utils";
import {init_panel_inset, init_panel_style} from "@/entry/init/_constant/init";
import {logger} from "@/util/logger/logger";

/**
 * 짧은 안내 박스의 내용
 */
interface InitPanelParams {
    /**
     * 박스 제목
     */
    title: string;
    /**
     * 실행 명령이나 시작 안내
     */
    message: string;
    /**
     * 완료 박스의 성공 색상
     */
    success?: boolean;
}

/**
 * 좁은 터미널의 일반 로그와 Consola 박스 표시
 */
export const printInitPanel = (params: InitPanelParams) => {
    const width = Math.max(stripAnsi(params.title).length, ...params.message.split("\n").map((line) => stripAnsi(line).length)) + init_panel_inset;

    if (process.stdout.columns !== undefined && width > process.stdout.columns) {
        logger.info(`${colors.bold(params.title)}\n${params.message}`);

        return;
    }

    logger.box({
        title: colors.bold(params.title),
        message: params.message,
        style: {...init_panel_style, borderColor: params.success === true ? "green" : init_panel_style.borderColor},
    });
};
