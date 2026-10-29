---
name: Fx implementation plan
label: 인터랙티브 그림 위젯 구현과 검증 순서
group: Development
order: 63
---

# Fx Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** nomeehej.dev가 문서마다 복사해 쓰던 인터랙티브 그림 런타임을 for-humanity의 내장 위젯 `WgFx`로 옮긴다. 설계는 [Fx design](fx-design.md).

**Architecture:** 표 정렬 `WgTableSort`와 같은 구조다. `browser.js` 번들 안의 Hono 컴포넌트가 `DOMContentLoaded` 뒤 `.fx[data-fx]`마다 종류별 enhance 함수를 붙이고 해제 시 되돌린다. 작성 계약(클래스, 속성, 이벤트, 변수)은 기존 런타임과 같다. CSS는 Stylelint 규칙에 맞게 다시 쓴다.

**Tech Stack:** TypeScript, Hono JSX DOM(`useLayoutEffect`), Zod(이벤트 detail 검증), Vitest unit, Playwright e2e와 integration, Biome, Stylelint.

**Conventions:** 절대 import `@/...`(같은 폴더 CSS만 `./`), 4칸 들여쓰기와 큰따옴표, 모든 export와 상위 상수에 한국어 JSDoc, 매개변수 3개 초과는 객체 하나, 숫자는 `snake_case` 상수, 블록 문 필수, 중첩 삼항 금지, `innerHTML` 금지. 커밋 전 `pnpm test`, `pnpm check`, `pnpm build`, `git diff --check`. 커밋 제목은 영어 동사로 시작하고 끝에 ` | aa`.

원본 런타임은 `/Users/l-20220017/workspace/my_pjt_summary/scripts/fx/runtime.html`이다. 동작을 바꾸지 않고 옮긴다.

---

### Task 1: 상수, 타입, 순수 함수

**Files:**
- Create: `src/component/widget/fx/_constant/copy.ts`
- Create: `src/component/widget/fx/_constant/fx.ts`
- Create: `src/component/widget/fx/_type/enhance.ts`
- Create: `src/component/widget/fx/_function/to-fx-copy.ts`
- Create: `src/component/widget/fx/_function/to-steps.ts`
- Create: `src/component/widget/fx/_function/to-steps.test.ts`
- Create: `src/component/widget/fx/_function/to-positions.ts`
- Create: `src/component/widget/fx/_function/to-run-document.ts`
- Create: `src/component/widget/fx/_function/to-run-document.test.ts`

- [ ] **Step 1: 범위 표기 검사를 먼저 쓴다**

`src/component/widget/fx/_function/to-steps.test.ts`:

```ts
import {describe, expect, test} from "vitest";
import {toSteps} from "@/component/widget/fx/_function/to-steps";

/**
 * 단계 범위 표기(src/component/widget/fx/_function/to-steps.ts) 검증
 */
describe("단계 범위", () => {
    test("하나, 구간, 끝까지, 처음부터 표기를 공백으로 이어 쓴다", () => {
        expect([...toSteps("3", 5)]).toEqual([3]);
        expect([...toSteps("2-4", 5)]).toEqual([2, 3, 4]);
        expect([...toSteps("4-", 5)]).toEqual([4, 5]);
        expect([...toSteps("-2", 5)]).toEqual([1, 2]);
        expect([...toSteps("1 3-4 -1", 5)].toSorted()).toEqual([1, 3, 4]);
    });

    test("빈 표기와 숫자가 아닌 조각은 단계를 켜지 않는다", () => {
        expect(toSteps("", 5).size).toBe(0);
        expect(toSteps("  ", 5).size).toBe(0);
        expect(toSteps("a 2", 5)).toEqual(new Set([2]));
    });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm exec vitest run src/component/widget/fx`
Expected: FAIL, `to-steps` 모듈 없음.

- [ ] **Step 3: 범위 함수를 쓴다**

`src/component/widget/fx/_function/to-steps.ts`:

```ts
/**
 * 구간 표기. 앞 숫자가 없으면 1부터, 뒤 숫자가 없으면 끝까지
 */
const range_pattern = /^(\d*)-(\d*)$/;

/**
 * "3", "2-5", "4-", "-2"를 공백으로 이은 표기에서 켜지는 단계 집합
 *
 *   - count는 전체 단계 수. "4-"의 끝
 *   - 숫자가 아닌 조각은 무시
 */
export const toSteps = (spec: string, count: number): Set<number> => {
    const steps = new Set<number>();

    for (const part of spec.trim().split(/\s+/)) {
        if (part === "") {
            continue;
        }

        const range = range_pattern.exec(part);

        if (range === null) {
            const step = Number(part);

            if (Number.isInteger(step)) {
                steps.add(step);
            }

            continue;
        }

        const start = range[1] === "" ? 1 : Number(range[1]);
        const end = range[2] === "" ? count : Number(range[2]);

        for (let step = start; step <= end; step++) {
            steps.add(step);
        }
    }

    return steps;
};
```

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm exec vitest run src/component/widget/fx`
Expected: PASS 2건.

- [ ] **Step 5: 위치 표기 함수를 쓴다**

`src/component/widget/fx/_function/to-positions.ts`:

```ts
/**
 * 한 단계의 좌표. "4:120 40"은 4단계부터 x 120, y 40
 */
export interface FxPosition {
    /**
     * 이 좌표가 시작되는 단계
     */
    step: number;

    /**
     * translate x, CSS 픽셀
     */
    x: number;

    /**
     * translate y, CSS 픽셀
     */
    y: number;
}

/**
 * 단계와 x y 한 쌍의 표기
 */
const position_pattern = /^(\d+):\s*(-?[\d.]+)\s+(-?[\d.]+)$/;

/**
 * "1:0 0;4:120 40" 표기의 단계별 위치. 형식에 맞지 않는 조각은 제외
 */
export const toPositions = (spec: string): FxPosition[] => {
    return spec.split(";").flatMap((part) => {
        const match = position_pattern.exec(part.trim());

        return match === null ? [] : [{step: Number(match[1]), x: Number(match[2]), y: Number(match[3])}];
    });
};
```

- [ ] **Step 6: 실행 문서 검사를 먼저 쓴다**

`src/component/widget/fx/_function/to-run-document.test.ts`:

```ts
import {describe, expect, test} from "vitest";
import {toRunDocument} from "@/component/widget/fx/_function/to-run-document";

/**
 * 실행 상자의 srcdoc(src/component/widget/fx/_function/to-run-document.ts) 검증
 */
describe("실행 문서", () => {
    test("콘솔 shim 뒤에 사용자 코드를 두고 id를 전달한다", () => {
        const html = toRunDocument({id: "abc", code: "console.log(1)"});

        expect(html).toContain('const id="abc"');
        expect(html.indexOf("postMessage")).toBeLessThan(html.indexOf("console.log(1)"));
        expect(html.match(/<script>/g)).toHaveLength(2);
    });

    test("사용자 코드의 닫는 script 태그는 문서를 닫지 못한다", {}, () => {
        const html = toRunDocument({id: "abc", code: 'const s = "</script><b>x</b>"'});

        expect(html).not.toContain("</script><b>");
        expect(html).toContain("<\\/script><b>");
    });
});
```

- [ ] **Step 7: 실패를 확인한다**

Run: `pnpm exec vitest run src/component/widget/fx`
Expected: FAIL, `to-run-document` 모듈 없음.

- [ ] **Step 8: 실행 문서 함수를 쓴다**

`src/component/widget/fx/_function/to-run-document.ts`:

```ts
/**
 * 실행 문서 입력
 */
interface RunDocumentParams {
    /**
     * 이번 실행의 메시지 id. 부모가 다른 실행과 구분
     */
    id: string;

    /**
     * 사용자가 실행할 코드
     */
    code: string;
}

/**
 * 닫는 script 태그. browser.js는 페이지에 인라인되므로 소스에 이 글자 그대로 두지 않는다
 */
const script_close = ["</", "script>"].join("");

/**
 * 사용자 코드 안의 닫는 script 태그
 */
const script_close_pattern = /<\/script/gi;

/**
 * 콘솔을 부모에 보내는 shim. 사용자 코드가 parent나 id 같은 이름을 써도 부딪치지 않게 즉시 실행 함수
 *
 *   - 문자열은 그대로, 함수는 이름, 오류는 메시지, 그 밖은 JSON
 *   - console.log, info, warn, error와 잡히지 않은 오류, 거부를 한 줄씩 전달
 */
const toShim = (id: string) => {
    return [
        "(()=>{",
        "const target=window.parent;",
        `const id=${JSON.stringify(id)};`,
        "const show=(v)=>{",
        "if(typeof v==='string')return v;",
        "if(v===null||['undefined','number','bigint','boolean','symbol'].includes(typeof v))return String(v);",
        "if(typeof v==='function')return '[Function '+(v.name||'anonymous')+']';",
        "if(v instanceof Error)return String(v);",
        "try{return JSON.stringify(v)}catch{return String(v)}",
        "};",
        "const send=(...a)=>target.postMessage({id,line:a.map(show).join(' ')},'*');",
        "console.log=console.info=console.warn=console.error=send;",
        "addEventListener('error',(e)=>send('Uncaught '+e.message));",
        "addEventListener('unhandledrejection',(e)=>send('Uncaught (in promise) '+show(e.reason)));",
        "})()",
    ].join("");
};

/**
 * sandbox iframe의 srcdoc. shim 스크립트 다음에 사용자 코드 스크립트
 */
export const toRunDocument = (params: RunDocumentParams): string => {
    const code = params.code.replace(script_close_pattern, "<\\/script");

    return `<script>${toShim(params.id)}${script_close}<script>${code}${script_close}`;
};
```

- [ ] **Step 9: 통과를 확인한다**

Run: `pnpm exec vitest run src/component/widget/fx`
Expected: PASS 4건.

- [ ] **Step 10: 문구, 상수, 타입, 문구 선택을 쓴다**

`src/component/widget/fx/_constant/copy.ts`:

```ts
/**
 * 조작부 문구 한 벌
 */
export interface FxCopy {
    /**
     * 재생 아이콘 버튼의 이름
     */
    play: string;

    /**
     * 멈춤 아이콘 버튼의 이름
     */
    pause: string;

    /**
     * 이전 단계 아이콘 버튼의 이름
     */
    previous: string;

    /**
     * 다음 단계 아이콘 버튼의 이름
     */
    next: string;

    /**
     * 스크러버의 이름
     */
    step: string;

    /**
     * 실행 상자의 실행 버튼
     */
    run: string;

    /**
     * 실행 상자의 코드 입력 열기
     */
    edit: string;

    /**
     * 실행 상자의 코드 입력 닫기
     */
    close: string;

    /**
     * 실행 상자의 처음 코드로 되돌리기
     */
    reset: string;

    /**
     * 코드 입력 상자의 이름
     */
    code: string;

    /**
     * 출력이 비었을 때의 안내
     */
    empty: string;
}

/**
 * 조작부 문구. 페이지 언어의 기본 하위 태그가 ko면 한국어, 그 밖은 영어
 */
export const copy_fx: Record<"en" | "ko", FxCopy> = {
    en: {
        play: "Play",
        pause: "Pause",
        previous: "Previous step",
        next: "Next step",
        step: "Step",
        run: "Run",
        edit: "Edit code",
        close: "Close editor",
        reset: "Reset code",
        code: "Code to run",
        empty: "Console output appears here after you run the code",
    },
    ko: {
        play: "재생",
        pause: "멈춤",
        previous: "이전 단계",
        next: "다음 단계",
        step: "단계",
        run: "실행",
        edit: "코드 고치기",
        close: "고치기 닫기",
        reset: "처음 코드로",
        code: "실행할 코드",
        empty: "실행하면 콘솔 출력이 여기에 나온다",
    },
};
```

`src/component/widget/fx/_constant/fx.ts`:

```ts
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
 * 슬라이더의 min, max 속성이 없을 때의 HTML 기본값
 */
export const fx_range_default_max = 100;

/**
 * 조작부 아이콘 이름
 */
export type FxIcon = "play" | "pause" | "prev" | "next";

/**
 * 16px 칸에 그린 아이콘 도형. 속성은 [이름, 값] 쌍
 *
 *   - 색은 currentColor로 버튼 글자색을 따름
 *   - 끝과 꺾인 곳만 살짝 둥글게, 삼각형은 눈으로 보이는 가운데에 맞춰 오른쪽으로 조금
 */
export const fx_icons: Record<FxIcon, {tag: "path" | "rect"; attributes: [string, string][]}[]> = {
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
};
```

`src/component/widget/fx/_type/enhance.ts`:

```ts
import type {FxCopy} from "@/component/widget/fx/_constant/copy";

