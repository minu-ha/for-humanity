/**
 * 이미지 자원 형식. img, srcset, poster와 Markdown 이미지
 */
export const asset_image_extensions: ReadonlySet<string> = new Set([".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"]);

/**
 * 영상, 소리 자원 형식. video, audio, source의 src
 */
export const asset_video_audio_extensions: ReadonlySet<string> = new Set([".mp4", ".webm", ".mp3"]);

/**
 * 명시적 로컬 참조로 배포할 수 있는 파일 형식. 실행 파일, 소스, 설정 제외
 */
export const asset_media_extensions: ReadonlySet<string> = new Set([...asset_image_extensions, ".pdf", ".csv", ".txt", ".zip", ...asset_video_audio_extensions]);

/**
 * 내용 지문 자원으로 수집하는 요소별 속성과 형식
 *
 *   - a의 href는 지원 형식만 첨부로 수집
 *   - 그 외 속성은 문서에 삽입하는 자원. 미지원 형식은 빌드 실패
 */
export const asset_reference_formats: ReadonlyMap<string, Readonly<Record<string, ReadonlySet<string>>>> = new Map<string, Readonly<Record<string, ReadonlySet<string>>>>([
    ["a", {href: asset_media_extensions}],
    ["img", {src: asset_image_extensions, srcSet: asset_image_extensions}],
    ["source", {src: asset_video_audio_extensions, srcSet: asset_image_extensions}],
    ["video", {src: asset_video_audio_extensions, poster: asset_image_extensions}],
    ["audio", {src: asset_video_audio_extensions}],
]);

/**
 * srcset 후보 하나의 구문
 *
 *   - 첫째 캡처 그룹은 앞 구분 문자, 둘째는 URL. 서술자와 뒤 쉼표는 캡처 제외
 *   - 제약: HTML 명세의 후보 구분. URL 끝 쉼표와 서술자 뒤 쉼표만 구분자, URL 안 쉼표 유지
 */
export const asset_srcset_candidate_pattern = /([\s,]*)([^\s,]\S*?)(?:,+(?=\s|$)|(?=\s|$)[^,]*,?)/g;
