import clsx from "clsx";
import {Fragment} from "react";
import {toTocGroups} from "@/component/widget/shell/_function/to-toc-groups";
import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import {
	copy_nav_aria_label,
	copy_nav_docs_label,
	copy_nav_toc_label,
	copy_overview_label,
	copy_overview_mark,
	copy_overview_name,
	copy_theme_label,
} from "@/constant/copy";
import {locale_doc_name} from "@/constant/locale";
import type {Doc} from "@/type/doc";
import type {SiteConfig} from "@/type/site-config";
import "./_wg-shell-nav.css";

/**
 * 사이드바. 문서 목록 (영어 이름 abc 순, 첫 글자 표지) 과 이 문서의 목차 (가름마다 끊긴 목록) 를 서버에서 그린다.
 * 브라우저에서는 테마 단추와 읽는 절 표시만 돈다 (client.ts). 스크립트가 잡는 요소에는 클래스 대신 data-* 를 단다
 */
export interface WgShellNavProps {
	/**
	 * 사이드바 맨 위 이름의 출처
	 */
	site: SiteConfig;
	/**
	 * 문서 모음 전부
	 */
	docs: Doc[];
	/**
	 * 지금 연 문서의 id. 첫 화면은 없다
	 */
	current?: string;
	/**
	 * 이 문서의 목차 재료. 첫 화면은 없다
	 */
	outline?: DocOutline;
}

export const WgShellNav = (props: WgShellNavProps) => {
	const docs = props.docs.toSorted((a, b) => a.data.name.localeCompare(b.data.name, locale_doc_name));
	const tocGroups = props.outline === undefined ? [] : toTocGroups(props.outline);

	return (
		<nav className="wg_shellNav__root" aria-label={copy_nav_aria_label}>
			<a className="wg_shellNav__brand" href="/">
				{props.site.title}
			</a>
			<div className="wg_shellNav__label">{copy_nav_docs_label}</div>
			{/**
			 * 문서 목록. 첫 화면이 맨 위고 문서는 영어 이름 순이다
			 */}
			<div className="wg_shellNav__docs">
				<ul className="wg_shellNav__list">
					<li>
						<a
							className={clsx("wg_shellNav__link", {"wg_shellNav__link--active": props.current === undefined})}
							href="/"
							title={copy_overview_label}
							aria-current={props.current === undefined ? "page" : undefined}
						>
							<span className="wg_shellNav__mark">{copy_overview_mark}</span>
							{copy_overview_name}
						</a>
					</li>
					{docs.map((doc) => (
						<li key={doc.id}>
							<a
								className={clsx("wg_shellNav__link", {"wg_shellNav__link--active": doc.id === props.current})}
								href={`/${doc.id}/`}
								title={doc.data.label}
								aria-current={doc.id === props.current ? "page" : undefined}
							>
								<span className="wg_shellNav__mark">{doc.data.name[0]}</span>
								{doc.data.name}
							</a>
						</li>
					))}
				</ul>
			</div>
			{/**
			 * 이 문서의 목차. 가름마다 목록이 끊기고, 지금 읽는 절의 소제목만 client.ts 가 펼친다
			 */}
			{tocGroups.length > 0 && (
				<Fragment>
					<div className="wg_shellNav__label">{copy_nav_toc_label}</div>
					{tocGroups.map((group) => (
						<Fragment key={group.sections[0].heading.slug}>
							{group.part !== undefined && <div className="wg_shellNav__group">{group.part}</div>}
							<ul className="wg_shellNav__list">
								{group.sections.map((section) => (
									<li key={section.heading.slug}>
										<a className="wg_shellNav__link" href={`#${section.heading.slug}`} data-toc-link="">
											<span className="wg_shellNav__mark">{section.number}</span>
											{section.heading.text}
										</a>
										{section.subs.length > 0 && (
											<ul className="wg_shellNav__sub" data-toc-sub="">
												{section.subs.map((sub) => (
													<li key={sub.heading.slug}>
														<a className="wg_shellNav__subLink" href={`#${sub.heading.slug}`} data-toc-sub-link="">
															<span className="wg_shellNav__mark">{sub.number}</span>
															{sub.heading.text}
														</a>
													</li>
												))}
											</ul>
										)}
									</li>
								))}
							</ul>
						</Fragment>
					))}
				</Fragment>
			)}
			<button className="wg_shellNav__theme" type="button" data-theme-toggle="">
				{copy_theme_label.system}
			</button>
		</nav>
	);
};
