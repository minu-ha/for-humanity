/**
 * 변경 재처리의 실행과 오류 보고 계약
 */
export interface ChangeQueueOptions {
    /**
     * 한 번의 최신 입력 처리 · 이전 실행이 끝난 뒤 호출
     */
    run: () => Promise<void>;
    /**
     * 실패 보고 · 대기 중인 변경과 다음 실행은 유지
     */
    onError: (error: unknown) => void;
}

/**
 * 동시에 하나만 실행하는 변경 요청 함수 · 실행 중 요청은 다음 한 번으로 합침
 * 활성 실행의 반환 Promise는 대기 요청까지 끝나면 완료, 중첩 요청은 즉시 반환
 */
export const toChangeQueue = (options: ChangeQueueOptions) => {
    const state = {requested: 0, completed: 0, running: false};

    return async () => {
        state.requested += 1;
        if (state.running) {
            return;
        }
        state.running = true;
        try {
            while (state.completed !== state.requested) {
                const requested = state.requested;
                try {
                    await options.run();
                } catch (error) {
                    options.onError(error);
                } finally {
                    state.completed = requested;
                }
            }
        } finally {
            state.running = false;
        }
    };
};
