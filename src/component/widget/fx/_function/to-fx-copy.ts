import {copy_fx} from "@/component/widget/fx/_constant/copy";
import type {FxCopy} from "@/component/widget/fx/_type/copy";

/**
 * 페이지 언어의 조작부 문구. 날짜 라벨과 같은 규칙으로 기본 하위 태그 ko만 한국어
 *
 *   - 언어 태그가 비었거나 잘못돼 Intl.Locale이 던지면 영어
 */
export const toFxCopy = (lang: string): FxCopy => {
    try {
        return new Intl.Locale(lang).language === "ko" ? copy_fx.ko : copy_fx.en;
    } catch {
        return copy_fx.en;
    }
};
