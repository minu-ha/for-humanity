import {existsSync, statSync} from "node:fs";
import {extname, resolve} from "node:path";
import {copy_error_asset, copy_error_file_missing} from "@/app/_constant/copy";
import {asset_media_dir} from "@/constant/asset";
import type {ContentScope} from "@/type/content-scope";
import {assertContentPath} from "@/util/file/assert-content-path";
import {toAssetPath} from "@/util/file/to-asset-path";

/**
 * 설정 이미지의 배포 입력
 */
interface SiteImageParams {
    /**
     * 경로 해석과 공개 범위 검사의 문서 범위
     */
    scope: ContentScope;

    /**
     * dev 응답과 정적 복사가 공유하는 자원 URL별 파일 경로
     */
    files: Map<string, string>;

    /**
     * 설정에 적은 문서 루트 기준 이미지 경로
     */
    path: string;
}

/**
 * 설정 이미지의 내용 지문 URL과 배포 목록 등록
 *
 *   - 문서 이미지와 같은 공개 범위 검사, 같은 내용은 같은 URL
 *   - 없는 파일과 폴더는 빌드 실패
 */
export const toSiteImagePath = (params: SiteImageParams) => {
    const file = resolve(params.scope.root, params.path);

    assertContentPath({scope: params.scope, path: file});

    if (!existsSync(file) || !statSync(file).isFile()) {
        throw new Error(`${copy_error_asset}: ${params.path} (${copy_error_file_missing})`);
    }

    const path = toAssetPath({path: `${asset_media_dir}/asset${extname(file).toLowerCase()}`, file});

    params.files.set(path, file);

    return path;
};
