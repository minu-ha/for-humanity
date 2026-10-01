import type {DocFileData} from "@/type/doc-file-data";

declare module "vfile" {
	interface DataMap {
		/**
		 * 문서 처리 플러그인 간 공유 데이터
		 */
		fh?: DocFileData;
	}
}
