/**
 * 문서 검사 결과. 파일마다 그 파일의 경고 줄을 둔다. remark-report 가 채우고 cli.ts 가 dev toolbar 로 보낸다.
 * dev 에서 문서를 고치면 그 파일의 줄만 다시 채워진다. 지운 파일의 줄은 dev 를 다시 켤 때까지 남는다
 */
export const report = new Map<string, string[]>();
