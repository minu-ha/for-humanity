import {boolean, int, object, optional} from "zod/mini";
import {fx_first_interval_ms, fx_interval_ms} from "@/component/widget/fx/_constant/fx";
import {setIcon} from "@/component/widget/fx/_function/set-icon";
import {toButton} from "@/component/widget/fx/_function/to-button";
import {toPositions} from "@/component/widget/fx/_function/to-positions";
import {toSteps} from "@/component/widget/fx/_function/to-steps";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";

/**
 * 그림이 보내는 fx:goto의 detail 검증
 */
const gotoDetailSchema = object({
    /**
     * 이동할 단계
     */
    step: optional(int()),

    /**
     * 이동 뒤 재생 여부
     */
    play: optional(boolean()),
});

/**
 * fx:goto에 단계가 없거나 detail 검증 실패 시 이동할 단계
 */
const goto_default_step = 1;

/**
 * 스크러버 진행의 끝 퍼센트. 단계가 하나면 항상 이 값
 */
const full_progress = 100;

/**
 * 단계 재생 그림의 조작부 추가, data-on, data-hl, data-pos의 단계별 반영
 *
 *   - 단계 수는 data-steps, 없으면 캡션 항목 수. 1 미만이면 변경 없음
 *   - data-labels가 있으면 재생 조작부 대신 탭 버튼
 *   - 단계 변경마다 fx:step 발송, 그림의 fx:goto 수신
 *   - 처음과 끝에서도 포커스 유지, disabled 대신 aria-disabled
 *   - 해제는 signal의 abort에서 조작부와 상태 복원
 */
export const enhanceSteps: FxEnhance = (params) => {
    const captions = [...params.root.querySelectorAll<HTMLLIElement>(".fx__captions > li")];
    const list = params.root.querySelector(".fx__captions");
    const count = Math.trunc(Number(params.root.dataset.steps)) || captions.length;

    if (count < 1) {
        return;
    }

    const shown = [...params.root.querySelectorAll<HTMLElement>("[data-on]")].flatMap((element) =>
        element.dataset.on === undefined ? [] : [{element, steps: toSteps(element.dataset.on, count)}],
    );
    const marked = [...params.root.querySelectorAll<HTMLElement>("[data-hl]")].flatMap((element) =>
        element.dataset.hl === undefined ? [] : [{element, steps: toSteps(element.dataset.hl, count)}],
    );
    const moved = [...params.root.querySelectorAll<HTMLElement>("[data-pos]")].flatMap((element) =>
        element.dataset.pos === undefined ? [] : [{element, positions: toPositions(element.dataset.pos)}],
    );
    const bar = document.createElement("div");
    const scrub = document.createElement("input");
    const counter = document.createElement("span");

    let step = 1;

    // 0이면 정지 상태
    let timer = 0;

    /**
     * 재생 중지, 재생 버튼 아이콘 복귀
     */
    const stop = () => {
        window.clearTimeout(timer);
        timer = 0;
        setIcon({button: play, icon: "play", label: params.copy.play});
    };

    /**
     * 단계를 1과 count 사이로 제한하고 모든 요소와 조작부에 반영
     */
    const show = (target: number) => {
        step = Math.min(Math.max(target, 1), count);
        params.root.dataset.step = String(step);

        for (const item of shown) {
            item.element.classList.toggle("is-on", item.steps.has(step));
        }

        for (const item of marked) {
            item.element.classList.toggle("is-hl", item.steps.has(step));
        }

        for (const item of moved) {
            const at = item.positions.findLast((position) => position.step <= step);

            item.element.style.transform = at === undefined ? "" : `translate(${at.x}px, ${at.y}px)`;
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
        params.root.dispatchEvent(new CustomEvent("fx:step", {detail: {step}}));
    };

    /**
     * 재생 중 다음 단계 표시. 마지막 단계에서 재생 종료
     */
    const tick = () => {
        show(step + 1);

        if (step >= count) {
            stop();

            return;
        }

        timer = window.setTimeout(tick, fx_interval_ms);
    };

    /**
     * 재생 시작. 끝에서 누르면 1단계로 복귀, 첫 장면도 한 간격 동안 표시
     */
    const start = (wait = fx_first_interval_ms) => {
        const restart = step >= count;

        if (restart) {
            show(1);
        }

        setIcon({button: play, icon: "pause", label: params.copy.pause});
        timer = window.setTimeout(tick, restart ? fx_interval_ms : wait);
    };

    const play = toButton({
        label: "",
        signal: params.signal,
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
        signal: params.signal,
        onClick: () => {
            stop();
            show(step - 1);
        },
    });
    const next = toButton({
        label: "",
        signal: params.signal,
        onClick: () => {
            stop();
            show(step + 1);
        },
    });
    const tabs = params.root.dataset.labels?.split("|").map((label, index) => {
        return toButton({
            label,
            signal: params.signal,
            onClick: () => {
                stop();
                show(index + 1);
            },
        });
    });

    setIcon({button: previous, icon: "prev", label: params.copy.previous});
    setIcon({button: next, icon: "next", label: params.copy.next});

    scrub.type = "range";
    scrub.className = "fx__scrub";
    scrub.min = "1";
    scrub.max = String(count);
    scrub.step = "1";
    scrub.setAttribute("aria-label", params.copy.step);
    scrub.addEventListener(
        "input",
        () => {
            stop();
            show(Number(scrub.value));
        },
        {signal: params.signal},
    );

    counter.className = "fx__count";
    bar.className = "fx__bar";

    // 입력 상자 안의 화살표 키는 커서 이동, 단계 이동 제외
    params.root.addEventListener(
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
        {signal: params.signal},
    );

    // 그림 스크립트의 단계 이동 요청, 단계가 없으면 1단계
    params.root.addEventListener(
        "fx:goto",
        (event) => {
            const parsed = gotoDetailSchema.safeParse(event instanceof CustomEvent ? event.detail : undefined);

            stop();
            show(parsed.data?.step ?? goto_default_step);

            if (parsed.data?.play === true) {
                start(fx_interval_ms);
            }
        },
        {signal: params.signal},
    );

    params.signal.addEventListener(
        "abort",
        () => {
            window.clearTimeout(timer);
            bar.remove();
            params.root.classList.remove("fx--ready");
            delete params.root.dataset.step;
            list?.removeAttribute("aria-live");

            for (const item of shown) {
                item.element.classList.remove("is-on");
            }

            for (const item of marked) {
                item.element.classList.remove("is-hl");
            }

            for (const item of moved) {
                item.element.style.transform = "";
            }

            for (const caption of captions) {
                caption.hidden = false;
            }
        },
        {once: true},
    );

    list?.setAttribute("aria-live", "polite");

    if (tabs === undefined) {
        // 재생 버튼 맨 앞 배치, 시범 재생 버튼만 있는 그림과 위치 일치
        bar.append(play, previous, next, scrub, counter);
    } else {
        bar.append(...tabs);
    }

    params.root.append(bar);
    params.root.classList.add("fx--ready");
    stop();
    show(1);
};
