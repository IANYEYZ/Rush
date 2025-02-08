# Rush

Rush is a static site generator

Different from other SSG, Rush use javascript as template plus some support for HTML template

## Get started

First, you need to install dependencies, which is `marked.js`, use `npm install marked` to install it

Then, you need to create directories for rush so rush can work with it, use `node rush.js new` to create a new set of directories (If you fork/clone the repository, the directories are right there with example pages)

To create a page, add a js file in the `/page` directory, it should be a function that takes a data(js object) as input and output a string representing html. After that, add a markdown file in the `/content` directory, it represent the content of the page.

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

In the process of generating, a data object will be feed to the JS template, which includes `title` and `content` by default, and **custom data object** can join in

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

Rush recommends you to use JS as template, but if you really want HTML, Rush support that

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

Note that the d you can use in HTML template is the same as what will be passed into the JS template, so generally both of these should be able to create the same page

## Multiple pages

Because a content or a template can be used multiple times, Rush uses neither of these as indicator of the generated file structure

The only indicator of that is the page name in `config.json`. For example, use `posts/index` to create an index.html inside the posts directory, that's also how the front-end routing works

## Styles, Script and Static assets

To use CSS, JS and static assets like logos, put them in specifc folders:

- CSS go into the `style` folder, and it'll be in `gen/style` after generation

- JS go into the `scripts` folder, and it'll be in `gen/scripts` after generation

- Static assets go into `static` folder, and it'll be in `gen/assets` after generation

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

But it's sometime very tedious to write all of these, so rush provide a simpler way to do it for style and script: style data and script data, to use these, first need to change config.json, here is an example:

```json
{
    "index": {
        "page": "template.js",
        "content": "content.md",
        "data": {"title": "Welcome to Rush"},
        "style": ["style.css"],
        "script": ["script.js"]
    }
}
```

Then, `d.script` and `d.style` can be written in template to automatically load all scripts and styles

## Global

use `global` in config.json to do global configuration, now only `highlight` is supported, see `Code highlight` part for more detail

## Code highlight

use `highlight` to specify the theme of code highlighting, it uses `highlight.js`, so go to their page for more detail, if there's no highlight tag in global and in current page, code highlight for this page will not open

## Component

Because sometimes you don't want to write the same thing again and again, Rush has the component mechanic to prevent that. By putting Rush template (JS as template only) in `/components` you can create a component

Also, a `config` file(no filename extension) is needed, it should contain and only contain a list of components name(a component's name is it's file name without the extension name), which is the **render order**, a component can only use component's that's before it in render order, and a page, of course, can use all of them

Using a component is very simple, in Js write:

```javascript
${d.componentName(d)}
```

and in HTML:

```HTML
{{d.componentName(d)}}
```

The reason for this design is that you can actually pass through another object than d, which gives you more flexibility when using and making components, for example, when using a component for blog article cards, you can do something like this:

```javascript
${d.card({"title": "blog title"})}
```


Sometimes, a rendered page might want to be used in someplace else, which is also supported as page-as-component mechanic

It's the same usage as the originall component, the name of the component is it's path(in config.json, something like `posts/index`), but with / changed to -

## Custom Data Object

A custom data object is what will be merged with the data object, and then get passed to pages, it can and probably will be different for each page

The data object, contains only `title` and `content`, where `title` is set to be the name of the markdown file, and the `content` is set to be the content of the markdown file

There's also component data, which contains either global components or page as component(read the section above for more detail)

script and style is also listed in data object,

After all these, there're two ways to make a custom data object:

1. by adding `data` inside `config.json`, as in `Get Started` section

2. by writing front matter inside markdown file

the loading priority for data object is the following(the one on the left most will be loaded first, then second to left, etc. The later ones overwritten earlier ones):

original data < front matter < config.json data < style < script < page as component < global component

## Plugin

Rush only supports js-as-template, html template as template and markdown as content

To support more template type and content, rush has a plugin system, each plugin should at least implement the following functions/have the following variable:

1. `supportContentType`: an array of strings, each string is a filename extension supported for content in this plugin
2. `parseContent`: a function takes content of string and filename extension of string, returns string represent html
3. `supportTemplateType`: an array of strings, each string is a filename extension supported for template in this plugin
4. `parseTemplate`: a function takes content of string, filename extension of string and a data of object, returns string represent html

It's OK to leave them empty and implement other things, but if you want to do that, make sure leave `supportContentType` and `supportTemplateType` empty

Unfortunately, component can't do anything with plugins


## Notes on example pages

`proto.css` is actually `MVP.css`

`index.md` is the same as `readme.md`
