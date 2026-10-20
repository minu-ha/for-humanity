import clsx from "clsx";
import {useLayoutEffect, useRef} from "hono/jsx";
import {image_size_px} from "@/component/widget/cursor-face/_constant/image";
import {position_offset_px, position_storage_key} from "@/component/widget/cursor-face/_constant/position";
import {asset_favicon_path} from "@/constant/asset";
import "./wg-cursor-face.css";

/**
 * SSR 기본 장식과 브라우저 DOM 연결을 구분하는 입력
 */
export interface WgCursorFaceProps {
    /**
     * 브라우저 진입점에서만 참. ref와 전역 이벤트 연결 조건
     */
    ready: boolean;
}

export const WgCursorFace = (props: WgCursorFaceProps) => {
    const faceRef = useRef<HTMLImageElement | null>(null);
    const mediaRef = useRef<MediaQueryList | null>(null);
    const positionRef = useRef({x: 0, y: 0, frame: 0, hasPointer: false});

    /**
     * 화면 이탈, 터치 전환에서 예약된 이동까지 취소
     */
    const handleCursorHide = () => {
        cancelAnimationFrame(positionRef.current.frame);
        positionRef.current.frame = 0;
        faceRef.current?.classList.remove("wg_cursorFace__root--visible");
    };

    /**
     * 비활성 전환에서만 장식 숨김, 새 마우스 이동은 취소 없음
     *
     *   - 마지막 좌표는 유지, 복원 여부는 다음 문서의 표시 조건으로 판정
     *   - Windows Chromium은 새로고침 직전 이 조건을 잠시 비활성으로 전환
     */
    const handleCursorMediaChange = () => {
        if (!mediaRef.current?.matches) {
            handleCursorHide();
        }
    };

    /**
     * 화면 갱신마다 한 번만 반영. translate 위치 변경으로 본문 재배치 방지
     */
    const renderCursorFace = () => {
        if (positionRef.current.frame !== 0) {
            return;
        }

        positionRef.current.frame = requestAnimationFrame(() => {
            positionRef.current.frame = 0;

            if (faceRef.current === null) {
                return;
            }

            faceRef.current.style.setProperty(
                "--wg-cursor-face-position",
                `${Math.max(0, Math.min(positionRef.current.x + position_offset_px, document.documentElement.clientWidth - faceRef.current.width - position_offset_px))}px ${Math.max(0, Math.min(positionRef.current.y + position_offset_px, document.documentElement.clientHeight - faceRef.current.height - position_offset_px))}px`,
            );

            faceRef.current.classList.add("wg_cursorFace__root--visible");
        });
    };

    /**
     * 클릭, 텍스트 선택 중에도 장식 유지. 실제 마우스 입력만 좌표 반영
     */
    const handleDocumentPointer = (event: PointerEvent) => {
        if (!mediaRef.current?.matches || event.pointerType !== "mouse") {
            positionRef.current.hasPointer = false;
            handleCursorHide();

            return;
        }

        positionRef.current.x = event.clientX;
        positionRef.current.y = event.clientY;
        positionRef.current.hasPointer = true;
        renderCursorFace();
    };

    /**
     * 새 마우스 이동 없이 화면 가장자리의 좌표 재계산
     */
    const handleCursorResize = () => {
        if (faceRef.current?.classList.contains("wg_cursorFace__root--visible")) {
            renderCursorFace();
        }
    };

    /**
     * 같은 탭의 마지막 마우스 좌표 전달, 포커스 이탈의 일시 숨김과 무관
     */
    const handlePageHide = () => {
        if (!positionRef.current.hasPointer) {
            return;
        }

        try {
            sessionStorage.setItem(position_storage_key, JSON.stringify({x: positionRef.current.x, y: positionRef.current.y}));
        } catch {
            // 저장소 차단 시 현재 페이지의 포인터 동작 유지
        }
    };

    /**
     * 첫 진입, BFCache 복귀의 저장 좌표 1회 소비. 외부 저장 값은 검증 후 사용
     */
    const handlePageShow = () => {
        try {
            const stored = sessionStorage.getItem(position_storage_key);

            sessionStorage.removeItem(position_storage_key);

            if (stored === null || !mediaRef.current?.matches) {
                return;
            }

            const point: unknown = JSON.parse(stored);

            if (
                typeof point === "object" &&
                point !== null &&
                "x" in point &&
                "y" in point &&
                typeof point.x === "number" &&
                typeof point.y === "number" &&
                Number.isFinite(point.x) &&
                Number.isFinite(point.y)
            ) {
                positionRef.current.x = point.x;
                positionRef.current.y = point.y;
                positionRef.current.hasPointer = true;
                renderCursorFace();
            }
        } catch {
            // 손상된 좌표는 다음 실제 마우스 입력으로 복구
        }
    };

    /**
     * 첫 페인트 전 좌표 복원. 해제 시 전역 이벤트와 예약 프레임 함께 정리
     */
    useLayoutEffect(() => {
        if (!props.ready) {
            return;
        }

        const lifetime = new AbortController();
        const media = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");

        mediaRef.current = media;
        handlePageShow();
        document.addEventListener("pointermove", handleDocumentPointer, {passive: true, signal: lifetime.signal});
        document.addEventListener("pointerdown", handleDocumentPointer, {passive: true, signal: lifetime.signal});
        document.documentElement.addEventListener("pointerleave", handleCursorHide, {signal: lifetime.signal});
        addEventListener("blur", handleCursorHide, {signal: lifetime.signal});
        addEventListener("resize", handleCursorResize, {signal: lifetime.signal});
        addEventListener("pagehide", handlePageHide, {signal: lifetime.signal});
        addEventListener("pageshow", handlePageShow, {signal: lifetime.signal});
        media.addEventListener("change", handleCursorMediaChange, {signal: lifetime.signal});

        return () => {
            lifetime.abort();
            mediaRef.current = null;
            handleCursorHide();
        };
    }, [props.ready]);

    return (
        <img
            ref={props.ready ? faceRef : undefined}
            className={clsx("wg_cursorFace__root")}
            src={asset_favicon_path}
            width={image_size_px}
            height={image_size_px}
            alt=""
            aria-hidden="true"
            draggable={false}
            data-cursor-face=""
        />
    );
};
