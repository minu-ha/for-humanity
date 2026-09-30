/*
 * 흐름도 격자 렌더러. beautiful-mermaid 가 만든 문자 격자 (ASCII) 를 SVG 로 그린다. 빌드 때 돈다.
 * 선 문자는 선, 화살촉은 삼각형, 판단 모서리는 ◇, 글자는 고정폭으로 그린다. 색은 CSS 변수라 테마가 바뀌어도 다시 그리지 않는다.
 * 격자 렌더러는 한글을 한 칸으로 세므로 전각 글자마다 폭 0 문자를 덧붙여 두 칸을 예약시킨다.
 *
 * 컨벤션 예외: import 줄과 맨 아래 renderFlow 사이는 agent-conventions 뷰어 → sk-ax-gas-pp blueprint.js → uoo _index.js 로
 * 옮겨 온 코드를 글자 그대로 둔다. 세 곳과 diff 로 맞춰 보려고 고치지 않는다. 그래서 TypeScript 가 아닌 .js 이고,
 * biome.json 의 files.includes 에서 뺐다.
 */
import {renderMermaidASCII} from "beautiful-mermaid";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ASCII_OPT = {paddingX: 3, paddingY: 2, boxBorderPadding: 1, colorMode: "none"};
const WIDE = /[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿぀-ヿ＀-｠]/;
const ZW = "​";
const widenCjk = (src) => src.replace(new RegExp(WIDE.source, "g"), (c) => c + ZW);
// 선 문자가 칸 가운데에서 어느 변으로 이어지는지. L R U D, r 은 둥근 모서리.
const LINES = {"─": "LR", "│": "UD", "┌": "RD", "┐": "LD", "└": "RU", "┘": "LU", "├": "UDR", "┤": "UDL", "┬": "LRD", "┴": "LRU", "┼": "LRUD", "╭": "RDr", "╮": "LDr", "╰": "RUr", "╯": "LUr",
	"═": "LRb", "║": "UDb", "╔": "RDb", "╗": "LDb", "╚": "RUb", "╝": "LUb", "╟": "UDRb", "╢": "UDLb", "╌": "LRd", "╎": "UDd"};
const ARROWS = {"►": "R", "◄": "L", "▼": "D", "▲": "U", "▶": "R", "◀": "L"};
// 상자의 세로 벽과 가로 테두리. 선과 화살촉은 벽 선이 지나는 칸 가운데까지 닿아야 붙어 보인다.
const isWall = (chr) => chr === "│" || chr === "◇" || chr === "├" || chr === "┤";
const isHBorder = (chr) => chr !== undefined && chr !== " " && chr !== ZW && (LINES[chr] !== undefined || chr === "◇");

