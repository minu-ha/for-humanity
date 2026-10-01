import {WgProse} from "@/component/widget/prose/wg-prose";
import {WgShell} from "@/component/widget/shell/wg-shell";
import type {Doc} from "@/type/doc";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";

/**
 * 문서 한 장. 라우트 /:slug/ 의 진입 파일이다. 본문은 read-docs 가 이미 그렸으니 틀에 넣기만 한다
 */
export interface PgDocProps {
	site: SiteConfig;
	docs: Doc[];
	assets: SiteAssets;
	/**
	 * 이 쪽이 그리는 문서
	 */
	doc: Doc;
}

export const PgDoc = (props: PgDocProps) => {
	return (
		<WgShell
			site={props.site}
			docs={props.docs}
			assets={props.assets}
			title={props.doc.data.name}
			current={props.doc.id}
			outline={props.doc.outline}
		>
			<WgProse html={props.doc.html} />
		</WgShell>
	);
};
