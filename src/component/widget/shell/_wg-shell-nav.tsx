import clsx from "clsx";
import {copy_nav_aria_label, copy_repository_github, copy_repository_gitlab, copy_theme_label} from "@/constant/copy";
import {site_repository_provider} from "@/constant/site";
import {theme_mode} from "@/constant/theme";
import {toDocGroups} from "@/content/to-doc-groups";
import type {Doc} from "@/type/doc";
import type {SiteConfig} from "@/type/site-config";
import "./_wg-shell-nav.css";

/**
 * 서버 사이드바 입력 · 읽는 순서의 문서 묶음과 사이트 도구
 * 브라우저 동작은 client.ts 소유 · data-* 연결
 */
export interface WgShellNavProps {
    /**
     * 문서 묶음 순서와 저장소 링크
     */
    site: SiteConfig;
    /**
     * 전체 문서 목록
     */
    docs: Doc[];
    /**
     * 현재 문서 id · 첫 화면 생략
     */
    current?: string;
}

export const WgShellNav = (props: WgShellNavProps) => {
    const docGroups = toDocGroups({docs: props.docs, navigation: props.site.navigation});
    const repositoryLabel = props.site.repository && (props.site.repository.provider === site_repository_provider.github ? copy_repository_github : copy_repository_gitlab);

    return (
        <nav className={clsx("wg_shellNav__root")} aria-label={copy_nav_aria_label}>
            {/**
             * 문서 이동 · 독자 목적별 묶음
             */}
            <div className={clsx("wg_shellNav__docs")}>
                {/**
                 * 묶음 이름과 독립 문서 · 제목이 링크의 접근 가능한 이름
                 */}
                {docGroups.map((group) => (
                    <section className={clsx("wg_shellNav__docGroup")} key={group.name} aria-label={group.name}>
                        <div className={clsx("wg_shellNav__group")}>{group.name}</div>
                        {/**
                         * 문서의 URL과 현재 페이지 표시
                         */}
                        <ul className={clsx("wg_shellNav__list")}>
                            {group.docs.map((doc) => (
                                <li key={doc.id}>
                                    <a
                                        className={clsx("wg_shellNav__link", {
                                            "wg_shellNav__link--active": doc.id === props.current,
                                        })}
                                        href={`/${doc.id}/`}
                                        title={doc.data.label}
                                        aria-current={doc.id === props.current ? "page" : undefined}
                                    >
                                        {doc.data.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
            {/**
             * 문서 탐색 뒤의 사이트 도구 · 테마와 선택 저장소 링크
             */}
            <div className={clsx("wg_shellNav__actions")}>
                <button className={clsx("wg_shellNav__action")} type="button" aria-label={copy_theme_label.system} title={copy_theme_label.system} data-theme-toggle="">
                    <svg
                        className={clsx("wg_shellNav__actionIcon")}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <g className={clsx("wg_shellNav__themeSymbol", "wg_shellNav__themeSymbol--active")} data-theme-icon={theme_mode.system}>
                            <rect x="3" y="4" width="18" height="12" rx="1" />
                            <path d="M12 16V20M8 20H16" />
                        </g>
                        <g className={clsx("wg_shellNav__themeSymbol")} data-theme-icon={theme_mode.light}>
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2V4M12 20V22M2 12H4M20 12H22M5 5L6.5 6.5M17.5 17.5L19 19M5 19L6.5 17.5M17.5 6.5L19 5" />
                        </g>
                        <g className={clsx("wg_shellNav__themeSymbol")} data-theme-icon={theme_mode.dark}>
                            <path d="M21 12.8A9 9 0 1 1 11.2 3A7 7 0 0 0 21 12.8Z" />
                        </g>
                    </svg>
                </button>
                {props.site.repository !== undefined && (
                    <a className={clsx("wg_shellNav__action")} href={props.site.repository.url} aria-label={repositoryLabel} title={repositoryLabel}>
                        <span className={clsx("wg_shellNav__actionLabel")}>{repositoryLabel}</span>
                        <svg
                            className={clsx("wg_shellNav__actionIcon")}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            focusable="false"
                        >
                            {props.site.repository.provider === site_repository_provider.github && (
                                <path d="M9 19C5 20 5 17 3 17M9 22V19C9 18 9.2 17.4 9.7 17C6.4 16.6 3 15.4 3 10C3 8.5 3.5 7.3 4.4 6.3C4.1 5.3 4.1 4.1 4.6 3C4.6 3 5.8 2.6 8.3 4.4C10.7 3.8 13.3 3.8 15.7 4.4C18.2 2.6 19.4 3 19.4 3C19.9 4.1 19.9 5.3 19.6 6.3C20.5 7.3 21 8.5 21 10C21 15.4 17.6 16.6 14.3 17C14.8 17.4 15 18.2 15 19V22" />
                            )}
                            {props.site.repository.provider === site_repository_provider.gitlab && (
                                <path d="M12 21L3 14L2 11L5 3L8 11H16L19 3L22 11L21 14ZM8 11L12 21L16 11M2 11H8M16 11H22" />
                            )}
                        </svg>
                    </a>
                )}
            </div>
        </nav>
    );
};
