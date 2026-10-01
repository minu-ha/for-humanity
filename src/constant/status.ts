/**
 * 상태 표지 종류 · verified 초록, unverified amber
 */
export const status_kind = {
    verified: "verified",
    unverified: "unverified",
} as const;

/**
 * 기본 상태 문구 · 확인됨은 뒤의 날짜 포함
 */
export const status_default_phrases = [
    {phrase: "확인됨", kind: status_kind.verified, date: true},
    {phrase: "확인되지 않았다", kind: status_kind.unverified},
];