/**
 * 그림 하나를 살리는 입력
 */
export interface FxEnhanceParams {
    /**
     * data-fx를 가진 .fx 상자
     */
    root: HTMLElement;

    /**
     * 페이지 언어의 조작부 문구
     */
    copy: FxCopy;

    /**
     * 위젯 해제에서 끊는 이벤트 구독
     */
    signal: AbortSignal;
}

/**
 * 종류별 enhance. 되돌리는 함수를 돌려줌
 */
export type FxEnhance = (params: FxEnhanceParams) => () => void;
```

`src/component/widget/fx/_function/to-fx-copy.ts`:

```ts
import {copy_fx, type FxCopy} from "@/component/widget/fx/_constant/copy";

/**
 * 페이지 언어의 조작부 문구. 날짜 라벨과 같은 규칙으로 기본 하위 태그 ko만 한국어
 */
export const toFxCopy = (lang: string): FxCopy => {
    return copy_fx[new Intl.Locale(lang === "" ? "en" : lang).language === "ko" ? "ko" : "en"];
};
```

- [ ] **Step 11: 검사와 커밋**

Run: `pnpm exec vitest run src/component/widget/fx && pnpm lint && pnpm typecheck`
Expected: PASS 4건, 린트와 타입 오류 없음. knip은 아직 소비자가 없는 export를 보고하므로 Task 5까지는 `pnpm knip`을 건너뛴다.

```bash
git add src/component/widget/fx
git commit -m "Add the step, position and run document helpers for figures | aa"
```

### Task 2: 버튼과 아이콘 도우미

**Files:**
- Create: `src/component/widget/fx/_function/to-button.ts`
- Create: `src/component/widget/fx/_function/set-icon.ts`

- [ ] **Step 1: 글자 버튼 도우미를 쓴다**

`src/component/widget/fx/_function/to-button.ts`:

```ts
/**
 * 조작부 버튼 입력
 */
export interface ButtonParams {
    /**
     * 보이는 글자. 아이콘 버튼은 빈 문자열
     */
    label: string;

    /**
     * 누름 처리
     */
    onClick: () => void;

    /**
     * 위젯 해제에서 끊는 구독
     */
    signal: AbortSignal;
}

/**
 * type=button인 조작부 버튼. 폼 제출 없음
 */
export const toButton = (params: ButtonParams): HTMLButtonElement => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = params.label;
    button.addEventListener("click", params.onClick, {signal: params.signal});

    return button;
};
```

- [ ] **Step 2: 아이콘 도우미를 쓴다**

`src/component/widget/fx/_function/set-icon.ts`:

```ts
import {type FxIcon, fx_icons} from "@/component/widget/fx/_constant/fx";

/**
 * SVG 이름공간
 */
const svg_namespace = "http://www.w3.org/2000/svg";

/**
 * 아이콘 교체 입력
 */
export interface IconParams {
    /**
     * 아이콘을 넣을 버튼
     */
    button: HTMLButtonElement;

    /**
     * 아이콘 이름
     */
    icon: FxIcon;

    /**
     * 버튼 이름. aria-label과 툴팁 data-tip
     */
    label: string;
}

/**
 * 16px 아이콘 SVG
 */
const toIcon = (icon: FxIcon): SVGSVGElement => {
    const svg = document.createElementNS(svg_namespace, "svg");

    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");

    for (const shape of fx_icons[icon]) {
        const element = document.createElementNS(svg_namespace, shape.tag);

        for (const [name, value] of shape.attributes) {
            element.setAttribute(name, value);
        }

        svg.append(element);
    }

    return svg;
};

/**
 * 버튼의 내용을 아이콘으로 바꾸고 이름을 aria-label과 툴팁으로 옮김. 재생과 멈춤 전환에도 사용
 */
export const setIcon = (params: IconParams) => {
    params.button.replaceChildren(toIcon(params.icon));
    params.button.classList.add("fx__icon");
    params.button.setAttribute("aria-label", params.label);
    params.button.dataset.tip = params.label;
};
```

- [ ] **Step 3: 검사와 커밋**

Run: `pnpm lint && pnpm typecheck`
Expected: 오류 없음.

```bash
git add src/component/widget/fx/_function/to-button.ts src/component/widget/fx/_function/set-icon.ts
git commit -m "Add the figure control button and icon helpers | aa"
```

### Task 3: 단계 재생

**Files:**
- Create: `src/component/widget/fx/_function/enhance-steps.ts`

- [ ] **Step 1: 단계 재생을 쓴다**

`src/component/widget/fx/_function/enhance-steps.ts`:

```ts
import {z} from "zod";
import {fx_first_interval_ms, fx_interval_ms} from "@/component/widget/fx/_constant/fx";
import {setIcon} from "@/component/widget/fx/_function/set-icon";
import {toButton} from "@/component/widget/fx/_function/to-button";
import {toPositions} from "@/component/widget/fx/_function/to-positions";
import {toSteps} from "@/component/widget/fx/_function/to-steps";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";

/**
 * 그림이 보내는 fx:goto의 detail. 단계와 이어서 재생할지
 */
const goto_detail_schema = z.object({step: z.number().int().optional(), play: z.boolean().optional()});

/**
 * 스크러버 진행이 100%인 단계 수. 단계가 하나면 항상 끝
 */
const full_progress = 100;

/**
 * 단계 재생. 조작부를 만들고 data-on, data-hl, data-pos를 단계마다 맞춤
 *
 *   - 단계 수는 캡션 항목 수, 없으면 data-steps
 *   - data-labels가 있으면 재생 조작부 대신 탭 버튼
 *   - 단계가 바뀔 때마다 fx:step을 보내고 그림의 fx:goto를 받음
 *   - 처음과 끝에서도 포커스를 잃지 않도록 disabled 대신 aria-disabled
 */
export const enhanceSteps: FxEnhance = ({root, copy, signal}) => {
    const captions = [...root.querySelectorAll<HTMLLIElement>(".fx__captions > li")];
    const list = root.querySelector(".fx__captions");
    const count = Number(root.dataset.steps) || captions.length;
    const shown = [...root.querySelectorAll<HTMLElement>("[data-on]")].map((element) => ({element, steps: toSteps(element.dataset.on ?? "", count)}));
    const marked = [...root.querySelectorAll<HTMLElement>("[data-hl]")].map((element) => ({element, steps: toSteps(element.dataset.hl ?? "", count)}));
    const moved = [...root.querySelectorAll<HTMLElement>("[data-pos]")].map((element) => ({element, positions: toPositions(element.dataset.pos ?? "")}));
    const labels = root.dataset.labels?.split("|");
    const bar = document.createElement("div");
    const scrub = document.createElement("input");
    const counter = document.createElement("span");

    let step = 1;
    let timer = 0;

    const stop = () => {
        window.clearTimeout(timer);
        timer = 0;
        setIcon({button: play, icon: "play", label: copy.play});
    };

    /**
     * 단계를 1과 count 사이로 맞추고 모든 요소와 조작부에 반영
     */
    const show = (next: number) => {
        step = Math.min(Math.max(next, 1), count);
        root.dataset.step = String(step);

        for (const {element, steps} of shown) {
            element.classList.toggle("is-on", steps.has(step));
        }

        for (const {element, steps} of marked) {
            element.classList.toggle("is-hl", steps.has(step));
        }

        for (const {element, positions} of moved) {
            const at = positions.filter((position) => position.step <= step).at(-1);

            element.style.transform = at === undefined ? "" : `translate(${at.x}px, ${at.y}px)`;
        }

        captions.forEach((caption, index) => {
            caption.hidden = index !== step - 1;
        });

        scrub.value = String(step);
        scrub.style.setProperty("--fx-p", `${count > 1 ? ((step - 1) / (count - 1)) * full_progress : full_progress}%`);
        counter.textContent = `${step} / ${count}`;
        previous.setAttribute("aria-disabled", String(step <= 1));
        next.setAttribute("aria-disabled", String(step >= count));
        tabs?.forEach((tab, index) => {
            tab.setAttribute("aria-pressed", String(index === step - 1));
        });
        root.dispatchEvent(new CustomEvent("fx:step", {detail: {step}}));
    };

    const tick = () => {
        show(step + 1);

        if (step >= count) {
            stop();

            return;
        }

        timer = window.setTimeout(tick, fx_interval_ms);
    };

    /**
     * 재생 시작. 끝에서 누르면 1단계로 돌아가 첫 장면도 제 시간만큼 보임
     */
    const start = (wait = fx_first_interval_ms) => {
        let first = wait;

        if (step >= count) {
            show(1);
            first = fx_interval_ms;
        }

        setIcon({button: play, icon: "pause", label: copy.pause});
        timer = window.setTimeout(tick, first);
    };

    const play = toButton({
        label: "",
        signal,
        onClick: () => {
            if (timer === 0) {
                start();
            } else {
                stop();
            }
        },
    });
    const previous = toButton({
        label: "",
        signal,
        onClick: () => {
            stop();
            show(step - 1);
        },
    });
    const next = toButton({
        label: "",
        signal,
        onClick: () => {
            stop();
            show(step + 1);
        },
    });
    const tabs = labels?.map((label, index) => {
        return toButton({
            label,
            signal,
            onClick: () => {
                stop();
                show(index + 1);
            },
        });
    });

    setIcon({button: previous, icon: "prev", label: copy.previous});
    setIcon({button: next, icon: "next", label: copy.next});

    scrub.type = "range";
    scrub.className = "fx__scrub";
    scrub.min = "1";
    scrub.max = String(count);
    scrub.step = "1";
    scrub.setAttribute("aria-label", copy.step);
    scrub.addEventListener(
        "input",
        () => {
            stop();
            show(Number(scrub.value));
        },
        {signal},
    );

    counter.className = "fx__count";
    bar.className = "fx__bar";

    root.addEventListener(
        "keydown",
        (event) => {
            if (event.target instanceof Element && event.target.closest("input, textarea") !== null) {
                return;
            }

            if (event.key === "ArrowRight") {
                stop();
                show(step + 1);
            } else if (event.key === "ArrowLeft") {
                stop();
                show(step - 1);
            }
        },
        {signal},
    );

    // 그림이 처음부터 다시 보이고 싶을 때 보내는 신호
    root.addEventListener(
        "fx:goto",
        (event) => {
            const detail = goto_detail_schema.safeParse(event instanceof CustomEvent ? event.detail : undefined);

            stop();
            show(detail.success ? (detail.data.step ?? 1) : 1);

            if (detail.success && detail.data.play === true) {
                start(fx_interval_ms);
            }
        },
        {signal},
    );

    list?.setAttribute("aria-live", "polite");

    if (tabs === undefined) {
        // 재생을 맨 앞에 두어 시범 재생 버튼만 있는 그림과 같은 자리에 맞춤
        bar.append(play, previous, next, scrub, counter);
    } else {
        bar.append(...tabs);
    }

    root.append(bar);
    root.classList.add("fx--ready");
    stop();
    show(1);

    return () => {
        window.clearTimeout(timer);
        bar.remove();
        root.classList.remove("fx--ready");
        delete root.dataset.step;
        list?.removeAttribute("aria-live");

        for (const {element} of shown) {
            element.classList.remove("is-on");
        }

        for (const {element} of marked) {
            element.classList.remove("is-hl");
        }

        for (const {element} of moved) {
            element.style.transform = "";
        }

        for (const caption of captions) {
            caption.hidden = false;
        }
    };
};
```

- [ ] **Step 2: 검사와 커밋**

Run: `pnpm lint && pnpm typecheck`
Expected: 오류 없음. `play`와 `previous`가 선언 전에 `stop`과 `show` 안에서 쓰이지만 호출은 선언 뒤라 Biome의 `noInvalidUseBeforeDeclaration`이 보고하지 않는다. 보고하면 `stop`, `show`, `tick`, `start`를 버튼 선언 아래로 옮긴다.

```bash
git add src/component/widget/fx/_function/enhance-steps.ts
git commit -m "Add the step figure controls | aa"
```

### Task 4: 슬라이더와 실행 상자

**Files:**
- Create: `src/component/widget/fx/_function/enhance-range.ts`
- Create: `src/component/widget/fx/_function/enhance-run.ts`

- [ ] **Step 1: 슬라이더를 쓴다**

`src/component/widget/fx/_function/enhance-range.ts`:

```ts
import {fx_range_default_max} from "@/component/widget/fx/_constant/fx";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";

/**
 * 슬라이더. 값 비율을 --fx-v와 data-value로 주고 output과 fx:input을 갱신
 *
 *   - min, max 속성이 없으면 HTML 기본값 0과 100
 *   - data-unit은 output 뒤에 붙는 단위
 */
