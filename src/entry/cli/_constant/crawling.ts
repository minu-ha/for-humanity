/**
 * 크롤러 안내 파일의 사이트 루트 경로
 */
export const crawling_robots_path = "/robots.txt";

/**
 * 공개 페이지 목록의 사이트 루트 경로
 */
export const crawling_sitemap_path = "/sitemap.xml";

/**
 * 공개 크롤러 파일과 정적 출력이 충돌하는 문서의 첫 경로 조각
 */
export const crawling_reserved_roots = [crawling_robots_path.slice(1), crawling_sitemap_path.slice(1)];
