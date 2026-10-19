import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",

    // 프로젝트 기준 문서 루트, 문서 루트 기준 공개와 내부 폴더
    content: {root: "content", public: "public", private: "private"},
} satisfies SiteConfig;
