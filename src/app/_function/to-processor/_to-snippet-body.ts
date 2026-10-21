import {dropRightWhile, dropWhile, minBy} from "es-toolkit/array";
import {copy_error_region_missing, copy_error_region_open} from "@/app/_constant/copy";
import {snippet_region_pattern} from "@/app/_constant/snippet";

/**
 * region 지정 시 해당 범위만 추출, 미지정 시 전체 사용
 *
 *   - region 경계 줄과 공통 들여쓰기 제거
 *   - 이름 없는 끝 표시는 가장 안쪽 region 종료
 *   - 이름 있는 끝 표시는 같은 이름의 가장 안쪽 region까지 종료
 *   - 빈 region은 빈 문자열
 *   - 없는 region과 파일 끝까지 닫히지 않은 region은 이유를 담은 오류
 */
export const toSnippetBody = (source: string, region: string | undefined): string => {
    // region 경계를 지날 때마다 바뀌는 줄 순서 의존 판정. 선언형 변환 대신 순차 반복
    const open: (string | undefined)[] = [];
    const kept: string[] = [];
    let found = region === undefined;

    for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
        const marker = snippet_region_pattern.exec(line);

        if (marker === null) {
            if (region === undefined || open.includes(region)) {
                kept.push(line);
            }

            continue;
        }

        if (marker[1] === undefined) {
            open.push(marker[2]);
            found ||= marker[2] === region;

            continue;
        }

        const closing = marker[2] === undefined ? open.length - 1 : open.lastIndexOf(marker[2]);

        // 대응하는 열린 region이 없는 끝 표시는 무시
        if (closing !== -1) {
            open.splice(closing);
        }
    }

    if (!found) {
        throw new Error(copy_error_region_missing);
    }

    if (region !== undefined && open.includes(region)) {
        throw new Error(copy_error_region_open);
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

    return content.map((line) => line.slice(indent)).join("\n");
};
