import type {Config} from "stylelint";

/*
 * CSS 컨벤션의 자동 검사. 포맷은 Biome
 * 의미, 역할, 접근성 판단은 수동 리뷰
 */

/**
 * 소유 클래스의 명명 계약. 외부 접두사 제외
 */
const toOwnClassPattern = (scope: "pg" | "wg" | "ui") => {
    return [
        "^(?:",

        // 외부 클래스 제외
        `(?!${scope}_).*`,
        "|",

        // 소유 클래스의 scope_slug__element--modifier 문법
        `${scope}_[a-z][a-zA-Z0-9]*__[a-z][a-zA-Z0-9]*(?:--[a-z][a-zA-Z0-9]*)?`,
        ")$",
    ].join("");
};

/**
 * 이름을 정하지 않는 라이브러리 클래스. 소유 root 아래에서만 선택
 *
 *   - Shiki의 코드 줄 표기, Mermaid의 공유 툴팁
 */
const library_prefixes = [/^\.(shiki|line|highlighted|diff|has-)/, /^\.mermaid/];

/**
 * 직접 작성한 마크업의 금지 선택자
 */
const own_markup_patterns = [
    // 최상위 상태 선택자 금지
    /^\.[\w-]+:(hover|focus|focus-visible|focus-within|active|enabled|disabled|checked|visited)/,

    // 소유 마크업의 요소 선택자 금지. 생성 마크업은 이유를 적은 예외
    /^&\s*[>+~]?\s*[a-z]/,
];

/**
 * 외부 소유 영역, 라이브러리, 직접 작성한 마크업의 금지 선택자 결합
 */
const toDisallowedSelectors = (foreignScopes: RegExp[]): [RegExp[], {splitList: true}] => {
    return [[...foreignScopes, ...library_prefixes, ...own_markup_patterns], {splitList: true}];
};

export default {
    extends: ["stylelint-config-standard"],

    // 더 이상 필요 없는 disable 주석 검출. 예외 주석이 실제 위반에만 남도록 유지
    reportNeedlessDisables: true,

    // 외부 글꼴 CSS 제외
    ignoreFiles: ["src/asset/**/*.css"],
    rules: {
        // @media 내부 클래스 깊이 0. 상태 중첩 1단계 허용
        "max-nesting-depth": [1, {ignoreAtRules: ["media", "supports", "container"]}],

        // 전역 keyframes 이름에 소유자 명시. 수정자 구분자와 혼동 방지
        "keyframes-name-pattern": "^(pg|wg|ui)_[a-z][a-zA-Z0-9]*__[a-z][a-zA-Z0-9]*$",

        // 쉼표 목록 이후의 단독 중복 선언 포함
        "no-duplicate-selectors": [true, {disallowInList: true}],

        // !important: 전역 움직임 줄이기만 허용
        "declaration-no-important": true,

        // 지역 CSS 변수 선언 금지. var() 소비 허용
        "property-disallowed-list": ["/^--/"],

        // 소유 마크업의 상태는 수정자 클래스
        "selector-attribute-name-disallowed-list": [/^aria-/, /^data-(pg|wg|ui)-/],
        "selector-max-id": 0,

        // 부정 선택자 대신 기본 블록
        "selector-pseudo-class-disallowed-list": ["not"],
    },
    overrides: [
        {
            files: ["src/page/**/*.css"],
            rules: {
                "selector-class-pattern": toOwnClassPattern("pg"),
                "selector-disallowed-list": toDisallowedSelectors([/^\.(wg|ui)_/]),
            },
        },
        {
            files: ["src/component/widget/**/*.css"],
            rules: {
                "selector-class-pattern": toOwnClassPattern("wg"),
                "selector-disallowed-list": toDisallowedSelectors([/^\.(pg|ui)_/]),
            },
        },
        {
            files: ["src/component/ui/**/*.css"],
            rules: {
                "selector-class-pattern": toOwnClassPattern("ui"),
                "selector-disallowed-list": toDisallowedSelectors([/^\.(pg|wg)_/]),
            },
        },
        {
            // 전역 스타일과 그림 작성 어휘는 소유 클래스 문법 제외. 작성 어휘의 --fx-* 공개 변수 선언 허용
            files: ["src/style/**/*.css", "src/*.css"],
            rules: {
                "selector-class-pattern": null,
                "keyframes-name-pattern": null,
                "property-disallowed-list": null,

                // 움직임 줄이기의 전역 !important 예외
                "declaration-no-important": null,
            },
        },
        {
            // 그림 작성 어휘. 전역 !important 예외 밖이고 소유 클래스 이름은 쓰지 않음
            files: ["src/style/authoring/**/*.css"],
            rules: {
                "declaration-no-important": true,
                "selector-disallowed-list": toDisallowedSelectors([/\.(pg|wg|ui)_/]),
            },
        },
        {
            // 전역 토큰의 --app-* 문법
            files: ["src/style/token.css"],
            rules: {
                "selector-class-pattern": null,
                "property-disallowed-list": null,

                // 컴포넌트 클래스의 선언은 소유 CSS에 한정
                "selector-disallowed-list": [/\.(pg|wg|ui)_/],

                // var() 소비까지 검사. 외부 변수 소비 파일 제외
                "custom-property-pattern": "^app-[a-z0-9-]+$",
            },
        },
    ],
} satisfies Config;
