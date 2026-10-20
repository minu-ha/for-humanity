import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {posix} from "node:path";

/**
 * 파일 내용으로 자원 URL을 구분하는 입력
 */
export interface AssetPathParams {
    /**
     * 사이트 루트 기준 기본 자원 경로
     */
    path: string;

    /**
     * 배포할 실제 파일 경로
     */
    file: string;
}

/**
 * 파일명에 내용 지문 추가. 같은 내용은 같은 URL, 변경한 내용은 새 캐시 키 사용
 */
export const toAssetPath = (params: AssetPathParams) => {
    const extension = posix.extname(params.path);

    return `${posix.dirname(params.path)}/${posix.basename(params.path, extension)}.${createHash("sha256").update(readFileSync(params.file)).digest("hex")}${extension}`;
};
