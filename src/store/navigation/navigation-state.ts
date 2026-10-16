import {z} from "zod/mini";

/**
 * 스크롤 영역의 배치. 넓은 3열, 좁은 2열, 모바일 모달
 */
const navigationLayoutSchema = z.enum(["wide", "desktop", "drawer"]);

/**
 * 화면 배치의 저장 키
 */
export type NavigationLayout = z.infer<typeof navigationLayoutSchema>;

/**
 * 한 화면 배치의 마지막 탐색 위치. 목록 변경과 다른 페이지의 목차는 재사용하지 않음
 */
const navigationPositionSchema = z.object({
    /**
     * 페이지별 활성 표시를 제외한 공통 문서 목록
     */
    navigation: z.string(),

    /**
     * 목차가 속한 페이지
     */
    pathname: z.string(),

    /**
     * 공통 문서 목록의 세로 위치
     */
    documents: z.number().check(z.gte(0)),

    /**
     * 현재 페이지 목차의 세로 위치
     */
    outline: z.number().check(z.gte(0)),
});

/**
 * 같은 탭 안에서 유지하는 배치별 탐색 위치
 */
export const navigationScrollStateSchema = z.object({
    /**
     * 아직 열지 않은 배치의 위치는 저장하지 않음
     */
    positions: z.partialRecord(navigationLayoutSchema, navigationPositionSchema),
});

/**
 * 검증한 배치별 탐색 위치
 */
export type NavigationScrollState = z.infer<typeof navigationScrollStateSchema>;
