import {readdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import type {Plugin} from "vite";
import {z} from "zod";

/**
 * 실제 번들 모듈의 전체 라이선스와 NOTICE 동봉
 *
 *   - 제약: Vite 기본 license 출력은 첫 라이선스 파일만 포함, 추가 고지 수집 필요
 */
export const toNoticesPlugin = (): Plugin => {
    return {
        name: "for-humanity:notices",

        // Rolldown의 호출 컨텍스트에서 emitFile 사용, 화살표 함수 전환 불가
        generateBundle: async function (_options, bundle) {
            const packages = new Set(
                Object.values(bundle)
                    .flatMap((output) => (output.type === "chunk" ? output.moduleIds : []))
                    .map((id) => id.replaceAll("\\", "/"))
                    .filter((id) => !id.startsWith("\0") && id.includes("/node_modules/"))
                    .map((id) => {
                        const marker = id.lastIndexOf("/node_modules/") + "/node_modules/".length;
                        const name = id.slice(marker).split("/");

                        return id.slice(0, marker) + name.slice(0, name[0].startsWith("@") ? 2 : 1).join("/");
                    }),
            );

            const notices = await Promise.all(
                [...packages].toSorted().map(async (directory) => {
                    const manifest = z
                        .object({name: z.string(), version: z.string(), license: z.string().optional()})
                        .parse(JSON.parse(await readFile(join(directory, "package.json"), "utf8")));

                    const files = (await readdir(directory, {withFileTypes: true})).filter((file) => file.isFile() && /^(licen[cs]e|copying|notice)([.-]|$)/i.test(file.name));
                    const licenses = await Promise.all(files.map(async (file) => `${file.name}\n${await readFile(join(directory, file.name), "utf8")}`));

                    return [`${manifest.name}@${manifest.version}`, ...(manifest.license === undefined ? [] : [`License: ${manifest.license}`]), ...licenses].join("\n\n");
                }),
            );

            this.emitFile({type: "asset", fileName: "THIRD-PARTY-NOTICES.txt", source: notices.join("\n\n----------------------------------------\n\n")});
        },
    };
};
