/*
 * dev toolbar 의 문서 검사 앱. cli.ts 가 서버 쪽을, toolbar/app.ts 가 브라우저 쪽을 맡는다
 */

/**
 * 앱의 id. toolbar 가 앱을 가리킬 때 쓴다
 */
export const toolbar_app_id = "for-humanity-report";

/**
 * 브라우저가 검사 결과를 달라고 보내고, 서버가 결과를 실어 보내는 이벤트 이름. 양쪽이 같은 이름을 쓴다
 */
export const toolbar_report_event = "for-humanity:report";
