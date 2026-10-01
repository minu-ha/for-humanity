/*
 * 브라우저 스크립트. 테마 단추, 목차의 읽는 절 표시, #절 주소로 들어왔을 때 자리 맞추기.
 * 서버가 그린 요소를 data-* 로 잡는다. esbuild 가 dist/client.js 로 묶고 wg-shell.tsx 가 모든 쪽에 싣는다
 */

import {reading_line_slack_px} from "@/component/widget/shell/_constant/reading-line";
import {copy_theme_label} from "@/constant/copy";
import {theme_mode, theme_order, theme_storage_key} from "@/constant/theme";
import {findHashTarget} from "@/util/dom/find-hash-target";

const themeButton = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");

/**
 * 지금 테마. 기억한 테마는 그리기 전에 wg-shell.tsx 머리가 data-theme 으로 붙였다
 */
const readThemeMode = () =>
	theme_order.find((mode) => mode === document.documentElement.getAttribute("data-theme")) ?? theme_mode.system;

if (themeButton) {
	/**
	 * 테마 단추. 누를 때마다 시스템 → 밝게 → 어둡게 차례로 바꾸고 고른 것을 기억한다
	 */
	const handleThemeClick = () => {
		const next = theme_order[(theme_order.indexOf(readThemeMode()) + 1) % theme_order.length];

		if (next === theme_mode.system) {
			document.documentElement.removeAttribute("data-theme");
		} else {
			document.documentElement.setAttribute("data-theme", next);
		}

		themeButton.textContent = copy_theme_label[next];

		try {
			localStorage.setItem(theme_storage_key, next);
		} catch {
			// 저장이 막혀도 이번 방문에는 적용된 채로 둔다
		}
	};

	themeButton.textContent = copy_theme_label[readThemeMode()];
	themeButton.addEventListener("click", handleThemeClick);
}

// 목차의 절과 소제목, 그 링크가 가리키는 제목. 읽는 절의 소제목만 펼친다
const tocSections = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")].flatMap((link) => {
	const heading = findHashTarget(link.hash);
	const item = link.parentElement;

	if (!heading || !item) {
		return [];
	}

	return [
		{
			heading,
			link,
			list: item.querySelector("[data-toc-sub]"),
			subs: [...item.querySelectorAll<HTMLAnchorElement>("[data-toc-sub-link]")].flatMap((sub) => {
				const subHeading = findHashTarget(sub.hash);

				return subHeading ? [{heading: subHeading, link: sub}] : [];
			}),
		},
	];
});
const firstSection = tocSections.at(0);

if (firstSection) {
	/**
	 * 읽는 선에 걸린 절과 소제목을 켠다. 읽는 선은 제목이 서는 높이 (--app-space-anchor) 라 목차로 옮긴 곳이 곧 켜진다.
	 * 스크롤 이벤트는 브라우저가 그림마다 한 번만 보내므로 따로 줄이지 않는다
	 */
	const markActive = () => {
		// scroll-margin-top 은 vh 를 px 로 푼 값으로 읽힌다
		const line = Number.parseFloat(getComputedStyle(firstSection.heading).scrollMarginTop) + reading_line_slack_px;
		const current =
			tocSections.findLast((section) => section.heading.getBoundingClientRect().top <= line) ?? firstSection;
		const sub = current.subs.findLast((item) => item.heading.getBoundingClientRect().top <= line);

		for (const section of tocSections) {
			section.link.classList.toggle("wg_shellNav__link--active", section === current);
			section.list?.classList.toggle("wg_shellNav__sub--open", section === current);

			for (const item of section.subs) {
				item.link.classList.toggle("wg_shellNav__subLink--active", item === sub);
			}
		}
	};

	addEventListener("scroll", markActive, {passive: true});
	addEventListener("resize", markActive);
	markActive();
}

const hashTarget = findHashTarget(location.hash);
const userScroll = new AbortController();

for (const type of ["wheel", "touchmove", "keydown", "mousedown"]) {
	addEventListener(type, () => userScroll.abort(), {once: true, passive: true});
}

/**
 * 주소의 #절로 들어오면 글꼴이 늦게 와 높이가 바뀐 뒤 한 번 더 맞춘다. 그새 사용자가 스크롤을 시작했으면 건너뛴다.
 * 쪽을 여는 동안은 머리의 인라인 스크립트가 부드러운 스크롤을 꺼 둔다. 켜 두면 브라우저가 처음 옮기는 움직임이
 * 글꼴이 오기 전 자리로 이어져, 여기서 맞춘 자리를 덮는다. 맞춘 뒤에 다시 켠다
 */
const settleHashScroll = async () => {
	await document.fonts.ready;

	if (hashTarget && !userScroll.signal.aborted) {
		hashTarget.scrollIntoView({behavior: "instant"});
	}

	document.documentElement.style.removeProperty("scroll-behavior");
};

// 글꼴 파일은 쪽의 load 무렵에야 요청이 끝나므로 load 뒤에 fonts.ready 를 기다린다
if (document.readyState === "complete") {
	settleHashScroll();
} else {
	addEventListener("load", settleHashScroll, {once: true});
}
