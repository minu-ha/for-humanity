---
name: Parts
label: Part purposes and authoring syntax
group: Guide
order: 20
---

Use Note for supplementary explanation and Details for implementation details. Write body text, comparisons, decisions and questions with Markdown text, lists, tables and sections.
The examples below are Note and Details blocks you can copy and use as they are.
For the overall structure of a document, see [Writing](writing.md).

## Overview

| Content       | Format                  | Use                              |
|---------------|-------------------------|----------------------------------|
| Body text and procedures | Paragraphs and lists | Content the reader needs to read first |
| Comparisons and contracts | Tables and code | Options, values, input and output |
| Flows, relationships and hierarchies | [Mermaid](diagrams.md)  | Procedures, request round trips, states, data relationships, folder structure |
| Decisions and questions | Sections, tables, hash links | Identifiers, status, reasons, remaining decisions |
| Supplementary explanation | `:::note[Title]` | Reading scope, constraints, things to check |
| Implementation details | `:::details[Title]` | Rules and contracts to expand when needed |

The basic blocks are Note and Details, and every document uses the same syntax.
You can use them together with [local images and attachments](images.md), footnotes, checklists, tables, code and flowcharts.

::part[Components]

## Note

Note is a supplementary explanation set apart from the body text. A title and a body are required, and there are no separate attributes.
The default presentation is a title and a left border. Write multiple items as a list and cite sources with links.

### Source

```markdown
:::note[Scope]
Check the following before you build the public documents.

- Check that the links on the home page and in the documents are correct.
- You can write additional explanation in [Details](#details).
:::
```

### Result

:::note[Scope]
Check the following before you build the public documents.

- Check that the links on the home page and in the documents are correct.
- You can write additional explanation in [Details](#details).
:::

## Details

The title of Details is always visible, and the body is collapsed by default. A title and a body are required.
The title starts with `+` while the body is collapsed and with `−` while it is open.
Add `{open}` to expand it from the start. `open=true` and `open=false` are not allowed.
`open=""`, which attaches a value, and a duplicate `open` are also errors. `{open}` is a single attribute without a value.

### Source

```markdown
:::details[Implementation]
### Supported files

| Field          | Use                |
|----------------|--------------------|
| `.md`         | Markdown document  |
| `.mdx`        | Handled as Markdown |
:::
```

### Result

:::details[Implementation]
### Supported files

| Field          | Use                |
|----------------|--------------------|
| `.md`         | Markdown document  |
| `.mdx`        | Handled as Markdown |
:::

### Default open

```markdown
:::details[Review criteria]{open}
Confirm the scope of the implementation after you check the inputs, errors and open issues.
:::
```

:::details[Review criteria]{open}
Confirm the scope of the implementation after you check the inputs, errors and open issues.
:::

### In a row

Details written one after another share one divider and read as a list.

```markdown
:::details[Inputs]
The files and settings the build reads.
:::

:::details[Outputs]
The pages and assets the build writes.
:::
```

:::details[Inputs]
The files and settings the build reads.
:::

:::details[Outputs]
The pages and assets the build writes.
:::

::part[Contract]

## Nesting

The body can contain paragraphs, lists, tables, code, Mermaid and headings of `###` and below.
Note and Details can be nested. Write `##` sections and `::part` outside a part.
Place the divisions of a document outside parts, and place elaboration and implementation details inside the relevant section.

The outer fence must have more `:` characters than the inner fence. The same rule applies when the code contains `:::`.

````markdown
::::details[Implementation details]
:::note[Things to check]
If you changed the configuration file, restart the dev server.
:::

```text
pnpm exec for-humanity --version
```
::::
````

::::details[Implementation details]
:::note[Things to check]
If you changed the configuration file, restart the dev server.
:::

```text
pnpm exec for-humanity --version
```
::::

## Titles and links

A title must be non-empty plain text. A title cannot contain links, emphasis or inline code.
A title that contains a colon, such as `예:이것`, is displayed exactly as written.
The body is ordinary Markdown. A `###` inside a part is also an outline entry and a hash target.

Navigating to [Supported files](#supported-files) expands the corresponding Details.
If there are several parent Details, they all expand together. Selecting the same link again also expands a collapsed target.
Collapsed headings are excluded when the section and subsection currently being read are determined.

You can expand Details from its title with Enter or Space.
You can read and expand the title and body even without JavaScript.

## Errors

Unsupported input is a build error. Invalid input is not replaced with another part.

| Input                           | Reason                         | Fix                            |
|---------------------------------|--------------------------------|--------------------------------|
| `::note[Scope]`                  | Form without a body            | `:::note[...]` block            |
| `:details[Implementation]`       | Inline form                    | `:::details[...]` block         |
| Omitted or empty title          | No name for the reading scope and behavior | Write `[Title]`  |
| Link, emphasis or code in a title | Plain text title contract    | Write formatting in the body   |
| Omitted body, or a body with only reference definitions, comments, empty code or an empty list | Nothing to read | Write body content such as paragraphs, images or tables |
| Note attribute or unsupported Details attribute | Value not in the public input | Remove the attribute |
| `open=false`, `open=true`, `open=""`, duplicate `open` | Contract of a single attribute without a value | Omit it or use `{open}` |
| Omitted or too short closing fence | End of the part is unclear | Close with a fence at least as long as the opening fence |
| `#`, `##`, `::part` or raw HTML `<h1>`, `<h2>` inside a part | Mixes document divisions with part content | Write headings and `::part` outside the part |
| `::part`, `::part[]`, `::part[ ]` | No group name to show in the body and outline | Write `::part[Title]` |
| `::part[**Title**]`, `::part[Title]{...}` | Plain text title contract and an attribute not in the public input | Write `::part[Title]` without formatting or attributes |
| `:::part[Title]` block          | Single-line directive contract | Write `::part[Title]` on one line |
| A `::part` followed by the next `::part` or the end of the document with no `##` section | No section to group in the outline | Write a `##` section after `::part` |

An unregistered block name is an authoring error. Text in an ordinary sentence that is mistaken for an unregistered inline directive is kept as written.
For the scope of raw HTML, see [Writing](writing.md#content-features).
