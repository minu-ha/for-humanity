/**
 * 같은 목차를 넓은 화면 오른쪽·좁은 화면 문서 아래로 이동 · 초기 HTML에서도 직렬화해 사용
 */
export const placeNavigationOutline = (wideQuery: string) => {
    const outline = document.querySelector<HTMLElement>("[data-navigation-outline]");
    const destination = document.querySelector<HTMLElement>(matchMedia(wideQuery).matches ? "[data-navigation-rail]" : "[data-navigation]");

    // 같은 부모에 다시 넣으면 초기 스크롤과 키보드 위치가 초기화될 수 있음
    if (outline && destination && outline.parentElement !== destination) {
        destination.append(outline);
    }
};
