import {z} from "zod";
import {doc_type} from "@/constant/doc";

/**
 * 문서 머리말. 틀리면 빌드가 멈춘다
 */
export const docDataSchema = z.object({
	/**
	 * 영어 이름. 문서 제목 (h1), 사이드바 문서 목록, 첫 화면 카드가 쓴다. 첫 글자가 목록의 표지다
	 */
	name: z.string(),
	/**
	 * 한글 이름. 카드의 둘째 줄, 사이드바 이름에 올리면 뜨는 글
	 */
	label: z.string(),
	/**
	 * 문서 종류
	 */
	type: z.enum(doc_type).default(doc_type.document),
	/**
	 * 첫 화면 카드와 문서 머리 윗줄의 묶음
	 */
	group: z.string(),
});

/**
 * 기본값을 채운 머리말
 */
export type DocData = z.infer<typeof docDataSchema>;
