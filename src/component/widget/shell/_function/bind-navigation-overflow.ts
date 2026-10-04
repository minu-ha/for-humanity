/**
 * 실제 남은 내용이 있는 위·아래 끝만 흐림 표시 · 스크롤·글꼴·화면 크기 추적
 * 탐색 진입점에서 첫 paint 전에 연결 · 네이티브 손잡이 숨김도 같은 시점에 적용
 * 관찰자는 문서 수명 동안 유지 · BFCache 복귀에서도 같은 탐색 DOM 추적
 */
export const bindNavigationOverflow = () => {
    const ports = [...document.querySelectorAll<HTMLElement>("[data-navigation-scroll]")];
    const frame = {id: 0};
    // 소수 픽셀 반올림으로 끝에서 흐림이 남는 것을 방지
    const edgeTolerance = 1;

    /**
     * 콘텐츠가 잘리는 끝만 표시 · 네이티브 스크롤은 그대로 사용
     */
    const updateOverflow = () => {
        frame.id = 0;

        for (const port of ports) {
            port.classList.add("wg_shell__scroll--ready");
            port.classList.toggle("wg_shell__scroll--above", port.scrollTop > edgeTolerance);
            port.classList.toggle("wg_shell__scroll--below", port.scrollHeight - port.clientHeight - port.scrollTop > edgeTolerance);
        }
    };

    /**
     * 연속 스크롤과 크기 변경은 프레임당 한 번만 반영
     */
    const scheduleOverflow = () => {
        if (frame.id === 0) {
            frame.id = requestAnimationFrame(updateOverflow);
        }
    };

    const observer = new ResizeObserver(scheduleOverflow);

    for (const port of ports) {
        port.addEventListener("scroll", scheduleOverflow, {passive: true});
        observer.observe(port);

        if (port.firstElementChild) {
            observer.observe(port.firstElementChild);
        }
    }

    addEventListener("pageshow", scheduleOverflow);
    updateOverflow();
};
