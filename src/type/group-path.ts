import {z} from "zod";

/**
 * 탐색 묶음 경로 · 기존 단일 이름과 중첩 배열을 한 번만 정규화
 * 쉼표·슬래시는 이름 그대로 유지하며 빈 경로·단계는 거부
 */
export const groupPathSchema = z.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)]).transform((path) => (typeof path === "string" ? [path] : path));
