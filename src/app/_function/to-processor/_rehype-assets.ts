import {existsSync, realpathSync, statSync} from "node:fs";
import {dirname, extname, resolve} from "node:path";
import type {Root} from "hast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {asset_image_extensions, asset_reference_formats, asset_srcset_candidate_pattern} from "@/app/_constant/asset";
import {copy_error_asset, copy_error_file_missing, copy_error_image_format, copy_error_media_format, copy_error_not_file, copy_warn_unpublished_file} from "@/app/_constant/copy";
import {asset_media_dir} from "@/constant/asset";
import {copy_error_url_encoding} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {toErrorMessage} from "@/util/error/to-error-message";
import {assertContentPath} from "@/util/file/assert-content-path";
import {toAssetPath} from "@/util/file/to-asset-path";
import {toDecodedPath} from "@/util/file/to-decoded-path";

/**
 * 명시적으로 참조한 로컬 이미지, 영상, 소리, 첨부의 수집 계약
 */
interface AssetOptions {
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
 * 문서 상대 경로의 이미지, 영상, 소리, 첨부 수집
 *
 *   - 원시 HTML의 srcset, poster, video, audio, source에도 같은 내용 지문 URL 적용
 *   - 없는 파일, 폴더 밖 경로와 symlink, 삽입 자원의 미지원 형식은 빌드 실패
 *   - 배포 형식이 아닌 로컬 파일 링크는 파일 경고
 *   - 절대 URL, 외부 URL은 작성자가 제공하며 수집하지 않음
 */
export const rehypeAssets = (options: AssetOptions) => (tree: Root, file: VFile) => {
    visit(tree, "element", (node) => {
        const references = asset_reference_formats.get(node.tagName);

        if (references === undefined) {
            return;
        }

        /**
         * 로컬 참조 하나의 내용 지문 URL. 외부, 절대 URL과 수집하지 않는 링크는 원문 유지
         */
        const toAssetUrl = (url: string, formats: ReadonlySet<string>) => {
            const match = /^([^?#]+)([?#].*|)$/.exec(url);

            if (match === null || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url)) {
                return url;
            }

            const path = toDecodedPath(match[1]);

            if (path === undefined) {
                file.fail(`${copy_error_url_encoding}: ${url}`, node);
            }

            const extension = extname(path).toLowerCase();
            const target = resolve(dirname(file.path), path);

            if (!formats.has(extension)) {
                if (node.tagName !== "a") {
                    file.fail(`${copy_error_asset}: ${url} (${formats === asset_image_extensions ? copy_error_image_format : copy_error_media_format})`, node);
                }

                // 실제 파일만 경고. 폴더와 페이지 기준 상대 URL 제외
                if (existsSync(target) && statSync(target).isFile()) {
                    file.message(`${copy_warn_unpublished_file}: ${url}`, node);
                }

                return url;
            }

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

            return `${assetUrl}${match[2]}`;
        };

        for (const [property, formats] of Object.entries(references)) {
            const value = node.properties[property];

            if (typeof value !== "string") {
                continue;
            }

            // srcset은 후보 URL만 교체, 서술자와 구분 문자 유지
            node.properties[property] =
                property === "srcSet"
                    ? value.replace(
                          asset_srcset_candidate_pattern,
                          (candidate: string, lead: string, url: string) => `${lead}${toAssetUrl(url, formats)}${candidate.slice(lead.length + url.length)}`,
                      )
                    : toAssetUrl(value, formats);
        }
    });
};
