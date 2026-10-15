import "@/style/base.css";
import "@/style/token.css";
import "@/entry/browser/browser";

// 서버 전용 컴포넌트의 스타일도 개발 그래프에 포함, 추가된 CSS의 HMR 유지
import.meta.glob("/src/component/**/*.css", {eager: true});
import.meta.glob("/src/page/**/*.css", {eager: true});
