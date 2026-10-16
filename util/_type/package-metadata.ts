import {z} from "zod";

/**
 * 공개 버전과 설치 결과 검증에 필요한 패키지 정보
 */
export const packageMetadataSchema = z.object({
    /**
     * npm 패키지 이름
     */
    name: z.string(),

    /**
     * 설치 또는 공개할 버전
     */
    version: z.string(),

    /**
     * 릴리스 안내에 사용할 문서 사이트
     */
    homepage: z.url(),

    /**
     * 설치 패키지의 실행 의존성
     */
    dependencies: z.record(z.string(), z.string()).optional(),
});
