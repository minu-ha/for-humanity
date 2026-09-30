/**
 * 테마 값. 시스템은 data-theme 을 떼어 운영체제 설정을 따른다
 */
export const theme_mode = {
	system: "system",
	light: "light",
	dark: "dark",
} as const;

/**
 * 테마 단추가 도는 차례
 */
export const theme_order = [theme_mode.system, theme_mode.light, theme_mode.dark] as const;

/**
 * 고른 테마를 기억하는 localStorage 키. 머리의 인라인 스크립트가 읽고 테마 단추가 쓴다
 */
export const theme_storage_key = "fh-theme";
