# Rendering torture test

## 1 · Tight task list with inline formatting (the reported bug)

- [ ] Create/confirm a **Meta Business Portfolio** (Meta Business Suite) that will own the app.
- [ ] Make sure the business's **legal name, address, and phone match public records** and your official documents (in KSA: exactly as on your Commercial Registration, Arabic + English).
- [x] Create the app at developers.facebook.com → **App type = Business** (⚠️ this choice is permanent — do not pick Consumer).
- [ ] **Start Business Verification** (App Dashboard → Settings → Basic → Start Verification). **This is the longest fixed wait (several days to ~2 weeks) — start it day one.**

## 2 · Tight task list with inline code (the second reported bug)

- [ ] Choose the **Instagram route = "Instagram API with Facebook Login"** (permissions `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`). ⚠️ Do **not** also request the `instagram_business_*` set — that's a different route and requesting both confuses reviewers.
- [ ] Submit **App Review** for the permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`, `pages_manage_metadata`, `publish_video`, `business_management`.
- [ ] A single enormous unbreakable token: `AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOpQrStUvWxYz0123456789`

## 3 · Loose task list (blank lines between items)

- [ ] Loose item with **bold** and `code` and a [link](https://example.com/some/deep/path).

- [x] Second loose item — should align identically to the tight ones above.

## 4 · Nested task lists

- [ ] Parent task with **bold**
  - [ ] Child task with `inline_code`
    - [x] Grandchild task
  - [ ] Second child
- [x] Sibling parent

## 5 · Mixed list — task items next to plain bullets

- [ ] A task item
- A plain bullet that must keep its disc marker
- [x] Another task item
- Another plain bullet

## 6 · Ordered list containing task items

1. [ ] Ordered task one
2. [x] Ordered task two
3. A plain ordered item

## 7 · Task item with block children

- [ ] Task with a fenced block underneath:

  ```ts
  const x: number = 1
  ```

- [ ] Task followed by a blockquote

  > quoted line inside a task item


## 8 · An image on the third page

![tiny](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) standalone image paragraph

A trailing paragraph after the image.
