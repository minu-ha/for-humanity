import {existsSync} from "node:fs";
import {copyFile} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

try {
    const output = join(fileURLToPath(new URL("../", import.meta.url)), "<CONTENT_ROOT>", "dist", "404.html");

    if (!existsSync(output)) {
        await copyFile(new URL("./404.html", import.meta.url), output);
    }
} catch (error) {
    throw new Error("Could not prepare Cloudflare Pages 404.html. Build the documentation output before running this helper.", {cause: error});
}