export const enhanceRange: FxEnhance = ({root, signal}) => {
    const input = root.querySelector<HTMLInputElement>("input[type=range]");
    const output = root.querySelector("output");

    if (input === null) {
        return () => {};
    }

    const update = () => {
        const min = input.min === "" ? 0 : Number(input.min);
        const max = input.max === "" ? fx_range_default_max : Number(input.max);
        const value = Number(input.value);
        const ratio = max > min ? (value - min) / (max - min) : 0;

        root.style.setProperty("--fx-v", String(ratio));
        root.dataset.value = input.value;

        if (output !== null) {
            output.textContent = `${input.value}${input.dataset.unit ?? ""}`;
        }

        root.dispatchEvent(new CustomEvent("fx:input", {detail: {value, ratio}}));
    };

    input.addEventListener("input", update, {signal});
    root.classList.add("fx--ready");
    update();

    return () => {
        root.classList.remove("fx--ready");
        root.style.removeProperty("--fx-v");
        delete root.dataset.value;
    };
};
```

- [ ] **Step 2: 실행 상자를 쓴다**

`src/component/widget/fx/_function/enhance-run.ts`:

```ts
import {z} from "zod";
import {fx_run_wait_ms} from "@/component/widget/fx/_constant/fx";
import {toButton} from "@/component/widget/fx/_function/to-button";
import {toRunDocument} from "@/component/widget/fx/_function/to-run-document";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";

/**
 * sandbox 안의 shim이 보내는 콘솔 한 줄
 */
const run_message_schema = z.object({id: z.string(), line: z.string()});

/**
 * 실행 상자. 바로 앞 코드 블록을 sandbox iframe에서 실행해 콘솔을 보임
 *
 *   - 앞 형제가 pre거나 pre code를 담은 상자일 때만 살림
 *   - 실행마다 새 id와 새 iframe. 그 iframe에서 온 같은 id의 메시지만 출력
 *   - data-wait(ms) 뒤 iframe을 지움. 기본 2000
 */
export const enhanceRun: FxEnhance = ({root, copy, signal}) => {
    const sibling = root.previousElementSibling;
    const source = sibling?.matches("pre") === true ? sibling.querySelector("code") : (sibling?.querySelector("pre code") ?? null);

    if (source === null || source === undefined) {
        return () => {};
    }

    const initial = (source.textContent ?? "").replace(/\n$/, "");
    const code = document.createElement("textarea");
    const output = document.createElement("div");
    const bar = document.createElement("div");

    let frame: HTMLIFrameElement | null = null;
    let id = "";
    let timer = 0;

    const finish = () => {
        window.clearTimeout(timer);
        timer = 0;
        frame?.remove();
        frame = null;
    };

    const execute = () => {
        finish();
        output.textContent = "";
        id = crypto.randomUUID();

        const next = document.createElement("iframe");

        next.setAttribute("sandbox", "allow-scripts");
        next.hidden = true;
        next.srcdoc = toRunDocument({id, code: code.value});
        frame = next;
        document.body.append(next);
        timer = window.setTimeout(finish, Number(root.dataset.wait) || fx_run_wait_ms);
    };

    const edit = toButton({
        label: copy.edit,
        signal,
        onClick: () => {
            code.hidden = !code.hidden;
            edit.textContent = code.hidden ? copy.edit : copy.close;

            if (!code.hidden) {
                code.focus();
            }
        },
    });

    code.value = initial;
    code.spellcheck = false;
    code.hidden = true;
    code.setAttribute("aria-label", copy.code);

    output.className = "fx__out";
    output.dataset.empty = root.dataset.empty ?? copy.empty;
    output.setAttribute("aria-live", "polite");

    bar.className = "fx__bar";
    bar.append(
        toButton({label: copy.run, signal, onClick: execute}),
        edit,
        toButton({
            label: copy.reset,
            signal,
            onClick: () => {
                code.value = initial;
                output.textContent = "";
            },
        }),
    );

    addEventListener(
        "message",
        (event) => {
            if (frame === null || event.source !== frame.contentWindow) {
                return;
            }

            const message = run_message_schema.safeParse(event.data);

            if (message.success && message.data.id === id) {
                output.textContent += `${message.data.line}\n`;
            }
        },
        {signal},
    );

    root.append(bar, code, output);
    root.classList.add("fx--ready", "fx__run");

    return () => {
        finish();
        bar.remove();
        code.remove();
        output.remove();
        root.classList.remove("fx--ready", "fx__run");
    };
};
```

- [ ] **Step 3: 검사와 커밋**

Run: `pnpm lint && pnpm typecheck`
Expected: 오류 없음.

```bash
git add src/component/widget/fx/_function/enhance-range.ts src/component/widget/fx/_function/enhance-run.ts
git commit -m "Add the slider and run box figures | aa"
```

### Task 5: 위젯과 셸 마운트

**Files:**
- Create: `src/component/widget/fx/wg-fx.tsx`
- Create: `src/component/widget/fx/wg-fx.css` (이 Task에서는 빈 파일 하나, 내용은 Task 6)
- Modify: `src/component/widget/shell-controls/wg-shell-controls.tsx` (import 목록과 `<WgTableSort />` 옆)

- [ ] **Step 1: 빈 CSS를 만든다**

```bash
printf '/* Task 6에서 채움 */\n' > src/component/widget/fx/wg-fx.css
```

- [ ] **Step 2: 위젯을 쓴다**

`src/component/widget/fx/wg-fx.tsx`:

```tsx
import {useLayoutEffect} from "hono/jsx";
import {enhanceRange} from "@/component/widget/fx/_function/enhance-range";
import {enhanceRun} from "@/component/widget/fx/_function/enhance-run";
import {enhanceSteps} from "@/component/widget/fx/_function/enhance-steps";
import {setIcon} from "@/component/widget/fx/_function/set-icon";
import {toFxCopy} from "@/component/widget/fx/_function/to-fx-copy";
import {type FxIcon, fx_icons} from "@/component/widget/fx/_constant/fx";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";
import "./wg-fx.css";

/**
 * data-fx 값별 enhance. custom은 작성자 스크립트 담당이라 없음
 */
const enhancers: Partial<Record<string, FxEnhance>> = {steps: enhanceSteps, range: enhanceRange, run: enhanceRun};

/**
 * data-icon 값이 아이콘 이름인지
 */
const isIcon = (value: string | undefined): value is FxIcon => {
    return value !== undefined && Object.hasOwn(fx_icons, value);
};

/**
 * 인터랙티브 그림 위젯의 입력
 */
export interface WgFxProps {
    /**
     * 조작부가 붙고 캡션이 접혀 본문 높이가 바뀐 뒤의 앵커 보정
     */
    onEnhanced?: () => void;
}

/**
 * 서버 본문의 .fx[data-fx] 그림에 조작부와 단계 표시. 셸과 본문 DOM 교체 미포함
 *
 *   - steps는 조작부 생성, range는 슬라이더 연결, run은 실행 상자, custom은 작성자 스크립트
 *   - 모든 종류의 button[data-icon]은 같은 아이콘 버튼으로 바꿈
 *   - 스크립트가 없으면 끝까지 가는 요소와 캡션 전체가 보이는 서버 HTML 유지
 */
export const WgFx = (props: WgFxProps) => {
    /**
     * 본문 파싱 뒤 그림마다 살리고 해제에서 되돌림
     */
    useLayoutEffect(() => {
        const lifetime = new AbortController();
        const disposers: (() => void)[] = [];

        const enhance = () => {
            const copy = toFxCopy(document.documentElement.lang);

            for (const button of document.querySelectorAll<HTMLButtonElement>(".fx button[data-icon]")) {
                const icon = button.dataset.icon;
                const label = button.textContent?.trim() ?? "";

                if (!isIcon(icon)) {
                    continue;
                }

                setIcon({button, icon, label});
                disposers.push(() => {
                    button.classList.remove("fx__icon");
                    button.removeAttribute("aria-label");
                    delete button.dataset.tip;
                    button.textContent = label;
                });
            }

            for (const root of document.querySelectorAll<HTMLElement>(".fx[data-fx]")) {
                const dispose = enhancers[root.dataset.fx ?? ""]?.({root, copy, signal: lifetime.signal});

                if (dispose !== undefined) {
                    disposers.push(dispose);
                }
            }

            if (disposers.length > 0) {
                props.onEnhanced?.();
            }
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", enhance, {once: true, signal: lifetime.signal});
        } else {
            enhance();
        }

        return () => {
            lifetime.abort();

            for (const dispose of disposers.toReversed()) {
                dispose();
            }

            disposers.length = 0;
        };
    }, []);

    return null;
};
```

- [ ] **Step 3: 셸에 마운트한다**

`src/component/widget/shell-controls/wg-shell-controls.tsx`의 import 목록에 한 줄을 더하고 `<WgTableSort />` 뒤에 한 줄을 더한다.

```tsx
import {WgFx} from "@/component/widget/fx/wg-fx";
```

```tsx
            <WgMermaid onRendered={handlePageLoad} />
            <WgTableSort />
            <WgFx onEnhanced={handlePageLoad} />
```

- [ ] **Step 4: 번들과 검사**

Run: `pnpm build:kit && grep -c "fx__bar" dist/browser.js && pnpm check`
Expected: `1` 이상, 린트와 타입과 knip 오류 없음. knip가 같은 파일 안에서만 쓰는 export 타입(`FxEnhanceParams`, `ButtonParams`, `IconParams`, `FxPosition`)을 보고하면 `export`를 뺀다. Biome `noMagicNumbers`가 `at(-1)`의 `-1`을 보고하면 `last_index` 상수로 뺀다.

- [ ] **Step 5: 커밋**

```bash
git add src/component/widget/fx/wg-fx.tsx src/component/widget/fx/wg-fx.css src/component/widget/shell-controls/wg-shell-controls.tsx
git commit -m "Mount the figure widget in the shell | aa"
```

### Task 6: 위젯 CSS

**Files:**
- Modify: `src/component/widget/fx/wg-fx.css` (전체 교체)

런타임 CSS의 선택자와 값을 유지하고 형식만 Stylelint 규칙에 맞춘다. 대응표는 [Fx design](fx-design.md#css-규칙-대응).

- [ ] **Step 1: CSS를 쓴다**

`src/component/widget/fx/wg-fx.css`:

```css
/*
 * 인터랙티브 그림. 작성자가 Markdown에 쓰는 .fx 상자와 위젯이 만드는 조작부
 *
 *   - fx 접두 클래스는 작성자 문법이라 wg_ 문법 밖의 외부 클래스로 둔다. 작성자도 fx__bar, fx--ready를 직접 쓴다
 *   - svg text, figcaption, button은 작성자 HTML이라 클래스를 요구하지 않고 요소 선택자로 꾸민다
 */

/* 그림 상자. 공개 변수는 사이트 토큰의 별칭이거나 light-dark 값이고 작성자 그림의 style과 script가 읽는다 */
/* stylelint-disable property-disallowed-list -- 작성자 그림이 소비하는 공개 변수 */
.fx {
    --fx-line: light-dark(#888, #777);
    --fx-line-strong: light-dark(#222, #eee);
    --fx-ink: var(--app-color-text);
    --fx-ink-strong: var(--app-color-text-strong);
    --fx-ink-muted: var(--app-color-text-muted);
    --fx-fill: var(--app-color-accent-soft);
    --fx-ground: var(--app-color-ground);
    --fx-mark: var(--app-color-anchor-highlight);
    --fx-ph: light-dark(#e6e6e0, #2e2e2e);
    --fx-ease: cubic-bezier(0.2, 0.7, 0.2, 1);

    margin: var(--app-space-block) 0;
    padding: var(--app-space-block);
    border: 1px solid var(--app-color-border);
}
/* stylelint-enable property-disallowed-list */

/* 위젯 안에서 display를 정한 요소도 hidden이면 숨긴다. 선택자 둘의 특이도가 단일 클래스보다 높다 */
.fx [hidden] {
    display: none;
}

/* 장면은 옆으로만 넘친다. 숨긴 data-on 요소의 translate 6px이 아래로 새어 세로 스크롤이 생기지 않게 */
.fx__stage,
.fx-scroll {
    overflow: auto hidden;
}

.fx__stage > * + * {
    margin-top: var(--app-space-block);
}

/* 격자와 나란히 비교는 gap으로 띄운다 */
.fx-cols > * + *,
.fx-pair > * + * {
    margin-top: 0;
}

.fx-pair {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-subsection);
    align-items: flex-start;
    justify-content: center;
}

.fx-cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    gap: var(--app-space-block);
}

/* 패널 제목. 본문 p 여백보다 앞서도록 .fx 아래 */
.fx .fx-label {
    margin: 0 0 var(--app-space-inline);
    color: var(--fx-ink-muted);
    font-size: var(--app-font-size-detail);
}

.fx * + .fx-label {
    margin-top: var(--app-space-block);
}

.fx figcaption {
    margin-top: var(--app-space-stack);
    color: var(--fx-ink-muted);
    font-size: var(--app-font-size-detail);
}

.fx-box {
    padding: var(--app-space-stack);
    border: 1px solid var(--fx-line);
    background: var(--fx-ground);
}

.fx-lane {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-inline);
    align-items: center;
    min-height: 42px;
    padding: var(--app-space-inline);
    border: 1px solid var(--fx-line);
    background: var(--fx-ground);
}

