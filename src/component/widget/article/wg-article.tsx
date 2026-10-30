import clsx from "clsx";
import {Fragment} from "hono/jsx";
import "./wg-article.css";
import "@/style/authoring/fx.css";

/**
 * Markdown HTML과 본문 부품의 공통 표현 입력
 *
 *   - remark, rehype 플러그인은 _function 소유
 */
export interface WgArticleProps {
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
         * 제목 아래 소개. 선택
         */
        lead?: string;
    };
}

export const WgArticle = (props: WgArticleProps) => {
    return (
        <Fragment>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 빌드 처리기가 만든 문서 HTML. 작성자의 원시 HTML 허용이 문서 계약 */}
            {props.html !== undefined && <article className={clsx("wg_article__root")} dangerouslySetInnerHTML={{__html: props.html}} />}
            {props.html === undefined && (
                <article className={clsx("wg_article__root")}>
                    {props.head !== undefined && (
                        <header className={clsx("wg_article__head")}>
                            <h1 className={clsx("wg_article__title")}>{props.head.title}</h1>
                            {props.head.lead !== undefined && <p className={clsx("wg_article__lead")}>{props.head.lead}</p>}
                        </header>
                    )}
                </article>
            )}
        </Fragment>
    );
};
