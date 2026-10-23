import {z} from "zod";
import {deploy_workers} from "@/entry/init/_constant/deploy";
import {init_deployments, init_managers, init_reserved_roots} from "@/entry/init/_constant/init";
import {contentConfigSchema} from "@/type/content-config";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 생성 문서와 터미널에 표시할 한 줄 제목
 */
export const initTitleSchema = z
    .string()
    .trim()
    .min(1, "Enter a site title.")
    .regex(/^[^\p{Cc}]+$/u, "Use a single line for the site title.");

/**
 * 기존 문서 경로 계약과 GitHub 표현식 제한
 */
export const initContentSchema = contentConfigSchema.shape.root
    .unwrap()
    .refine((value) => !value.includes("${{"), "Use a folder name without GitHub Actions expressions.")
    .refine((value) => !init_reserved_roots.includes(value.split("/")[0].toLowerCase()), "Choose a documentation folder that does not overlap a project configuration file.");

/**
 * GitHub 소유자와 저장소의 직접 입력
 */
export const initRepositorySchema = z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/, "Enter the GitHub repository as owner/name.")
    .refine((value) => ![".", ".."].includes(value.split("/")[1]), "Enter the GitHub repository as owner/name.");

/**
 * Git 브랜치 이름과 워크플로 표현식 제한
 */
export const initBranchSchema = z
    .string()
    .trim()
    .min(1)
    .refine(
        (value) => value !== "@" && !/^[-/.]|[~^:?*[\]\\\s\p{Cc}]|\/\/|\.\.|@\{|\/\.|\.lock(?:\/|$)|[/.]$/u.test(value) && !value.includes("${{"),
        "Enter a valid Git deployment branch.",
    );

/**
 * 비어 있는 선택 입력을 생략하는 공개 도메인
 */
export const initUrlSchema = z.preprocess((value) => (value === "" ? undefined : value), siteConfigSchema.shape.url);

/**
 * Workers 배포 이름의 소문자, 숫자와 하이픈 제한
 */
export const initWorkerNameSchema = z
    .string()
    .trim()
    .max(deploy_workers.name_length_limit, "Use 63 characters or fewer for the Worker name.")
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, numbers and hyphens for the Worker name, starting and ending with a letter or number.");

/**
 * Citty가 허용하는 임의 인자를 제한하는 초기화 입력 경계
 */
export const initInputSchema = z.strictObject({
    /**
     * 프로젝트 폴더를 포함한 위치 인자
     */
    // biome-ignore lint/style/useNamingConvention: Citty의 위치 인자 계약
    _: z.array(z.string()).max(1, "Pass one project folder to init."),
    /**
     * 초기화할 프로젝트 폴더
     */
    dir: z.string().trim().min(1),
    /**
     * 기본값 적용과 확인 생략
     */
    yes: z.boolean(),
    /**
     * 명시한 사이트 이름
     */
    title: initTitleSchema.optional(),
    /**
     * 명시한 문서 루트
     */
    content: initContentSchema.optional(),
    /**
     * 명시한 문서 언어
     */
    lang: siteConfigSchema.shape.lang.unwrap().optional(),
    /**
     * 생성할 배포 설정
     */
    deploy: z.enum(init_deployments).optional(),
    /**
     * Workers 배포 이름 지정
     */
    "worker-name": initWorkerNameSchema.optional(),
    /**
     * Citty가 함께 전달하는 Worker 이름의 camelCase 별칭
     */
    workerName: initWorkerNameSchema.optional(),
    /**
     * GitHub 저장소 지정
     */
    repository: initRepositorySchema.optional(),
    /**
     * GitHub 배포 브랜치 지정
     */
    branch: initBranchSchema.optional(),
    /**
     * 패키지 매니저 지정
     */
    manager: z.enum(init_managers).optional(),
    /**
     * 공개 도메인 지정
     */
    url: initUrlSchema,
});

/**
 * 초기화 입력 스키마를 통과한 CLI 인자
 */
export type InitInput = z.infer<typeof initInputSchema>;
