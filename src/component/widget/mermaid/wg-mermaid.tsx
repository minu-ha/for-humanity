import {useEffect} from "hono/jsx";
import {copy_error_load, copy_error_render} from "@/component/widget/mermaid/_constant/copy";
import {render_config, render_dark_config, render_id_words, render_source_max_chars} from "@/component/widget/mermaid/_constant/render";
import {toChangeQueue} from "@/util/async/to-change-queue";
import "./wg-mermaid.css";

/**
 * 서버 본문의 Mermaid 영역 렌더 수명. 셸과 본문 DOM 교체 미포함
 *
 *   - 렌더 완료 알림으로 문서 배치와 연결
 */
export interface WgMermaidProps {
    /**
     * 렌더에 따른 본문 높이 변경 후 초기 앵커 위치 보정
     */
    onRendered?: () => void;
}

export const WgMermaid = (props: WgMermaidProps) => {
    /**
     * 본문 파싱 후 모듈 수신, 테마 변경과 Details 공개의 직렬 렌더
     */
    useEffect(() => {
        const lifetime = new AbortController();
        const theme = matchMedia("(prefers-color-scheme: dark)");
        const measurements = new Set<HTMLElement>();
        const owned = new Set<HTMLElement>();
        const tooltips = new Set<HTMLElement>();

        /**
         * 공유 툴팁 재사용, 테마나 접힘 변경에서 숨긴 안내의 다음 호버 복원
         */
        const handleTooltipShow = (event: MouseEvent) => {
            if (!(event.target instanceof Element) || event.target.closest("[title]") === null) {
                return;
            }

            for (const tooltip of tooltips) {
                tooltip.hidden = false;

                // 표시 후 측정한 폭으로 화면 오른쪽 넘침 방지
                const bounds = tooltip.getBoundingClientRect();

                tooltip.style.left = `${scrollX + Math.max(0, Math.min(bounds.left, document.documentElement.clientWidth - bounds.width))}px`;
            }
        };

        /**
         * SVG 이탈이나 배치 변경에서 툴팁의 이전 절대 좌표와 스크롤 넘침 제외
         */
        const handleTooltipHide = () => {
            for (const tooltip of tooltips) {
                tooltip.hidden = true;
            }
        };

        /**
         * 보이는 다이어그램만 현재 테마로 차례 렌더. 모듈 수신 실패는 모든 영역에 오류 안내
         */
        const render = toChangeQueue({
            run: async () => {
                const elements = [...document.querySelectorAll<HTMLElement>(".wg_mermaid__root[data-mermaid]")];
                const path = elements[0]?.dataset.mermaidModule;

                if (path === undefined || lifetime.signal.aborted) {
                    return;
                }

                const mode = theme.matches ? "dark" : "light";

                /**
                 * 해제, 문서 교체, 테마 전환으로 이번 회차의 결과를 쓰지 않을 영역
                 */
                const isStale = (element: HTMLElement) => {
                    return lifetime.signal.aborted || !element.isConnected || theme.matches !== (mode === "dark");
                };
                const pending = elements.filter((element) => element.checkVisibility({visibilityProperty: true}) && element.dataset.mermaidTheme !== mode);

                if (pending.length === 0) {
                    return;
                }

                // 미리 빌드한 자체 호스팅 ESM의 런타임 URL, Vite의 번들 대상 분석 제외
                const library: typeof import("mermaid") = await import(/* @vite-ignore */ path);

                await document.fonts.ready;

                if (lifetime.signal.aborted) {
                    return;
                }

                for (const element of pending) {
                    if (isStale(element)) {
                        return;
                    }

                    const source = element.querySelector<HTMLElement>(".wg_mermaid__source");
                    const result = element.querySelector<HTMLElement>(".wg_mermaid__result");
                    const error = element.querySelector<HTMLElement>(".wg_mermaid__error");

                    if (source === null || result === null || error === null) {
                        continue;
                    }

                    const measurement = document.createElement("div");

                    measurement.className = "wg_mermaid__measurement";
                    measurements.add(measurement);
                    document.body.append(measurement);

                    try {
                        if (source.textContent.length > render_source_max_chars) {
                            throw new Error(`Mermaid source exceeds ${render_source_max_chars} characters`);
                        }

                        // Mermaid 설정은 렌더마다 초기화. 앞 다이어그램의 frontmatter 전파 제외
                        library.default.initialize(mode === "dark" ? render_dark_config : render_config);

                        const rendered = await library.default.render(
                            `fh-mermaid-${crypto.getRandomValues(new Uint32Array(render_id_words)).join("-")}`,
                            source.textContent,
                            measurement,
                        );

                        if (isStale(element)) {
                            return;
                        }

                        const canvas = document.createElement("div");

                        canvas.innerHTML = rendered.svg;

                        // 생성 SVG의 공식 스타일 격리. 본문 p, code, a 선택자의 내부 라벨 개입 제외
                        (result.shadowRoot ?? result.attachShadow({mode: "open"})).replaceChildren(canvas);

                        // Mermaid bindFunctions는 SVG 자식을 가진 Element 요구
                        rendered.bindFunctions?.(canvas);
                        canvas.addEventListener("mouseover", handleTooltipShow, {signal: lifetime.signal});
                        canvas.addEventListener("mouseout", handleTooltipHide, {signal: lifetime.signal});

                        const tooltip = document.querySelector<HTMLElement>(".mermaidTooltip");

                        if (tooltip !== null) {
                            tooltip.classList.add("wg_mermaid__tooltip");
                            tooltips.add(tooltip);
                        }

                        result.hidden = false;
                        source.hidden = true;
                        error.hidden = true;
                        element.dataset.mermaidStatus = "rendered";
                    } catch (cause) {
                        if (lifetime.signal.aborted) {
                            return;
                        }

                        result.hidden = true;
                        source.hidden = false;
                        error.textContent = copy_error_render;
                        error.hidden = false;
                        element.dataset.mermaidStatus = "error";
                        console.error("for-humanity Mermaid rendering failed", cause);
                    } finally {
                        measurement.remove();
                        measurements.delete(measurement);
                    }

                    element.dataset.mermaidTheme = mode;
                    owned.add(element);
                }

                props.onRendered?.();
            },
            onError: (cause) => {
                if (lifetime.signal.aborted) {
                    return;
                }

                for (const element of document.querySelectorAll<HTMLElement>(".wg_mermaid__root[data-mermaid]")) {
                    const error = element.querySelector<HTMLElement>(".wg_mermaid__error");

                    if (error !== null) {
                        owned.add(element);
                        error.textContent = copy_error_load;
                        error.hidden = false;
                    }
                }

                console.error("for-humanity Mermaid loading failed", cause);
            },
        });

        /**
         * 연속 이벤트 집약, 직전 렌더 완료 후 최신 테마 반영
         */
        const handleRender = () => {
            handleTooltipHide();
            void render();
        };

        theme.addEventListener("change", handleRender, {signal: lifetime.signal});
        addEventListener("resize", handleTooltipHide, {signal: lifetime.signal});
        document.addEventListener("toggle", handleRender, {capture: true, signal: lifetime.signal});

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", handleRender, {once: true, signal: lifetime.signal});
        } else {
            handleRender();
        }

        return () => {
            lifetime.abort();

            for (const measurement of measurements) {
                measurement.remove();
            }

            measurements.clear();

            for (const tooltip of tooltips) {
                tooltip.remove();
            }

            tooltips.clear();

            for (const element of owned) {
                const source = element.querySelector<HTMLElement>(".wg_mermaid__source");
                const result = element.querySelector<HTMLElement>(".wg_mermaid__result");
                const error = element.querySelector<HTMLElement>(".wg_mermaid__error");

                if (result !== null) {
                    result.shadowRoot?.replaceChildren();
                    result.hidden = true;
                }

                if (source !== null) {
                    source.hidden = false;
                }

                if (error !== null) {
                    error.hidden = true;
                }

                delete element.dataset.mermaidTheme;
                delete element.dataset.mermaidStatus;
            }

            owned.clear();
        };
    }, [props.onRendered]);

    return null;
};
