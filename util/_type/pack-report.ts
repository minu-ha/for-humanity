import {z} from "zod";

/**
 * npm pack 결과의 배포 검증 필드
 */
export const packSchema = z.object({
    /**
     * 패키지 공개 이름
     */
    name: z.string().min(1),
    /**
     * 패키지 공개 버전
     */
    version: z.string().min(1),
    /**
     * 생성된 압축 파일 이름
     */
    filename: z.string().min(1),
    /**
     * npm 레지스트리와 비교할 내용 무결성 값
     */
    integrity: z.string().min(1),
    /**
     * 패키지에 포함된 상대 경로 목록
     */
    files: z.array(z.object({path: z.string()})),
});

/**
 * npm 버전별 배열 또는 패키지 이름 객체의 단일 산출물
 */
export const packReportSchema = z
    .union([z.array(packSchema), z.record(z.string(), packSchema)])
    .transform((report) => Object.values(report))
    .pipe(z.array(packSchema).length(1))
    .transform((reports) => reports[0]);
