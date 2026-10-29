export {};

declare global {
    /**
     * 브라우저 수명 검사에서 수집한 전역 이벤트 구독
     */
    interface ShellListener {
        /**
         * 구독 대상
         */
        target: EventTarget;

        /**
         * 이벤트 이름
         */
        type: string;

        /**
         * 등록된 콜백
         */
        listener: EventListenerOrEventListenerObject | null;

        /**
         * 캡처 여부 또는 구독 옵션
         */
        options?: boolean | AddEventListenerOptions;

        /**
         * 명시적 해제 여부
         */
        removed: boolean;

        /**
         * 테스트 셸의 구독 여부
         */
        owned: boolean;
    }

    /**
     * 공개 제품 코드와 분리한 브라우저 검사 계약. 갤러리 페이지와 spec이 공유
     */
    interface Window {
        /**
         * 다이어그램 위젯의 마운트와 해제 명령
         */
        diagramFixture: {mount: () => void; unmount: () => void};

        /**
         * 실제 Mermaid 렌더의 첫 응답을 지연하는 테스트 전용 제어
         */
        diagramRender: {waiting: boolean; release: () => void; completion: Promise<void>};

        /**
         * 잘못된 원문에 넣은 스크립트의 실행 흔적. 실행되지 않으면 없음
         */
        mermaidInjected?: boolean;

        /**
         * 첫 프레임부터 수집한 두 스크롤 위치
         */
        navigationFrames: {documents: number; outline: number}[];

        /**
         * 첫 프레임부터 수집한 본문 스크롤 위치
         */
        readingFrames: number[];

        /**
         * 목차 현재 항목의 변경 기록
         */
        tocChanges: string[];

        /**
         * 셸 마운트와 해제 명령
         */
        shellFixture: {mount: () => void; unmount: () => void};

        /**
         * 전역 구독의 수명 기록
         */
        shellListeners: ShellListener[];

        /**
         * 표 정렬 위젯의 마운트와 해제 명령
         */
        tableSortFixture: {mount: () => void; unmount: () => void};

        /**
         * 그림 위젯의 마운트와 해제 명령
         */
        fxFixture: {mount: () => void; unmount: () => void};

        /**
         * 갤러리에서 마운트한 그림 위젯의 onEnhanced 호출 횟수
         */
        fxEnhanced: number;
    }
}
