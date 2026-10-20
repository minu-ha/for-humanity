import {z} from "zod";
import {copy_error_content_overlap, copy_error_content_path, copy_error_private_folder, copy_error_public_folder} from "@/constant/copy";
import {content_default} from "@/constant/site";

/**
 * 프로젝트 내부의 상대 경로, 출력 폴더와 시스템 폴더 제외
 */
const contentPathSchema = z
    .string()
    .trim()
    .min(1)
    .refine(
        (value) => !/^[\\/]|[:?#%*\p{Cc}]/u.test(value) && !value.split(/[\\/]/).some((part) => ["..", "dist", "node_modules", ".git"].includes(part.toLowerCase())),
        copy_error_content_path,
    )
    .transform((value) =>
        value
            .replaceAll("\\", "/")
            .split("/")
            .filter((part) => part !== "" && part !== ".")
            .join("/"),
    );

/**
 * 공개와 내부 문서 폴더의 상대 경로 계약
 */
export const contentConfigSchema = z
    .object({
        /**
         * 프로젝트 루트 기준 문서 폴더, 점 하나는 프로젝트 루트
         */
        root: contentPathSchema.transform((value) => (value === "" ? "." : value)).default(content_default.root),

        /**
         * 문서 루트 아래 공개 문서 폴더
         */
        public: contentPathSchema.refine((value) => value !== "", copy_error_public_folder).default(content_default.public),

        /**
         * 문서 루트 아래 로컬 전용 문서 폴더
         */
        private: contentPathSchema.refine((value) => value !== "", copy_error_private_folder).default(content_default.private),
    })
    .refine((value) => {
        const published = value.public.toLowerCase();
        const internal = value.private.toLowerCase();

        return published !== internal && !published.startsWith(`${internal}/`) && !internal.startsWith(`${published}/`);
    }, copy_error_content_overlap);
