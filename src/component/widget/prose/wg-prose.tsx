import clsx from "clsx";
import "./wg-prose.css";

/**
 * Markdown HTML과 본문 부품의 공통 표현 입력
 * remark·rehype 플러그인은 _function 소유
 */
export interface WgProseProps {
    /**
     * 머리를 포함한 렌더링 완료 HTML
     */
    html?: string;
    /**
     * README가 없을 때의 안내 머리
     */
    head?: {
        /**
         * 문서 h1 제목
         */
        title: string;
        /**
         * 제목 아래 소개 · 선택
         */
        lead?: string;
    };
}

export const WgProse = (props: WgProseProps) => {
    if (props.html !== undefined) {
        return <article className={clsx("wg_prose__root")} dangerouslySetInnerHTML={{__html: props.html}} />;
    }

    return (
        <article className={clsx("wg_prose__root")}>
            {props.head !== undefined && (
                <header className={clsx("wg_prose__head")}>
                    <h1>{props.head.title}</h1>
                    {props.head.lead !== undefined && <p>{props.head.lead}</p>}
                </header>
            )}
        </article>
    );
};
