# Rush

Rush is a static site generator

Different from other SSG, Rush use javascript as template, but for some one who likes HTML template, Rush also support it

## Get started

First, the you need to install dependencies, which is `marked.js`, use `npm install marked` to install it

To create a page, add a js file in the `/page` directory, it should be a function that takes a data(js object) as input and output a string represent html. After that, add a md file in the `/content` directory, it represent the content of a page.

Here is a minimal example of how the js file could look like:

```Javascript
d => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${d.title}</title>
</head>
<body>
    ${d.content}
</body>
</html>`
```

After that, suppose your js file is `template.js` and content file(markdown) is `content.md`, and the page should be an index page(the output html is "index.html"), then you should add the following to `config.json`:

```json
{
    "index": {
        "page": "template.js",
        "content": "content.md"
    }
}
```

The given page will have a title as `content`, but probably you want another name, then you should add a **custom data object**:

```json
{
    "index": {
        "page": "template.js",
        "content": "content.md",
        "data": {"title": "Welcome to Rush"}
    }
}
```

## HTML template in Rush

Most of web developers know JS, so Rush takes advantage of that, and let HTML template include JS, here is an example:

```HTML
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{d.title}}</title>
</head>
<body>
    {{d.content}}
</body>
</html>
```

Everything in double curly braces is considered as a JS script, with a **data object** `d` in the environment

But it is still quite JS-ish, so the general recommendation is to use JS-as-template

## Multiple pages

Because a content or a template can be used multiple times, Rush use neither of these as indicator of the generated file structure

The only indicator of that is the page name. For example, use `posts/index` to create an index.html inside the posts directory

## Styles, Script and Static assets

To use CSS, JS and static assets like logos, put them in specifc folders:

- CSS go into the `style` folder, and it'll be in `gen/style` after generation

- JS go into the `scripts` folder, and it'll be in `gen/scripts` after generation

- Static assets go into `static` folder, and it'll be in `ge/assets` after generation

The file structure in these folder will be mimiced during generation

To maximize reuseability of template, the general recommendation is to use `d.toGlobal` to link to these files, for example, here is a example of how you may do that:

```javascript
d => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${d.title}</title>
    <link rel="stylesheet" href="${d.toGlobal}style/proto.css"/>
</head>
<body>
    ${d.content}
</body>
</html>`
```

Script and static assets are the same

If you are sure the template will only be put in specific place, then it's also OK not to use it

## Global

use `global` in config.json to do global configuration,now only `highlight` is supported

## Code highlight

use `highlight` to specify the theme of highlight, if there's no highlight tag in global and in current page, code highlight will not open

## Component

Because sometimes you don't want to write the samething again and again, Rush has the component mechanic to prevent that

There's one way to register a component:

1. By putting Rush template (JS only) in `/components`

Also, a `config` file(no extension) is needed, it should contain and only contain a list of components name(a component's name is it's file name without the extension name), which is the **render order**, a component can only use component's that's before it in render order, and a page, of course, can use all of them

Using a component is very simple, in Js write:

```javascript
${d.component-name}
```

and in HTML:

```HTML
{{d.component-name}}
```