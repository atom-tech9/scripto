# Lists, notes & math

## 1 · Deeply nested mixed lists

1. Ordered level one with **bold**
   - Unordered level two with `code_token`
     1. Ordered level three
        - [ ] Task at level four with **bold** and `inline_code`
          - [x] Task at level five
            - Plain bullet at level six with a long URL https://example.com/very/deep/path/that/keeps/going/and/going
   - Second level two
2. Back to level one

- [ ] Task containing a table

  | A | B |
  | --- | --- |
  | 1 | 2 |

- [ ] Task containing an image and a nested ordered list
  1. First
  2. Second

## 2 · Loose vs tight in one document

- tight one
- tight two

* loose one

* loose two

## 3 · Definition lists

`instagram_basic`
: Baseline read permission. Required for **every** Instagram Graph call, including the ones that only touch metadata.

Business Verification
: A one-time review of the legal entity. Takes several days to ~2 weeks.
: Can be reused across apps in the same portfolio.

## 4 · Math

Inline math $E = mc^2$ inside a sentence, and a display block:

$$
\frac{\partial L}{\partial \theta} = \sum_{i=1}^{n} \left( \hat{y}_i - y_i \right) x_i + \lambda \lVert \theta \rVert_2^2
$$

A very wide display equation that must not run off the page:

$$
f(x) = a_0 + a_1 x + a_2 x^2 + a_3 x^3 + a_4 x^4 + a_5 x^5 + a_6 x^6 + a_7 x^7 + a_8 x^8 + a_9 x^9 + a_{10} x^{10}
$$

## 5 · Callouts

:::warning{title="One route only"}
Requesting `instagram_business_basic` alongside `instagram_basic` triggers an automatic rejection. See https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login for the full matrix.
:::

:::tip
A callout containing a list:

- [ ] item with `code`
- [x] done item
:::

## 6 · Blockquotes

> A quote with **bold**, `code`, and a [link](https://example.com).
>
> > A nested quote inside it.
>
> - a list inside a quote
> - second item

## 7 · Footnotes

Meta's review now warns ~20 days per submission.[^meta] A second reference.[^two]

[^meta]: Measured across five submissions between June and August 2026. Source: https://developers.facebook.com/docs/app-review
[^two]: A footnote with `inline_code` and **bold**.

## 8 · Horizontal rules and headings

### H3 with `code` in it

#### H4 level

##### H5 level

###### H6 level

---

Trailing paragraph.
