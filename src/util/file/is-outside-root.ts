import {isAbsolute, sep} from "node:path";

/**
 * 기준 폴더에서 계산한 상대 경로의 이탈 판정. 상위 폴더와 다른 드라이브 포함
 */
export const isOutsideRoot = (location: string) => {
    return location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location);
};
