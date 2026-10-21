import {array, boolean, lazy, minLength, number, object, optional, string, type ZodMiniType} from "zod/mini";
import type {NavigationData, NavigationDoc, NavigationGroup} from "@/component/widget/sidebar/_type/navigation-data";

/**
 * 본문과 파일 경로를 제외한 탐색 문서의 브라우저 입력 검증
 */
const navigationDocSchema: ZodMiniType<NavigationDoc> = object({
    /**
     * 링크에 사용할 문서 ID
     */
    id: string(),

    /**
     * 링크 표시 이름
     */
    name: string(),

    /**
     * 링크의 보조 설명
     */
    label: string(),

    /**
     * 현재 페이지 강조 여부
     */
    active: boolean(),

    /**
     * 같은 문서 아래의 재귀 탐색 목록
     */
    children: lazy(() => array(navigationDocSchema)),
});

/**
 * 전체 경로로 구분한 탐색 묶음의 브라우저 입력 검증
 */
const navigationGroupSchema: ZodMiniType<NavigationGroup> = object({
    /**
     * 클릭하지 않는 묶음 이름
     */
    name: string(),

    /**
     * 최상위부터 현재 묶음까지의 이름 경로
     */
    path: array(string()),

    /**
     * 현재 단계의 문서 목록
     */
    docs: array(navigationDocSchema),

    /**
     * 하위 탐색 묶음
     */
    groups: lazy(() => array(navigationGroupSchema)),
});

/**
 * 본문 제목과 목차 링크의 연결 검증
 */
const headingSchema = object({
    /**
     * 본문의 제목 깊이
     */
    depth: number(),

    /**
     * 이동 대상의 HTML ID
     */
    slug: string(),

    /**
     * 목차 표시 문자열
     */
    text: string(),
});

/**
 * HTML에 포함된 JSON을 읽는 브라우저 경계. 손상된 자료에는 서버 HTML 유지
 */
export const navigationDataSchema: ZodMiniType<NavigationData> = object({
    /**
     * 홈 링크의 브랜드 이름
     */
    title: string(),

    /**
     * 표시 순서가 확정된 문서 트리
     */
    groups: array(navigationGroupSchema),

    /**
     * 같은 문서 목록의 저장 위치만 복원하는 목록 식별값
     */
    signature: string(),

    /**
     * 현재 페이지의 가름별 목차
     */
    outline: array(
        object({
            /**
             * 묶음 위에 표시할 가름 이름
             */
            part: optional(string()),

            /**
             * 하나 이상의 절과 하위 제목
             */
            sections: array(
                object({
                    /**
                     * 절의 이동 대상과 표시명
                     */
                    heading: headingSchema,

                    /**
                     * 이 절에서 시작하는 가름 이름
                     */
                    part: optional(string()),

                    /**
                     * 본문 순서의 하위 제목 목록
                     */
                    subs: array(
                        object({
                            /**
                             * 소제목의 이동 대상과 표시명
                             */
                            heading: headingSchema,
                        }),
                    ),
                }),
            ).check(minLength(1)),
        }),
    ),

    /**
     * README 홈 여부
     */
    home: boolean(),

    /**
     * 사이트 설정의 커서 장식 활성화 여부
     */
    cursorFace: boolean(),
});
