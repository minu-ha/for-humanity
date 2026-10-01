/**
 * 섬을 심는 지시문 이름. `::note[단추 글]` 한 줄이 쪽지 섬이 된다
 */
export const island_directive_note = "note";

/**
 * 섬 뿌리 요소의 data-* 이름. 서버는 이 자리에 React 를 그리고 브라우저는 같은 자리를 이어받는다
 */
export const island_attribute_name = "data-island";

/**
 * 섬 프롭이 담기는 data-* 이름. JSON 을 encodeURIComponent 로 적어 따옴표와 한글의 이스케이프를 피한다
 */
export const island_attribute_props = "data-props";