.fx-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--fx-line);
    background: var(--fx-fill);
    color: var(--fx-ink-strong);
    font-family: var(--app-font-mono);
    font-size: var(--app-font-size-detail);
    white-space: nowrap;
}

.fx-chip--mine {
    border: 1.8px solid var(--fx-line-strong);
}

.fx-chip--dash {
    border-style: dashed;
    background: var(--fx-ground);
}

/* 코드 줄 목록. 본문 ul 규칙보다 앞서도록 .fx 아래 */
.fx .fx-lines {
    margin: 0;
    padding: var(--app-space-inline) 0;
    border: 1px solid var(--fx-line);
    background: var(--fx-ground);
    font-family: var(--app-font-mono);
    font-size: var(--app-font-size-detail);
    line-height: var(--app-line-height-code);
    list-style: none;
}

.fx .fx-lines > li {
    margin: 0;
    padding: 0 var(--app-space-stack);
    white-space: pre;
}

.fx-muted {
    color: var(--fx-ink-muted);
    font-size: var(--app-font-size-detail);
}

.fx-swap {
    display: inline-grid;
}

.fx-swap > * {
    grid-area: 1 / 1;
}

.fx-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-inline);
    align-items: center;
}

.fx-row + .fx-row {
    margin-top: var(--app-space-inline);
}

.fx__stage > svg,
.fx-scroll > svg {
    display: block;
    max-width: 100%;
    height: auto;
    margin-inline: auto;
    overflow: visible;
    font-family: var(--app-font-body);
}

@media (width < 640px) {
    .fx__stage > svg,
    .fx-scroll > svg {
        max-width: none;
    }
}

/* SVG 글자와 도형. fill은 SVG 속성보다 우선하므로 따로 줄 색은 인라인 style */
.fx svg text {
    font-size: 14px;
    fill: var(--fx-ink);
}

.fx svg .fx-strong {
    font-weight: 600;
    fill: var(--fx-ink-strong);
}

.fx svg .fx-muted {
    font-size: 12px;
    fill: var(--fx-ink-muted);
}

.fx svg .fx-mono {
    font-family: var(--app-font-mono);
    font-size: 13px;
}

.fx svg .fx-box {
    fill: var(--fx-fill);
    stroke: var(--fx-line);
    stroke-width: 1;
}

.fx svg .fx-mine {
    fill: var(--fx-fill);
    stroke: var(--fx-line-strong);
    stroke-width: 1.8;
}

.fx svg .fx-ground {
    fill: var(--fx-ground);
    stroke: var(--fx-line);
    stroke-width: 1;
}

.fx svg .fx-dash {
    fill: none;
    stroke: var(--fx-line);
    stroke-width: 1.2;
    stroke-dasharray: 5 4;
}

.fx svg .fx-ln {
    fill: none;
    stroke: var(--fx-line);
    stroke-width: 1.2;
}

.fx svg .fx-ln-strong {
    fill: none;
    stroke: var(--fx-line-strong);
    stroke-width: 1.8;
}

.fx svg .fx-arrow {
    fill: var(--fx-line);
}

.fx svg .fx-mark {
    fill: var(--fx-mark);
    stroke: none;
}

/* 형광펜. 왼쪽에서 오른쪽으로 칠해진다 */
.fx [data-hl] {
    background-image: linear-gradient(var(--fx-mark), var(--fx-mark));
    background-repeat: no-repeat;
    background-size: 0% 100%;
}

.fx [data-hl].is-hl {
    background-size: 100% 100%;
}

.fx--ready [data-hl] {
    transition: background-size 0.45s var(--fx-ease);
}

/* SVG 안의 형광펜은 배경 대신 사각형을 늘린다 */
.fx svg [data-hl] {
    background-image: none;
}

.fx svg .fx-mark[data-hl] {
    transform: scaleX(0);
    transform-box: fill-box;
    transform-origin: left center;
}

.fx svg .fx-mark[data-hl].is-hl {
    transform: scaleX(1);
}

.fx--ready svg .fx-mark[data-hl] {
    transition: transform 0.45s var(--fx-ease);
}

/* 단계 요소. 스크립트 전에는 끝까지 가는 요소만 보인다 */
.fx [data-on] {
    opacity: 0;
}

.fx [data-on$="-"] {
    opacity: 1;
}

/* 스크립트 뒤에는 그 단계의 요소만 보이고 나머지는 아래로 조금 밀려 사라진다 */
.fx--ready [data-on] {
    opacity: 0;
    translate: 0 6px;
    pointer-events: none;
    transition:
        opacity 0.4s var(--fx-ease),
        translate 0.4s var(--fx-ease);
}

.fx--ready [data-on].is-on {
    opacity: 1;
    translate: 0;
    pointer-events: auto;
}

.fx--ready [data-pos] {
    transition: transform 0.6s var(--fx-ease);
}

.fx__captions {
    margin: var(--app-space-stack) 0 0;
    padding-left: 1.6em;
}

/* 본문의 ol 여백 규칙(.wg_article__root ol)보다 앞서야 그림과 설명 사이가 벌어진다 */
.fx .fx__captions {
    margin-top: var(--app-space-block);
}

.fx__captions > li {
    margin: 0;
}

/* 스크립트 뒤에는 한 항목만 보여 번호가 필요 없고 두 줄 높이를 미리 잡는다 */
.fx--ready .fx__captions {
    min-height: calc(var(--app-line-height-body) * 2em);
    padding-left: 0;
    list-style: none;
}

/* 그림 아래 조작부 띠. 상자 안쪽 여백을 되감아 가장자리까지 */
.fx__bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-stack);
    align-items: center;
    margin: var(--app-space-block) calc(-1 * var(--app-space-block)) calc(-1 * var(--app-space-block));
    padding: var(--app-space-stack) var(--app-space-block);
    border-top: 1px solid var(--app-color-border-layout);
    background: var(--fx-fill);
}

/* 조작부 버튼. 작성자가 fx__bar 안에 직접 둔 button과 fx-button도 같다 */
.fx__bar button,
.fx-button {
    min-width: 44px;
    min-height: 32px;
    padding: 4px 10px;
    border: 1px solid var(--app-color-border);
    border-radius: 0;
    background: var(--fx-ground);
    color: var(--fx-ink-strong);
    font: inherit;
    font-size: var(--app-font-size-detail);
    cursor: pointer;

    &:hover {
        background: var(--fx-fill);
    }

    &:focus-visible {
        outline: var(--app-outline-focus);
        outline-offset: var(--app-outline-focus-offset);
    }

    /* 처음과 끝의 이전, 다음은 포커스를 잃지 않도록 disabled 대신 aria-disabled */
    &:disabled,
    /* stylelint-disable-next-line selector-attribute-name-disallowed-list -- 작성자 마크업 버튼의 상태 계약 */
    &[aria-disabled="true"] {
        background: var(--fx-ground);
        color: var(--fx-ink-muted);
        cursor: default;
    }

    /* stylelint-disable-next-line selector-attribute-name-disallowed-list -- 작성자 마크업 버튼의 상태 계약 */
    &[aria-pressed="true"] {
        background: var(--fx-mark);
    }
}

.fx input {
    &:focus-visible {
        outline: var(--app-outline-focus);
        outline-offset: var(--app-outline-focus-offset);
    }
}

/* 아이콘 버튼. 이름은 aria-label과 같은 data-tip을 hover와 키보드 포커스에서 툴팁으로 보인다 */
.fx__bar .fx__icon {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    padding: 0;
}

.fx__icon > svg {
    display: block;
}

.fx__icon[data-tip] {
    &:focus-visible::after {
        content: attr(data-tip);
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        z-index: 2;
        padding: 2px 6px;
        background: var(--fx-ink-strong);
        color: var(--fx-ground);
        font-size: 11px;
        line-height: 1.5;
        white-space: nowrap;
        pointer-events: none;
        translate: -50% 0;
    }
}

@media (hover: hover) {
    .fx__icon[data-tip] {
        &:hover::after {
            content: attr(data-tip);
            position: absolute;
            bottom: calc(100% + 6px);
            left: 50%;
            z-index: 2;
            padding: 2px 6px;
            background: var(--fx-ink-strong);
            color: var(--fx-ground);
            font-size: 11px;
            line-height: 1.5;
            white-space: nowrap;
            pointer-events: none;
            translate: -50% 0;
        }
    }
}

/* 스크러버. 기본 모양을 지우고 2px 선과 작은 네모 손잡이. 진행은 JS가 주는 --fx-p */
.fx__scrub {
    flex: 1;
    min-width: 120px;
    max-width: 340px;
    height: 22px;
    margin: 0;
    background: none;
    appearance: none;
    cursor: pointer;

    &::-webkit-slider-runnable-track {
        height: 2px;
        background:
            linear-gradient(var(--fx-ink-strong), var(--fx-ink-strong)) 0 0 / var(--fx-p, 0%) 100% no-repeat,
            var(--app-color-border);
    }

    &::-webkit-slider-thumb {
        width: 12px;
        height: 12px;
        margin-top: -5px;
        border: 1.5px solid var(--fx-ink-strong);
        border-radius: 0;
        background: var(--fx-ground);
        appearance: none;
    }

    &::-moz-range-track {
        height: 2px;
        background: var(--app-color-border);
    }

    &::-moz-range-progress {
        height: 2px;
        background: var(--fx-ink-strong);
    }

    &::-moz-range-thumb {
        width: 9px;
        height: 9px;
        border: 1.5px solid var(--fx-ink-strong);
        border-radius: 0;
        background: var(--fx-ground);
    }

    &:hover::-webkit-slider-thumb {
        background: var(--fx-mark);
    }

    &:hover::-moz-range-thumb {
        background: var(--fx-mark);
    }
}

.fx__count {
    min-width: 4.5em;
    color: var(--fx-ink-muted);
    font-size: var(--app-font-size-detail);
    font-variant-numeric: tabular-nums;
    text-align: center;
}

/* 작성자가 두는 슬라이더 줄 */
.fx__range {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-stack);
    align-items: center;
    margin-top: var(--app-space-stack);
    font-size: var(--app-font-size-detail);
}

.fx__range input {
    flex: 1;
    min-width: 160px;
    accent-color: var(--fx-line-strong);
}

/* 실행 상자. 코드 블록 바로 아래에 붙으므로 상자 테두리와 여백 없음 */
.fx[data-fx="run"] {
    margin-top: calc(-1 * var(--app-space-stack));
    padding: 0;
    border: 0;
}

.fx[data-fx="run"] .fx__bar {
    margin: var(--app-space-stack) 0 0;
    padding: 0;
    border: 0;
    background: none;
}

.fx__run textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 12em;
    margin-top: var(--app-space-stack);
    padding: var(--app-space-stack) var(--app-space-block);
    border: 1px solid var(--app-color-border);
    border-radius: 0;
    background: var(--app-color-code);
    color: var(--fx-ink-strong);
    font-family: var(--app-font-mono);
    font-size: var(--app-font-size-detail);
    line-height: var(--app-line-height-code);
    resize: vertical;
    tab-size: 2;
}

