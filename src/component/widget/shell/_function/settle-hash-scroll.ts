import {findHashTarget} from "@/util/dom/find-hash-target";

/**
 * 주소의 #절로 들어오면 글꼴이 늦게 와 높이가 바뀐 뒤 한 번 더 맞춘다. 그새 사용자가 스크롤을 시작했으면 건너뛴다.
 * 쪽을 여는 동안은 부드러운 스크롤을 꺼 둔다 (wg-shell.astro 머리). 켜 두면 브라우저가 처음 옮기는 움직임이
 * 글꼴이 오기 전 자리로 이어져, 여기서 맞춘 자리를 덮는다. 맞춘 뒤에 다시 켠다.
 * `<script>` 안의 코드는 tsc 가 보지 않으므로 wg-shell.astro 의 스크립트는 이 파일을 불러 부르기만 한다
 */
export const settleHashScroll = () => {
	const target = findHashTarget(location.hash);
	const userScroll = new AbortController();

	for (const type of ["wheel", "touchmove", "keydown", "mousedown"]) {
		addEventListener(type, () => userScroll.abort(), {once: true, passive: true});
	}

	// 글꼴 파일은 쪽의 load 무렵에야 요청이 끝나므로 load 뒤에 fonts.ready 를 기다린다
	const settle = async () => {
		await document.fonts.ready;

		if (target && !userScroll.signal.aborted) {
			target.scrollIntoView({behavior: "instant"});
		}

		document.documentElement.style.removeProperty("scroll-behavior");
	};

	if (document.readyState === "complete") {
		settle();
	} else {
		addEventListener("load", settle, {once: true});
	}
};
