import {Hono} from "hono";
import {ssgParams} from "hono/ssg";
import type {ReactElement} from "react";
import {renderToString} from "react-dom/server";
import {PgDoc} from "@/page/doc/pg-doc";
import {PgHome} from "@/page/home/pg-home";
import type {Doc} from "@/type/doc";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";

/**
 * 쪽을 그리는 재료
 */
export interface AppOptions {
	site: SiteConfig;
	/**
	 * 문서 모음. dev 에서 문서가 바뀌면 cli 가 docs 를 통째로 바꿔 끼운다
	 */
	store: {docs: Doc[]};
	assets: SiteAssets;
}

/**
 * React 트리를 HTML 문서 글로. 쪽은 전부 서버에서 그리고 브라우저에는 React 를 보내지 않는다
 */
const toHtml = (page: ReactElement) => `<!DOCTYPE html>${renderToString(page)}`;

/**
 * 쪽 앱. 라우트는 둘이다: 첫 화면 `/` 과 문서 `/:slug/`. 문서 id 에 폴더가 들어갈 수 있어 `{.+}` 로 받는다.
 * 자원과 새로고침 길은 여기 두지 않는다 (dev.ts). 정규식 매개변수와 `*` 라우트가 한 앱에 있으면 Hono 가 Trie 라우터로 물러나 `{.+}` 가 맞지 않는다
 */
export const createApp = (options: AppOptions) => {
	const app = new Hono();

	app.get("/", (c) => c.html(toHtml(<PgHome site={options.site} docs={options.store.docs} assets={options.assets} />)));
	app.get(
		"/:slug{.+}/",
		ssgParams(() => options.store.docs.map((doc) => ({slug: doc.id}))),
		(c) => {
			const doc = options.store.docs.find((entry) => entry.id === c.req.param("slug"));

			return doc === undefined
				? c.notFound()
				: c.html(toHtml(<PgDoc site={options.site} docs={options.store.docs} assets={options.assets} doc={doc} />));
		},
	);

	return app;
};
