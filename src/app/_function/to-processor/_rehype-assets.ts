import {existsSync, realpathSync, statSync} from "node:fs";
import {dirname, extname, resolve} from "node:path";
import type {Root} from "hast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_asset, copy_error_file_missing, copy_error_image_format, copy_error_not_file} from "@/app/_constant/copy";
import {asset_media_dir, asset_media_extensions} from "@/constant/asset";
import {copy_error_url_encoding} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {toErrorMessage} from "@/util/error/to-error-message";
import {assertContentPath} from "@/util/file/assert-content-path";
import {toAssetPath} from "@/util/file/to-asset-path";
import {toDecodedPath} from "@/util/file/to-decoded-path";

/**
 * 명시적으로 참조한 로컬 이미지, 첨부의 수집 계약
 */
export interface AssetOptions {
    /**
     * 자원 경로를 해석하고 공개 범위를 검사할 문서 범위
     */
    scope: ContentScope;

    /**
     * dev 응답과 정적 복사가 공유하는 자원 URL별 파일 경로
     */
    files: Map<string, string>;
}

/**
 * 문서 상대 경로의 이미지와 첨부 수집
 *
 *   - 원시 HTML에도 같은 내용 지문 URL 적용
 *   - 없는 파일, 폴더 밖 경로와 symlink, 지원하지 않는 이미지 형식은 빌드 실패
 *   - 절대 URL, 외부 URL은 작성자가 제공하며 수집하지 않음
 */
export const rehypeAssets = (options: AssetOptions) => (tree: Root, file: VFile) => {
    visit(tree, "element", (node) => {
        const property = node.tagName === "img" ? "src" : "href";
        const url = node.properties[property];

        if ((node.tagName !== "img" && node.tagName !== "a") || typeof url !== "string" || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url)) {
            return;
        }

        const match = /^([^?#]+)([?#].*)?$/.exec(url);

        if (match === null) {
            return;
        }

        const path = toDecodedPath(match[1]);

        if (path === undefined) {
            file.fail(`${copy_error_url_encoding}: ${url}`, node);
        }

        const extension = extname(path).toLowerCase();

        if (!asset_media_extensions.has(extension)) {
            if (node.tagName === "img") {
                file.fail(`${copy_error_asset}: ${url} (${copy_error_image_format})`, node);
            }

            return;
        }

        const target = resolve(dirname(file.path), path);

        // 경로와 symlink 대상의 문서 범위 검사
        try {
            assertContentPath({scope: options.scope, path: target});
        } catch (error) {
            file.fail(toErrorMessage(error), node);
        }

        if (!existsSync(target)) {
            file.fail(`${copy_error_asset}: ${url} (${copy_error_file_missing})`, node);
        }

        const actual = realpathSync(target);

        if (!statSync(actual).isFile()) {
            file.fail(`${copy_error_asset}: ${url} (${copy_error_not_file})`, node);
        }

        const assetUrl = toAssetPath({path: `${asset_media_dir}/asset${extension}`, file: actual});

        options.files.set(assetUrl, actual);
        node.properties[property] = match[2] === undefined ? assetUrl : `${assetUrl}${match[2]}`;
    });
};
