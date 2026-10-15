import {createJiti} from "jiti";

// cosmiconfig의 TypeScript 5 API 의존을 피하는 로더 · 설정 본문은 타입 검사 대상
export default await createJiti(import.meta.url).import("./util/stylelint.config.ts", {default: true});
