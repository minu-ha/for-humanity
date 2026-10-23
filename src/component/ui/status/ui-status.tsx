import clsx from "clsx";
import "./ui-status.css";

/**
 * 이미지, 상태 번호와 복귀 경로를 받는 독립 안내 화면
 */
export interface UiStatusProps {
    /**
     * 본문 위에 표시할 상태 번호
     */
    code: string;

    /**
     * 상태 번호를 설명하는 제목
     */
    title: string;

    /**
     * 문제와 다음 행동 안내
     */
    description: string;

    /**
     * 장식 이미지 URL, 상태 의미는 제목과 본문으로 전달
     */
    image: string;

    /**
     * 안내 뒤의 복귀 링크
     */
    action: {
        /**
         * 이동 목적지 URL
         */
        href: string;

        /**
         * 화면에 표시할 행동 이름
         */
        label: string;
    };
}

export const UiStatus = (props: UiStatusProps) => {
    return (
        <section className={clsx("ui_status__root")}>
            <img className={clsx("ui_status__image")} src={props.image} alt="" />

            {/**
             * 상태 번호와 읽을 수 있는 오류 제목
             */}
            <h1 className={clsx("ui_status__heading")}>
                <span className={clsx("ui_status__code")}>{props.code}</span>
                <span className={clsx("ui_status__title")}>{props.title}</span>
            </h1>

            <p className={clsx("ui_status__description")}>{props.description}</p>
            <a className={clsx("ui_status__action")} href={props.action.href}>
                {props.action.label}
            </a>
        </section>
    );
};
