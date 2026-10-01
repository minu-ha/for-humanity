import type {DocFileData} from "@/type/doc-file-data";

declare module "vfile" {
	interface DataMap {
		/**
		 * 문서 처리기가 플러그인 사이에 나르는 값
		 */
		fh?: DocFileData;
	}
}
