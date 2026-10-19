import {existsSync, realpathSync, statSync} from "node:fs";
import {isAbsolute, join, relative, sep} from "node:path";
import type {ContentScope} from "@/type/content-scope";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 문서 루트의 실제 경로 검증 입력
 */
interface ContentScopeParams {
    /**
     * 설정에서 해소한 문서 루트
     */
    root: string;
    /**
     * 스키마가 검증한 공개 범위 경로
     */
    content: ResolvedSiteConfig["content"];
    /**
     * 개발 실행 여부
     */
    includePrivate: boolean;
}

/**
 * 공개 폴더 필수, 내부 폴더 선택, 범위 폴더의 symlink 별칭 금지
 */
export const readContentScope = (params: ContentScopeParams): ContentScope => {
    if (!existsSync(params.root) || !statSync(params.root).isDirectory()) throw new Error(`content 문서 루트가 없습니다: ${params.root}`);
    const root = realpathSync(params.root);
    const publicRoot = join(root, params.content.public);
    const privateRoot = join(root, params.content.private);
    for (const path of [publicRoot, privateRoot]) {
        if (!existsSync(path)) {
            if (path === privateRoot) continue;
            throw new Error(`공개 문서 폴더가 없습니다: ${path}. content/public 구조 또는 content 설정을 확인하세요`);
        }
        const actual = realpathSync(path);
        const location = relative(root, actual);
        if (!statSync(path).isDirectory() || actual !== path || location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location)) {
            throw new Error(`문서 폴더는 content 내부의 실제 폴더여야 합니다: ${path}`);
        }
    }
    return {root, publicRoot, privateRoot, includePrivate: params.includePrivate};
};
