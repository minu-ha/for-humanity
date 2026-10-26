---
name: Navigation
label: Reading paths built from groups and parent documents
group: Guide
parent: writing
order: 10
---

A group is a category heading that cannot be clicked. Each document is a link with its own body and URL.
`parent` places a document under another document. Supported since `0.3.0`.
This page is also a child document under [Writing](writing.md) in the sidebar.

## Group and parent

`group` is the category path a document belongs to. `parent` is the ID of the parent document in the same category.
Readers click the parent document to read its introduction, and read the details in the child documents.

```text
Guide
├─ Writing
└─ Settings
   ├─ Site
   └─ Themes
```

For example, the frontmatter of `settings.md` looks like this.

```yaml
name: Settings
label: Configuration guide
group: Guide
order: 20
```

Add the parent ID to `site.md`.

```yaml
name: Site
label: Site configuration
group: Guide
parent: settings
order: 10
```

If `themes.md` also specifies `parent: settings`, it appears under the same parent.
Both parents and children are clickable documents. Only the current page is shown in bold, and children are shown indented under the parent.
A child document is not repeated as a separate top-level link and is always shown under its parent.

## Parent references

Specify the parent not by its display name but by the lowercase document ID without the extension.
The ID of `content/public/guide/settings.md` is `guide/settings`, and its URL is `/guide/settings/`.
A basic reference is based on the document ID in the site URL. A public document looks like `guide`, and a private document looks like `private/plan`. Leading and trailing whitespace is removed.

A reference based on the file location starts with `./` or `../`.

```yaml
# research/parts.md → research/README.md
parent: ./readme
```

```yaml
# guide/authoring.md → research/README.md
parent: ../research/readme
```

A relative reference also omits the extension. It is resolved relative to the file location, so a private document can reference a public parent such as `../public/guide`. The parent of a public document must be a public document.
A plain ID is not a URL, so do not use `/settings/`, `settings.md` or `#settings`.
When you move or rename a file, also check the documents that reference it as a parent.

## Ordering and validation

The full `group` path of a parent and its children must be the same. When you use nested groups, specify the same array on both sides.
Children of the same parent are shown starting from the smallest `order`. Documents without `order` are shown after the ordered ones, sorted by title, and by ID if the titles are also the same.
A child's `order` applies only to the list of children of that parent and does not change the position of the parent or of other branches.
A child can also be a parent, so documents can be nested in multiple levels.

A document without `parent` is shown directly under its group as before.
Changing the group or parent keeps the file ID, URL, relative Markdown links and each page outline.

dev and build fail with an error in the following cases.

- A `parent` that is an empty string or not a string
- A reference to a parent that does not exist, or to the home README
- A self reference or a cycle in the parent path
- A mismatch between the full `group` paths of the parent and the child

`content/README.md` is the home page linked from the site name, so it cannot be a parent document.
A README in a subfolder is an ordinary document, so it can be used as a parent if it has complete frontmatter.
