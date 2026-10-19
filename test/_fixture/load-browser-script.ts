import {toBrowserConfig} from "@tool/to-browser-config";
import {build, mergeConfig} from "vite";

/**
 * 제품과 같은 설정으로 fixture 번들 생성, 디스크 출력 미포함
 */
export const loadBrowserScript = async (entry: string) => {
    const result = await build(mergeConfig(toBrowserConfig(entry), {logLevel: "error", build: {write: false}}));
    if ("on" in result) {
        throw new Error("브라우저 fixture는 watch 빌드를 사용하지 않습니다");
    }
    const script = (Array.isArray(result) ? result : [result]).flatMap((bundle) => bundle.output).find((output) => output.type === "chunk" && output.isEntry);
    if (script?.type !== "chunk") {
        throw new Error("브라우저 fixture의 진입 번들이 없습니다");
    }
    return script.code;
};
