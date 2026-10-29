/**
 * 재생 중 단계마다 머무는 시간
 */
export const fx_interval_ms = 2000;

/**
 * 재생을 누른 뒤 첫 전환까지. 보이던 장면은 이미 읽었으므로 짧게
 */
export const fx_first_interval_ms = 500;

/**
 * 실행 상자가 콘솔 출력을 모으는 기본 시간. data-wait로 바꿈
 */
export const fx_run_wait_ms = 2000;

/**
 * 슬라이더의 max 속성이 없을 때의 HTML 기본값
 */
export const fx_range_default_max = 100;

/**
 * 조작부 아이콘 이름
 */
export type FxIcon = keyof typeof fx_icons;

/**
 * 16px 칸에 그린 아이콘 도형. 속성은 [이름, 값] 쌍
 *
 *   - 색은 currentColor로 버튼 글자색을 따름
 *   - 끝과 꺾인 곳만 살짝 둥글게, 삼각형은 눈으로 보이는 가운데에 맞춰 오른쪽으로 조금
 */
export const fx_icons = {
    play: [
        {
            tag: "path",
            attributes: [
                ["d", "M5.6 4.2v7.6l6.1-3.8z"],
                ["fill", "currentColor"],
                ["stroke", "currentColor"],
                ["stroke-width", "1.4"],
                ["stroke-linejoin", "round"],
            ],
        },
    ],
    pause: [
        {
            tag: "rect",
            attributes: [
                ["x", "4.4"],
                ["y", "3.6"],
                ["width", "2.4"],
                ["height", "8.8"],
                ["rx", "0.7"],
                ["fill", "currentColor"],
            ],
        },
        {
            tag: "rect",
            attributes: [
                ["x", "9.2"],
                ["y", "3.6"],
                ["width", "2.4"],
                ["height", "8.8"],
                ["rx", "0.7"],
                ["fill", "currentColor"],
            ],
        },
    ],
    prev: [
        {
            tag: "path",
            attributes: [
                ["d", "M9.8 3.8 5.6 8l4.2 4.2"],
                ["fill", "none"],
                ["stroke", "currentColor"],
                ["stroke-width", "1.6"],
                ["stroke-linecap", "round"],
                ["stroke-linejoin", "round"],
            ],
        },
    ],
    next: [
        {
            tag: "path",
            attributes: [
                ["d", "M6.2 3.8 10.4 8l-4.2 4.2"],
                ["fill", "none"],
                ["stroke", "currentColor"],
                ["stroke-width", "1.6"],
                ["stroke-linecap", "round"],
                ["stroke-linejoin", "round"],
            ],
        },
    ],
} satisfies Record<string, {tag: "path" | "rect"; attributes: [string, string][]}[]>;
