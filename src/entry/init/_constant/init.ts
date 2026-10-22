/**
 * 초기화의 배포 선택값
 */
export const init_deployments = ["none", "github-pages", "cloudflare-pages"] as const;

/**
 * 초기화가 지원하는 패키지 매니저
 */
export const init_managers = ["npm", "pnpm"] as const;

/**
 * 입력 경계의 초기화 기본값
 */
export const init_defaults = {
    title: "Project notes",
    content: "content",
    lang: "ko",
    deploy: "none",
    branch: "main",
    manager: "npm",
    pnpm: "pnpm@10.33.2",
    indent: "  ",
    configIndent: 4,
    emptyText: "",
} as const;

/**
 * 박스 양쪽 여백 네 칸과 테두리 두 칸
 */
export const init_panel_inset = 6;

/**
 * 초기화 안내 박스의 공통 테두리
 */
export const init_panel_style = {borderColor: "cyan", borderStyle: "rounded", padding: 1, marginLeft: 0, marginTop: 1, marginBottom: 1} as const;

/**
 * 문서 폴더로 만들 수 없는 프로젝트 설정 파일 이름
 */
export const init_reserved_roots = ["package.json", ".gitignore", "for-humanity.config.ts", "for-humanity.config.mjs"];

/**
 * 호스팅 선택 메뉴의 표시 문구
 */
export const init_deploy_choices = [
    {value: "none", label: "Set up later", hint: "Start writing locally"},
    {value: "github-pages", label: "GitHub Pages", hint: "Deploy with GitHub Actions"},
    {value: "cloudflare-pages", label: "Cloudflare Pages", hint: "Connect a Git repository"},
];

/**
 * 문서 루트의 빠른 선택값
 */
export const init_content_choices = [
    {value: init_defaults.content, label: init_defaults.content, hint: "Recommended"},
    {value: "docs", label: "docs"},
];

/**
 * 문서 언어의 빠른 선택값
 */
export const init_lang_choices = [
    {value: init_defaults.lang, label: "한국어 (ko)", hint: "Recommended"},
    {value: "en", label: "English (en)"},
];

/**
 * 배포 브랜치의 기본 후보
 */
export const init_branch_choices = ["main", "master"];

/**
 * 추천값의 실제 내용과 분리한 직접 입력 식별자
 */
export const init_custom_choice = "custom";

/**
 * 미지정 package.json 스크립트와 의존성
 */
export const init_empty_entries: Record<string, string> = {};

/**
 * 대화형 입력 취소의 내부 표시
 */
export const init_cancelled = Symbol("init_cancelled");

/**
 * SIGINT와 같은 초기화 취소 종료 코드
 */
export const init_cancel_code = 130;

/**
 * 초기화 화면과 실행 결과의 표시 문구
 */
export const init_copy = {
    description: "Create documentation and choose a deployment target",
    welcome: "Create your documentation site",
    tagline: "Documents, for humans.",
    siteStep: "1 / 3  Site settings",
    siteHint: "Choose a suggestion or your own.",
    deployStep: "2 / 3  Deployment",
    deployHint: "Publish now or set it up later.",
    reviewStep: "3 / 3  Review",
    reviewHint: "Check your choices before writing.",
    custom: "Custom...",
    customHint: "Type your own value",
    recommended: "Recommended",
    ready: "Setup complete",
    buildPreview: "Build and preview",
    title: "Site title",
    titleExample: "Team handbook",
    content: "Documentation folder",
    contentExample: "handbook",
    lang: "Document language",
    langExample: "en-US",
    deploy: "Where will you publish your site?",
    repository: "GitHub repository (owner/name)",
    repositoryExample: "owner/repository",
    branch: "Deployment branch",
    branchExample: "release/docs",
    url: "Public site origin (optional)",
    emptyUrl: "Leave blank to skip",
    defaultUrl: "Use the GitHub Pages address",
    laterUrl: "Set up later",
    confirm: "Create these files?",
    done: "Your documentation is ready",
    cancelled: "Setup cancelled. No files changed.",
    interactive: "Run init in a terminal, or use init --yes to accept the defaults.",
    conflict: "Existing documentation or configuration. Choose an empty folder or follow the migration guide",
    next: "Next steps",
    github: "Settings > Pages > GitHub Actions\nCommit your files and lockfile.\nPush the deployment branch.",
    cloudflare: "Cloudflare Pages: connect your Git repository and use these build settings.",
    none: "Publish later: https://for-humanity.fyi/deployment/",
} as const;

/**
 * 사이트 실행과 분리한 init 전용 인자
 */
export const init_args = {
    dir: {type: "positional", description: "Project folder", default: "."},
    yes: {type: "boolean", description: "Accept defaults and skip prompts", default: false},
    title: {type: "string", description: "Site title"},
    content: {type: "string", description: "Documentation folder, default content"},
    lang: {type: "string", description: "Document language, default ko"},
    deploy: {type: "enum", options: init_deployments.slice(), description: "none, github-pages or cloudflare-pages"},
    repository: {type: "string", description: "GitHub owner/repository"},
    branch: {type: "string", description: "GitHub deployment branch"},
    manager: {type: "enum", options: init_managers.slice(), description: "npm or pnpm, detected from the project"},
    url: {type: "string", description: "Public HTTP(S) origin"},
} as const;
