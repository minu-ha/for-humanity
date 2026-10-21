import type {KnipConfig} from "knip";

/**
 * 사용하지 않는 파일, export, 의존성 검사. 정적 import로 찾지 못하는 진입점만 추가
 */
export default {
    entry: [
        // CLI가 jiti로 읽는 사이트 설정과 사용자 템플릿 설정
        "for-humanity.config.ts",
        "template/for-humanity.config.ts",

        // Vite browser 모드와 dev 서버가 경로 문자열로 여는 모듈
        "src/entry/browser/browser.tsx",
        "src/entry/dev/_constant/style.ts",

        // 테스트가 경로 문자열로 번들하는 갤러리 스크립트
        "test/_gallery/*.tsx",

        // stylelint.config.mjs가 jiti로 읽는 설정 본문
        "util/stylelint.config.ts",
    ],
} satisfies KnipConfig;
