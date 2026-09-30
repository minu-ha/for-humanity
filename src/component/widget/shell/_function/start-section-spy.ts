import {reading_line_slack_px} from "@/component/widget/shell/_constant/reading-line";
import {findHashTarget} from "@/util/dom/find-hash-target";

/**
 * 읽는 선에 걸린 절과 소제목을 목차에서 켠다. 읽는 절의 소제목만 펼친다.
 * 읽는 선은 제목이 서는 높이 (--app-space-anchor) 라 목차로 옮긴 곳이 곧 켜진다.
 * `<script>` 안의 코드는 tsc 가 보지 않으므로 _wg-shell-nav.astro 의 스크립트는 이 파일을 불러 부르기만 한다
 */
export const startSectionSpy = () => {
	const sections = [...document.querySelectorAll<HTMLAnchorElement>(".wg_shellNav__toc .wg_shellNav__link")].flatMap(
		(link) => {
			const heading = findHashTarget(link.hash);
			const item = link.parentElement;

			if (!heading || !item) {
				return [];
			}

			return [
				{
					heading,
					link,
					list: item.querySelector(".wg_shellNav__sub"),
					subs: [...item.querySelectorAll<HTMLAnchorElement>(".wg_shellNav__subLink")].flatMap((sub) => {
						const subHeading = findHashTarget(sub.hash);

						return subHeading ? [{heading: subHeading, link: sub}] : [];
					}),
				},
			];
		},
	);
	const first = sections.at(0);

	if (!first) {
		return;
	}

	// 스크롤 이벤트는 브라우저가 그림마다 한 번만 보내므로 따로 줄이지 않는다
	const markActive = () => {
		// scroll-margin-top 은 vh 를 px 로 푼 값으로 읽힌다
		const line = Number.parseFloat(getComputedStyle(first.heading).scrollMarginTop) + reading_line_slack_px;
		const current = sections.findLast((section) => section.heading.getBoundingClientRect().top <= line) ?? first;
		const sub = current.subs.findLast((item) => item.heading.getBoundingClientRect().top <= line);

		for (const section of sections) {
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
};