.fx__out {
    min-height: 1.7em;
    margin: var(--app-space-stack) 0 0;
    padding: var(--app-space-stack) var(--app-space-block);
    border: 1px dashed var(--app-color-border);
    color: var(--fx-ink-strong);
    font-family: var(--app-font-mono);
    font-size: var(--app-font-size-detail);
    line-height: var(--app-line-height-code);
    white-space: pre-wrap;

    &:empty::before {
        content: attr(data-empty);
        color: var(--fx-ink-muted);
    }
}
```

- [ ] **Step 2: 린트를 돌리고 보고된 것만 고친다**

Run: `pnpm exec stylelint src/component/widget/fx/wg-fx.css && pnpm exec biome check src/component/widget/fx`
Expected: 오류 없음. 보고가 나오면 값과 선택자는 두고 형식만 고친다. 예상되는 보고와 대응:

| 보고 | 대응 |
| --- | --- |
| `no-descending-specificity` | 같은 마지막 복합 선택자를 가진 규칙을 특이도 오름차순으로 옮김 |
| `selector-no-vendor-prefix`가 `::-webkit-slider-thumb`를 보고 | 이유 주석으로 그 줄만 예외. `range 입력의 손잡이는 표준 pseudo-element가 없다` |
| `declaration-block-no-redundant-longhand-properties` | 보고한 longhand를 shorthand 하나로 합침 |
| Biome 포맷 차이 | `pnpm exec biome check --write src/component/widget/fx` |

- [ ] **Step 3: 번들에 들어갔는지 확인하고 커밋**

Run: `pnpm build:kit && grep -c "fx__bar" dist/cli.css && pnpm check`
Expected: `1` 이상, 오류 없음.

```bash
git add src/component/widget/fx/wg-fx.css
git commit -m "Style the figure box, scenes and controls | aa"
```

### Task 7: 브라우저 검사

**Files:**
- Create: `test/_fixture/fx.ts`
- Create: `test/_gallery/fx-lifecycle.tsx`
- Modify: `test/_type/browser.d.ts` (`tableSortFixture` 아래)
- Create: `test/2-page/2.7-fx.e2e.spec.ts`
- Create: `test/2-page/2.7-fx.integration.spec.ts`
- Modify: `test/README.md` (구조 목록, fixture와 갤러리 설명, 영역 코드)
- Modify: `package.json` (`test:mermaid` 아래)

- [ ] **Step 1: fixture 사이트를 쓴다**

`test/_fixture/fx.ts`:

```ts
import {execFileSync} from "node:child_process";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test as base} from "@playwright/test";
import {loadBrowserScript} from "@test/_fixture/load-browser-script";
import {preview} from "vite";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";

/**
 * 네 종류의 그림과 그림 아래 제목을 둔 영어 문서
 *
 *   - 단계: data-on 세 형식, data-hl, data-pos, 캡션 셋
 *   - 탭: data-labels와 data-steps
 *   - 작성자 스크립트가 fx:step을 받고 fx:goto를 보내는 단계 그림
 *   - 슬라이더, 실행 상자, custom의 data-icon 버튼
 */
const figures_document = [
    "---",
    "name: Figures",
    "label: Figures",
    "group: Guide",
    "---",
    "",
    "## Steps",
    "",
    '<figure class="fx" data-fx="steps" id="steps" aria-label="Three step scene">',
    '<div class="fx__stage">',
    '<p><span id="marked" data-hl="2">Highlight on two</span></p>',
    '<div class="fx-row">',
    '<span class="fx-chip" id="only-one" data-on="1">One</span>',
    '<span class="fx-chip" id="from-two" data-on="2-">Two onward</span>',
    '<span class="fx-chip" id="up-to-two" data-on="-2">Up to two</span>',
    '<span class="fx-chip" id="moved" data-pos="1:0 0;3:40 0">Moves</span>',
    "</div>",
    "</div>",
    '<ol class="fx__captions">',
    "<li>First caption</li>",
    "<li>Second caption</li>",
    "<li>Third caption</li>",
    "</ol>",
    "</figure>",
    "",
    "## Tabs",
    "",
    '<figure class="fx" data-fx="steps" id="tabs" data-labels="Before|After" data-steps="2" aria-label="Two tabs">',
    '<div class="fx__stage">',
    '<p data-on="1">Before scene</p>',
    '<p data-on="2">After scene</p>',
    "</div>",
    "</figure>",
    "",
    "## Scripted",
    "",
    '<figure class="fx" data-fx="steps" id="scripted" data-steps="3" aria-label="Scripted steps">',
    '<div class="fx__stage"><p id="scripted-out">waiting</p><button type="button" id="scripted-replay" class="fx-button">Replay</button></div>',
    "</figure>",
    '<script type="module">',
    'const root = document.getElementById("scripted");',
    'root.addEventListener("fx:step", (event) => { document.getElementById("scripted-out").textContent = `step ${event.detail.step}`; });',
    'document.getElementById("scripted-replay").addEventListener("click", () => root.dispatchEvent(new CustomEvent("fx:goto", {detail: {step: 1, play: true}})));',
    "</script>",
    "",
    "## Range",
    "",
    '<figure class="fx" data-fx="range" id="range" aria-label="Width slider">',
    '<div class="fx__stage"><div class="fx-box" id="bar" style="width: calc(20% + var(--fx-v, 0) * 80%)">Bar</div></div>',
    '<label class="fx__range">Width <input type="range" min="0" max="10" value="5" data-unit="px"> <output></output></label>',
    "</figure>",
    "",
    "## Run",
    "",
    "```js",
    'console.log("hello", 1 + 1);',
    'console.log({a: 1}, "</script>");',
    "missing.x;",
    "```",
    "",
    '<div class="fx" data-fx="run" id="run"></div>',
    "",
    "## Custom",
    "",
    '<figure class="fx" data-fx="custom" id="custom" aria-label="Custom figure">',
    '<div class="fx__stage"><p>Custom scene</p></div>',
    '<div class="fx__bar"><button type="button" data-icon="play">Replay</button></div>',
    "</figure>",
    '<script type="module">',
    'document.getElementById("custom").classList.add("fx--ready");',
    "</script>",
    "",
    "## After",
    "",
    "Text below the figures.",
    "",
].join("\n");

/**
 * 워커마다 격리한 실제 CLI 출력과 빈 포트의 로컬 서버. /lifecycle/은 셸 번들 대신 갤러리 스크립트
 */
export const test = base.extend<Record<never, never>, {fxSite: string}>({
    fxSite: [
        // biome-ignore lint/correctness/noEmptyPattern: Playwright가 구조분해 매개변수로 fixture 의존성을 조회
        async ({}, use) => {
            const root = await mkdtemp(join(tmpdir(), "for-humanity-fx-"));

            try {
                await mkdir(join(root, "public"));
                await writeFile(join(root, "for-humanity.config.ts"), 'export default {content: {root: "."}, lang: "en"};');
                await writeFile(join(root, "README.md"), "# Home\n\nOrdinary content.\n");
                await writeFile(join(root, "public/figures.md"), figures_document);
                await writeFile(join(root, "public/plain.md"), "---\nname: Plain\nlabel: Plain\ngroup: Guide\n---\n\nNo figures here.\n");

                execFileSync(process.execPath, ["dist/cli.js", "build", root]);

                const fixture = await loadBrowserScript("test/_gallery/fx-lifecycle.tsx");
                const shell = await readFile("dist/browser.js", "utf8");

                const html = (await readFile(join(root, "dist/figures/index.html"), "utf8"))
                    .replace(`<script>${shell}</script>`, "")
                    .replace("</body>", () => `<script>${fixture}</script></body>`);

                await mkdir(join(root, "dist/lifecycle"));
                await writeFile(join(root, "dist/lifecycle/index.html"), html);

                const server = await preview(toPreviewConfig({root, port: 0, host: "localhost", basePath: "/"}));

                try {
                    const url = server.resolvedUrls?.local[0];

                    if (url === undefined) {
                        throw new Error("미리보기 서버의 테스트 주소가 없습니다");
                    }

                    await use(new URL(url).origin);
                } finally {
                    await server.close();
                }
            } finally {
                await rm(root, {recursive: true, force: true});
            }
        },
        {scope: "worker"},
    ],
    baseURL: async ({fxSite}, use) => {
        await use(fxSite);
    },
});
```

- [ ] **Step 2: 갤러리와 전역 계약을 쓴다**

`test/_gallery/fx-lifecycle.tsx`:

```tsx
import {flushSync} from "hono/jsx/dom";
import {createRoot} from "hono/jsx/dom/client";
import {WgFx} from "@/component/widget/fx/wg-fx";

let mounted: ReturnType<typeof createRoot>;

/**
 * 공개 번들 밖에서 그림 위젯의 마운트와 해제만 노출
 */
window.fxFixture = {
    mount: () => {
        mounted = createRoot(document.createElement("div"));
        flushSync(() => mounted.render(<WgFx />));
    },
    unmount: () => {
        flushSync(() => mounted.unmount());
    },
};
```

`test/_type/browser.d.ts`의 `tableSortFixture` 아래에 더한다.

```ts
        /**
         * 그림 위젯의 마운트와 해제 명령
         */
        fxFixture: {mount: () => void; unmount: () => void};
```

- [ ] **Step 3: e2e 검사를 쓴다**

`test/2-page/2.7-fx.e2e.spec.ts`:

```ts
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/fx";

/**
 * 인터랙티브 그림(src/component/widget/fx) 검증. 실제 CLI 빌드 결과
 */
