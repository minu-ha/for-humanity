import assert from "node:assert/strict";
import {test} from "node:test";
import {navigation_scroll_storage_key, navigation_tree_storage_key} from "@/component/widget/shell/_constant/navigation";
import {createNavigationStores} from "@/component/widget/shell/_function/create-navigation-stores";

const fixture = () => {
    const local = new Map<string, string>();
    const session = new Map<string, string>();
    const storage = (values: Map<string, string>) => ({
        getItem: (key: string) => {
            const value = values.get(key);
            return value === undefined ? null : value;
        },
        setItem: (key: string, value: string) => {
            values.set(key, value);
        },
        removeItem: (key: string) => {
            values.delete(key);
        },
    });
    return {local, session, options: {local: () => storage(local), session: () => storage(session)}};
};

test("starts with every branch expanded and persists explicit choices across pages", () => {
    const setup = fixture();
    const stores = createNavigationStores(setup.options);
    assert.deepEqual(stores.tree.getState(), {collapsed: {}});
    stores.tree.setState({collapsed: {'group:["Projects"]': true, "outline:one:heading:setup": false}});
    assert.deepEqual(createNavigationStores(setup.options).tree.getState(), stores.tree.getState());
    assert.equal(setup.session.has(navigation_tree_storage_key), false);
});

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
    assert.equal(setup.local.has(navigation_scroll_storage_key), false);
});

test("rejects malformed and unknown-version persistence without losing defaults", () => {
    for (const value of ["{", "null", '{"state":null,"version":1}', '{"state":{"collapsed":{"group:a":true}},"version":999}']) {
        const setup = fixture();
        setup.local.set(navigation_tree_storage_key, value);
        setup.session.set(navigation_scroll_storage_key, value);
        const stores = createNavigationStores(setup.options);
        assert.deepEqual(stores.tree.getState(), {collapsed: {}});
        assert.deepEqual(stores.scroll.getState(), {positions: {}});
    }
});

test("narrows persisted branch flags and rejects invalid scroll coordinates", () => {
    const setup = fixture();
    setup.local.set(navigation_tree_storage_key, JSON.stringify({version: 1, state: {collapsed: {good: true, bad: "true"}, unexpected: true}}));
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
    assert.deepEqual(stores.tree.getState(), {collapsed: {good: true}});
    assert.deepEqual(stores.scroll.getState().positions.wide, {navigation: "docs", pathname: "/one/", documents: 100, outline: 20});
    assert.equal(stores.scroll.getState().positions.desktop, undefined);
    assert.equal(stores.scroll.getState().positions.drawer, undefined);
});

test("keeps in-memory interaction working when storage reads and writes are blocked", () => {
    const blocked = () => {
        throw new Error("Storage blocked");
    };
    const stores = createNavigationStores({local: blocked, session: blocked});
    stores.tree.setState({collapsed: {"document:one": true}});
    stores.tree.persist.rehydrate();
    assert.equal(stores.tree.getState().collapsed["document:one"], true);
    stores.scroll.setState({positions: {desktop: {navigation: "docs", pathname: "/", documents: 100, outline: 200}}});
    stores.scroll.persist.rehydrate();
    assert.equal(stores.scroll.getState().positions.desktop?.documents, 100);
});
