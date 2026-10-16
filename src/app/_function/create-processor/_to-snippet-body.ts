import {dropRightWhile, dropWhile, minBy} from "es-toolkit/array";
import {snippet_region_pattern} from "@/app/_constant/snippet";

/**
 * region 지정 시 해당 범위만 추출, 미지정 시 전체 사용
 *
 *   - region 경계 줄과 공통 들여쓰기 제거
 *   - 빈 region은 빈 문자열, 없는 region은 undefined 반환
 */
export const toSnippetBody = (source: string, region: string | undefined): string | undefined => {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let inside = region === undefined;
    let found = region === undefined;
    const kept: string[] = [];

    for (const line of lines) {
        const marker = snippet_region_pattern.exec(line);

        if (marker !== null) {
            if (region !== undefined && marker[2] === region) {
                inside = marker[1] === undefined;
                found = true;
            }

            continue;
        }

        if (inside) {
            kept.push(line);
        }
    }

    if (!found) {
        return undefined;
    }

    const content = dropRightWhile(
        dropWhile(kept, (line) => line.trim() === ""),
        (line) => line.trim() === "",
    );

    const leastIndentedLine = minBy(
        content.filter((line) => line.trim() !== ""),
        (line) => line.length - line.trimStart().length,
    );

    if (leastIndentedLine === undefined) {
        return "";
    }

    const indent = leastIndentedLine.length - leastIndentedLine.trimStart().length;

    return content.map((line) => line.slice(Math.min(indent, line.length - line.trimStart().length))).join("\n");
};