test.describe("그림", () => {
    test.describe("단계 재생", () => {
        test("[FIG-001] 조작부가 붙고 1단계에서 시작하며 다음과 이전이 요소, 형광펜, 위치, 캡션을 바꾼다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 빌드한 단계 그림
             */
            await page.goto("/figures/");

            const figure = page.locator("#steps");
            const bar = figure.locator(".fx__bar");
            const next = bar.getByRole("button", {name: "Next step"});
            const previous = bar.getByRole("button", {name: "Previous step"});
            const captions = figure.locator(".fx__captions > li");

            await expect(figure).toHaveClass(/fx--ready/);
            await expect(figure).toHaveAttribute("data-step", "1");
            await expect(bar.locator(".fx__count")).toHaveText("1 / 3");
            await expect(previous).toHaveAttribute("aria-disabled", "true");
            await expect(next).toHaveAttribute("aria-disabled", "false");
            await expect(captions.nth(0)).toBeVisible();
            await expect(captions.nth(1)).toBeHidden();
            await expect(page.locator("#only-one")).toHaveClass(/is-on/);
            await expect(page.locator("#from-two")).not.toHaveClass(/is-on/);
            await expect(page.locator("#up-to-two")).toHaveClass(/is-on/);
            await expect(page.locator("#marked")).not.toHaveClass(/is-hl/);
            await expect(page.locator("#moved")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

            /**
             * WHEN
             * 다음 단계를 두 번 누름
             */
            await next.click();
            await next.click();

            /**
             * THEN
             * 3단계의 요소, 위치, 캡션, 양 끝 상태
             */
            await expect(figure).toHaveAttribute("data-step", "3");
            await expect(bar.locator(".fx__count")).toHaveText("3 / 3");
            await expect(next).toHaveAttribute("aria-disabled", "true");
            await expect(page.locator("#only-one")).not.toHaveClass(/is-on/);
            await expect(page.locator("#from-two")).toHaveClass(/is-on/);
            await expect(page.locator("#up-to-two")).not.toHaveClass(/is-on/);
            await expect(page.locator("#moved")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 40, 0)");
            await expect(captions.nth(2)).toBeVisible();
            await expect(captions.nth(0)).toBeHidden();

            await previous.click();
            await expect(figure).toHaveAttribute("data-step", "2");
            await expect(page.locator("#marked")).toHaveClass(/is-hl/);
            await expect(captions.nth(1)).toBeVisible();
        });

        test("[FIG-002] 스크러버와 방향키로 단계를 옮긴다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 1단계의 단계 그림
             */
            await page.goto("/figures/");

            const figure = page.locator("#steps");
            const scrub = figure.getByRole("slider", {name: "Step"});

            /**
             * WHEN
             * 스크러버를 3으로 옮기고 왼쪽 방향키
             */
            await scrub.fill("3");
            await expect(figure).toHaveAttribute("data-step", "3");
            await figure.getByRole("button", {name: "Next step"}).focus();
            await page.keyboard.press("ArrowLeft");

            /**
             * THEN
             * 2단계와 스크러버 값
             */
            await expect(figure).toHaveAttribute("data-step", "2");
            await expect(scrub).toHaveValue("2");
        });

        test("[FIG-003] 재생은 0.5초 뒤 다음 단계로 가고 2초마다 넘기다 끝에서 멈춘다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 가짜 시계와 1단계의 단계 그림
             */
            await page.clock.install();
            await page.goto("/figures/");

            const figure = page.locator("#steps");
            const play = figure.locator(".fx__bar button").first();

            /**
             * WHEN
             * 재생을 누르고 시간을 흘림
             */
            await play.click();
            await expect(play).toHaveAttribute("aria-label", "Pause");
            await page.clock.runFor(500);
            await expect(figure).toHaveAttribute("data-step", "2");
            await page.clock.runFor(2000);

            /**
             * THEN
             * 끝에서 멈추고 재생 아이콘으로 돌아옴. 다시 누르면 1단계부터
             */
            await expect(figure).toHaveAttribute("data-step", "3");
            await expect(play).toHaveAttribute("aria-label", "Play");
            await play.click();
            await expect(figure).toHaveAttribute("data-step", "1");
            await expect(play).toHaveAttribute("aria-label", "Pause");
            await play.click();
            await expect(play).toHaveAttribute("aria-label", "Play");
            await page.clock.runFor(3000);
            await expect(figure).toHaveAttribute("data-step", "1");
        });

        test("[FIG-004] data-labels는 재생 조작부 대신 탭이고 누른 탭이 눌린 상태다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 탭 그림
             */
            await page.goto("/figures/");

            const figure = page.locator("#tabs");
            const before = figure.getByRole("button", {name: "Before"});
            const after = figure.getByRole("button", {name: "After"});

            await expect(figure.locator(".fx__bar button")).toHaveCount(2);
            await expect(figure.locator(".fx__scrub")).toHaveCount(0);
            await expect(before).toHaveAttribute("aria-pressed", "true");

            /**
             * WHEN
             * After 탭
             */
            await after.click();

            /**
             * THEN
             * 2단계 요소와 눌린 탭
             */
            await expect(figure).toHaveAttribute("data-step", "2");
            await expect(after).toHaveAttribute("aria-pressed", "true");
            await expect(before).toHaveAttribute("aria-pressed", "false");
            await expect(figure.locator('[data-on="2"]')).toHaveClass(/is-on/);
        });

        test("[FIG-005] 작성자 스크립트는 fx:step을 받고 fx:goto로 처음부터 재생한다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 가짜 시계와 3단계로 옮긴 스크립트 그림
             */
            await page.clock.install();
            await page.goto("/figures/");

            const figure = page.locator("#scripted");

            await expect(page.locator("#scripted-out")).toHaveText("step 1");
            await figure.getByRole("slider", {name: "Step"}).fill("3");
            await expect(page.locator("#scripted-out")).toHaveText("step 3");

            /**
             * WHEN
             * 그림의 Replay 버튼이 fx:goto {step: 1, play: true}
             */
            await figure.getByRole("button", {name: "Replay"}).click();

            /**
             * THEN
             * 1단계가 2초 보인 뒤 2단계
             */
            await expect(page.locator("#scripted-out")).toHaveText("step 1");
            await expect(figure.locator(".fx__bar button").first()).toHaveAttribute("aria-label", "Pause");
            await page.clock.runFor(1900);
            await expect(page.locator("#scripted-out")).toHaveText("step 1");
            await page.clock.runFor(100);
            await expect(page.locator("#scripted-out")).toHaveText("step 2");
        });
    });

    test.describe("슬라이더와 실행 상자", () => {
        test("[FIG-006] 슬라이더 값이 --fx-v, data-value, output, fx:input에 반영된다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * min 0, max 10, value 5인 슬라이더
             */
            await page.goto("/figures/");

            const figure = page.locator("#range");
            const input = figure.locator("input[type=range]");

            await expect(figure).toHaveAttribute("data-value", "5");
            await expect(figure.locator("output")).toHaveText("5px");

            /**
             * WHEN
             * 값을 10으로
             */
            const received = page.evaluate(() => {
                return new Promise<number>((resolve) => {
                    document.getElementById("range")?.addEventListener("fx:input", (event) => resolve((event as CustomEvent<{ratio: number}>).detail.ratio), {once: true});
                });
            });

            await input.fill("10");

            /**
             * THEN
             * 비율 1과 폭
             */
            expect(await received).toBe(1);
            await expect(figure).toHaveAttribute("data-value", "10");
            await expect(figure.locator("output")).toHaveText("10px");
            await expect(page.locator("#bar")).toHaveCSS("width", /^\d+(\.\d+)?px$/);
            expect(await figure.evaluate((element) => element.style.getPropertyValue("--fx-v"))).toBe("1");
        });

        test("[FIG-007] 실행 상자는 앞 코드 블록을 sandbox에서 돌려 콘솔과 오류를 보이고 고친 코드도 돌린다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 콘솔 두 줄과 오류 한 줄을 내는 코드 블록 아래 실행 상자
             */
            await page.goto("/figures/");

            const figure = page.locator("#run");
            const output = figure.locator(".fx__out");

            await expect(figure).toHaveClass(/fx--ready/);
            await expect(output).toHaveText("");

            /**
             * WHEN
             * 실행
             */
            await figure.getByRole("button", {name: "Run"}).click();

            /**
             * THEN
             * 두 줄의 콘솔, script 문자열 그대로, 잡히지 않은 오류
             */
            await expect(output).toContainText("hello 2");
            await expect(output).toContainText('{"a":1} </script>');
            await expect(output).toContainText("Uncaught");
            await expect(page.locator("iframe[sandbox]")).toHaveCount(1);
            await expect(page.locator("iframe[sandbox]")).toHaveCount(0, {timeout: 5000});

            await figure.getByRole("button", {name: "Edit code"}).click();
            await figure.getByRole("textbox", {name: "Code to run"}).fill('console.log("edited")');
            await figure.getByRole("button", {name: "Run"}).click();
            await expect(output).toHaveText("edited\n");

            await figure.getByRole("button", {name: "Reset code"}).click();
            await expect(output).toHaveText("");
            await expect(figure.getByRole("textbox", {name: "Code to run"})).toHaveValue(/hello/);
        });
    });

    test.describe("문서 진입과 자원", () => {
        test("[FIG-008] custom 그림의 data-icon 버튼은 아이콘과 이름으로 바뀌고 작성자 조작부는 그대로다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 작성자가 fx__bar와 data-icon 버튼을 둔 custom 그림
             */
            await page.goto("/figures/");

            const figure = page.locator("#custom");
            const button = figure.getByRole("button", {name: "Replay"});

            /**
             * THEN
             * 아이콘 SVG, aria-label, data-tip, 조작부 하나
             */
            await expect(button).toHaveClass(/fx__icon/);
            await expect(button.locator("svg")).toHaveCount(1);
            await expect(button).toHaveAttribute("data-tip", "Replay");
            await expect(figure.locator(".fx__bar")).toHaveCount(1);
            await expect(figure.locator(".fx__scrub")).toHaveCount(0);
        });

        test("[FIG-009] 그림 아래 제목으로 들어오면 조작부가 붙은 뒤에도 제목이 보인다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 그림 여섯 개 아래의 제목 hash
             */

            /**
             * WHEN
             * hash로 진입
             */
            await page.goto("/figures/#after");

            /**
             * THEN
             * 조작부가 붙은 뒤 제목이 화면 안
             */
            await expect(page.locator("#steps .fx__bar")).toHaveCount(1);
            await expect(page.getByRole("heading", {name: "After"})).toBeInViewport();
        });

        test("[FIG-010] 그림이 없는 페이지는 바뀌지 않고 오류가 없다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 그림 없는 문서
             */
            const errors: string[] = [];

            page.on("pageerror", (error) => errors.push(error.message));

            /**
             * WHEN
             * 조회
             */
            await page.goto("/plain/");

            /**
             * THEN
             * fx 요소 없음, 오류 없음
             */
            await expect(page.getByRole("heading", {name: "Plain"})).toBeVisible();
            await expect(page.locator(".fx--ready, .fx__bar")).toHaveCount(0);
            expect(errors).toEqual([]);
        });
    });

    test.describe("스크립트 없음", () => {
        test.use({javaScriptEnabled: false});

        test("[FIG-011] 끝까지 가는 요소와 캡션 전체가 보이고 조작부가 없다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * JavaScript를 끈 브라우저
             */

            /**
             * WHEN
             * 그림 문서 조회
             */
            await page.goto("/figures/");

            /**
             * THEN
             * 서버 HTML 그대로
             */
            const figure = page.locator("#steps");

            await expect(figure).not.toHaveClass(/fx--ready/);
            await expect(figure.locator(".fx__bar")).toHaveCount(0);
            await expect(figure.locator(".fx__captions > li")).toHaveCount(3);
            await expect(figure.locator(".fx__captions > li").nth(2)).toBeVisible();
            await expect(page.locator("#from-two")).toHaveCSS("opacity", "1");
            await expect(page.locator("#only-one")).toHaveCSS("opacity", "0");
        });
    });
});
```

- [ ] **Step 4: integration 검사를 쓴다**

`test/2-page/2.7-fx.integration.spec.ts`:

```ts
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/fx";

/**
 * 그림 위젯(src/component/widget/fx/wg-fx.tsx) 검증. 갤러리에서 마운트한 위젯
 */
test.describe("그림", () => {
    test.describe("수명", () => {
        test("[FIG-012] 위젯을 해제하면 조작부와 상태가 사라지고 재생이 멈추며 다시 마운트하면 1단계부터 붙는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 갤러리에서 마운트하고 재생 중인 단계 그림
             */
            await page.clock.install();
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.fxFixture.mount());

            const figure = page.locator("#steps");

            await figure.locator(".fx__bar button").first().click();
            await page.clock.runFor(500);
            await expect(figure).toHaveAttribute("data-step", "2");

            /**
             * WHEN
             * 위젯 해제 뒤 시간을 흘림
             */
            await page.evaluate(() => window.fxFixture.unmount());
            await page.clock.runFor(4000);

            /**
             * THEN
             * 조작부, 상태, 캡션 접힘 없음. 다시 마운트하면 1단계
             */
            await expect(page.locator(".fx__bar button")).toHaveCount(1);
            await expect(figure).not.toHaveClass(/fx--ready/);
            await expect(figure).not.toHaveAttribute("data-step", /.*/);
            await expect(figure.locator(".fx__captions > li").nth(2)).toBeVisible();
            await expect(page.locator("#from-two")).not.toHaveClass(/is-on/);
            await expect(page.locator("#run .fx__out")).toHaveCount(0);

            await page.evaluate(() => window.fxFixture.mount());
            await expect(figure).toHaveAttribute("data-step", "1");
            await expect(figure.locator(".fx__bar")).toHaveCount(1);
        });

        test("[FIG-013] 페이지 언어가 ko면 조작부 문구가 한국어다", {tag: "@low"}, async ({page}) => {
            /**
             * GIVEN
             * lang을 ko로 바꾼 문서
             */
            await page.goto("/lifecycle/");
            await page.evaluate(() => {
                document.documentElement.lang = "ko";
            });

            /**
             * WHEN
             * 마운트
             */
            await page.evaluate(() => window.fxFixture.mount());

            /**
             * THEN
             * 한국어 이름
             */
            await expect(page.locator("#steps .fx__bar button").first()).toHaveAttribute("aria-label", "재생");
            await expect(page.locator("#run").getByRole("button", {name: "실행"})).toHaveCount(1);
        });
    });
});
```

`.fx__bar button`이 해제 뒤 1개인 것은 custom 그림의 작성자 버튼이다.

- [ ] **Step 5: 실행 스크립트와 README**

`package.json`의 `test:mermaid` 아래:

```json
        "test:fx": "pnpm build:kit && playwright test fx",
```

`test/README.md`: 구조 목록의 `2.6-table-sort.integration.spec.ts` 아래에 두 줄을 더하고, `_fixture/`와 `_gallery/` 설명에 `fx`와 `fx-lifecycle`을 더하고, 영역 코드 목록 끝에 `FIG(인터랙티브 그림)`을 더한다. unit 검사 `to-steps.test.ts`와 `to-run-document.test.ts`는 `src` 옆 규칙대로라 목록에 넣지 않는다.

```text
    2.7-fx.e2e.spec.ts           ↔ src/component/widget/fx                              FIG
    2.7-fx.integration.spec.ts
```

- [ ] **Step 6: 실행**

Run: `pnpm test && pnpm test:fx`
Expected: Vitest 전부 PASS, Playwright `fx` 13건 PASS. 실패하면 trace를 보고 위젯이나 검사를 고친다. 번호 중복 검사:

```sh
grep -rhoE '\[[A-Z]{3}-[0-9]{3}\]|caseId: "[A-Z]{3}-[0-9]{3}"' test --include='*.ts' | grep -oE '[A-Z]{3}-[0-9]{3}' | sort | uniq -d
```

Expected: 출력 없음.

- [ ] **Step 7: 커밋**

```bash
git add test/_fixture/fx.ts test/_gallery/fx-lifecycle.tsx test/_type/browser.d.ts test/2-page/2.7-fx.e2e.spec.ts test/2-page/2.7-fx.integration.spec.ts test/README.md package.json
git commit -m "Add browser checks for figures | aa"
```

### Task 8: 공개 문서와 기록

**Files:**
- Create: `content/public/figures.md`
- Create: `content/ko/public/figures.md`
- Modify: `content/public/writing.md` (Content features의 원시 HTML 문단 아래)
- Modify: `content/ko/public/writing.md` (같은 자리)
- Modify: `README.md`, `language/README.ko.md` (Documentation 표의 Add rich content 행)
- Modify: `CHANGELOG.md` (맨 위에 `Unreleased`)
- Modify: `content/private/architecture.md` (Markdown pipeline의 Mermaid 문단 아래, Package output의 `dist/browser.js` 줄)
- Modify: `content/private/roadmap.md` (Visualization modules)
- Modify: `content/private/design.md` (Component review 끝)

- [ ] **Step 1: 영어 안내 문서를 쓴다**

`content/public/figures.md`:

`````markdown
---
name: Figures
label: Interactive figures with steps, sliders and runnable code
group: Guide
parent: writing
order: 16
---

