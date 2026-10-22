import {copyFile} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

try {
    await copyFile(new URL("./404.html", import.meta.url), join(fileURLToPath(new URL("../", import.meta.url)), "<CONTENT_ROOT>", "dist", "404.html"));
} catch (error) {
    throw new Error("Could not prepare Cloudflare Pages 404.html. Build the documentation output before running this helper.", {cause: error});
}
