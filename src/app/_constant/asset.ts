import {copy_error_embed_format, copy_error_image_format, copy_error_media_format, copy_error_track_format} from "@/app/_constant/copy";
import type {AssetReference} from "@/app/_type/asset-reference";

/**
 * 원본 크기를 width, height로 넣는 래스터 이미지 형식. viewBox만 있는 SVG는 표시 크기가 달라져 제외
 */
export const asset_raster_image_extensions: ReadonlySet<string> = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"]);

/**
 * 가로세로가 바뀌는 EXIF 방향 값의 하한. 5부터 8까지 90도 회전
 */
export const asset_exif_rotated_orientation = 5;

/**
 * 이미지 자원 형식. img, srcset, poster와 Markdown 이미지
 */
const asset_image_extensions: ReadonlySet<string> = new Set([...asset_raster_image_extensions, ".svg"]);

/**
 * 영상, 소리 자원 형식. video, audio, source의 src
 */
const asset_video_audio_extensions: ReadonlySet<string> = new Set([".mp4", ".webm", ".mp3"]);

/**
 * 자막 트랙 형식. track의 src
 */
const asset_track_extensions: ReadonlySet<string> = new Set([".vtt"]);

/**
 * 삽입 문서 형식. embed의 src와 object의 data
 */
const asset_embed_extensions: ReadonlySet<string> = new Set([...asset_image_extensions, ".pdf"]);

/**
 * 명시적 로컬 참조로 배포할 수 있는 파일 형식. 실행 파일, 소스, 설정 제외
 */
const asset_media_extensions: ReadonlySet<string> = new Set([
    ...asset_image_extensions,
    ".pdf",
    ".csv",
    ".txt",
    ".zip",
    ...asset_video_audio_extensions,
    ...asset_track_extensions,
]);

/**
 * 이미지를 삽입하는 속성의 수집 규칙
 */
const asset_image_reference: AssetReference = {formats: asset_image_extensions, unsupported: copy_error_image_format};

/**
 * 영상, 소리를 삽입하는 속성의 수집 규칙
 */
const asset_video_audio_reference: AssetReference = {formats: asset_video_audio_extensions, unsupported: copy_error_media_format};

/**
 * 문서와 이미지를 삽입하는 embed, object의 수집 규칙
 */
const asset_embed_reference: AssetReference = {formats: asset_embed_extensions, unsupported: copy_error_embed_format};

/**
 * 내용 지문 자원으로 수집하는 요소별 속성과 규칙
 *
 *   - a의 href는 지원 형식만 첨부로 수집
 *   - iframe은 배포할 수 있는 형식 없음. 로컬 파일은 경고
 *   - 그 외 속성은 문서에 삽입하는 자원. 미지원 형식은 빌드 실패
 */
export const asset_references: ReadonlyMap<string, Readonly<Record<string, AssetReference>>> = new Map<string, Readonly<Record<string, AssetReference>>>([
    ["a", {href: {formats: asset_media_extensions}}],
    ["iframe", {src: {formats: new Set()}}],
    ["img", {src: asset_image_reference, srcSet: asset_image_reference}],
    ["source", {src: asset_video_audio_reference, srcSet: asset_image_reference}],
    ["video", {src: asset_video_audio_reference, poster: asset_image_reference}],
    ["audio", {src: asset_video_audio_reference}],
    ["track", {src: {formats: asset_track_extensions, unsupported: copy_error_track_format}}],
    ["embed", {src: asset_embed_reference}],
    ["object", {data: asset_embed_reference}],
]);

/**
 * srcset 후보 하나의 구문
 *
 *   - 첫째 캡처 그룹은 앞 구분 문자, 둘째는 URL. 서술자와 뒤 쉼표는 캡처 제외
 *   - 제약: HTML 명세의 후보 구분. URL 끝 쉼표와 서술자 뒤 쉼표만 구분자, URL 안 쉼표 유지
 */
export const asset_srcset_candidate_pattern = /([\s,]*)([^\s,]\S*?)(?:,+(?=\s|$)|(?=\s|$)[^,]*,?)/g;

/**
 * dev 자원 응답의 확장자별 content-type
 */
export const asset_content_types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".woff2": "font/woff2",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".pdf": "application/pdf",
    ".csv": "text/csv; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".vtt": "text/vtt; charset=utf-8",
};

/**
 * 미등록 확장자의 content-type
 */
export const asset_content_type_default = "application/octet-stream";
