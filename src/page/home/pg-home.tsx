import {WgProse} from "@/component/widget/prose/wg-prose";
import {WgShell} from "@/component/widget/shell/wg-shell";
import {copy_overview_name} from "@/constant/copy";
import {locale_doc_group, locale_doc_name} from "@/constant/locale";
import type {Doc} from "@/type/doc";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";
import "./pg-home.css";

/**
 * 첫 화면. 라우트 / 의 진입 파일이다.
 * 설정의 제목과 설명, 그리고 문서 카드를 놓는다. 카드는 묶음 순, 묶음 안에서는 이름 순이다
 */
export interface PgHomeProps {
	site: SiteConfig;
	docs: Doc[];
	assets: SiteAssets;
}

export const PgHome = (props: PgHomeProps) => {
	const docs = props.docs.toSorted(
		(a, b) =>
			a.data.group.localeCompare(b.data.group, locale_doc_group) ||
			a.data.name.localeCompare(b.data.name, locale_doc_name),
	);

	return (
		<WgShell site={props.site} docs={props.docs} assets={props.assets} island={false}>
			<WgProse
				head={{
					eyebrow: [props.site.title, copy_overview_name],
					title: copy_overview_name,
					lead: props.site.description,
				}}
			/>
			<div className="pg_home__cards">
				{docs.map((doc) => (
					<a key={doc.id} className="pg_home__card" href={`/${doc.id}/`}>
						<span className="pg_home__cardGroup">{doc.data.group}</span>
						<span className="pg_home__cardTitle">{doc.data.name}</span>
						<span className="pg_home__cardLabel">{doc.data.label}</span>
					</a>
				))}
			</div>
		</WgShell>
	);
};
