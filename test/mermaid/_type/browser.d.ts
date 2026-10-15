export {};

declare global {
    interface Window {
        diagramFixture: {mount: () => void; unmount: () => void};
        /**
         * 실제 Mermaid 렌더의 첫 응답을 지연하는 테스트 전용 제어
         */
        diagramRender: {waiting: boolean; release: () => void; completion: Promise<void>};
        mermaidInjected?: boolean;
    }
}
