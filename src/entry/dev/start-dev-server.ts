import {createServer} from "vite";
import {type DevParams, toDevConfig} from "@/entry/dev/to-dev-config";

/**
 * 개발 서버 시작과 프로세스 종료 시 파일 감시·통신 정리
 */
export const startDevServer = async (params: DevParams) => {
    const server = await createServer(toDevConfig(params));
    try {
        await server.listen();
        server.printUrls();
    } catch (error) {
        await server.close();
        throw error;
    }

    /**
     * 실행기 종료 신호에서 Vite 자원 해제 후 종료
     */
    const handleExit = async () => {
        await server.close();
        process.exit(0);
    };
    process.once("SIGINT", handleExit);
    process.once("SIGTERM", handleExit);
};
