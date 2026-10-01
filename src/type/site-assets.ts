/**
 * 쪽 머리에 들어가는 사이트 공통 자원. cli 가 글꼴 패키지를 읽어 만들고 모든 쪽이 같은 값을 받는다
 */
export interface SiteAssets {
	/**
	 * @font-face 블록과 --app-font-face-* 변수. 머리의 <style> 에 들어간다
	 */
	fontCss: string;
	/**
	 * 미리 받을 글꼴 파일의 주소. 코드 글꼴 한 파일만이다
	 */
	preload: string[];
	/**
	 * dev 서버인가. 문서가 바뀌면 쪽을 다시 여는 스크립트를 싣는다
	 */
	reload: boolean;
}
