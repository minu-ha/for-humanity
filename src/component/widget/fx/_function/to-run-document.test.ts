import {describe, expect, test} from "vitest";
import {toRunDocument} from "@/component/widget/fx/_function/to-run-document";

/**
 * 실행 상자의 srcdoc(src/component/widget/fx/_function/to-run-document.ts) 검증
 */
describe("실행 문서", () => {
    test("콘솔 shim 뒤에 사용자 코드를 두고 id를 전달한다", () => {
        const html = toRunDocument({id: "abc", code: "console.log(1)"});

        expect(html).toContain('("abc")');
        expect(html.indexOf("postMessage")).toBeLessThan(html.indexOf("console.log(1)"));
        expect(html.match(/<script>/g)).toHaveLength(2);
    });

    test("사용자 코드의 닫는 script 태그는 문서를 닫지 못한다", () => {
        const html = toRunDocument({id: "abc", code: 'const s = "</script><b>x</b>"'});

        expect(html).not.toContain("</script><b>");
        expect(html).toContain("<\\/script><b>");
    });

    test("대문자로 쓴 닫는 script 태그도 글자 그대로 이스케이프한다", () => {
        const html = toRunDocument({id: "abc", code: 'const s = "</SCRIPT><b>x</b>"'});

        expect(html).not.toContain("</SCRIPT>");
        expect(html).toContain("<\\/SCRIPT><b>");
    });
});
