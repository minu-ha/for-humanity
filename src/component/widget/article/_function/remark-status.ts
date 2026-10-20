import clsx from "clsx";
import {orderBy} from "es-toolkit/array";
import {escape as escapeHtml, escapeRegExp} from "es-toolkit/string";
import type {Root} from "mdast";
import {findAndReplace, type RegExpMatchObject} from "mdast-util-find-and-replace";
import type {VFile} from "vfile";
import {copy_warn_unknown_status} from "@/component/widget/article/_constant/copy";
import {status_candidate_pattern, status_date_pattern} from "@/component/widget/article/_constant/status";
import {status_kind} from "@/constant/status";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 상태 표지로 바꿀 설정 문구
 */
interface StatusOptions {
    /**
     * 사이트 설정의 문구와 색 종류, 날짜 포함 여부
     */
    status: ResolvedSiteConfig["status"];
}

/**
 * 설정 문구의 상태 표지 변환. 괄호 제거
 *
 *   - 제목, 링크 안의 문구 제외
 *   - 미등록 날짜 문구는 파일 경고, remark-report에서 출력
 */
export const remarkStatus = (options: StatusOptions) => {
    const statuses = orderBy(options.status, [(item) => item.phrase.length], ["desc"]);
    const phrases = statuses.map((item) => `${escapeRegExp(item.phrase)}${item.date ? `(?: ${status_date_pattern})?` : ""}`).join("|");
    const pattern = new RegExp(String.raw`\((${phrases})\)|(${phrases})`, "g");
    const ignore = ["link", "linkReference", "heading"];

    return (tree: Root, file: VFile) => {
        findAndReplace(
            tree,
            [
                pattern,
                (_match: string, inParens: string | undefined, bare: string | undefined) => {
                    const text = inParens ?? bare;
                    const item = statuses.find((status) => text?.startsWith(status.phrase));

                    // findAndReplace의 false: 원문 유지
                    if (text === undefined || item === undefined) {
                        return false;
                    }

                    return {
                        type: "html",
                        value: `<span class="${clsx("wg_article__pill", item.kind === status_kind.verified && "wg_article__pill--verified", item.kind === status_kind.unverified && "wg_article__pill--unverified")}">${escapeHtml(text)}</span>`,
                    };
                },
            ],
            {ignore},
        );

        findAndReplace(
            tree,
            [
                status_candidate_pattern,
                (match: string, info: RegExpMatchObject) => {
                    // 치환된 텍스트에 position 부재. 위치가 남은 가까운 조상 기준
                    file.message(
                        `${copy_warn_unknown_status}: ${match}`,
                        info.stack.findLast((node) => node.position !== undefined),
                    );

                    return false;
                },
            ],
            {ignore},
        );
    };
};
