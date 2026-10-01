/**
 * 테마 종류 · system은 data-theme 없이 OS 설정 사용
 */
export const theme_mode = {
	system: "system",
	light: "light",
	dark: "dark",
} as const;

/**
 * 테마 버튼의 순환 순서
 */
export const theme_order = [theme_mode.system, theme_mode.light, theme_mode.dark] as const;

/**
 * 테마 저장 키 · HTML 머리에서 읽기, 버튼에서 쓰기
 */
export const theme_storage_key = "fh-theme";
