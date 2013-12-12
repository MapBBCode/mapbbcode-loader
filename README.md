# MapBBCode Loader

This small script (under 5KB) includes MapBBCode libraries and additional files, replaces all [map] bbcode and external maps code with maps, and adds `onclick` listener to specially marked buttons, which open map editor. If there are no map codes on a page, it does nothing. Basically it is the universal MapBBCode plugin, which can be employed even when you have no source to your forum or blog engine.

## Getting started

The smallest page to include maps is this (replace map bbcode as needed):

```html
<!DOCTYPE html>
<meta charset="utf-8" />
<script src="MapBBCodeLoader.min.js"></script>
<div class="mapbbcode">[map]59.95,30.4(marker!)[/map]</div>
```

Loader sees there is a `<div>` with `mapbbcode` class, considers itself needed, loads Leaflet and MapBBCode libraries from `mapbbcode/` directory, initializes `MapBBCode` object with default properties and invokes `show()` method to convert `<div>` into a map.

For a shared map you should use `mapbbcode_shared` class:

```html
<div class="mapbbcode_shared">gttvz</div>
```

Now, in your blog you may have no means for enclosing bbcode with `<div>` tags, or you might want to configure MapBBCode options. For that you will need to set loader options:

```html
<script>
window.MapBBCodeLoaderOptions.set({
	path: '/lib/mapbbcode/',
	plain: true,
	mapBBCodeOptions: {
		fullFromStart: true,
		fullViewHeight: 300
	}
});
</script>
```

With this configuration script, Leaflet and MapBBCode libraries will be loaded from the explicitly specified path, all bbcode will be converted to maps regardless of `<div>` tags, and those maps will have 100% width and 300px height. It is pretty obvious. Which other options are there?

| Option | Type | Default | Description
|---|---|---|---
| path | String | `'mapbbcode/'` | Path to Leaflet and MapBBCode libraries.
| plain | Boolean | `false` | Whether to convert plain-text bbcode, or just code enclosed in `<div>` tags with relevant classes.
| language | String | `''` | MapBBCode language. Should be equal to i18n file name without '.js'.
| proprietary | String[] | `[]` | List of proprietary layer files (without paths and '.js').
| addons | String[] | `[]` | List of additional scripts to include (with '.js' extensions).
| mapBBCodeOptions | Object | `{}` | Options for MapBBCode object constructor.
| processorOptions | Object | `{}` | Options for MapBBCodeProcessor object constructor.

To set some of those options, use `set()` method with an object as a sole parameter.

Now let's make a MapBBCode editor:

```html
<input type="button" class="mapbbcode_edit" value="Edit map" target_id="text"/>
<textarea id="text"></textarea>
```

When a cursor in a textarea is placed inside a [map] bbcode string, the button opens an editing window for that code, empty otherwise. When "Apply" button is clicked in that window, updated code is inserted at the cursor's location. As you can see, the button and the textarea are linked with `target_id` attribute.

You can update one or all of maps when the content of divs is updated, using `window.updateMapBBCode()` function. Do not try to call it while a page is loading: it is initialized after all bbcodes are turned into maps.

See an extended example of using the loader in [example.html](example.html) (run `make download` to get a copy of MapBBCode library for it).

## Embedding in a forum or blog

If you can program and have an ability to make a plugin, [you should do that](http://mapbbcode.org/embedding.html), instead of going the simple path with this loader. That way you would help many similar websites owners with enabling maps on their sites.

Otherwise you have come to the right place. In the documentation on embedding there are 11 steps. With this library, a couple of simple template modifications and two custom bbcodes you can implement 7 of them (8 if you can find a current language string). Not bad, considering some unfinished plugins implement only 3-4.

### Processing BBCode

All you need is to enclose `[map]...[/map]` (note that there may be arguments: `[map=8,60.1,30.5]`) and `[mapid]abcde[/mapid]` in `<div class="mapbbcode">` and `<div class="mapbbcode_shared">`. Advanced engines have custom BBCode administration panel, or just a file like `bbcode.php` with a lot of regular expressions in it. Add following regular expression replacements:

    \[map(=[0-9,.]+)?\](.+?)\[/map\]  -->  <div class="mapbbcode" map="$1">$2</div>
    \[mapid\]([a-z]+)\[/mapid\]       -->  <div class="mapbbcode_shared">$1</div>

You may need to use `\/` instead of `/`.

If bbcode is not used in your forum or blog engine, check if your HTML tags are preserved. You will have to write `<div class="mapbbcode">[map]...[/map]</div>` by hand. Sorry. Though map editor will still work on the enclosed code.

If everything else fails, you will have to set `plain` option to `true`. This is very bad. When you have no control on which bbcode can be processed, maps might (and probably will) appear in unexpected places around your website.

### Including MapBBCodeLoader

This is simple. Find a header template (usually with `head` in a file name, or that includes `<head>` tag; there might be more than one) and right before `</head>` closing tag add those lines:

```html
<script src="/js/mapbbcode/MapBBCodeLoader.min.js"></script>
<script>
window.MapBBCodeLoaderOptions.set({
	path: '/js/mapbbcode/',
	mapBBCodeOptions: {
		layers: 'OpenMapSurfer,OpenStreetMap',
		uploadButton: true
	}
});
</script>
```

You will have to find a place in the document root to unzip MapBBCode archive from [the official website](http://mapbbcode.org) (only versions 1.2+ will do) and put `MapBBCodeLoader.min.js` in that `mappbcode` directory. Then you should put the path into `path` option above.

After that you can add some test [map] bbcode on your website and customize MapBBCode options, probably adding some layers.

### Configuring language

If your website is single-language, just add the `language` option with its name (English is default, so you don't have to write that one). Otherwise you would need to get a language name for a currently logged in user. Check templates for special variables, something-language-something, or just add a new one, if you can. The option can receive virtually anything: only first two letters should be informative. For example, `'en'` for English and `'ru'` for Russian. It won't be a problem if there is no translation for some languages: maps will appear in English for those.

### Adding a map edit button

Find a posting page. It must contain a lot of BBCode buttons: you know, `[i]`, `[u]`, `[url]` and so on. Copy and paste `[img]` one (or another like that) and rename to `[map]`. Add `class="mapbbcode_edit"` to the `<input>` tag (or `<button>`, though the probability of encountering that tag is low). Then find `<textarea>` tag and remember its `id` attribute (add one if it isn't there). Put it into `target_id` attribute of the new button. Now open your website and test that the button works. Test a preview page and that it is correctly displayed after posting.

### Showing off

That's all, your website is now MapBBCode-enabled. Write a long and cheerful post somewhere about that. Draw some maps. And maybe contact Ilya Zverev to share some of your joy and to add your website to [this list of fame](http://mapbbcode.org/forums.html).

## Author and license

The loader was written by Ilya Zverev and published under WTFPL license.
