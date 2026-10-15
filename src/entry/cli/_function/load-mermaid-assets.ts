import {readdirSync} from "node:fs";
import {join} from "node:path";
import {asset_mermaid_dir} from "@/constant/asset";
import type {MermaidAssets} from "@/type/mermaid-assets";

/**
 * 패키지에 포함한 Mermaid 진입 모듈과 지연 청크 등록 목록
 */
export const loadMermaidAssets = (kitRoot: string): MermaidAssets => {
    const directory = join(kitRoot, "dist/mermaid");
    const names = readdirSync(directory);
    const entry = names.find((name) => name.startsWith("mermaid-") && name.endsWith(".js"));
    if (entry === undefined) {
        throw new Error("Missing Mermaid browser entry. Run pnpm build:kit before using the CLI.");
    }

    return {
        entry: `${asset_mermaid_dir}/${entry}`,
        files: new Map(names.map((name) => [`${asset_mermaid_dir}/${name}`, join(directory, name)])),
    };
};
