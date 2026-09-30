/**
 * 알약 뒤에 붙는 날짜의 꼴 (2026-09-30)
 */
export const status_date_pattern = String.raw`\d{4}-\d{2}-\d{2}`;

/**
 * 알약 문구 같은데 설정에 없는 글. 괄호 안이 날짜로 끝나면 대개 문구의 오타다. 설정에 있는 문구는 이 검사 앞에서 이미 알약이 됐다
 */
export const status_candidate_pattern = new RegExp(String.raw`\([^()\n]*${status_date_pattern}\)`, "g");
