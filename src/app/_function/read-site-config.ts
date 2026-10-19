import {existsSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {createJiti} from "jiti";
import {z} from "zod";
import {config_file_names} from "@/app/_constant/config";
import {copy_error_config} from "@/constant/copy";
import {site_config_absent} from "@/constant/site";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 프로젝트 루트의 설정 조회, TypeScript 실행과 스키마 검증
 *
 *   - 중복 파일 거부, 실제 적용되는 설정의 모호성 방지
 *   - Node의 기본 TypeScript 지원 여부와 무관하게 같은 설정 실행
 */
export const readSiteConfig = async (root: string) => {
    const files = config_file_names.map((name) => join(root, name)).filter((file) => existsSync(file));

    if (files.length > 1) {
        throw new Error(`${copy_error_config}: 설정 파일은 하나만 사용하세요 (${config_file_names.join(", ")})`);
    }

    const file = files[0];

    if (file === undefined) {
        return siteConfigSchema.parse(site_config_absent);
    }

    // ESM 실행 오류를 변환 재시도로 숨기지 않고 기존 Node import 계약 유지
    const input: unknown = file.endsWith(".mjs")
        ? await import(pathToFileURL(file).href)
        : await createJiti(import.meta.url, {interopDefault: false, tryNative: false}).import(file);

    const parsed = z.object({default: siteConfigSchema}).safeParse(input);

    if (!parsed.success) {
        throw new Error(`${copy_error_config}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join(", ")}`);
    }

    return parsed.data.default;
};
