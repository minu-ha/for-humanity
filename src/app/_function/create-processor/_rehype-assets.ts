import {existsSync, realpathSync, statSync} from "node:fs";
import {dirname, extname, isAbsolute, relative, resolve, sep} from "node:path";
import type {Root} from "hast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {asset_media_dir, asset_media_extensions} from "@/constant/asset";
import {copy_error_asset} from "@/constant/copy";
import {toAssetPath} from "@/util/file/to-asset-path";

/**
 * 명시적으로 참조한 로컬 이미지·첨부의 수집 계약
 */
export interface AssetOptions {
    /**
     * 자원을 읽을 수 있는 문서 루트
     */
    root: string;
    /**
     * dev 응답과 정적 복사에서 공유할 URL → 파일 목록
     */
    files: Map<string, string>;
}

/**
 * 파일 위치 기준 이미지·첨부 → 내용 지문 URL · 원시 HTML도 같은 규칙
 * 없는 파일, 폴더 밖 경로와 symlink, 지원하지 않는 이미지 형식은 빌드 실패
 * 절대 URL·외부 URL은 작성자가 제공하며 수집하지 않음
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

        const path = decodeURIComponent(match[1]);
        const extension = extname(path).toLowerCase();
        if (!asset_media_extensions.has(extension)) {
            if (node.tagName === "img") {
                file.fail(`${copy_error_asset}: 지원하지 않는 이미지 형식 · ${url}`, node);
            }
            return;
        }

        const target = resolve(dirname(file.path), path);
        const location = relative(options.root, target);
        if (location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location)) {
            file.fail(`${copy_error_asset}: 문서 폴더 밖 · ${url}`, node);
        }
        if (!existsSync(target)) {
            file.fail(`${copy_error_asset}: 파일이 없다 · ${url}`, node);
        }
        const actual = realpathSync(target);
        const actualLocation = relative(realpathSync(options.root), actual);
        if (actualLocation === ".." || actualLocation.startsWith(`..${sep}`) || isAbsolute(actualLocation) || !statSync(actual).isFile()) {
            file.fail(`${copy_error_asset}: 문서 폴더 밖이거나 일반 파일이 아니다 · ${url}`, node);
        }

        const assetUrl = toAssetPath({path: `${asset_media_dir}/asset${extension}`, file: actual});
        options.files.set(assetUrl, actual);
        node.properties[property] = match[2] === undefined ? assetUrl : `${assetUrl}${match[2]}`;
    });
};
