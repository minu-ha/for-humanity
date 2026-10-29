import {range} from "es-toolkit/math";

/**
 * 구간 표기. 앞 숫자가 없으면 1부터, 뒤 숫자가 없으면 끝까지
 */
const range_pattern = /^(\d*)-(\d*)$/;

/**
 * 단계 하나의 표기. 숫자만
 */
const step_pattern = /^\d+$/;

/**
 * "3", "2-5", "4-", "-2"를 공백으로 이은 표기에서 켜지는 단계 집합
 *
 *   - count는 전체 단계 수. "4-"의 끝이자 구간 끝의 상한
 *   - 숫자만으로 된 조각이 아니면 무시
 */
export const toSteps = (spec: string, count: number): Set<number> => {
    return new Set(
        spec
            .split(/\s+/)
            .filter((part) => part !== "")
            .flatMap((part) => {
                const match = range_pattern.exec(part);

                if (match === null) {
                    return step_pattern.test(part) ? [Number(part)] : [];
                }

                return range(match[1] === "" ? 1 : Number(match[1]), (match[2] === "" ? count : Math.min(Number(match[2]), count)) + 1);
            }),
    );
};
