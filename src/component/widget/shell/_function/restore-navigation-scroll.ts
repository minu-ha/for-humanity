/**
 * 탐색 HTML 직후와 드로어 열기에서 저장 위치 복원 · 첫 paint 전 실행
 * HTML에 함수 본문을 직렬화하므로 import나 바깥 변수 없이 브라우저 DOM만 사용
 * @param storageKey 탭·화면 모드별 저장 키
 */
export const restoreNavigationScroll = (storageKey: string) => {
    const navigation = document.querySelector<HTMLElement>("[data-navigation]");
    const documents = document.querySelector<HTMLElement>('[data-navigation-scroll="documents"]');
    const outline = document.querySelector<HTMLElement>('[data-navigation-scroll="outline"]');

    if (!navigation || !documents || !outline) {
        return;
    }

    try {
        const value = sessionStorage.getItem(storageKey);

        if (value === null) {
            return;
        }

        const stored: unknown = JSON.parse(value);
        const signature = [...navigation.querySelectorAll<HTMLAnchorElement>(".wg_shellNav__root a[href]")].map((link) => `${link.pathname}:${link.textContent}`).join("\n");

        if (typeof stored !== "object" || stored === null || !("navigation" in stored) || stored.navigation !== signature) {
            return;
        }

        if ("documents" in stored && typeof stored.documents === "number" && Number.isFinite(stored.documents) && stored.documents >= 0) {
            documents.scrollTop = stored.documents;
        }

        // 문서 목록은 공통 위치 · 목차는 같은 페이지에 다시 들어왔을 때만 복원
        if (
            "pathname" in stored &&
            stored.pathname === location.pathname &&
            "outline" in stored &&
            typeof stored.outline === "number" &&
            Number.isFinite(stored.outline) &&
            stored.outline >= 0
        ) {
            outline.scrollTop = stored.outline;
        }
    } catch {
        // 차단·손상된 저장소는 복원만 생략 · 기본 링크와 스크롤 유지
    }
};
