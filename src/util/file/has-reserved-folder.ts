import {content_reserved_dirs} from "@/constant/content";

/**
 * 생성물, 저장소, 설치 폴더를 지나는 상대 경로 판정. 두 구분자와 대소문자 무시
 */
export const hasReservedFolder = (location: string) => {
    return location.split(/[\\/]/).some((part) => content_reserved_dirs.includes(part.toLowerCase()));
};