Write an interactive figure as raw HTML in a `<figure class="fx">` box and name its kind with `data-fx`. The site adds the controls, highlights and transitions in the browser; without JavaScript the page shows the last scene and all captions.
Figures suit sequences and state changes, side by side comparisons of the same transition, values that change with a slider, and a prediction the reader checks by running code. Static structure stays an [image](images.md) or a [diagram](diagrams.md).

This page is not published to npm yet. It describes the next release after `0.27.0`.

## Overview

| Kind | `data-fx` | What the site adds |
| --- | --- | --- |
| Steps | `steps` | A bar with play, previous, next, a scrubber and `n / N`; elements that show, highlight or move per step; one caption at a time |
| Tabs | `steps` with `data-labels` | Tab buttons instead of the play bar |
| Slider | `range` | The value as `--fx-v` and `data-value`, the `<output>` text and an `fx:input` event |
| Run box | `run` | Buttons that run the code block right above it in a sandbox and show the console |
| Custom | `custom` | Nothing but the icon buttons. Your own `<script type="module">` draws the scene |

Keep no blank lines inside an HTML block. A blank line ends the block and Markdown parsing starts again.

## Steps

Mark the elements of the scene with step ranges. `data-on` shows the element only on those steps, `data-hl` paints a highlight on them, and `data-pos` moves the element to a position from that step on.
A range is `3`, `2-5`, `4-` (to the end) or `-2` (from the start), and several ranges are separated by spaces. A position is `step:x y`, and several positions are separated by `;`.
`data-steps` sets the number of steps. Without it, the number of items in `<ol class="fx__captions">` is used. One caption is visible per step.

### Source

```html
<figure class="fx" data-fx="steps" aria-label="A request passes the cache">
<div class="fx__stage">
<div class="fx-row">
<span class="fx-chip" data-on="-2">Request</span>
<span class="fx-chip" data-hl="2">Cache</span>
<span class="fx-chip fx-chip--mine" data-on="3-">Response</span>
<span class="fx-chip" data-pos="1:0 0;3:24 0">Moves right on step 3</span>
</div>
</div>
<ol class="fx__captions">
<li>The request leaves the browser.</li>
<li>The cache is checked.</li>
<li>The response comes back.</li>
</ol>
</figure>
```

### Result

<figure class="fx" data-fx="steps" aria-label="A request passes the cache">
<div class="fx__stage">
<div class="fx-row">
<span class="fx-chip" data-on="-2">Request</span>
<span class="fx-chip" data-hl="2">Cache</span>
<span class="fx-chip fx-chip--mine" data-on="3-">Response</span>
<span class="fx-chip" data-pos="1:0 0;3:24 0">Moves right on step 3</span>
</div>
</div>
<ol class="fx__captions">
<li>The request leaves the browser.</li>
<li>The cache is checked.</li>
<li>The response comes back.</li>
</ol>
</figure>

Play holds each step for two seconds and makes the first change half a second after the click, because the scene on screen has already been read. The arrow keys also move one step while the figure has focus.

### Tabs

With `data-labels`, the bar shows one tab per label instead of play, previous and next. Separate labels with `|`. Set `data-steps` when there are no captions to count.

```html
<figure class="fx" data-fx="steps" data-labels="Before|After" data-steps="2" aria-label="Before and after">
<div class="fx__stage">
<p data-on="1">Before: one request per page.</p>
<p data-on="2">After: one request per session.</p>
</div>
</figure>
```

<figure class="fx" data-fx="steps" data-labels="Before|After" data-steps="2" aria-label="Before and after">
<div class="fx__stage">
<p data-on="1">Before: one request per page.</p>
<p data-on="2">After: one request per session.</p>
</div>
</figure>

## Slider

Put an `<input type="range">` and an `<output>` inside the figure. The site writes the value to the `<output>`, with `data-unit` appended, and gives the figure the ratio between `min` and `max` as the `--fx-v` variable, so the scene can use it in `calc()`.

### Source

```html
<figure class="fx" data-fx="range" aria-label="Cache lifetime">
<div class="fx__stage">
<div class="fx-box" style="width: calc(20% + var(--fx-v, 0) * 80%)">Lifetime</div>
</div>
<label class="fx__range">Seconds <input type="range" min="0" max="60" value="30" data-unit="s"> <output></output></label>
</figure>
```

### Result

<figure class="fx" data-fx="range" aria-label="Cache lifetime">
<div class="fx__stage">
<div class="fx-box" style="width: calc(20% + var(--fx-v, 0) * 80%)">Lifetime</div>
</div>
<label class="fx__range">Seconds <input type="range" min="0" max="60" value="30" data-unit="s"> <output></output></label>
</figure>

## Run box

Put an empty `<div class="fx" data-fx="run"></div>` right after a code block. The site adds Run, Edit code and Reset code buttons and shows what the code prints.
The code runs in an `<iframe>` with `sandbox="allow-scripts"` and no other permission, so it cannot read the page, cookies or storage. `console.log`, `info`, `warn` and `error`, uncaught errors and rejected promises are shown one per line. Output is collected for two seconds; set `data-wait` in milliseconds for longer code.

### Source

````markdown
```js
const seen = new Set([1, 2, 2, 3]);
console.log(seen.size, [...seen]);
```

<div class="fx" data-fx="run"></div>
````

### Result

```js
const seen = new Set([1, 2, 2, 3]);
console.log(seen.size, [...seen]);
```

<div class="fx" data-fx="run"></div>

## Custom scenes

A figure of kind `steps` can also be drawn by your own script. Listen for `fx:step` on the figure and draw the scene for `event.detail.step` from scratch, so dragging the scrubber backwards shows the right scene. To restart, dispatch `fx:goto` with `{step: 1, play: true}`.
For a scene with no steps, such as a map the reader drags, use `data-fx="custom"`, write your own `<script type="module">` in the same document and add the `fx--ready` class when it is set up. A `button` with `data-icon="play"` gets the same play icon as the bar, with its text as the name.

```html
<figure class="fx" data-fx="steps" id="count" data-steps="3" aria-label="Counter">
<div class="fx__stage"><p class="fx-box" id="count-out"></p></div>
</figure>
<script type="module">
const root = document.getElementById("count");
root.addEventListener("fx:step", (event) => {
  document.getElementById("count-out").textContent = `Step ${event.detail.step} of 3`;
});
</script>
```

<figure class="fx" data-fx="steps" id="count" data-steps="3" aria-label="Counter">
<div class="fx__stage"><p class="fx-box" id="count-out"></p></div>
</figure>
<script type="module">
const root = document.getElementById("count");
root.addEventListener("fx:step", (event) => {
  document.getElementById("count-out").textContent = `Step ${event.detail.step} of 3`;
});
</script>

## Reference

### Attributes

| Attribute | On | Meaning |
| --- | --- | --- |
| `data-fx` | the figure | `steps`, `range`, `run` or `custom` |
| `data-steps` | a steps figure | Number of steps. Without it, the number of captions |
| `data-labels` | a steps figure | Tab labels separated by `\|` |
| `data-on` | an element | Steps on which the element is visible |
| `data-hl` | an element | Steps on which the element is highlighted. Inside SVG, put it on a `rect.fx-mark` |
| `data-pos` | an element | `step:x y` pairs separated by `;`. The element moves by that many pixels from that step on |
| `data-unit` | the range input | Text appended to the output value |
| `data-empty` | a run box | Text shown while there is no output |
| `data-wait` | a run box | Milliseconds to collect output. Default 2000 |
| `data-icon` | a button | `play`, `pause`, `prev` or `next`. The button text becomes its name |

### Events

| Event | Direction | `detail` |
| --- | --- | --- |
| `fx:step` | figure to your script | `{step}` after every step change, including the first |
| `fx:goto` | your script to figure | `{step, play}`. Both optional. `play: true` starts playing from that step |
| `fx:input` | figure to your script | `{value, ratio}` on every slider change, including the first |

### Classes and variables

Layout classes: `fx__stage` (the scene), `fx__captions` (one `li` per step), `fx-cols` (a grid that stacks on narrow screens), `fx-pair` (two scenes side by side), `fx-scroll` (an SVG that scrolls sideways on phones), `fx-row`, `fx-lane`, `fx-swap` (children stacked in one place).
Element classes: `fx-box`, `fx-chip` with `fx-chip--mine` and `fx-chip--dash`, `fx-lines` (a list of code lines), `fx-label`, `fx-muted`, `fx-button`. Inside SVG: `fx-strong`, `fx-muted`, `fx-mono` for text and `fx-box`, `fx-mine`, `fx-ground`, `fx-dash`, `fx-ln`, `fx-ln-strong`, `fx-arrow`, `fx-mark` for shapes.
Variables on the figure, which your own styles can read: `--fx-line`, `--fx-line-strong`, `--fx-ink`, `--fx-ink-strong`, `--fx-ink-muted`, `--fx-fill`, `--fx-ground`, `--fx-mark`, `--fx-ph`, `--fx-ease`. They follow the light and dark theme. A slider figure also carries `--fx-v`.

### Without JavaScript

The page shows the server HTML. Elements whose `data-on` ends with `-` are visible, every caption is listed, there is no bar, and a run box shows nothing below the code block. Write the scene so that the last step alone carries the point.

### Language

The names of the bar buttons, the scrubber and the run box buttons are English, and Korean when the page language starts with `ko`, like the date labels under the title.
`````

- [ ] **Step 2: 한국어 안내 문서를 쓴다**

`content/ko/public/figures.md`: 위 문서의 번역. frontmatter는 `name: Figures`, `label: 단계, 슬라이더, 실행 코드가 있는 인터랙티브 그림`, 나머지 같음. 절 제목은 영어 그대로(`## Overview`, `## Steps`, `### Source`, `### Result`, `## Slider`, `## Run box`, `## Custom scenes`, `## Reference`, `### Attributes`, `### Events`, `### Classes and variables`, `### Without JavaScript`, `### Language`). HTML 예시는 글자만 한국어로 바꾸고 속성과 클래스는 그대로 둔다. 문장은 `-합니다`체로 쓴다.

예시로 첫 두 문단과 Overview 표:

```markdown
인터랙티브 그림은 `<figure class="fx">` 상자 안에 원시 HTML로 쓰고 종류를 `data-fx`로 적습니다. 조작부, 형광펜, 전환은 브라우저에서 사이트가 더하며, JavaScript가 없으면 마지막 장면과 모든 설명이 보입니다.
순서와 상태 변화, 같은 전이의 나란한 비교, 슬라이더에 따라 바뀌는 값, 코드를 실행해 확인하는 예측에 맞습니다. 정적인 구조는 [이미지](images.md)나 [다이어그램](diagrams.md)으로 둡니다.

이 문서는 아직 npm에 공개되지 않은 기능을 설명합니다. `0.27.0` 다음 공개에 포함됩니다.

## Overview

| 종류 | `data-fx` | 사이트가 더하는 것 |
| --- | --- | --- |
| 단계 | `steps` | 재생, 이전, 다음, 스크러버, `n / N`이 있는 띠. 단계마다 보이고 칠해지고 움직이는 요소. 한 번에 설명 하나 |
| 탭 | `data-labels`를 준 `steps` | 재생 띠 대신 탭 버튼 |
| 슬라이더 | `range` | `--fx-v`와 `data-value`로 주는 값, `<output>` 글자, `fx:input` 이벤트 |
| 실행 상자 | `run` | 바로 위 코드 블록을 샌드박스에서 실행하고 콘솔을 보이는 버튼 |
| 직접 그리기 | `custom` | 아이콘 버튼만. 장면은 `<script type="module">`이 그립니다 |
```

- [ ] **Step 3: Writing, README, CHANGELOG**

`content/public/writing.md`의 "You can also use raw HTML ..." 문단 다음 줄에 더한다.

```markdown
Raw HTML can also be an interactive figure with steps, a slider or a runnable code block. See [Figures](figures.md).
```

`content/ko/public/writing.md`의 "원시 HTML도 사용할 수 있지만 ..." 문단 다음 줄에 더한다.

```markdown
원시 HTML로 단계, 슬라이더, 실행 코드가 있는 인터랙티브 그림도 쓸 수 있습니다. [Figures](figures.md)를 참고합니다.
```

`README.md`의 Add rich content 행:

