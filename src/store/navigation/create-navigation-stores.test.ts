import assert from "node:assert/strict";
import {test} from "node:test";
import {createNavigationStores} from "@/store/navigation/create-navigation-stores";
import {navigation_scroll_storage_key} from "@/store/navigation/navigation-storage";

const fixture = () => {
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
    return {session, options: {session: () => storage}};
};

test("retains independent wide, desktop and drawer scroll positions within a tab", () => {
    const setup = fixture();
    const stores = createNavigationStores(setup.options);
    stores.scroll.setState({
        positions: {
            wide: {navigation: "docs", pathname: "/one/", documents: 450, outline: 300},
            desktop: {navigation: "docs", pathname: "/two/", documents: 750, outline: 100},
            drawer: {navigation: "docs", pathname: "/one/", documents: 200, outline: 800},
        },
    });
    assert.deepEqual(createNavigationStores(setup.options).scroll.getState(), stores.scroll.getState());
});

test("rejects malformed and unknown-version persistence without losing defaults", () => {
    for (const value of ["{", "null", '{"state":null,"version":1}', '{"state":{"positions":{}},"version":999}']) {
        const setup = fixture();
        setup.session.set(navigation_scroll_storage_key, value);
        const stores = createNavigationStores(setup.options);
        assert.deepEqual(stores.scroll.getState(), {positions: {}});
    }
});

test("rejects invalid scroll coordinates", () => {
    const setup = fixture();
    setup.session.set(
        navigation_scroll_storage_key,
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
    const stores = createNavigationStores(setup.options);
    assert.deepEqual(stores.scroll.getState().positions.wide, {navigation: "docs", pathname: "/one/", documents: 100, outline: 20});
    assert.equal(stores.scroll.getState().positions.desktop, undefined);
    assert.equal(stores.scroll.getState().positions.drawer, undefined);
});

test("keeps in-memory interaction working when storage reads and writes are blocked", () => {
    const blocked = () => {
        throw new Error("Storage blocked");
    };
    const stores = createNavigationStores({session: blocked});
    stores.scroll.setState({positions: {desktop: {navigation: "docs", pathname: "/", documents: 100, outline: 200}}});
    stores.scroll.persist.rehydrate();
    assert.equal(stores.scroll.getState().positions.desktop?.documents, 100);
});
