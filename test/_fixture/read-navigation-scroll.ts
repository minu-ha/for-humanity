import type {Page} from "@playwright/test";
import {z} from "zod";
import {storage_scroll_key} from "@/store/navigation/_constant/storage";

/**
 * 브라우저에 저장한 원문을 읽어 단언에 사용할 위치 추출
 */
export const readNavigationScroll = async (page: Page) => {
    const serialized = await page.evaluate((key) => sessionStorage.getItem(key), storage_scroll_key);

    if (serialized === null) {
        return undefined;
    }

    return z.object({state: z.object({positions: z.record(z.string(), z.object({documents: z.number(), outline: z.number()}))})}).parse(JSON.parse(serialized)).state.positions;
};
