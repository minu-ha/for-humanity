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
     * Markdown 없는 첫 화면 머리
     */
    head?: {
        /**
         * 제목 위 라벨 목록
         */
        eyebrow: string[];
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
                    <div className={clsx("wg_prose__eyebrow")}>
                        {props.head.eyebrow.map((text) => (
                            <span key={text}>{text}</span>
                        ))}
                    </div>
                    <h1>{props.head.title}</h1>
                    {props.head.lead !== undefined && <p>{props.head.lead}</p>}
                </header>
            )}
        </article>
    );
};
