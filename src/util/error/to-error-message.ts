/**
 * CLI·dev 공통 오류 문구 · 문법 오류의 파일과 줄 번호 포함
 */
export const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error && "file" in error && typeof error.file === "string" && "line" in error && typeof error.line === "number") {
        return `${error.file}:${error.line}: ${error.message}`;
    }

    return error instanceof Error ? error.message : String(error);
};
