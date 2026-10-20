/**
 * HTML script 안에 넣을 JSON. 작성한 문자열이 script 종료 태그나 JavaScript 줄 구분자로 해석되지 않음
 */
export const toScriptJson = (data: unknown) => {
    return JSON.stringify(data).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
};
