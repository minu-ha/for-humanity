import type {EventEmitter} from "node:events";
import {readFile} from "node:fs/promises";
import {extname} from "node:path";
import {type Context, Hono} from "hono";
import {streamSSE} from "hono/streaming";
import {
	asset_content_type_default,
	asset_content_types,
	asset_dir,
	asset_favicon_path,
	asset_reload_path,
} from "@/constant/asset";

/**
 * dev 서버의 재료
 */
export interface DevOptions {
	/**
	 * 쪽 앱 (app.tsx). 자원이 아닌 요청은 모두 여기로 넘긴다
	 */
	pages: Hono;
	/**
	 * 자원 주소 → 파일 자리. 빌드가 결과 폴더에 복사하는 것과 같은 목록이다
	 */
	files: Map<string, string>;
	/**
	 * 문서가 바뀌면 "change" 를 낸다. 열려 있는 쪽이 SSE 로 받아 다시 연다
	 */
	reload: EventEmitter;
}

/**
 * dev 서버 앱. 자원 파일과 새로고침 길을 맡고, 나머지 요청은 쪽 앱에 넘긴다.
 * 빌드 결과에서는 자원이 같은 주소에 파일로 있으므로 이 앱은 dev 에만 쓴다
 */
export const createDevApp = (options: DevOptions) => {
	const app = new Hono();

	/**
	 * 주소에 맞는 파일을 읽어 준다
	 */
	const handleAsset = async (c: Context) => {
		const file = options.files.get(c.req.path);

		if (file === undefined) {
			return c.notFound();
		}

		c.header("content-type", asset_content_types[extname(file)] ?? asset_content_type_default);

		return c.body(await readFile(file));
	};

	app.get(asset_reload_path, (c) =>
		streamSSE(
			c,
			(stream) =>
				new Promise((done) => {
					const handleChange = async () => {
						await stream.writeSSE({data: "change"});
						done();
					};

					options.reload.once("change", handleChange);
					stream.onAbort(() => {
						options.reload.off("change", handleChange);
						done();
					});
				}),
		),
	);
	app.get(`/${asset_dir}/*`, handleAsset);
	app.get(asset_favicon_path, handleAsset);
	app.all("/*", (c) => options.pages.fetch(c.req.raw, c.env));

	return app;
};