```markdown
| Add rich content | [Parts](https://github.com/nomeehej/for-humanity/blob/main/content/public/parts.md), [Diagrams](https://github.com/nomeehej/for-humanity/blob/main/content/public/diagrams.md), [Figures](https://github.com/nomeehej/for-humanity/blob/main/content/public/figures.md), [Images](https://github.com/nomeehej/for-humanity/blob/main/content/public/images.md) |
```

`language/README.ko.md`의 표현 추가 행:

```markdown
| 표현 추가 | [Parts](../content/ko/public/parts.md), [Diagrams](../content/ko/public/diagrams.md), [Figures](../content/ko/public/figures.md), [Images](../content/ko/public/images.md) |
```

`CHANGELOG.md`의 `# Changelog` 바로 아래:

```markdown
## Unreleased

**Upgrade:** Existing projects remain compatible. Rebuild and redeploy to get the figure widget. CLI commands, configuration, document syntax and Node.js requirements are unchanged.

- Add interactive figures. A `<figure class="fx" data-fx="steps">` written in raw HTML gets a bar with play, previous, next, a scrubber and the step count, and its elements show, highlight or move per step with `data-on`, `data-hl` and `data-pos`; `data-labels` turns the bar into tabs. `data-fx="range"` wires a slider to the `--fx-v` variable and an `<output>`, `data-fx="run"` runs the code block above it in a sandboxed iframe and shows the console, and `data-fx="custom"` leaves the scene to the author's own module script. The widget ships in the inline browser bundle like table sorting, so pages without figures carry about 4KB more script. Without JavaScript the page shows the last scene and every caption. Control names are English, and Korean when the page language starts with `ko`. See [Figures](https://github.com/nomeehej/for-humanity/blob/main/content/public/figures.md).
```

- [ ] **Step 4: 내부 문서**

`content/private/architecture.md`의 Markdown pipeline 절, Mermaid 문단("공식 `bindFunctions`에는 ...")과 "frontmatter는 정규식으로 ..." 사이에 더한다.

```markdown
인터랙티브 그림은 작성자의 원시 HTML `figure.fx[data-fx]`이며 Markdown 처리기는 손대지 않습니다. `WgFx`가 표 정렬처럼 `DOMContentLoaded` 뒤 그림마다 종류별 enhance를 붙이고 해제 시 조작부와 상태를 되돌립니다. 조작부가 붙고 캡션이 접혀 본문 높이가 바뀌면 셸에 알려 Mermaid 렌더 뒤처럼 앵커 위치를 보정합니다. 실행 상자는 `sandbox="allow-scripts"`만 준 `srcdoc` iframe에서 코드를 돌리고 실행마다 만든 id가 맞는 `postMessage`만 받습니다. 작성 계약은 [Figures](../public/figures.md).
```

Package output의 `dist/browser.js` 줄을 바꾼다.

```markdown
- `dist/browser.js`: HTML에 포함하는 셸, 탐색, 커서, 표 정렬, 인터랙티브 그림의 Hono JSX 런타임
```

`content/private/roadmap.md`의 Visualization modules 절. 체크박스 목록에 한 줄을 더하고 "제품 전용 UI, 차트, 실행형 데모를 ..." 문장을 바꾼다.

```markdown
- [x] 단계, 슬라이더, 실행 상자, 직접 그리는 장면의 인터랙티브 그림 위젯([Figures](../public/figures.md), 설계는 [Fx design](fx-design.md))
```

```markdown
제품 전용 UI와 차트는 기본 기능으로 자동 이식하지 않습니다. 실행형 데모는 샌드박스 콘솔 상자(`data-fx="run"`)까지만 제공합니다.
```

`content/private/design.md`의 Component review 절 끝에 더한다.

```markdown
### Figures

인터랙티브 그림은 본문과 같은 흑백, 가는 선, 직각을 지키고 강조는 형광펜 노랑 하나(`--app-color-anchor-highlight`)다. 굵은 실선은 강조할 경계, 점선은 아직 없거나 검토만 한 것. 조작부 띠는 `--app-color-accent-soft` 바탕에 직각 버튼이고 아이콘은 끝과 꺾인 곳만 살짝 둥글다. 움직임은 독자가 시작하며 화면 진입만으로 재생하지 않는다. 변수와 클래스는 [Figures](../public/figures.md).
```

- [ ] **Step 5: 빌드와 검사**

Run: `pnpm build && pnpm check`
Expected: 사이트 빌드 성공(`content/README.md`와 `content/public/changelog.md` 동기화 포함), figures 페이지의 링크와 hash 경고 없음, 오류 없음. 이어서 `pnpm exec playwright test accessibility`로 Figures 페이지의 axe 위반이 없는지 본다.

- [ ] **Step 6: 커밋**

```bash
git add content/public/figures.md content/ko/public/figures.md content/public/writing.md content/ko/public/writing.md README.md language/README.ko.md content/README.md content/ko/README.md CHANGELOG.md content/public/changelog.md content/ko/public/changelog.md content/private/architecture.md content/private/roadmap.md content/private/design.md
git commit -m "Document interactive figures | aa"
```

### Task 9: 수동 확인, push, 릴리스

**Files:**
- Modify: `package.json` (버전), `CHANGELOG.md` (`Unreleased` → `0.28.0`), `README.md`와 `language/README.ko.md` (설치 버전), `content/public/figures.md`와 `content/ko/public/figures.md` (미공개 문장 → `Supported since \`0.28.0\`.`)

- [ ] **Step 1: 수동 확인**

Run: `pnpm dev`
`/figures/`를 라이트와 다크, 1280px과 390px에서 연다. 키보드만으로 재생, 이전, 다음, 스크러버, 탭, 슬라이더, 실행 상자를 조작한다. 콘솔 오류가 없어야 한다. 움직임 줄이기 설정에서 전환이 즉시 끝나는지 본다.

- [ ] **Step 2: 전체 검증과 push**

Run: `pnpm test && pnpm check && pnpm build && pnpm test:browser && git diff --check`
Expected: 모두 통과. Task 1부터 8의 커밋을 `main`에 push하고 CI와 Workers Builds 결과를 확인한다. push까지는 사이트 갱신이며 npm 공개가 아니다.

```bash
git push origin main
```

- [ ] **Step 3: 릴리스 0.28.0**

[Maintenance의 Release steps](maintenance.md#release-steps)를 따른다. 새 표현 기능이라 [Version policy](release-policy.md#version-policy)의 minor다.

1. `package.json`을 `0.28.0`으로 올린다.
2. `CHANGELOG.md`의 `## Unreleased`를 `## 0.28.0 — <공개 날짜>`로 바꾼다.
3. `README.md`와 `language/README.ko.md`의 설치 명령을 `for-humanity@0.28.0`으로 바꾼다.
4. 두 `figures.md`의 "This page is not published to npm yet ..." 문단을 `Supported since \`0.28.0\`.`로 바꾼다.
5. `pnpm test && pnpm check && pnpm build && git diff --check`.
6. 릴리스 준비 변경만 커밋한다. `git commit -m "Prepare 0.28.0 release with interactive figures | aa"`. push 뒤 CI 확인.
7. `git tag -a v0.28.0 -m "Release v0.28.0" && git push origin v0.28.0`. Release Actions, npm의 `0.28.0`, GitHub Release를 확인한다.

### Task 10: nomeehej.dev 이관 (my_pjt_summary)

for-humanity 0.28.0이 npm에 있을 때 `/Users/l-20220017/workspace/my_pjt_summary`에서 한다. 그 저장소의 규칙(CLAUDE.md)대로 `pnpm build`와 `pnpm check`를 통과시키고 커밋 제목 끝에 ` | aa`.

**Files:**
- Modify: `package.json` (`for-humanity` 버전, `fx` 스크립트 삭제)
- Modify: `content/public/**/*.md` 중 `<!-- fx:runtime` 블록이 있는 40편
- Delete: `scripts/fx.ts`, `scripts/fx/runtime.ts`, `scripts/fx/runtime.html`
- Modify: `scripts/check.ts` (6행 import와 70행 검사)
- Modify: `content/private/docs/writing-guide.md` (`## 인터랙티브 그림` 머리 문단과 `pnpm fx` 언급), `content/private/docs/workflow.md` (68행), `content/private/docs/decisions.md`, `content/private/docs/todo.md`

- [ ] **Step 1: 패키지 갱신**

```bash
pnpm add -D --save-exact for-humanity@0.28.0
```

`package.json`에서 `"fx": "tsx scripts/fx.ts",` 줄을 지운다.

- [ ] **Step 2: 런타임 블록 삭제**

`scripts/fx/runtime.ts`의 `BLOCK` 정규식과 같은 것으로 40편에서 블록을 떼고 끝 빈 줄을 정리한다. 스크립트를 지우기 전에 한 번만 쓰는 명령:

```bash
pnpm exec tsx -e '
import {readdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
const root = "content/public";
const block = /\n*<!-- fx:runtime \d+ -->[\s\S]*?<!-- \/fx:runtime -->\n*/g;
for (const entry of readdirSync(root, {recursive: true, withFileTypes: true})) {
  if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
  const file = path.join(entry.parentPath, entry.name);
  const text = readFileSync(file, "utf8");
  if (!text.includes("<!-- fx:runtime")) continue;
  writeFileSync(file, `${text.replace(block, "\n").trimEnd()}\n`);
  console.log("stripped", file);
}'
```

Expected: `stripped` 40줄. 확인: `grep -rl "fx:runtime" content/public | wc -l` → `0`.

- [ ] **Step 3: 스크립트와 검사 삭제**

```bash
git rm scripts/fx.ts scripts/fx/runtime.ts scripts/fx/runtime.html
```

`scripts/check.ts`에서 `import {withRuntime} from '@/scripts/fx/runtime'` 줄과 `if (rel.endsWith('.md') && withRuntime(text) !== text) problems.push(...)` 줄을 지운다.

- [ ] **Step 4: 내부 문서**

`content/private/docs/writing-guide.md`의 `## 인터랙티브 그림` 머리 문단을 바꾼다.

```markdown
그림 키트는 for-humanity 0.28.0의 내장 위젯이다. 종류, 속성, 이벤트, 클래스와 변수의 계약은 for-humanity의 [Figures](https://for-humanity.fyi/ko/figures/)에 있고 이 절은 이 저장소의 그림 규칙만 둔다. 2026-10-27부터 10-29까지 쓰던 문서 끝 런타임 블록(`scripts/fx/runtime.html`, `pnpm fx`)은 2026-10-29에 없앴다.
```

같은 절에서 `종류는 넷이다 ...` 항목과 `단계 재생의 요소에는 ...` 항목은 계약이 for-humanity 문서에 있으므로 지우고, `검증은 pnpm fx, pnpm build, pnpm check 뒤 ...`에서 `pnpm fx, `를 지우고, `런타임 규칙이 사이트 규칙에 밀리는 자리가 있다 ...` 항목을 지운다(위젯 CSS가 처리). `모양은 사이트 토큰(--app-color-*)과 런타임의 --fx-* 변수만 쓴다` 항목은 `위젯의 --fx-* 변수`로 고친다.

`content/private/docs/workflow.md` 68행(`인터랙티브 그림이 있는 공개 문서는 pnpm fx로 ...`)을 지운다.

`content/private/docs/decisions.md`의 결정 목록과 표에 한 줄씩 더한다.

```markdown
- 2026-10-29 그림 런타임을 for-humanity 0.28.0의 내장 위젯으로 이관(본인 결정: 위젯으로, 접두는 fx 유지, run 포함). 문서 40편의 런타임 블록과 `pnpm fx`를 없앴다. custom 그림의 자체 스크립트는 이벤트 계약이 같아 그대로다. 설계는 for-humanity 저장소의 `content/private/fx-design.md`.
```

`content/private/docs/todo.md`의 해당 할 일을 완료 절로 옮긴다.

- [ ] **Step 5: 검증**

Run: `pnpm build && pnpm check`
Expected: 통과. `content/dist`의 한 페이지에서 `grep -c "fx:runtime" content/dist/posts/language/javascript-execution-model/index.html` → `0`, `grep -c "fx__bar" content/dist/_fh/style*.css` → `1` 이상.

`pnpm preview`로 javascript-execution-model, ezl-culturepass, media-thumbnails, readable-ai-docs를 라이트와 다크, 1280px과 390px에서 열어 단계, 슬라이더, 실행 상자, custom 그림을 눌러 보고 콘솔 오류가 없는지 본다.

- [ ] **Step 6: 커밋과 push**

```bash
git add -A content/public scripts package.json pnpm-lock.yaml content/private/docs
git commit -m "Move the figure runtime to the for-humanity widget | aa"
git push origin main
```

Workers Builds 결과와 nomeehej.dev의 글 한 편을 확인한다.
