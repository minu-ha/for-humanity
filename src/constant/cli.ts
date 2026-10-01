/**
 * 명령 이름을 빼고 부르면 도는 명령
 */
export const cli_default_command = "dev";

/**
 * 문서 폴더를 빼고 부르면 쓰는 폴더. 지금 폴더다
 */
export const cli_default_docs_dir = ".";

/**
 * 문서 폴더에서 찾는 설정 파일 이름. 없어도 된다
 */
export const cli_config_file_name = "for-humanity.config.mjs";

/**
 * 명령이 앱에 설정을 넘기는 가상 모듈. Astro 시절의 것이라 시험판이 합격하면 지운다
 */
export const cli_config_module_id = "virtual:for-humanity/config";

/**
 * dev 서버의 포트. Astro 의 기본값과 같다
 */
export const cli_dev_port = 4321;
