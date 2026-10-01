/*
 * CSS 컨벤션의 자동 검사 · 포맷은 Biome
 * 의미·역할·접근성 판단은 수동 리뷰
 */

/**
 * 소유 클래스의 명명 계약 · 외부 접두사 제외
 */
const ownClassPattern = (scope) => {
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
 * 직접 작성한 마크업의 금지 선택자
 */
const ownMarkupPatterns = [
	// 최상위 상태 선택자 금지
	/^\.[\w-]+:(hover|focus|focus-visible|focus-within|active|enabled|disabled|checked|visited)/,
	// 소유 마크업의 요소 선택자 금지 · 생성 마크업은 이유를 적은 예외
	/^&\s*[>+~]?\s*[a-z]/,
];

const disallowed = (foreignScopes) => {
	return [[...foreignScopes, ...ownMarkupPatterns], {splitList: true}];
};

export default {
	extends: ["stylelint-config-standard"],
	// 외부 글꼴 CSS 제외
	ignoreFiles: ["src/asset/**/*.css"],
	rules: {
		// @media 내부 클래스 깊이 0 · 상태 중첩 1단계 허용
		"max-nesting-depth": [1, {ignoreAtRules: ["media", "supports", "container"]}],
		// 전역 keyframes 이름에 소유자 명시 · 수정자 구분자와 혼동 방지
		"keyframes-name-pattern": "^(pg|wg|ui)_[a-z][a-zA-Z0-9]*__[a-z][a-zA-Z0-9]*$",
		// 쉼표 목록 이후의 단독 중복 선언 포함
		"no-duplicate-selectors": [true, {disallowInList: true}],
		// !important: 전역 움직임 줄이기만 허용
		"declaration-no-important": true,
		// 지역 CSS 변수 선언 금지 · var() 소비 허용
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
				"selector-class-pattern": ownClassPattern("pg"),
				"selector-disallowed-list": disallowed([/^\.(wg|ui)_/]),
			},
		},
		{
			files: ["src/component/widget/**/*.css"],
			rules: {
				"selector-class-pattern": ownClassPattern("wg"),
				"selector-disallowed-list": disallowed([/^\.(pg|ui)_/]),
			},
		},
		{
			files: ["src/component/ui/**/*.css"],
			rules: {
				"selector-class-pattern": ownClassPattern("ui"),
				"selector-disallowed-list": disallowed([/^\.(pg|wg)_/]),
			},
		},
		{
			// 전역 스타일은 소유 클래스 문법 제외
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
			// 전역 토큰의 --app-* 문법
			files: ["src/style/token.css"],
			rules: {
				"selector-class-pattern": null,
				"property-disallowed-list": null,
				// var() 소비까지 검사 · 외부 변수 소비 파일 제외
				"custom-property-pattern": "^app-[a-z0-9-]+$",
			},
		},
	],
};
