import {content_reserved_dirs} from "@/constant/content";

/**
 * 연속 저장을 한 번의 문서 준비로 합치는 대기 시간
 */
export const dev_reload_delay_ms = 150;

/**
 * 변경 감시와 문서 갱신에서 제외하는 폴더. 생성물, 설치 파일, 캐시의 재빌드 반복 방지
 */
export const dev_ignored_dirs: readonly string[] = [...content_reserved_dirs, ".cache"];
