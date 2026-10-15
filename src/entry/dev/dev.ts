import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {readSiteConfig} from "@/app/_function/read-site-config";
import {startDevServer} from "@/entry/dev/start-dev-server";

const root = resolve("templates/document");
await startDevServer({root, kitRoot: fileURLToPath(new URL("../../../", import.meta.url)), site: await readSiteConfig(root), source: true});
