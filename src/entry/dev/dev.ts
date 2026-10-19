import {fileURLToPath} from "node:url";
import {readProject} from "@/app/_function/read-project";
import {startDevServer} from "@/entry/dev/start-dev-server";

const project = await readProject(".");

await startDevServer({...project, kitRoot: fileURLToPath(new URL("../../../", import.meta.url)), source: true, includePrivate: true});
