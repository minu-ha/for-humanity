import {init_panel_style, init_panel_width} from "@/entry/init/_constant/init";
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
}

/**
 * 좁은 터미널의 일반 로그와 Consola 박스 표시
 */
export const printInitPanel = (params: InitPanelParams) => {
    if (process.stdout.columns !== undefined && process.stdout.columns < init_panel_width) {
        logger.info(`${params.title}\n${params.message}`);

        return;
    }

    logger.box({...params, style: init_panel_style});
};
