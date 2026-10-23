import {existsSync} from "node:fs";
import {copyFile} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

try {
    for (const file of ["404.html", "_headers"]) {
        const output = join(fileURLToPath(new URL("../", import.meta.url)), "<CONTENT_ROOT>", "dist", file);

        if (file !== "404.html" || !existsSync(output)) {
            await copyFile(new URL(`./${file}`, import.meta.url), output);
        }
    }
} catch (error) {
    throw new Error("Could not prepare Cloudflare Workers assets. Build the documentation output before running this helper.", {cause: error});
}
