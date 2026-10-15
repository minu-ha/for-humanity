export {};

declare global {
    interface Window {
        diagramFixture: {mount: () => void; unmount: () => void};
        mermaidInjected?: boolean;
    }
}
