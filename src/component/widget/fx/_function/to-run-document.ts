/**
 * 실행 문서 입력
 */
interface RunDocumentParams {
    /**
     * 이번 실행의 메시지 id. 부모가 다른 실행과 구분
     */
    id: string;

    /**
     * 사용자가 실행할 코드
     */
    code: string;
}

/**
 * 닫는 script 태그. browser.js는 페이지에 인라인되므로 소스에 이 글자 그대로 두지 않는다
 */
const script_close = ["</", "script>"].join("");

/**
 * 사용자 코드 안의 닫는 script 태그. 대소문자는 그대로 두고 슬래시만 이스케이프
 */
const script_close_pattern = /<\/(script)/gi;

/**
 * 콘솔을 부모에 보내는 shim. id를 인자로 받는 즉시 실행 함수라 사용자 코드가 parent나 id 같은 이름을 써도 부딪치지 않음
 *
 *   - 문자열은 그대로, 함수는 이름, 오류는 메시지, 그 밖은 JSON
 *   - console.log, info, warn, error와 잡히지 않은 오류, 거부를 한 줄씩 전달
 *   - 잡히지 않은 오류는 Error 객체를 먼저 보고, 브라우저가 이미 붙인 Uncaught는 다시 붙이지 않음
 */
const run_shim = [
    "((id)=>{",
    "const target=window.parent;",
    "const show=(v)=>{",
    "if(typeof v==='string')return v;",
    "if(v===null||['undefined','number','bigint','boolean','symbol'].includes(typeof v))return String(v);",
    "if(typeof v==='function')return '[Function '+(v.name||'anonymous')+']';",
    "if(v instanceof Error)return String(v);",
    "try{return JSON.stringify(v)}catch{return String(v)}",
    "};",
    "const send=(...a)=>target.postMessage({id,line:a.map(show).join(' ')},'*');",
    "console.log=console.info=console.warn=console.error=send;",
    "addEventListener('error',(e)=>{const m=e.error==null?e.message:show(e.error);send(m.startsWith('Uncaught')?m:'Uncaught '+m)});",
    "addEventListener('unhandledrejection',(e)=>send('Uncaught (in promise) '+show(e.reason)));",
    "})",
].join("");

/**
 * sandbox iframe의 srcdoc. shim 스크립트 다음에 사용자 코드 스크립트
 */
export const toRunDocument = (params: RunDocumentParams): string => {
    return `<script>${run_shim}(${JSON.stringify(params.id)})${script_close}<script>${params.code.replace(script_close_pattern, "<\\/$1")}${script_close}`;
};
