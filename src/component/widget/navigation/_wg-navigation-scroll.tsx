import clsx from "clsx";
import {type Child, type DOMAttributes, type RefObject, useLayoutEffect, useRef, useState} from "hono/jsx";

/**
 * 탐색 좌표를 제어하는 부모와 넘침 표시를 소유하는 스크롤 영역의 경계
 */
export interface WgNavigationScrollProps {
    /**
     * 배치별 좌표 복원과 저장에 필요한 실제 스크롤 요소
     */
    portRef: RefObject<HTMLDivElement | null>;
    /**
     * 문서 목록과 현재 페이지 목차의 독립된 스크롤 수명
     */
    kind: "documents" | "outline";
    /**
     * JavaScript가 연결된 뒤에만 손잡이를 넘침 표시로 대체
     */
    ready: boolean;
    /**
     * 탐색 링크를 포함한 영역 내용
     */
    children: Child;
    /**
     * 이동 직전 좌표 보존과 모바일 모달 닫기
     */
    onClick?: DOMAttributes["onClick"];
    /**
     * 실제 스크롤 좌표가 바뀔 때 부모 저장소에 반영
     */
    onScroll?: () => void;
}

export const WgNavigationScroll = (props: WgNavigationScrollProps) => {
    const [overflow, setOverflow] = useState({above: false, below: false});
    const frameRef = useRef(0);

    /**
     * 소수 픽셀 반올림을 제외한 실제 남은 내용만 위·아래 흐림으로 알림
     */
    const updateOverflow = () => {
        frameRef.current = 0;
        if (props.portRef.current === null) return;
        const above = props.portRef.current.scrollTop > 1;
        const below = props.portRef.current.scrollHeight - props.portRef.current.clientHeight - props.portRef.current.scrollTop > 1;
        setOverflow((state) => (state.above === above && state.below === below ? state : {above, below}));
    };

    /**
     * 연속 스크롤과 관찰자 알림은 프레임당 한 번 측정
     */
    const scheduleOverflow = () => {
        if (frameRef.current === 0) frameRef.current = requestAnimationFrame(updateOverflow);
    };

    /**
     * 네이티브 좌표는 바로 저장하고 시각적 넘침만 프레임에 맞춰 갱신
     */
    const handlePortScroll: DOMAttributes["onScroll"] = (_event) => {
        props.onScroll?.();
        scheduleOverflow();
    };

    /**
     * 영역과 내용의 크기를 함께 추적 · Hono 최초 mount의 분리된 fragment 측정은 연결 직후 실행
     */
    useLayoutEffect(() => {
        if (!props.ready || props.portRef.current === null) return;
        const observer = new ResizeObserver(scheduleOverflow);
        observer.observe(props.portRef.current);
        if (props.portRef.current.firstElementChild !== null) observer.observe(props.portRef.current.firstElementChild);
        let active = true;
        addEventListener("pageshow", scheduleOverflow);
        if (props.portRef.current.isConnected) {
            updateOverflow();
        } else {
            // Hono는 최초 layout effect를 fragment에서 실행하므로 같은 script의 paint 전 microtask에서 측정한다
            queueMicrotask(() => {
                if (active) updateOverflow();
            });
        }
        return () => {
            active = false;
            observer.disconnect();
            removeEventListener("pageshow", scheduleOverflow);
            cancelAnimationFrame(frameRef.current);
            frameRef.current = 0;
        };
    }, [props.portRef, props.ready]);

    /**
     * 접힘 선택의 렌더가 바뀐 직후 측정 · 좌표 복원은 부모의 연결 후 처리보다 앞서 저장하지 않음
     */
    useLayoutEffect(() => {
        if (props.ready && props.portRef.current?.isConnected) updateOverflow();
    }, [props.children, props.ready]);

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: 부모의 링크 이벤트 위임이며 자식 a·button의 네이티브 키보드 동작을 그대로 소비한다
        <div
            ref={props.ready ? props.portRef : undefined}
            className={clsx(
                "wg_navigation__scroll",
                props.kind === "documents" && "wg_navigation__documents",
                props.kind === "outline" && "wg_navigation__headings",
                props.ready && "wg_navigation__scroll--ready",
                props.ready && overflow.above && "wg_navigation__scroll--above",
                props.ready && overflow.below && "wg_navigation__scroll--below",
            )}
            data-navigation-scroll={props.kind}
            onClick={props.onClick}
            onScroll={handlePortScroll}
        >
            {props.children}
        </div>
    );
};
