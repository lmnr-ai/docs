# Laminar Documentation

Welcome to the Laminar documentation!

### Development

This repo uses [Mintlify](https://www.mintlify.com/) to build the documentation.

To get started, install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command

```
npm i -g mintlify
```

Run the following command at the root of your documentation (where mint.json is)

```
mintlify dev
```

Before committing, make sure to run `mintlify dev` to check that the changes are rendered correctly.
Also run

```
mintlify broken-links
```

to verify that there are no broken links. This only works for full page links, not anchors, but it's better than nothing.
