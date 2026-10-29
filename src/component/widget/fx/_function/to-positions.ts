/**
 * 한 단계의 좌표. "4:120 40"은 4단계부터 x 120, y 40
 */
export interface FxPosition {
    /**
     * 이 좌표가 시작되는 단계
     */
    step: number;

    /**
     * translate x, CSS 픽셀
     */
    x: number;

    /**
     * translate y, CSS 픽셀
     */
    y: number;
}

/**
 * 단계와 x y 한 쌍의 표기
 */
const position_pattern = /^(\d+):\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s+(-?(?:\d+(?:\.\d*)?|\.\d+))$/;

/**
 * "1:0 0;4:120 40" 표기의 단계별 위치. 형식에 맞지 않는 조각은 제외
 */
export const toPositions = (spec: string): FxPosition[] => {
    return spec.split(";").flatMap((part) => {
        const match = position_pattern.exec(part.trim());

        return match === null ? [] : [{step: Number(match[1]), x: Number(match[2]), y: Number(match[3])}];
    });
};
