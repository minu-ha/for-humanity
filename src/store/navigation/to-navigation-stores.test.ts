import {describe, expect, test} from "vitest";
import {storage_scroll_key} from "@/store/navigation/_constant/storage";
import {toNavigationStores} from "@/store/navigation/to-navigation-stores";

/**
 * 세션 저장소의 읽기와 쓰기를 메모리에서 제공하는 테스트 준비
 */
const toMemoryStorage = () => {
    const session = new Map<string, string>();

    const storage = {
        getItem: (key: string) => {
            const value = session.get(key);

            return value === undefined ? null : value;
        },
        setItem: (key: string, value: string) => {
            session.set(key, value);
        },
        removeItem: (key: string) => {
            session.delete(key);
        },
    };

    return {
        session,
        options: {
            session: () => {
                return storage;
            },
        },
    };
};

describe("탐색 스크롤 저장", () => {
    test("와이드, 데스크톱, 드로어의 스크롤 위치를 독립적으로 복원한다", () => {
        /**
         * GIVEN
         * 격리된 세션 저장소
         */
        const setup = toMemoryStorage();

        /**
         * WHEN
         * 탐색 스토어 생성과 저장 상태 복원
         */
        const stores = toNavigationStores(setup.options);

        stores.scroll.setState({
            positions: {
                wide: {navigation: "docs", pathname: "/one/", documents: 450, outline: 300},
                desktop: {navigation: "docs", pathname: "/two/", documents: 750, outline: 100},
                drawer: {navigation: "docs", pathname: "/one/", documents: 200, outline: 800},
            },
        });

        const restored = toNavigationStores(setup.options).scroll.getState();

        /**
         * THEN
         * 배치별로 복원한 스크롤 위치
         */
        expect(restored).toStrictEqual(stores.scroll.getState());
    });

    test.each(["{", "null", '{"state":null,"version":1}'])("손상된 저장값 %s는 기본 상태로 복원한다", (value) => {
        /**
         * GIVEN
         * 격리된 세션 저장소
         */
        const setup = toMemoryStorage();

        setup.session.set(storage_scroll_key, value);

        /**
         * WHEN
         * 탐색 스토어 생성과 저장 상태 복원
         */
        const stores = toNavigationStores(setup.options);

        /**
         * THEN
         * 기본 탐색 위치
         */
        expect(stores.scroll.getState()).toStrictEqual({positions: {}});
    });

    test("잘못된 좌표가 포함된 저장값은 전체를 초기화한다", () => {
        /**
         * GIVEN
         * 격리된 세션 저장소
         */
        const setup = toMemoryStorage();

        setup.session.set(
            storage_scroll_key,
            JSON.stringify({
                version: 1,
                state: {
                    positions: {
                        desktop: {navigation: "docs", pathname: "/one/", documents: -1, outline: 0},
                        wide: {navigation: "docs", pathname: "/one/", documents: 100, outline: 20},
                        drawer: {navigation: "docs", pathname: "/one/", documents: 100, outline: "20"},
                    },
                },
            }),
        );

        /**
         * WHEN
         * 탐색 스토어 생성과 저장 상태 복원
         */
        const stores = toNavigationStores(setup.options);

        /**
         * THEN
         * 손상된 저장값 전체 제외
         */
        expect(stores.scroll.getState()).toStrictEqual({positions: {}});
    });

    test("저장소 접근이 차단되어도 메모리의 탐색 상태를 유지한다", () => {
        /**
         * GIVEN
         * 접근할 때 예외를 발생시키는 저장소
         */
        const stores = toNavigationStores({
            session: () => {
                throw new Error("Storage blocked");
            },
        });

        stores.scroll.setState({positions: {desktop: {navigation: "docs", pathname: "/", documents: 100, outline: 200}}});

        /**
         * WHEN
         * 저장된 상태 다시 조회
         */
        stores.scroll.persist.rehydrate();

        /**
         * THEN
         * 저장소 오류에도 기존 메모리 상태 유지
         */
        expect(stores.scroll.getState().positions.desktop).toStrictEqual({navigation: "docs", pathname: "/", documents: 100, outline: 200});
    });

    test("저장 용량이 부족해도 실행 중인 탐색 위치를 유지한다", () => {
        /**
         * GIVEN
         * 읽기는 가능하고 쓰기는 실패하는 세션 저장소
         */
        const setup = toMemoryStorage();

        const stores = toNavigationStores({
            session: () => {
                return {
                    ...setup.options.session(),
                    setItem: () => {
                        throw new DOMException("Storage full", "QuotaExceededError");
                    },
                };
            },
        });

        /**
         * WHEN
         * 탐색 위치 변경
         */
        stores.scroll.setState({positions: {wide: {navigation: "docs", pathname: "/", documents: 120, outline: 80}}});

        /**
         * THEN
         * 저장 예외 없이 메모리 좌표 유지
         */
        expect(stores.scroll.getState().positions.wide).toStrictEqual({navigation: "docs", pathname: "/", documents: 120, outline: 80});
    });
});
