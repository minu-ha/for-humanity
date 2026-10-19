import {z} from "zod";
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
        "프로젝트 내부 상대 경로만 사용하세요. dist, node_modules, .git 경로는 사용할 수 없습니다",
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
        public: contentPathSchema.refine((value) => value !== "", "공개 문서는 별도 하위 폴더가 필요합니다").default(content_default.public),
        /**
         * 문서 루트 아래 로컬 전용 문서 폴더
         */
        private: contentPathSchema.refine((value) => value !== "", "내부 문서는 별도 하위 폴더가 필요합니다").default(content_default.private),
    })
    .refine((value) => {
        const published = value.public.toLowerCase();
        const internal = value.private.toLowerCase();
        return published !== internal && !published.startsWith(`${internal}/`) && !internal.startsWith(`${published}/`);
    }, "공개 문서와 내부 문서 폴더는 같거나 중첩될 수 없습니다");
