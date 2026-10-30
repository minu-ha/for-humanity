import {object, string} from "zod/mini";
import {fx_run_wait_ms} from "@/component/widget/fx/_constant/fx";
import {toButton} from "@/component/widget/fx/_function/to-button";
import {toRunDocument} from "@/component/widget/fx/_function/to-run-document";
import type {FxEnhance} from "@/component/widget/fx/_type/enhance";

/**
 * sandbox iframe의 shim이 보낸 콘솔 한 줄 검증
 */
const runMessageSchema = object({
    /**
     * 그림 안의 실행 순번
     *
     *   - 그림 사이와 실행 사이 구분은 event.source 창 확인
     */
    id: string(),

    /**
     * 출력 한 줄
     */
    line: string(),
});

/**
 * 실행 상자 그림. 바로 앞 코드 블록의 sandbox iframe 실행, 콘솔 출력 표시
 *
 *   - 앞 형제가 pre거나 pre code를 담은 상자일 때만 적용
 *   - 실행마다 새 id와 새 iframe. 그 iframe에서 온 같은 id의 메시지만 출력
 *   - data-wait(ms) 뒤 iframe 제거. 기본 fx_run_wait_ms
 *   - 해제는 signal의 abort에서 iframe과 생성 요소 제거
 */
export const enhanceRun: FxEnhance = (params) => {
    // 이미 해제된 signal은 abort 이벤트 없음, 복원 불가
    if (params.signal.aborted) {
        return;
    }

    const sibling = params.root.previousElementSibling;

    // Shiki 코드 블록은 pre code를 담은 상자
    const source = sibling?.matches("pre") ? sibling.querySelector("code") : sibling?.querySelector("pre code");
    const initial = source?.textContent.replace(/\n$/, "");

    if (initial === undefined) {
        return;
    }

    const code = document.createElement("textarea");
    const output = document.createElement("div");
    const bar = document.createElement("div");

    let frame: HTMLIFrameElement | null = null;
    let id = 0;
    let timer = 0;

    /**
     * 진행 중인 실행 종료. 대기 타이머 해제, iframe 제거
     */
    const finish = () => {
        window.clearTimeout(timer);
        frame?.remove();
        frame = null;
    };

    /**
     * 입력 상자의 코드 실행. 이전 실행 종료, 출력 초기화 뒤 새 iframe 추가
     */
    const run = () => {
        finish();
        output.textContent = "";
        id += 1;
        frame = document.createElement("iframe");

        // allow-same-origin 제외, 부모 DOM과 저장소 접근 불가
        frame.setAttribute("sandbox", "allow-scripts");
        frame.hidden = true;
        frame.srcdoc = toRunDocument({id: String(id), code: code.value});
        document.body.append(frame);

        // 속성이 없으면 NaN, 0과 함께 기본값 사용
        timer = window.setTimeout(finish, Number(params.root.dataset.wait) || fx_run_wait_ms);
    };

    const edit = toButton({
        label: params.copy.edit,
        signal: params.signal,
        onClick: () => {
            code.hidden = !code.hidden;
            edit.textContent = code.hidden ? params.copy.edit : params.copy.close;

            if (!code.hidden) {
                code.focus();
            }
        },
    });

    code.value = initial;
    code.spellcheck = false;
    code.className = "wg_fx__editor";
    code.hidden = true;
    code.setAttribute("aria-label", params.copy.code);

    output.className = "wg_fx__out";
    output.dataset.empty = params.root.dataset.empty ?? params.copy.empty;
    output.setAttribute("aria-live", "polite");

    bar.className = "fx__bar wg_fx__bar";
    bar.append(
        toButton({label: params.copy.run, signal: params.signal, onClick: run}),
        edit,
        toButton({
            label: params.copy.reset,
            signal: params.signal,
            onClick: () => {
                finish();
                code.value = initial;
                output.textContent = "";
            },
        }),
    );

    // 현재 iframe에서 온 같은 id의 콘솔 줄만 출력
    window.addEventListener(
        "message",
        (event) => {
            if (frame === null || event.source !== frame.contentWindow) {
                return;
            }

            const message = runMessageSchema.safeParse(event.data);

            if (message.success && message.data.id === String(id)) {
                output.append(`${message.data.line}\n`);
            }
        },
        {signal: params.signal},
    );

    params.signal.addEventListener(
        "abort",
        () => {
            finish();
            bar.remove();
            code.remove();
            output.remove();
            params.root.classList.remove("fx--ready");
        },
        {once: true},
    );

    params.root.append(bar, code, output);
    params.root.classList.add("fx--ready");
};
