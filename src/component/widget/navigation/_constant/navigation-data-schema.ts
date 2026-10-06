import {array, boolean, lazy, minLength, number, object, optional, string, type ZodMiniType} from "zod/mini";
import type {NavigationData, NavigationDoc, NavigationGroup} from "@/component/widget/navigation/_type/navigation-data";

const navigationDocSchema: ZodMiniType<NavigationDoc> = object({
    id: string(),
    name: string(),
    label: string(),
    active: boolean(),
    children: lazy(() => array(navigationDocSchema)),
});
const navigationGroupSchema: ZodMiniType<NavigationGroup> = object({
    name: string(),
    path: array(string()),
    docs: array(navigationDocSchema),
    groups: lazy(() => array(navigationGroupSchema)),
});
const headingSchema = object({depth: number(), slug: string(), text: string()});

/**
 * HTML에 포함된 JSON을 읽는 브라우저 경계 · 손상된 자료에는 서버 HTML 유지
 */
export const navigationDataSchema: ZodMiniType<NavigationData> = object({
    title: string(),
    groups: array(navigationGroupSchema),
    outline: array(
        object({
            part: optional(string()),
            sections: array(object({heading: headingSchema, part: optional(string()), subs: array(object({heading: headingSchema}))})).check(minLength(1)),
        }),
    ),
    pageId: string(),
    home: boolean(),
});
