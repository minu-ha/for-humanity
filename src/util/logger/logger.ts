import {createConsola} from "consola";
import {copy_error_prefix} from "@/constant/copy";

/**
 * CLI와 문서 처리의 공통 로그. Vite·브라우저 콘솔과 분리
 */
export const logger = createConsola({formatOptions: {date: false}}).withTag(copy_error_prefix);