// 렌더러는 라벨이 있는 가로 구간을 "라벨 + 3칸" 으로 고정해 선 조각이 한 칸씩만 남는다.
// 1) 어느 줄의 글자도 가르지 않는 열(라벨 뒤, 화살표 앞)에 열을 끼워 구간 길이를 라벨 + 6칸 이상으로 늘리고,
// 2) 줄마다 라벨을 구간 가운데로 옮겨 양쪽 선을 같게 한다. 줄 길이는 그대로라 세로 정렬이 유지된다.
function widenLabelGaps(rows) {
	const width = Math.max.apply(null, rows.map((r) => r.length));
	let grid = rows.map((r) => r.padEnd(width));
	const H = new Set("─┬┴├┤┼◇┌┐└┘╭╮╰╯═╌►◄▶◀╔╗╚╝╟╢".split(""));
	const ANCHOR = new Set("├┤┬┴┼└┘┌┐╭╮╰╯".split(""));
	const END = new Set("►▶◄◀┤├┬┴┼┐┘┌└╮╯╭╰│".split(""));
	const isTxt = (chr) => chr !== undefined && chr !== " " && chr !== ZW && chr !== "│" && !H.has(chr);
	const txtish = (chr) => isTxt(chr) || chr === ZW;
	const splittable = (col) => grid.every((r) => !(txtish(r[col - 1]) && txtish(r[col])));
	const filler = (r, col) => {
		const l = r[col - 1], rt = r[col];
		if (l === undefined || rt === undefined) return " ";
		if ((H.has(l) || txtish(l)) && (H.has(rt) || rt === "│" || txtish(rt)) && !(txtish(l) && txtish(rt))) {
			if (!(H.has(l) || H.has(rt))) return " ";
			return l === "╌" || rt === "╌" ? "╌" : "─";
		}
		return " ";
	};
	// 가로 선 위 라벨: 양쏀에 선 조각이 있거나 한쪽이 꺾임 · 화살표에 바로 닿는 글자 묶음
	const runs = (row) => {
		const out = [];
		for (const m of row.matchAll(/(─*)((?:[가-힣A-Za-z0-9]​?)+)(─*)/g)) {
			if (m[2].length === 0) continue;
			const before = row[m.index - 1], after = row[m.index + m[0].length];
			const leftOk = m[1].length > 0 || ANCHOR.has(before);
			const rightOk = m[3].length > 0 || END.has(after);
			if (leftOk && rightOk && (m[1].length + m[3].length > 0 || (ANCHOR.has(before) && END.has(after)))) {
				out.push({start: m.index, label: m[2], left: m[1].length, right: m[3].length, end: m.index + m[0].length});
			}
		}
		return out;
	};
	const want = 6;
	// 1) 열 끼우기 — 오른쏀에서 왼쪽으로 처리해 앞선 자리가 밀리지 않게 한다
	const inserts = [];
	grid.forEach((row) => {
		for (const run of runs(row)) {
			const missing = want - (run.left + run.right);
			if (missing > 0) inserts.push({at: run.end, alt: run.start + run.left, n: missing});
		}
	});
	inserts.sort((x, y) => y.at - x.at);
	for (const ins of inserts) {
		const candidates = [ins.at, ins.at + 1, ins.at + 2, ins.alt, ins.alt - 1];
		const col = candidates.find((c) => c > 0 && c < width + 40 && splittable(c));
		if (col === undefined) continue;
		grid = grid.map((r) => r.slice(0, col) + filler(r, col).repeat(ins.n) + r.slice(col));
	}
	// 2) 라벨을 구간 가운데로
	return grid.map((row) => {
		let out = row;
		for (const run of runs(row).reverse()) {
			const total = run.left + run.right, l = Math.floor(total / 2), rgt = total - l;
			out = out.slice(0, run.start) + "─".repeat(l) + run.label + "─".repeat(rgt) + out.slice(run.end);
		}
		return out;
	});
}

