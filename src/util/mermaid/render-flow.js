/*
 * ASCII 격자의 빌드 시 SVG 렌더링 · CSS 변수 테마
 * 전각 문자의 폭 0 문자 삽입으로 2칸 확보
 * 공유 blueprint 알고리즘 · Biome 제외 · 실행 로직 변경 시 원본 대조
 */
import {renderMermaidASCII} from "beautiful-mermaid";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ASCII_OPT = {paddingX: 3, paddingY: 2, boxBorderPadding: 1, colorMode: "none"};
const WIDE = /[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿぀-ヿ＀-｠]/;
const ZW = "​";
const widenCjk = (src) => src.replace(new RegExp(WIDE.source, "g"), (c) => c + ZW);
// 선 문자의 연결 방향 · L R U D · r 둥근 모서리
const LINES = {"─": "LR", "│": "UD", "┌": "RD", "┐": "LD", "└": "RU", "┘": "LU", "├": "UDR", "┤": "UDL", "┬": "LRD", "┴": "LRU", "┼": "LRUD", "╭": "RDr", "╮": "LDr", "╰": "RUr", "╯": "LUr",
    "═": "LRb", "║": "UDb", "╔": "RDb", "╗": "LDb", "╚": "RUb", "╝": "LUb", "╟": "UDRb", "╢": "UDLb", "╌": "LRd", "╎": "UDd"};
const ARROWS = {"►": "R", "◄": "L", "▼": "D", "▲": "U", "▶": "R", "◀": "L"};
// 선·화살촉의 접점: 상자 벽 선의 가운데
const isWall = (chr) => chr === "│" || chr === "◇" || chr === "├" || chr === "┤";
const isHBorder = (chr) => chr !== undefined && chr !== " " && chr !== ZW && (LINES[chr] !== undefined || chr === "◇");

// ASCII 라벨 구간의 3칸 여백 보정
// 1) 글자를 가르지 않는 열 삽입 · 라벨 양옆 최소 6칸 확보
// 2) 라벨 중앙 정렬 · 줄 길이 유지로 세로선 정렬 보존
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
    // 선 위 라벨 · 양쪽 선 또는 모서리·화살표에 닿은 글자 묶음
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
    // 1) 오른쪽부터 열 삽입 · 기존 인덱스 보존
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
    // 2) 라벨 중앙 정렬
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
        // 전각 선 라벨의 1칸 오차 보정
        // 벽부터 화살촉까지 중앙 정렬 · 라벨 폭만큼 선 비움
        const skip = new Set();
        for (let c = 0; c < row.length; c++) {
            if (!isText(row[c]) || skip.has(c)) continue;
            let e = c;
            while (e < row.length && (isText(row[e]) || row[e] === ZW || (row[e] === " " && isText(row[e + 1])))) e++;
            // 테두리 라벨로 사라진 분기점 ┬ 복원
            // 테두리·세로선 연결 · 라벨은 다음 줄의 세로선 옆
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
            // 출발점 ├ 앞의 ASCII 여백을 건너 상자 벽까지 연결
            let segStart = L * cw, drawStart = L * cw;
            if (row[L] === "├" || row[L - 1] === "├") {
                const j = row[L] === "├" ? L : L - 1;
                const above = rows[r - 1] ? rows[r - 1][j] : " ", below = rows[r + 1] ? rows[r + 1][j] : " ";
                const junction = (above !== undefined && LINES[above] !== undefined && /[UD]/.test(LINES[above])) ||
                    (below !== undefined && LINES[below] !== undefined && /[UD]/.test(LINES[below]));
                if (junction) {
                    // 상자 벽인 ├는 기본 루프에서 유지 · 연결선만 벽 가운데부터 시작
                    segStart = center(j);
                    drawStart = center(j);
                    for (let m = j + 1; m < L; m++) skip.add(m);
                } else {
                    // 벽과 떨어진 ├는 별도 표식 없이 연결선으로 대체
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
        // 영문은 격자 칸별 배치 · 한글 혼합은 예약 칸 중앙의 글자 묶음
        // 상자 내부 라벨은 실제 테두리 중앙 · ASCII의 반 칸 오차 보정
        // 테두리 없는 라벨은 예약 칸 기준 정렬
        const wall = (chr) => chr === "│" || chr === "◇" || chr === "├" || chr === "┤";
        const walls = (from, to) => {
            let l = from - 1, rgt = to;
            while (l >= 0 && (row[l] === " " || row[l] === ZW)) l--;
            while (rgt < row.length && (row[rgt] === " " || row[rgt] === ZW)) rgt++;
            return wall(row[l] || "") && wall(row[rgt] || "") ? [l, rgt] : null;
        };
        // 상자 내부와 라벨의 줄 수 홀짝 차이 · 반 줄 처짐 보정
        const lift = (box) => {
            const col = run.start;
            let top = r - 1, bottom = r + 1;
            while (top >= 0 && !isHBorder((rows[top] || "")[col])) top--;
            while (bottom < rows.length && !isHBorder((rows[bottom] || "")[col])) bottom++;
            // 실제 상자 모서리만 보정 · 시퀀스 생명선 제외
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

            // 라벨 내부 단일 공백은 묶음 유지 · 연속 공백은 묶음 종료
            if (chr === " ") {
                const next = row[c + 1];
                const joins = run && next !== undefined && next !== " " && next !== ZW && !LINES[next] && !ARROWS[next] && next !== "◇";
                if (!joins) { flush(); continue; }
            }

            // 세로선 없는 ├·┤는 ASCII 가로선의 출발·도착점
            // 상자와의 여백까지 연결
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
                    // 벽 접점까지 선 연장 · b 이중선, d 점선
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
                // 화살촉의 벽 접점 보정
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

            // 상태도 시작 ● · 클래스 상속 △
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
 * Mermaid 원문의 격자 SVG 문자열
 */
export const renderFlow = (source) => gridToSvg(renderMermaidASCII(widenCjk(source), ASCII_OPT));
