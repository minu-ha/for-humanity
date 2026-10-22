import {toInitPanel} from "@/entry/init/_function/to-init-panel";
import type {InitPanelParams} from "@/entry/init/_type/init-panel";

/**
 * 터미널 폭에 맞춘 초기화 안내 박스 출력
 */
export const printInitPanel = (params: InitPanelParams) => {
    process.stdout.write(toInitPanel({...params, columns: process.stdout.columns}));
};