function gridToSvg(ascii) {
	const cw = 7.2, ch = 17, fs = 12;
	const rows = widenLabelGaps(ascii.replace(/\s+$/, "").split("\n"));
	const cols = Math.max.apply(null, rows.map((r) => r.length));
	const f = (n) => n.toFixed(1);
	let path = "", bold = "", dashed = "", arcs = "", tris = "", marks = "", dots = "", texts = "";

	const isText = (chr) => chr !== undefined && chr !== " " && chr !== ZW && LINES[chr] === undefined && ARROWS[chr] === undefined && chr !== "◇";
	const center = (c) => c * cw + cw / 2;
	const textWidth = (chars) => chars.reduce((w, chr) => w + (WIDE.test(chr) ? fs : cw), 0);

	rows.forEach((row, r) => {
		const cy = r * ch + ch / 2, y0 = r * ch, y1 = y0 + ch;
		let run = null;
		// 가로선 위 라벨(── 예 ──►). 렌더러는 라벨을 한 칸으로 보고 놓으므로 전각 라벨이 한 칸 밀린다.
		// 선 구간(벽 가운데 ~ 화살촉 끝)의 정확한 가운데에 라벨을 놓고, 선은 라벨 폭만큼 비워 다시 그린다.
		const skip = new Set();
		for (let c = 0; c < row.length; c++) {
			if (!isText(row[c]) || skip.has(c)) continue;
			let e = c;
			while (e < row.length && (isText(row[e]) || row[e] === ZW || (row[e] === " " && isText(row[e + 1])))) e++;
			// 상자 테두리 위에 얹힌 라벨(◇───예───◇). 렌더러가 아래 · 위로 나가는 선의 라벨을 테두리 줄에 쓰고 ┬ 를 지운다.
			// 테두리를 이어 그리고 세로 선을 테두리까지 붙인 뒤, 라벨은 그 세로 선 옆(다음 줄)에 놓는다.
			if (row[c - 1] === "─" && row[e] === "─") {
				const below = rows[r + 1] || "", above = rows[r - 1] || "";
				let exit = null;
				for (let k = c - 2; k < e + 2 && exit === null; k++) {
					if (below[k] === "│" || below[k] === "▼") exit = {k: k, dir: 1};
					else if (above[k] === "│" || above[k] === "▲") exit = {k: k, dir: -1};
				}
				if (exit) {
					const kx = center(exit.k), chars = row.slice(c, e).split("").filter((chr) => chr !== ZW);
					path += "M" + f(c * cw) + " " + f(cy) + "H" + f(e * cw) + " ";
					path += "M" + f(kx) + " " + f(cy) + "V" + f(exit.dir > 0 ? y1 : y0) + " ";
					texts += '<text x="' + f(kx + cw * 0.8 + textWidth(chars) / 2) + '" y="' + f(cy + exit.dir * ch + fs * 0.35) + '">' + esc(chars.join("")) + "</text>";
					for (let k = c; k < e; k++) skip.add(k);
					c = e - 1;
					continue;
				}
			}

			let l = c - 1, rr = e;
			while (l >= 0 && row[l] === " ") l--;
			while (rr < row.length && row[rr] === " ") rr++;
			const onLine = (row[l] === "─" || row[l] === "├") && (row[rr] === "─" || ARROWS[row[rr]] !== undefined || row[rr] === "┤");
			if (!onLine) { c = e - 1; continue; }
			let L = l;
			while (L - 1 >= 0 && row[L - 1] === "─") L--;
			// 출발점 ├ 앞의 빈칸(렌더러의 가로 여백)을 건너 벽 선의 가운데까지가 구간의 시작이다.
			let segStart = L * cw, drawStart = L * cw;
			if (row[L] === "├" || row[L - 1] === "├") {
				const j = row[L] === "├" ? L : L - 1;
				const above = rows[r - 1] ? rows[r - 1][j] : " ", below = rows[r + 1] ? rows[r + 1][j] : " ";
				const junction = (above !== undefined && LINES[above] !== undefined && /[UD]/.test(LINES[above])) ||
					(below !== undefined && LINES[below] !== undefined && /[UD]/.test(LINES[below]));
				if (junction) {
					// ├ 가 상자 벽 자체다. 벽은 본 루프가 그리므로 건너뛰지 않고, 선만 벽 가운데에서 시작한다.
					segStart = center(j);
					drawStart = center(j);
					for (let m = j + 1; m < L; m++) skip.add(m);
				} else {
					// 벽과 떨어진 출발점 ├. 앞의 빈칸을 건너 벽 가운데까지 선을 잇고 ├ 는 그리지 않는다.
					let k = j - 1;
					while (k >= 0 && row[k] === " ") k--;
					segStart = isWall(row[k]) ? center(k) : center(j);
					drawStart = segStart;
					for (let m = j; m < L; m++) skip.add(m);
				}
			} else if (LINES[row[L - 1]] !== undefined || isWall(row[L - 1])) {
				segStart = center(L - 1);
			}
			let R = rr;
			while (R + 1 < row.length && row[R + 1] === "─") R++;
			let segEnd = (R + 1) * cw, drawEnd = (R + 1) * cw;
			if (ARROWS[row[R]] !== undefined) {
				drawEnd = R * cw;
				segEnd = isWall(row[R + 1]) ? center(R + 1) : center(R) + cw * 0.45;
				R--;
			} else if (ARROWS[row[R + 1]] !== undefined) {
				drawEnd = (R + 1) * cw;
				segEnd = isWall(row[R + 2]) ? center(R + 2) : center(R + 1) + cw * 0.45;
			} else if (LINES[row[R + 1]] !== undefined || isWall(row[R + 1])) {
				segEnd = center(R + 1);
			}
			const chars = row.slice(c, e).split("").filter((chr) => chr !== ZW);
			const mid = (segStart + segEnd) / 2, half = textWidth(chars) / 2 + 5;
			path += "M" + f(drawStart) + " " + f(cy) + "H" + f(mid - half) + " ";
			path += "M" + f(mid + half) + " " + f(cy) + "H" + f(drawEnd) + " ";
			texts += '<text x="' + f(mid) + '" y="' + f(cy + fs * 0.35) + '">' + esc(chars.join("")) + "</text>";
			for (let k = L; k <= R; k++) skip.add(k);
			c = e - 1;
		}
		// 영문만 있는 묶음은 칸마다 놓아 격자 느낌을 지키고, 한글이 섞인 묶음은 예약한 칸 가운데에 한 덩어리로 놓아 자간을 살린다.
		// 상자 안 글자는 좌우 테두리 사이의 정확한 가운데에 한 덩어리로 놓는다. 격자 렌더러는 칸 수로 맞춰 반 칸씩 어긋난다.
		// 선 위 라벨처럼 테두리가 없으면, 한글이 섞인 묶음은 예약 칸 가운데에, 영문 묶음은 칸마다 놓는다.
		const wall = (chr) => chr === "│" || chr === "◇" || chr === "├" || chr === "┤";
		const walls = (from, to) => {
			let l = from - 1, rgt = to;
			while (l >= 0 && (row[l] === " " || row[l] === ZW)) l--;
			while (rgt < row.length && (row[rgt] === " " || row[rgt] === ZW)) rgt++;
			return wall(row[l] || "") && wall(row[rgt] || "") ? [l, rgt] : null;
		};
		// 상자 안쪽 줄 수와 라벨 줄 수의 홀짝이 다르면 렌더러가 남는 빈 줄을 위에 두어 라벨이 반 줄 처진다. 그만큼 올린다.
		const lift = (box) => {
			const col = run.start;
			let top = r - 1, bottom = r + 1;
			while (top >= 0 && !isHBorder((rows[top] || "")[col])) top--;
			while (bottom < rows.length && !isHBorder((rows[bottom] || "")[col])) bottom++;
			// 시퀀스도의 생명선 사이 글자처럼 상자가 아닌 자리는 건드리지 않는다. 상자는 테두리 줄의 벽 자리가 모서리다.
			const corner = (chr) => chr !== undefined && chr !== "─" && chr !== "═" && chr !== "╌" && (LINES[chr] !== undefined || chr === "◇");
			if (top < 0 || bottom >= rows.length || !corner((rows[top] || "")[box[0]]) || !corner((rows[bottom] || "")[box[0]])) return 0;
			let labelRows = 0;
			for (let k = top + 1; k < bottom; k++) {
				const inner = (rows[k] || "").slice(box[0] + 1, box[1]).split(ZW).join("").trim();
				if (inner.length > 0) labelRows++;
			}
			return (bottom - top - 1 - labelRows) % 2 === 1 ? -ch / 2 : 0;
		};
		const flush = () => {
			if (!run) return;
			const box = walls(run.start, run.end);
			const y = f(cy + fs * 0.35 + (box ? lift(box) : 0));
			const x = box ? f(((box[0] + 1) * cw + box[1] * cw) / 2) : run.wide ? f((run.start * cw + run.end * cw) / 2) : run.xs.join(" ");
			texts += '<text x="' + x + '" y="' + y + '">' + esc(run.chars.join("")) + "</text>";
			run = null;
		};

		for (let c = 0; c < row.length; c++) {
			const chr = row[c];
			const cx = c * cw + cw / 2, x0 = c * cw, x1 = x0 + cw;

			if (skip.has(c)) { flush(); continue; }
			if (chr === ZW) { if (run) run.end = c + 1; continue; }

			// 라벨 안의 한 칸 띄어쓰기는 묶음에 넣어 한 줄을 한 덩어리로 놓는다. 빈칸이 이어지면 묶음이 끝난 것이다.
			if (chr === " ") {
				const next = row[c + 1];
				const joins = run && next !== undefined && next !== " " && next !== ZW && !LINES[next] && !ARROWS[next] && next !== "◇";
				if (!joins) { flush(); continue; }
			}

			// 가로 배치에서 렌더러는 상자 오른쪽에 빈칸 하나를 두고 ├ 로 선을 시작한다. 세로로 이어지는 선이 없으면
			// 갈래가 아니라 출발점이므로, 빈칸까지 메우는 가로선으로 그린다.
			const above = rows[r - 1] ? rows[r - 1][c] : " ", below = rows[r + 1] ? rows[r + 1][c] : " ";
			const vertical = (v) => v !== undefined && LINES[v] !== undefined && /[UD]/.test(LINES[v]) || v === "◇";
			if ((chr === "├" || chr === "┤") && !vertical(above) && !vertical(below)) {
				flush();
				let l = c - 1, rgt = c + 1;
				while (l >= 0 && row[l] === " ") l--;
				while (rgt < row.length && row[rgt] === " ") rgt++;
				const gapL = isWall(row[l]) ? l * cw + cw / 2 : x0;
				const gapR = isWall(row[rgt]) ? rgt * cw + cw / 2 : x1;
				path += "M" + f(gapL) + " " + f(cy) + "H" + f(gapR) + " ";
				continue;
			}

			const ln = LINES[chr];
			if (ln) {
				flush();
				if (ln.indexOf("r") >= 0) {
					const ax = ln.indexOf("L") >= 0 ? x0 : x1, by = ln.indexOf("U") >= 0 ? y0 : y1;
					arcs += "M" + f(ax) + " " + f(cy) + "Q" + f(cx) + " " + f(cy) + " " + f(cx) + " " + f(by) + " ";
				} else {
					// 옆 칸이 벽이면 벽 선의 가운데까지 늘려 붙인다. 이중선(b)은 굵게, 점선(d)은 끊어 그린다.
					let seg = "";
					if (ln.indexOf("L") >= 0) seg += "M" + f(isWall(row[c - 1]) ? x0 - cw / 2 : x0) + " " + f(cy) + "H" + f(cx) + " ";
					if (ln.indexOf("R") >= 0) seg += "M" + f(cx) + " " + f(cy) + "H" + f(isWall(row[c + 1]) ? x1 + cw / 2 : x1) + " ";
					if (ln.indexOf("U") >= 0) seg += "M" + f(cx) + " " + f(y0) + "V" + f(cy) + " ";
					if (ln.indexOf("D") >= 0) seg += "M" + f(cx) + " " + f(cy) + "V" + f(y1) + " ";
					if (ln.indexOf("b") >= 0) bold += seg; else if (ln.indexOf("d") >= 0) dashed += seg; else path += seg;
				}
				continue;
			}

			const ar = ARROWS[chr];
			if (ar) {
				flush();
				// 화살촉 끝은 다음 칸이 벽이면 벽 선의 가운데에 닿는다.
				const w = cw * 0.9, h = ch * 0.42;
				const tipR = isWall(row[c + 1]) ? x1 + cw / 2 : cx + w / 2, tipL = isWall(row[c - 1]) ? x0 - cw / 2 : cx - w / 2;
				const tipD = isHBorder(below) ? y1 + ch / 2 : cy + h / 2, tipU = isHBorder(above) ? y0 - ch / 2 : cy - h / 2;
				if (ar === "R") { path += "M" + f(x0) + " " + f(cy) + "H" + f(tipR - w) + " "; tris += "M" + f(tipR - w) + " " + f(cy - h / 2) + "L" + f(tipR) + " " + f(cy) + "L" + f(tipR - w) + " " + f(cy + h / 2) + "Z "; }
				if (ar === "L") { path += "M" + f(tipL + w) + " " + f(cy) + "H" + f(x1) + " "; tris += "M" + f(tipL + w) + " " + f(cy - h / 2) + "L" + f(tipL) + " " + f(cy) + "L" + f(tipL + w) + " " + f(cy + h / 2) + "Z "; }
				if (ar === "D") { path += "M" + f(cx) + " " + f(y0) + "V" + f(tipD - h) + " "; tris += "M" + f(cx - w / 2) + " " + f(tipD - h) + "L" + f(cx + w / 2) + " " + f(tipD - h) + "L" + f(cx) + " " + f(tipD) + "Z "; }
				if (ar === "U") { path += "M" + f(cx) + " " + f(tipU + h) + "V" + f(y1) + " "; tris += "M" + f(cx - w / 2) + " " + f(tipU + h) + "L" + f(cx + w / 2) + " " + f(tipU + h) + "L" + f(cx) + " " + f(tipU) + "Z "; }
				continue;
			}

			if (chr === "◇") {
				flush();
				const w = cw * 0.8, h = ch * 0.4;
				marks += "M" + f(cx) + " " + f(cy - h / 2) + "L" + f(cx + w / 2) + " " + f(cy) + "L" + f(cx) + " " + f(cy + h / 2) + "L" + f(cx - w / 2) + " " + f(cy) + "Z ";
				continue;
			}

			// 상태도의 시작점(●)과 클래스도의 상속 표식(△).
			if (chr === "●") {
				flush();
				const rr = cw * 0.45;
				dots += "M" + f(cx - rr) + " " + f(cy) + "a" + f(rr) + " " + f(rr) + " 0 1 0 " + f(rr * 2) + " 0a" + f(rr) + " " + f(rr) + " 0 1 0 " + f(-rr * 2) + " 0Z ";
				continue;
			}

			if (chr === "△") {
				flush();
				const w = cw * 0.9, h = ch * 0.42;
				marks += "M" + f(cx) + " " + f(cy - h / 2) + "L" + f(cx + w / 2) + " " + f(cy + h / 2) + "L" + f(cx - w / 2) + " " + f(cy + h / 2) + "Z ";
				path += "M" + f(cx) + " " + f(cy + h / 2) + "V" + f(y1) + " ";
				continue;
			}

			if (!run) run = {start: c, end: c + 1, xs: [], chars: [], wide: false};
			run.end = c + 1;
			run.xs.push(f(cx));
			run.chars.push(chr);
			if (WIDE.test(chr)) run.wide = true;
		}

		flush();
	});

	const W = f(cols * cw), H = f(rows.length * ch);

	return '<svg xmlns="http://www.w3.org/2000/svg" class="ascii-flow" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">' +
		'<path d="' + path + '" fill="none" stroke="var(--app-color-text-muted)" stroke-width="1"/>' +
		'<path d="' + bold + '" fill="none" stroke="var(--app-color-text-muted)" stroke-width="2"/>' +
		'<path d="' + dashed + '" fill="none" stroke="var(--app-color-text-muted)" stroke-width="1" stroke-dasharray="3 3"/>' +
		'<path d="' + arcs + '" fill="none" stroke="var(--app-color-text-muted)" stroke-width="1"/>' +
		'<path d="' + tris + '" fill="var(--app-color-text-muted)"/>' +
		'<path d="' + dots + '" fill="var(--app-color-text-muted)"/>' +
		'<path d="' + marks + '" fill="var(--app-color-surface)" stroke="var(--app-color-text-muted)" stroke-width="1"/>' +
		'<g font-family="var(--app-font-mono)" font-size="' + fs + '" text-anchor="middle" fill="var(--app-color-text)">' + texts + "</g></svg>";
}

/**
 * mermaid 원문 한 장을 격자 SVG 문자열로 바꾼다
 */
export const renderFlow = (source) => gridToSvg(renderMermaidASCII(widenCjk(source), ASCII_OPT));
