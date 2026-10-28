/**
 * 값이 없는 칸의 글. 방향과 관계없이 끝
 */
const blank_cell_texts = new Set(["", "-"]);

/**
 * 숫자가 든 글은 값 순서, 대소문자는 같은 글자
 */
const collator_options: Intl.CollatorOptions = {numeric: true, sensitivity: "base"};

/**
 * 비교할 칸 글. 없는 칸은 빈 칸, 앞뒤 공백과 연속 공백 제외
 */
const toCellText = (text: string | undefined) => {
    return text === undefined ? "" : text.replace(/\s+/g, " ").trim();
};

/**
 * 문서 언어의 사전 순서. 언어 태그가 비었거나 잘못됐으면 실행 환경 기본
 */
const toCollator = (locale: string | undefined) => {
    try {
        return new Intl.Collator(locale || undefined, collator_options);
    } catch {
        return new Intl.Collator(undefined, collator_options);
    }
};

/**
 * 머리글 정렬의 칸 글 비교. 숫자와 날짜가 든 글은 값 순서, 글자는 문서 언어의 사전 순서
 *
 *   - 빈 칸과 `-`는 오름차순과 내림차순 모두 끝. 빈 칸끼리는 0을 돌려 쓴 순서 유지
 *   - 없는 칸은 빈 칸으로 비교. 앞뒤 공백과 연속 공백은 비교에서 제외
 */
export const toCellComparator = (locale?: string) => {
    const collator = toCollator(locale);

    return (a: string | undefined, b: string | undefined, descending = false): number => {
        const textA = toCellText(a);
        const textB = toCellText(b);
        const blankA = blank_cell_texts.has(textA);
        const blankB = blank_cell_texts.has(textB);

        if (blankA || blankB) {
            return Number(blankA) - Number(blankB);
        }

        return descending ? collator.compare(textB, textA) : collator.compare(textA, textB);
    };
};
