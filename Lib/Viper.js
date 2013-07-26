/**
 * +--------------------------------------------------------------------+
 * | This Squiz Viper file is Copyright (c) Squiz Australia Pty Ltd     |
 * | ABN 53 131 581 247                                                 |
 * +--------------------------------------------------------------------+
 * | IMPORTANT: Your use of this Software is subject to the terms of    |
 * | the Licence provided in the file licence.txt. If you cannot find   |
 * | this file please contact Squiz (www.squiz.com.au) so we may        |
 * | provide you a copy.                                                |
 * +--------------------------------------------------------------------+
 *
 */

function Viper(id, options, callback, editables)
{
    this.id           = id;
    this._document    = document;
    this._browserType = null;
    this._specialKeys = [];
    this._prevRange   = null;
    this.enabled      = false;
    this.inlineMode   = false;

    this.ViperHistoryManager = null;
    this.ViperPluginManager  = null;
    this.ViperTools          = null;

    this._settings = {
        changeTracking: false
    };

    this._viperElementHolder = null;
    this._subElementActive   = false;
    this._mainElem           = null;
    this._registeredElements = [];

    // This var is used to store the range of Viper before it loses focus. Any plugins
    // that steal focus from Viper element can use getPreviousRange.
    this._viperRange = null;

    // Callback methods which are added by external objects.
    this.callbacks = {};

    if (!options) {
        options = {};
    }

    this.setSetting('emptyTableCellContent', '<br />');

    this.init();

    if (editables && editables.length > 0) {
        this.registerEditableElements(editables);
        for (var i = 0; i < editables.length; i++) {
            (function(editableElement) {
                dfx.addEvent(editableElement, 'mousedown', function(e) {
                    self.setEditableElement(editableElement);
                });
            }) (editables[i]);
        }
    }

    if (options) {
        var self = this;
        this._processOptions(options, function() {
            if (callback) {
                callback.call(self, self);
            }
        });
    }

}

Viper.document = document;
Viper.window   = window;

Viper.prototype = {

    getId: function()
    {
        return this.id;
    },

    _processOptions: function(options, callback)
    {
        var self = this;
        for (var op in options) {
            var fn = 'set' + dfx.ucFirst(op);
            if (fn === 'setSetting') {
                delete options[op];
                // Reserved.
                continue;
            }

            if (dfx.isFn(this[fn]) === true) {
                this[fn](options[op], function() {
                    delete options[op];
                    self._processOptions(options, callback);
                });
                return;
            }

            fn = '_' + fn;
            if (dfx.isFn(this[fn]) === true) {
                this[fn](options[op], function() {
                    delete options[op];
                    self._processOptions(options, callback);
                });
                return;
            } else {
                this.setSetting(op, options[op]);
                delete options[op];
                self._processOptions(options, callback);
                return;
            }
        }//end for

        callback.call(this);

    },

    getPluginManager: function()
    {
        return this.ViperPluginManager;

    },

    getHistoryManager: function()
    {
        return this.ViperHistoryManager;

    },

    setSetting: function(setting, value)
    {
        this._settings[setting] = value;

        var fn = 'set' + dfx.ucFirst(setting);
        if (dfx.isFn(this[fn]) === true) {
            this[fn].call(this, value);
        }

    },

    /**
     * Sets the given settings.
     *
     * @param {object}  settings Setting name and value list.
     * @param {boolean} clean    If true then the original settings will be wiped out.
     *
     * @return void
     */
    setSettings: function(settings, clean)
    {
        if (clean === true) {
            this._settings = {};
        }

        for (var setting in settings) {
            this.setSetting(setting, settings[setting]);
        }

    },

    getSetting: function(setting)
    {
        return this._settings[setting];

    },

    getSettings: function()
    {
        return dfx.clone(this._settings);

    },

    getDefaultBlockTag: function()
    {
        var defaultBlockTag = this.getSetting('defaultBlockTag');
        if (dfx.isset(defaultBlockTag) === true) {
            return defaultBlockTag;
        }

        return 'p';

    },

    _setLanguage: function(lang, callback)
    {
        if (!lang) {
            return;
        }

        var code = null;
        var src  = null;
        if (typeof(lang) === 'object') {
            code = lang.code;
            src  = lang.src;
        } else {
            code = lang;
            src  = this.getViperPath().replace(/\/build$/, '') + '/build/Translation/' + code + '.js';
        }

        if (code === 'en') {
            callback.call(this);
            return;
        }

        if (ViperTranslation.isLoaded(code) === false && src) {
            this.loadScript(src, function() {
                ViperTranslation.setLanguage(code);
                callback.call(this);
            }, 2000);
        } else {
            ViperTranslation.setLanguage(code);
            callback.call(this);
        }

    },

    /**
     * Initialise Viper.
     *
     * @return {void}
     */
    init: function()
    {
        this.ViperTools          = new ViperTools(this);
        this.ViperHistoryManager = new ViperHistoryManager(this);
        this.ViperPluginManager  = new ViperPluginManager(this);

        ViperChangeTracker.init(this, false);
        this._setupCoreTrackChangeActions();
        ViperChangeTracker.addChangeType('textRemoved', 'Deleted', 'remove');
        ViperChangeTracker.addChangeType('textAdded', 'Inserted', 'insert');
        ViperChangeTracker.addChangeType('merged', 'Merged', 'remove');
        ViperSelection._viper = this;

    },

    destroy: function()
    {
        this.fireCallbacks('Viper:destroy');
        this.setEnabled(false);
        dfx.removeEvent(dfx.getDocuments(), '.' + this.getEventNamespace());

        if (this._viperElementHolder) {
            dfx.remove(this._viperElementHolder);
        }

    },

    /**
     * Adds a Viper related element to Viper elements holder.
     *
     * Plugins should use this method to add their elements to DOM.
     */
    addElement: function(element)
    {
        if (!element) {
            return;
        }

        if (!this._viperElementHolder) {
            this._viperElementHolder = this._createElementHolder();
        }

        this._viperElementHolder.appendChild(element);

    },

    _createElementHolder: function()
    {
        var holder = document.createElement('div');
        Viper.document.body.appendChild(holder);

        // Add browser type.
        var browser = this.getBrowserType();
        var version = this.getBrowserVersion();

        if (browser && version) {
            dfx.addClass(holder, 'Viper-browser-' + browser);
            dfx.addClass(holder, 'Viper-browserVer-' + browser + version);
        }

        return holder;

    },

    getElementHolder: function()
    {
        if (!this._viperElementHolder) {
            this._viperElementHolder = this._createElementHolder();
        }

        return this._viperElementHolder;

    },

    /**
     * Set Viper mode.
     *
     * If Viper is using "inline" mode then some of the actions will be disabled
     *
     * @param {string} mode The Viper mode (inline or block).
     *
     * @return {void}
     */
    setMode: function(mode)
    {
        if (mode === 'inline') {
            this.inlineMode = true;
        } else {
            this.inlineMode = false;
        }

    },

    /**
     * Returns the current browser type.
     *
     * @return {string}
     */
    getBrowserType: function()
    {
        if (this._browserType === null) {
            var tests = ['msie', 'firefox', 'chrome', 'safari'];
            var tln   = tests.length;
            for (var i = 0; i < tln; i++) {
                var r = new RegExp(tests[i], 'i');
                if (r.test(navigator.userAgent) === true) {
                    this._browserType = tests[i];
                    return this._browserType;
                }
            }

            this._browserType = 'other';
        }

        return this._browserType;

    },

    /**
     * Returns the version of the current browser.
     *
     * @return {integer}
     */
    getBrowserVersion: function()
    {
        var browsers = ['MSIE', 'Chrome', 'Safari', 'Firefox'];
        var c        = browsers.length;
        var uAgent   = navigator.userAgent;

        var browserName = null;
        for (var i = 0; i < c; i++) {
            var nameIndex = uAgent.indexOf(browsers[i]);
            if (nameIndex >= 0) {
                browserName = browsers[i];
                break;
            }
        }

        if (!browserName) {
            return null;
        }

        if (browserName === 'Safari') {
            browserName = 'Version';
        }

        var re = null;
        if (browserName === 'MSIE') {
            re = new RegExp('MSIE (\\d+)');
        } else {
            re = new RegExp(browserName + '/(\\d+)');
        }

        var matches = re.exec(uAgent);
        if (!matches) {
            return null;
        }

        return parseInt(matches[1]);

    },

    /**
     * Checks if specified browser type is the current browser.
     *
     * @param {string} browser The browser type to test.
     *
     * @return {boolean}
     */
    isBrowser: function(browser)
    {
        return (this.getBrowserType() === browser);

    },

    /**
     * Returns the path to the Viper JS file directory.
     *
     * Plugins can use this to load extra JS files.
     *
     * @return {string} Path to JS file directory.
     */
    getViperPath: function()
    {
        // TODO: This path may need to be set incase a different file name is used.
        var scripts = document.getElementsByTagName('script');
        var path    = null;
        var c       = scripts.length;
        for (var i = 0; i < c; i++) {
            if (scripts[i].src) {
                if (scripts[i].src.match(/\/Lib\/Viper\.js/)) {
                    // library, so we can extract the path and include the rest.
                    path = scripts[i].src.replace(/\/Lib\/Viper\.js/,'');
                    break;
                } else if (scripts[i].src.match(/\/viper-combined\.js/)) {
                    // library, so we can extract the path and include the rest.
                    path = scripts[i].src.replace(/\/viper-combined\.js/,'');
                    break;
                } else if (scripts[i].src.match(/\/viper\.js/)) {
                    path = scripts[i].src.replace(/\/viper\.js/,'');
                    break;
                }
            }
        }

        return path;

    },

    loadScript: function(src, callback, timeout) {
        var t = null;
        if (timeout) {
            t = setTimeout(callback, timeout);
        }

        var script    = document.createElement('script');
        script.onload = function() {
            clearTimeout(t);
            script.onload = null;
            script.onreadystatechange = null;
            callback.call(this);
        };

        script.onreadystatechange = function() {
            if (/^(complete|loaded)$/.test(this.readyState) === true) {
                clearTimeout(t);
                script.onreadystatechange = null;
                script.onload();
            }
        }

        script.src = src;

        if (document.head) {
            document.head.appendChild(script);
        } else {
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    },

    getEventNamespace: function()
    {
        return 'viper-' + this.id;

    },

    /**
     * Adds the events required for mouse navigating and key navigating/typing.
     *
     * @return {void}
     */
    _addEvents: function(elem)
    {
        if (!elem) {
            elem = this.element;
        }

        this._document = elem.ownerDocument;
        Viper.document = this._document;
        if (this._document.defaultView) {
            Viper.window = this._document.defaultView;
        } else {
            Viper.window = window;
        }

        var namespace = this.getEventNamespace();

        dfx.removeEvent(dfx.getDocuments(), '.' + namespace);
        this._removeEvents(elem);
        var self = this;

        if (this.isBrowser('msie') === true) {
            dfx.addEvent(elem, 'mouseup.' + namespace, function(e) {
                return self.mouseUp(e);
            });
        } else {
            dfx.addEvent(dfx.getDocuments(), 'mouseup.' + namespace, function(e) {
                return self.mouseUp(e);
            });
        }

        dfx.addEvent(dfx.getDocuments(), 'mousedown.' + namespace, function(e) {
            return self.mouseDown(e);
        });

        // Add key events. Note that there is a known issue with IME keyboard events
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=354358. This effects
        // change tracking while using Korean, Chinese etc.
        dfx.addEvent(elem, 'keypress.' + namespace, function(e) {
            return self.keyPress(e);
        });

        dfx.addEvent(elem, 'keydown.' + namespace, function(e) {
            return self.keyDown(e);
        });

        dfx.addEvent(elem, 'keyup.' + namespace, function(e) {
            return self.keyUp(e);
        });

        dfx.addEvent(elem, 'blur.' + namespace, function(e) {
            if (!self._viperRange) {
                self._viperRange = self._currentRange;
            }
        });

        dfx.addEvent(elem, 'focus.' + namespace, function(e) {
            if (self.fireCallbacks('Viper:viperElementFocused') === false) {
                return;
            }

            self.highlightToSelection();
        });

        if (navigator.userAgent.match(/iPad/i) != null) {
            // On the iPad we need to detect selection changes every few ms.
            setInterval(function() {
                self.fireSelectionChanged();
            }, 500);

            // Add scaling.
            dfx.addEvent(window, 'gestureend', function() {
                var elements = dfx.getClass('Viper-scalable');
                var c        = elements.length;
                for (var i = 0; i < c; i++) {
                    var scale = ViperTools.scaleElement(elements[i]);
                    self.fireCallbacks('Viper:elementScaled', {
                        element: elements[i],
                        scale: scale
                    });
                }
            });
        }

    },

    /**
     * Removes the events required for mouse navigating and key navigating/typing.
     *
     * @return void
     */
    _removeEvents: function(elem)
    {
        if (!elem) {
            elem = this.element;
        }

        dfx.removeEvent(elem, '.' + this.getEventNamespace());

    },

    /**
     * Enables or disables Viper.
     *
     * @param boolean enabled If true viper will be enabled, otherwise it will be
     *                        disabled.
     */
     setEnabled: function(enabled)
     {
        if (enabled === true && this.enabled === false) {
            this._addEvents();
            this.enabled = true;
            this.fireCallbacks('Viper:enabled');
            this.element.setAttribute('contentEditable', true);
            dfx.setStyle(this.element, 'outline', 'none');

            var range = this.getCurrentRange();
            var editableChild = range._getFirstSelectableChild(this.element);
            if (!editableChild) {
                // Check if any of these elements exist in the content.
                var tags = 'iframe,img,object';
                if (dfx.getTag(tags, this.element).length === 0) {
                    var blockElement = null;
                    for (var node = this.element.firstChild; node; node = node.nextSibling) {
                        if (dfx.isBlockElement(node) === true
                            && dfx.isStubElement(node) === false
                        ) {
                            blockElement = node;
                            break;
                        }
                    }

                    if (blockElement) {
                        if (this.isBrowser('msie') !== true) {
                            dfx.setHtml(blockElement, '<br />');
                        } else {
                            blockElement.appendChild(document.createTextNode(' '));
                        }

                        editableChild = range._getFirstSelectableChild(this.element);
                    } else {
                        var tagName = this.getDefaultBlockTag();
                        if (!tagName) {
                            dfx.setHtml(this.element, '');
                        } else {
                            blockElement = document.createElement(tagName);
                            dfx.setHtml(blockElement, '&nbsp;');
                            this.element.appendChild(blockElement);
                            editableChild = range._getFirstSelectableChild(this.element);
                        }
                    }//end if
                }//end if
            }//end if

            if (editableChild) {
                //this.setRange(editableChild, 0);
            }
        } else if (enabled === false && this.enabled === true) {
            // Back to final mode.
            ViperChangeTracker.activateFinalMode();
            this.cleanDOM(this.element);

            if (dfx.trim(dfx.getNodeTextContent(this.element)) === '') {
                if (this.isBrowser('msie') === true && dfx.getTag('*', this.element).length === 0) {
                    // This check is to prevent iframe elements stuffing up the whole browser screen in IE8 when
                    // they are the only content on the page. Makes no sense but when
                    // did IE ever make sense?
                    this.initEditableElement();
                }
            }

            this.element.setAttribute('contentEditable', false);
            dfx.setStyle(this.element, 'outline', 'invert');
            this._removeEvents();
            this.enabled = false;
            this.fireCallbacks('Viper:disabled');
            ViperChangeTracker.disableChangeTracking();
            ViperChangeTracker.cleanUp();
        }//end if

    },

    enable: function()
    {
        this.setEnabled(true);

    },

    disable: function()
    {
        this.setEnabled(false);

    },

    /**
     * Returns true if Viper is enabled false otherwise.
     *
     * @return {boolean}
     */
    isEnabled: function()
    {
        return this.enabled;

    },

    /**
     * Sets the element that should be editable. The current element that is
     * editable will become non-editable.
     *
     * If you wish to have two elements that are editable simutaneously, then
     * construct to viper instances.
     *
     * @param DomElement elem The element to become editable.
     *
     * @return void
     */
    setEditableElement: function(elem)
    {
        var self = this;

        if (this.element === elem) {
            return;
        }

        // Load default plugin set if nothing has been set yet.
        if (this.ViperPluginManager.getPlugins() === null) {
            this._useDefaultPlugins();
        }

        this._viperRange = null;

        if (this.element) {
            this.element.setAttribute('contentEditable', false);
            dfx.setStyle(this.element, 'outline', 'invert');
        }

        // Turn off tracking.
        ViperChangeTracker.cleanUp();
        this.setSubElementState(null, false);
        ViperChangeTracker.init(this, false);

        this.setEnabled(false);
        this.element = elem;

        if (this._registeredElements.inArray(elem) === false) {
            this.registerEditableElement(elem);
        }

        this.setEnabled(true);
        this.ViperHistoryManager.setActiveElement(elem);
        this.inlineMode = false;
        elem.setAttribute('contentEditable', true);
        dfx.setStyle(elem, 'outline', 'none');

        if (this.getSetting('changeTracking') === true) {
            ViperChangeTracker.enableChangeTracking();
        }

        this.fireCallbacks('Viper:editableElementChanged', {element: elem});

        // Create a text field that is off screen that will handle tabbing in to Viper.
        var tabTextfield  = document.createElement('input');
        tabTextfield.type = 'text';
        dfx.setStyle(tabTextfield, 'left', '-9999px');
        dfx.setStyle(tabTextfield, 'top', '-9999px');
        dfx.setStyle(tabTextfield, 'position', 'absolute');
        dfx.insertBefore(this.element, tabTextfield);
        dfx.addEvent(tabTextfield, 'focus', function(e) {
            tabTextfield.blur();
            self.setEnabled(true);

            self.element.focus();

            self.fireCallbacks('Viper:clickedInside', e);
            self.initEditableElement();

            var range = self.getCurrentRange();

            var selectable = range._getFirstSelectableChild(self.element);
            if (!selectable) {
                var brTags = dfx.getTag('br', self.element);
                if (brTags.length > 0) {
                    range.selectNode(brTags[0]);
                }
            }

            if (selectable) {
                range.setEnd(selectable, 0);
                range.setStart(selectable, 0);
            }

            range.collapse(true);
            ViperSelection.addRange(range);
            self.fireSelectionChanged(range, true);
        });

    },

    registerEditableElements: function(elements)
    {
        for (var i = 0; i < elements.length; i++) {
            this.registerEditableElement(elements[i]);
        }

    },

    registerEditableElement: function(element)
    {
        this.initEditableElement(element);
        this._registeredElements.push(element);

    },

    initEditableElement: function(elem)
    {
        var elem = elem || this.element;
        if (!elem) {
            return;
        }

        if (this.isBrowser('msie') === true) {
            // Find iframe elements for youtube.com videos to add wmode=opaque to query
            // string so that the video does not sit on top of the editor window in IE.
            var iframeTags = dfx.getTag('iframe', elem);
            for (var i = 0; i < iframeTags.length; i++) {
                var src = iframeTags[i].getAttribute('src');
                if (src && src.match('youtube') && !src.match('wmode=opaque')) {
                    src = dfx.addToQueryString(src, {wmode: 'opaque'});
                    iframeTags[i].src = src;
                }
            }

            // Add wmode=transparent to old object code.
            var embedTags = dfx.getTag('embed', elem);
            for (var i = 0; i < embedTags.length; i++) {
                if (dfx.isTag(embedTags[i].parentNode, 'object') === true) {
                    var paramTag = document.createElement('param');
                    paramTag.setAttribute('name', 'wmode');
                    paramTag.setAttribute('value', 'transparent');
                    dfx.insertBefore(embedTags[i], paramTag);
                    embedTags[i].setAttribute('wmode', 'transparent');
                }
            }
        }//end if

        var tmp     = Viper.document.createElement('div');
        var content = this.getContents(elem);
        dfx.setHtml(tmp, content);

        if ((dfx.trim(dfx.getNodeTextContent(tmp)).length === 0 || dfx.getHtml(tmp) === '&nbsp;')
            && dfx.getTag('*', tmp).length === 0
        ) {
            // Check for stub elements.
            var tags         = dfx.getTag('*', tmp);
            var hasStubElems = false;
            dfx.foreach(tags, function(i) {
                if (dfx.isStubElement(tags[i]) === true) {
                    hasStubElems = true;
                    return false;
                }
            });

            if (hasStubElems !== true) {
                // Insert initial P tags.
                var range    = this.getCurrentRange();
                var blockTag = this.getDefaultBlockTag();
                if (!blockTag) {
                    dfx.setHtml(elem, '');
                } else {
                    dfx.setHtml(elem, '<' + blockTag +'>&nbsp;</' + blockTag  + '>');
                }

                try {
                    range.setEnd(elem.firstChild, 0);
                    range.collapse(false);
                    ViperSelection.addRange(range);
                } catch (e) {}
            }
        } else {
            var cleanedContent = this.cleanHTML(content);
            if (cleanedContent !== content) {
                dfx.setHtml(elem, cleanedContent);
            }

            var defaultTagName = this.getDefaultBlockTag();
            if (defaultTagName) {
                var nodesToRemove = [];
                for (var i = 0; i < elem.childNodes.length; i++) {
                    var child = elem.childNodes[i];
                    if ((dfx.isBlockElement(child) === true && dfx.isStubElement(child) === false)
                        || (child.nodeType !== dfx.ELEMENT_NODE && child.nodeType !== dfx.TEXT_NODE)
                        || dfx.isTag(child, 'hr') === true
                        || dfx.isTag(child, 'iframe') === true
                        || dfx.isTag(child, 'object') === true
                    ) {
                        continue;
                    } else if (child.nodeType === dfx.TEXT_NODE && dfx.trim(child.data) === '') {
                        nodesToRemove.push(child);
                        continue;
                    }

                    var p = null;
                    if (child.previousSibling && dfx.isTag(child.previousSibling, defaultTagName) === true) {
                        p = child.previousSibling;
                    } else {
                        p = document.createElement(defaultTagName);
                        dfx.insertBefore(child, p);
                    }

                    if (child.nodeType === dfx.TEXT_NODE) {
                        child.data = dfx.trim(child.data);
                    }

                    p.appendChild(child);

                }

                dfx.remove(nodesToRemove);
            }//end if
        }//end if

    },

    getEditableElement: function()
    {
        return this.element;

    },

    resetPlugins: function()
    {
        this._useDefaultPlugins();

    },

    _useDefaultPlugins: function()
    {
        // Default plugins (all Viper plugins).
        this.ViperPluginManager.setPlugins(['ViperCoreStylesPlugin', 'ViperKeyboardEditorPlugin', 'ViperInlineToolbarPlugin', 'ViperHistoryPlugin', 'ViperListPlugin', 'ViperFormatPlugin', 'ViperToolbarPlugin', 'ViperTableEditorPlugin', 'ViperCopyPastePlugin', 'ViperImagePlugin', 'ViperLinkPlugin', 'ViperAccessibilityPlugin', 'ViperSourceViewPlugin', 'ViperSearchReplacePlugin', 'ViperLangToolsPlugin', 'ViperCharMapPlugin', 'ViperTrackChangesPlugin']);

        // Default button ordering.
        var buttons = [['bold', 'italic', 'subscript', 'superscript', 'strikethrough', 'class'], 'removeFormat', ['justify', 'formats', 'headings'], ['undo', 'redo'], ['unorderedList', 'orderedList', 'indentList', 'outdentList'], 'insertTable', 'image', 'hr', ['insertLink', 'removeLink', 'anchor'], 'insertCharacter', 'searchReplace', 'langTools', 'accessibility', 'sourceEditor'];
        this.getPluginManager().setPluginSettings('ViperToolbarPlugin', {buttons: buttons});

        var inlineToolbarButtons = [['bold', 'italic', 'class'], ['justify', 'formats', 'headings'], ['unorderedList', 'orderedList', 'indentList', 'outdentList'], ['insertLink', 'removeLink', 'anchor'], ['image', 'imageMove']];
        this.getPluginManager().setPluginSettings('ViperInlineToolbarPlugin', {buttons: inlineToolbarButtons});

        // Accessibility Plugin, standard.
        this.getPluginManager().setPluginSettings('ViperAccessibilityPlugin', {standard: 'WCAG2AA'});

        this.setSetting('defaultBlockTag', this.getDefaultBlockTag());

    },

    setSubElementState: function(elem, active)
    {
        if (active === true) {
            if (this._subElementActive === true && this.element !== elem) {
                this.setSubElementState(this.element, false);
            }

            if (this._subElementActive !== true) {
                this._mainElem = this.element;
                this.element = elem;
                this._subElementActive = true;
                this.element.setAttribute('contentEditable', true);
                dfx.setStyle(this.element, 'outline', 'none');
                this._addEvents();
                this.fireCallbacks('subElementEnabled', elem);
            }
        } else if (this.element && this._subElementActive === true) {
            this.element.setAttribute('contentEditable', false);
            dfx.setStyle(this.element, 'outline', 'invert');
            this._removeEvents();
            var pelem              = this.element;
            this.element           = this._mainElem;
            this._subElementActive = false;
            this._mainElem         = null;
            this.fireCallbacks('subElementDisabled', pelem);
        }//end if

    },

    getViperElement: function()
    {
        if (this._subElementActive === true) {
            return this._mainElem;
        }

        return this.element;

    },

    getViperElementDocument: function()
    {
        return this.element.ownerDocument;

    },

    getViperSubElement: function()
    {
        if (this._subElementActive === true) {
            return this.element;
        }

        return null;

    },

    getViperActiveElement: function()
    {
        return this.element;

    },

    /**
     * Returns the current range.
     *
     * Note that this range may be out side of Viper element.
     *
     * @return {ViperDOMRange} The Vipe DOMRange object.
     */
    getCurrentRange: function()
    {
        var range =  ViperSelection.getRangeAt(0);
        this._currentRange = range.cloneRange();
        return range;

    },

    /**
     * Returns the range that was set before Viper lost focus.
     *
     * Plugins that steal focus from the Viper element may need to give the focus
     * back to Viper element and also select the text/node that selected before they
     * took the focus. In that case this method should be used instead of the
     * getCurrentRange.
     *
     * @return {ViperDOMRange} The Vipe DOMRange object.
     */
    getViperRange: function()
    {
        if (this.isBrowser('msie') === false) {
            this.highlightToSelection();
        }

        if (this._viperRange) {
            return this._viperRange;
        }

        return this.getCurrentRange();

    },

    /**
     * Selects the specified element.
     *
     * @param {DOMNode} element The element to select.
     */
    selectElement: function(element)
    {
        var range = this.getViperRange();
        range.selectNode(element);
        ViperSelection.addRange(range);

    },

    getNodeSelection: function(range)
    {
        range = range || this.getViperRange();

        var nodeSelection = range.getNodeSelection();
        var node = this.fireCallbacks('Viper:getNodeSelection', {range: range});

        if (node) {
            nodeSelection = node;
        }

        return nodeSelection;

    },

    /**
     * Sets the attribute of an element.
     *
     * If the specified value is empty and the attribute value is empty then
     * attribute will be removed from the element.
     *
     * @param {DOMNode}  element   The element to update.
     * @param {string}   attribute The attribute name.
     * @param {string}   value     The value of the attribute.
     */
    setAttribute: function(element, attribute, value)
    {
        if (!element || !element.setAttribute) {
            return;
        }

        if (!value && dfx.hasAttribute(element, attribute) === true) {
            element.removeAttribute(attribute);

            if (dfx.isTag(element, 'span') === true
                && element.attributes
                && element.attributes.length === 0
            ) {
                var range        = this.getViperRange();
                var selectedNode = range.getNodeSelection();

                var firstSelectable = null;
                var lastSelectable  = null;
                if (selectedNode === element) {
                    // Select again.
                    firstSelectable = range._getFirstSelectableChild(element);
                    lastSelectable  = range._getLastSelectableChild(element);
                }

                while (element.firstChild) {
                    dfx.insertBefore(element, element.firstChild);
                }

                dfx.remove(element);

                if (firstSelectable && lastSelectable) {
                    range.setStart(firstSelectable, 0);
                    range.setEnd(lastSelectable, lastSelectable.data.length);
                    ViperSelection.addRange(range);
                }
            }

        } else if (value) {
            element.setAttribute(attribute, value);
        }

    },

    /**
     * Rturns a DOMElement if all of its contents is selected, null otherwise.
     *
     * @param {DOMRange} range The range to check.
     *
     * @return {DOMNode}
     */
    getWholeElementSelection: function(range)
    {
        range = range || this.getViperRange();

        if (range.startContainer.nodeType === dfx.TEXT_NODE
            && range.startOffset === 0
        ) {
            // Must not have a previous sibling.
            var sibling = range.startContainer.previousSibling;
            while (sibling) {
                if (sibling.nodeType !== dfx.TEXT_NODE
                    || dfx.isBlank(sibling.data) === false
                ) {
                    return null;
                }

                sibling = sibling.previousSibling;
            }

            var parent = range.startContainer.parentNode;

            // Check the end.
            if (range.endContainer.nodeType === dfx.TEXT_NODE) {
                if (range.endOffset !== range.endContainer.data.length) {
                    return null;
                }

                // Check if this is the last selectable element.
                var lastSelectable = range._getLastSelectableChild(parent);
                if (range.endContainer !== lastSelectable) {
                    // Check if there are empty textnodes after this.
                    var sibling = range.endContainer.nextSibling;
                    while (sibling) {
                        if (sibling.nodeType !== dfx.TEXT_NODE
                            || dfx.isBlank(sibling.data) === false
                        ) {
                            return null;
                        }

                        sibling = sibling.nextSibling;
                    }

                    if (sibling !== lastSelectable) {
                        return null;
                    }
                }

                return parent;
            }
        }

        return null;

    },

    /**
     * Sets the selection starting from start and ending at end element.
     *
     * @param {DOMNode} start The start of the selection.
     * @param {DOMNode} end   The end of the selection.
     */
    selectNodeToNode: function(start, end)
    {
        var range = this.getViperRange();

        if (start === end) {
            range.selectNode(start);
        } else {
            if (start.nodeType === dfx.ELEMENT_NODE) {
                start = range._getFirstSelectableElement(start);
            }

            if (end.nodeType === dfx.ELEMENT_NODE) {
                end = range._getLastSelectableElement(end);
            }

            range.setStart(start, 0);
            range.setEnd(end, end.data.length);
        }

        ViperSelection.addRange(range);
        this.fireCallbacks('Viper:selectionChanged', range);

    },


    /**
     * Returns the caret coords.
     *
     * @return {object} The x and y position of the caret.
     */
    getCaretCoords: function()
    {
        // TODO: Change this to range coords.

        var coords = {};
        try {
            var bookmark = this.createBookmark();
            dfx.setStyle(bookmark.end, 'display', 'inline');
            coords = dfx.getElementCoords(bookmark.end);
            dfx.remove(bookmark.start);
            dfx.remove(bookmark.end);
        } catch (e) {
            coords = {
                x: -1,
                y: -1
            };
        }

        return coords;

    },


    getDocumentOffset: function()
    {
        var doc    = Viper.document;
        var offset = {
            x: 0,
            y: 0
        };

        while (document !== doc) {
            var frameElem = doc.defaultView.frameElement;
            if (!frameElem) {
                continue;
            }

            var coords    = dfx.getElementCoords(frameElem);
            offset.x += coords.x;
            offset.y += coords.y;
            doc = frameElem.ownerDocument;
        }

        return offset;

    },


    getDocumentWindow: function()
    {
        return Viper.document.defaultView;

    },


    /**
     * Returns true if given selection is in side the Viper element false otherwise.
     *
     * @param {ViperDOMRange} range The range object to check.
     *
     * @return {boolean} True if range is inside Viper element.
     */
    rangeInViperBounds: function(range)
    {
        range = range || this.getCurrentRange();
        if (range === null || this.isOutOfBounds(range.startContainer) || this.isOutOfBounds(range.endContainer)) {
            return false;
        }

        return true;

    },

    /**
     * Checks if specified element is inside Viper element.
     *
     * @param {DOMNode} element The element to test.
     *
     * @return {boolean} True if the element is inside Viper element.
     */
    isOutOfBounds: function(element)
    {
        if (element === this.element || dfx.isChildOf(element, this.element) === true) {
            return false;
        } else if (this._subElementActive === true && (element === this._mainElem || dfx.isChildOf(element, this._mainElem) === true)) {
            return false;
        }

        return true;

    },

    /**
     * Inserts a node after the current caret position.
     *
     * If the current selection is not collapsed, then the contents currently
     * selected will be deleted before inserting the specified node The new caret
     * position will exist after the inserted node.
     *
     * @param DOMNode node The node to insert.
     *
     * @return void
     */
    insertNodeAtCaret: function(node)
    {
        var range = this.getCurrentRange();

        // If we have any nodes highlighted, then we want to delete them before
        // inserting the new text.
        if (range.collapsed !== true) {
            if (this.isBrowser('chrome') === true
                && range.startOffset === 0
                && range.startContainer === range._getFirstSelectableChild(this.element)
                && range.endOffset === (this.element.childNodes.length - 1)
            ) {
                // Whole editable container.
                dfx.setHtml(this.element, '');
            } else {
                range.deleteContents();
            }

            if (dfx.trim(dfx.getHtml(this.element)) === '') {
                this.initEditableElement();
            }

            // Update the range var.
            range = this.getCurrentRange();
            if (range.startContainer === range.endContainer && this.element === range.startContainer) {
                // The whole editable element is selected. Need to remove everything
                // and init its contents.
                dfx.empty(this.element);
                this.initEditableElement();

                // Update the range.
                var firstSelectable = range._getFirstSelectableChild(this.element);
                range.setStart(firstSelectable, 0);
                range.collapse(true);
            }
        } else if (dfx.isStubElement(range.startContainer.parentNode) === true) {
            var newNode = Viper.document.createTextNode('');
            dfx.insertBefore(range.startContainer.parentNode, newNode);
            dfx.remove(range.startContainer.parentNode);
            range.setStart(newNode, 0);
            range.collapse(true);
            ViperSelection.addRange(range);
        }//end if

        if (typeof node === 'string') {
            if (node === '\r') {
                return;
            }

            var newNode  = Viper.document.createTextNode(node);
            var noBlock  = true;
            var newRange = this.ctmInsertNodeAtCaret(range, newNode);
            if (newRange !== false) {
                noBlock = false;
            } else {
                newRange = range;

                 if (newRange.collapsed === true
                     && newRange.startContainer.parentNode
                     && newRange.startContainer.parentNode.firstChild.nodeType === dfx.TEXT_NODE
                     && newRange.startContainer.parentNode.firstChild === newRange.startContainer.parentNode.lastChild
                     && dfx.trim(newRange.startContainer.parentNode.firstChild.data) === ''
                 ) {
                     newRange.setStart(newRange.startContainer.parentNode.firstChild, 0);
                     newRange.collapse(true);
                     newRange.startContainer.parentNode.firstChild.data = '';
                 } else if (newRange.collapsed === true
                     && dfx.isStubElement(newRange.startContainer) === true
                 ) {
                     var tmpTextNode = Viper.document.createTextNode('');
                     dfx.insertBefore(newRange.startContainer, tmpTextNode);
                     dfx.remove(newRange.startContainer);
                     newRange.setStart(tmpTextNode, 0);
                     newRange.collapse(true);
                 }
            }//end if

            if (this.fireCallbacks('Viper:nodesInserted', {node: newNode, range: newRange}) === false) {
                noBlock = false;
            }

            if (noBlock === false) {
                return false;
            }

            this.fireNodesChanged([newNode.parentNode]);
            return;
        } else {
            // We need to import nodes from a document fragment into the current
            // this._document, so that we don't have document fragments within our this._document,
            // as they don't have parentNodes and are hard to work with.
            if (node.nodeType === dfx.DOCUMENT_FRAGMENT_NODE) {
                if (this.isBrowser('msie') === true) {
                    // Insert a marker span tag to the caret positioon.
                    range.rangeObj.pasteHTML('<span id="__viperMarker"></span>');
                    var marker = dfx.getId('__viperMarker');

                    // Put the node contents after the marker.
                    dfx.insertAfter(marker, node);

                    // Remove the marker.
                    dfx.remove(marker);
                    range.collapse(false);
                    return;
                } else {
                    var newNode = null;
                    var clen    = node.childNodes.length;
                    for (var i = 0; i < clen; i++) {
                        var child = node.childNodes[i];

                        // We need to skip text nodes that don't represent any content
                        // as if they exist as the last node in the fragment, we won't
                        // be able to set the end of the range to that node.
                        if (child.nodeType === dfx.TEXT_NODE) {
                            if (dfx.trim(child.data) === '') {
                                continue;
                            }
                        }

                        newNode = Viper.document.importNode(child, true);
                        range.insertNode(newNode);

                        // We need to move to the end of the new node after insertion.
                        // Otherwise next node will be inserted before this one.
                        range.selectNode(newNode);
                        range.collapse(false);
                    }//end for

                    node = newNode;
                    range.moveEnd('character', -1);
                    range.moveEnd('character', 1);
                    range.collapse(false);
                    return;
                }//end if
            } else if (dfx.isStubElement(range.startContainer) === true) {
                dfx.insertBefore(range.startContainer, node);
            } else {
                range.insertNode(node);
            }//end if

            range.setEndAfter(node, (this._getNodeOffset(node) + 1));
            range.collapse(false);
        }//end if

    },

    /**
     * Change Tracking Mode: InsertNodeAtCaret.
     */
    ctmInsertNodeAtCaret: function(range, node)
    {
        if (ViperChangeTracker.isTracking() === true) {
            if (range.collapsed === false) {
                // Range should be collapsed by the time this method is called.
                return range;
            }

            var offset    = range.startOffset;
            var ctNode    = null;
            var startNode = range.getStartNode();

            // Make sure startNode is not inside a textRemoved CTNode.
            if (ViperChangeTracker.getCTNode(startNode, 'textRemoved') !== null) {
                return false;
            }

            // Determine if a new CTNode needs to be created.
            ctNode = ViperChangeTracker.getCTNode(startNode, 'textAdd');

            if (ctNode === null) {
                if (offset === 0) {
                    // Look at the previous sibling to see if its a CTNode.
                    while (startNode) {
                        startNode = startNode.previousSibling;
                        if (startNode && (startNode.nodeType !== dfx.TEXT_NODE || startNode.data.length !== 0)) {
                            break;
                        }
                    }

                    ctNode = ViperChangeTracker.getCTNode(startNode, 'textAdd');
                    if (ctNode !== null) {
                        var newNode = Viper.document.createTextNode('');
                        ctNode.appendChild(newNode);
                        range.setStart(newNode, 0);
                        range.collapse(true);
                    }
                } else if (offset === startNode.data.length) {
                    // Look at the next sibling to see if its a CTNode.
                    while (startNode) {
                        startNode = startNode.nextSibling;
                        if (startNode && (startNode.nodeType !== dfx.TEXT_NODE || startNode.data.length !== 0)) {
                            break;
                        }
                    }

                    ctNode = ViperChangeTracker.getCTNode(startNode, 'textAdd');
                    if (ctNode !== null) {
                        var newNode = Viper.document.createTextNode('');
                        dfx.insertBefore(ctNode.firstChild, newNode);
                        range.setStart(newNode, 0);
                        range.collapse(true);
                    }
                }//end if
            }//end if

            if (ctNode === null) {
                // Create a new CTNode.
                ctNode = ViperChangeTracker.createCTNode('ins', 'textAdd', node);
                ViperChangeTracker.addChange('textAdded', [ctNode]);
                range.insertNode(ctNode);
                range.setEnd(node, 1);
                range.collapse(false);
                ViperSelection.addRange(range);
            } else {
                return false;
            }
        } else {
            return false;
        }//end if

        return range;

    },

    /**
     * Inserts the specified text after the current caret location.
     *
     * If the current selection is not collapsed, then the contents currently
     * selected will be deleted before inserting the specified node The new caret
     * position will exist after the inserted node.
     *
     * @param string text The text to insert.
     *
     * @return void
     */
    insertTextAtCaret: function(text)
    {
        if (typeof text !== 'string') {
            throw('InvalidArgumentException: text must be a string');
        }

        return this.insertNodeAtCaret(text);

    },

    /**
     * Returns the offset where the node exists in the parent's childNodes property.
     *
     * @param DomNode node The node to obtain the offset for.
     *
     * @return integer
     */
    _getNodeOffset: function(node)
    {
        var nodes = node.parentNode.childNodes;
        var ln    = nodes.length;
        for (var i = 0; i < ln; i++) {
            if (nodes[i] === node) {
                return i;
            }
        }

    },

    _parentWillBeDeleted: function(node)
    {
        // Check to see if the container that we are deleting from will have
        // any content in it after the delete operation. If not, then it should
        // be removed to avoid having empty elements.
        if (node.parentNode) {
            var parentContent = dfx.trim(dfx.getNodeTextContent(node.parentNode));
            if (parentContent === '' || parentContent === '&nbsp;') {
                return true;
            } else {
                return false;
            }
        }

        return false;

    },

    getBlockParent: function(node)
    {
        if (node) {
            while (node.parentNode) {
                node = node.parentNode;
                if (node === this.element) {
                    return null;
                }

                if (dfx.isBlockElement(node) === true) {
                    return node;
                }
            }
        }

        return null;

    },

    /**
     * Returns the text contents of specified elements as an array.
     */
    getTextContentFromElements: function(elements)
    {
        var text = [];
        dfx.foreach(elements, function(i) {
            if (elements[i].nodeType === dfx.TEXT_NODE) {
                text.push(elements[i].data);
            } else {
                text.push(dfx.getNodeTextContent(elements[i]));
            }
        });

        return text;

    },

    deleteContents: function(right)
    {
        var range = this.getCurrentRange();
        if (range.collapsed === false) {
            // Delete multiple elements.
            this._deleteFromSelection(range);
        } else {
            // Range is collapsed.
            var container = range.startContainer;
            if (container.nodeType === dfx.ELEMENT_NODE) {
                // Delete an element node.
                this._deleteNode(range);
            } else if (container.nodeType === dfx.TEXT_NODE) {
                if (right === true) {
                    // Remove content from the right of the caret (delete).
                    this._deleteFromRight(range);
                } else {
                    // Remove content from the left of the caret (backspace).
                    this._deleteFromLeft(range);
                }
            }
        }//end if

        ViperSelection.addRange(range);

        this.fireNodesChanged([this.element]);

    },

    _deleteNode: function(range)
    {
        var container = range.startContainer;

        // If the selection is a stub element (e.g. br, img)
        // then just remove the node.
        if (dfx.isStubElement(container) === true) {
            this.removeElem(container);
            return;
        } else if (container === this.element && range.startOffset === 0) {
            // The whole editable element is selected then clear its contents.
            var defaultTag = this.getDefaultBlockTag();
            if (defaultTag) {
                dfx.setHtml(this.element, '<' + defaultTag + '>&nbsp;</' + defaultTag + '>');
            } else {
                dfx.setHtml(this.element, '&nbsp;');
            }

            range.setStart(this.element.firstChild.firstChild, 0);
            range.collapse(true);
            return;
        }

    },

    _deleteFromSelection: function(range)
    {
        var moveBeforeParent = false;
        if (range.startContainer.nodeType === dfx.TEXT_NODE
            && range.startOffset === 0
            && !range.startContainer.previousSibling
        ) {
            moveBeforeParent = range.startContainer.parentNode;
        }

        // Book mark the range.
        var bookmark = this.createBookmark(range);

        if (moveBeforeParent) {
            // Move the range to before parent.
            dfx.insertBefore(moveBeforeParent, bookmark.start);
        }

        // Remove all elements in between.
        var elements = dfx.getElementsBetween(bookmark.start, bookmark.end);

        // Tracking Mode.
        // Intead of removing nodes just wrap them with a span tag.
        if (ViperChangeTracker.isTracking() === true) {
            var removedText = (this.getTextContentFromElements(elements)).join('');

            var changeid = ViperChangeTracker.addChange('textRemoved');
            var eln      = elements.length;
            for (var i = 0; i < eln; i++) {
                var elem = elements[i];
                if (ViperChangeTracker.getCTNode(elem, 'textRemoved') === null) {
                    if (dfx.isBlockElement(elem) === true) {
                        var del = Viper.document.createElement('del');
                        dfx.insertBefore(elem, del);
                        del.appendChild(elem);
                        ViperChangeTracker.addNodeToChange(changeid, del);
                    } else {
                        this._wrapElement(elem, 'del', function(newElem) {
                            // Add new class to wrap element to mark it as "deleted".
                            ViperChangeTracker.addNodeToChange(changeid, newElem);
                        });
                    }
                }
            }

            var startEl = bookmark.start.previousSibling;
            if (!startEl) {
                startEl = Viper.document.createTextNode('');
                dfx.insertBefore(bookmark.start, startEl);
                this.selectBookmark(bookmark);
                range = this.getCurrentRange();
                range.setStart(startEl, 0);
            } else {
                this.selectBookmark(bookmark);
                range = this.getCurrentRange();
                // Move left and then right to position the start of range
                // just before the CTNode.
                range.moveStart(ViperDOMRange.CHARACTER_UNIT, -1);
                range.moveStart(ViperDOMRange.CHARACTER_UNIT, 1);
            }

            range.collapse(true);
            return;
        }//end if

        // Remove all the elements in between.
        this.removeElem(elements);

        var parent    = bookmark.start.parentNode;
        var endParent = bookmark.end.parentNode;

        // Select Bookmark.
        this.selectBookmark(bookmark);

        if (parent && dfx.getHtml(parent) === '') {
            dfx.setHtml(parent, '&nbsp;');
            range.setStart(parent.firstChild, 0);
        }

        // Remove the parent node of the end range if its empty.
        if (endParent && parent !== endParent && dfx.getHtml(endParent) === '') {
            dfx.remove(endParent);
        }

        // Collapse range to the start.
        range.collapse(true);

    },

    _deleteFromRight: function(range)
    {
        var container = range.startContainer;

        // Remove content from the right of caret (i.e. delete key).
        // First check if caret is at the end of a container.
        if (range.endOffset === container.data.length) {
            // Check if need to merge containers.
            var cRange = range.cloneRange();
            cRange.moveEnd(ViperDOMRange.CHARACTER_UNIT, 1);
            var eParent = this.getBlockParent(cRange.endContainer);
            if (eParent) {
                if (dfx.isChildOf(eParent, this.element) === false) {
                    return;
                }

                var sParent = this.getBlockParent(cRange.startContainer);

                // If the start of the cloned range has moved to a new block
                // parent then merge these nodes.
                if (eParent !== sParent) {
                    this.mergeContainers(eParent, sParent);
                    range.setStart(cRange.startContainer, cRange.startContainer.data.length);
                    range.collapse(true);
                    return;
                }
            }

            // Caret is at the end of a container so it needs to
            // move to the next container.
            var nextContainer = range.getNextContainer(container);

            // If range is at the end of the container and the
            // next container is out side of Viper then do nothing.
            if (dfx.isChildOf(nextContainer, this.element) === false) {
                return false;
            }

            var firstSelectable = range._getFirstSelectableChild(nextContainer);
            range.setStart(firstSelectable, 0);

            if (ViperChangeTracker.isTracking() === true) {
                // Tracking Mode.
                // Instead of removing nodes wrap them around new
                // span tags.
                this._addTextNodeTracking(firstSelectable, range);
            } else {
                range.collapse(true);
                range.moveEnd(ViperDOMRange.CHARACTER_UNIT, 1);
                range.deleteContents();
                range.collapse(true);

                // If the parent container is going to be empty then it
                // should be removed.
                if (this._parentWillBeDeleted(container) === true) {
                    dfx.remove(container.parentNode);
                }
            }
        } else {
            var textNode    = range.getStartNode();
            var isTracking  = ViperChangeTracker.isTracking();
            var textAddNode = null;
            if (isTracking === true) {
                textAddNode = ViperChangeTracker.getCTNode(textNode, 'textAdd');
            }

            if (isTracking === true && textAddNode === null) {
                // Tracking Mode
                // Instead of removing contents, wrap them in a new
                // "delete" span tag.
                this._addTextNodeTracking(textNode, range, true);
            } else {
                range.moveEnd(ViperDOMRange.CHARACTER_UNIT, 1);
                range.deleteContents();

                // The textAddNode is a tracked inserted content, its contents
                // are deleted and it may be empty.
                if (textAddNode !== null && dfx.isBlank(dfx.getNodeTextContent(textAddNode)) === true) {
                    // Content is now empty, so remove the node.
                    var prevSibling = textAddNode.previousSibling;
                    if (!prevSibling || prevSibling.nodeType !== dfx.TEXT_NODE) {
                        prevSibling = Viper.document.createTextNode('');
                        dfx.insertBefore(textAddNode, prevSibling);
                    }

                    range.setStart(prevSibling, prevSibling.data.length);

                    dfx.remove(textAddNode);
                }
            }//end if
        }//end if

    },

    _deleteFromLeft: function(range)
    {
        var container = range.startContainer;

        // First check if caret is at the start of a container.
        if (range.startOffset === 0) {
            // Check if need to merge containers.
            var cRange = range.cloneRange();
            cRange.moveStart(ViperDOMRange.CHARACTER_UNIT, -1);

            var sParent = this.getBlockParent(cRange.startContainer);
            if (sParent) {
                if (dfx.isChildOf(sParent, this.element) === false) {
                    // If the endContainer is inside the editable text region then
                    // move the start of the range to the beginning.
                    var firstChild = dfx.getFirstChild(this.element);
                    if (!firstChild) {
                        return false;
                    } else {
                        cRange.setStart(firstChild, 0);
                        sParent = this.getBlockParent(cRange.startContainer);
                    }
                }

                var eParent = this.getBlockParent(cRange.endContainer);

                // If the start of the cloned range has moved to a new block
                // parent then merge these nodes.
                if (eParent !== sParent) {
                    this.mergeContainers(eParent, sParent);

                    range.setStart(cRange.startContainer, cRange.startContainer.data.length);
                    range.collapse(true);

                    // Two block containers merged, clean empty containers.
                    this.removeEmptyNodes();
                    return;
                }
            }//end if

            // Caret is at the start of a container so it needs to
            // move to the previous container.
            var previousContainer = range.getPreviousContainer(container);

            // If range is at the beginning of the container and the
            // previous container is out side of Viper then do nothing.
            if (dfx.isChildOf(previousContainer, this.element) === false) {
                return false;
            }

            if (dfx.isStubElement(previousContainer) === true) {
                if (ViperChangeTracker.isTracking() === true) {
                    // Tracking Mode
                    // Mark the stub element as "deleted".
                    range.moveStart(ViperDOMRange.CHARACTER_UNIT, -1);
                    dfx.addClass(previousContainer, ViperChangeTracker.getCTNodeClass('textRemoved'));
                    dfx.attr(previousContainer, 'title', 'Content removed');
                } else {
                    dfx.remove(previousContainer);
                }

                range.collapse(true);
            } else {
                var lastSelectable = range._getLastSelectableChild(previousContainer);
                range.setStart(lastSelectable, lastSelectable.data.length);

                if (ViperChangeTracker.isTracking() === true) {
                    // Tracking Mode.
                    // Instead of removing nodes wrap them around new
                    // span tags.
                    this._addTextNodeTracking(lastSelectable, range);
                } else {
                    range.collapse(true);
                    range.moveStart(ViperDOMRange.CHARACTER_UNIT, -1);
                    range.deleteContents();

                    // If the parent container is going to be empty then it
                    // should be removed.
                    if (this._parentWillBeDeleted(container) === true) {
                        dfx.remove(container.parentNode);
                    }
                }
            }//end if
        } else {
            var textNode    = range.getStartNode();
            var isTracking  = ViperChangeTracker.isTracking();
            var textAddNode = null;
            if (isTracking === true) {
                textAddNode = ViperChangeTracker.getCTNode(textNode, 'textAdd');
            }

            if (isTracking === true && textAddNode === null) {
                // Tracking Mode
                // Instead of removing contents, wrap them in a new
                // "delete" span tag.
                this._addTextNodeTracking(textNode, range);
            } else {
                range.moveStart(ViperDOMRange.CHARACTER_UNIT, -1);
                range.deleteContents();

                // The textAddNode is a tracked inserted content, its contents
                // are deleted and it may be empty.
                if (textAddNode !== null && dfx.isBlank(dfx.getNodeTextContent(textAddNode)) === true) {
                    // Content is now empty, so remove the node.
                    var prevSibling = textAddNode.previousSibling;
                    if (!prevSibling || prevSibling.nodeType !== dfx.TEXT_NODE) {
                        prevSibling = Viper.document.createTextNode('');
                        dfx.insertBefore(textAddNode, prevSibling);
                    }

                    range.setStart(prevSibling, prevSibling.data.length);

                    dfx.remove(textAddNode);
                }
            }//end if
        }//end if

    },

    _addTextNodeTracking: function(textNode, range, del)
    {
        if ((del !== true && range.startOffset === 0) || ViperChangeTracker.getCTNode(textNode, 'textRemoved') !== null) {
            return;
        }

        var beforeText  = '';
        var removedChar = '';
        var afterText   = '';

        if (del !== true) {
            beforeText  = textNode.nodeValue.substring(0, (range.startOffset - 1));
            removedChar = textNode.nodeValue.substr((range.startOffset - 1), 1);
            afterText   = textNode.nodeValue.substring(range.startOffset);
        } else {
            beforeText  = textNode.nodeValue.substring(0, range.endOffset);
            removedChar = textNode.nodeValue.substr(range.endOffset, 1);
            afterText   = textNode.nodeValue.substring((range.endOffset + 1));
        }

        if ((range.startOffset === 1 && del !== true) || (del === true && range.startOffset === 0)) {
            // Check if we can merge to an existing previous CTNode.
            var ctNode = ViperChangeTracker.getCTNode(textNode.previousSibling, 'textRemoved');
            if (ctNode) {
                // Can add the removed char to previous sibling.
                if (del !== true) {
                    if (ctNode.lastChild && ctNode.lastChild.nodeType === dfx.TEXT_NODE) {
                        ctNode.lastChild.nodeValue += removedChar;
                        range.setStart(ctNode.lastChild, (ctNode.lastChild.nodeValue.length - 1));
                    } else {
                        var charNode = Viper.document.createTextNode(removedChar);
                        ctNode.appendChild(charNode);
                        range.setStart(charNode, 0);
                    }

                    // Update textNode.
                    textNode.nodeValue = beforeText + afterText;
                    // Update textNode.
                    textNode.nodeValue = beforeText + afterText;
                    if (textNode.nodeValue.length === 0) {
                        // Move the range to the right until there is valid sibling.
                        var found           = false;
                        var previousSibling = textNode.previousSibling;
                        while (found !== true) {
                            ctNode = ViperChangeTracker.getCTNode(previousSibling, 'textRemoved');
                            if (!ctNode) {
                                found = true;
                            } else {
                                previousSibling = previousSibling.previousSibling;
                            }
                        }

                        if (previousSibling) {
                            previousSibling = range._getLastSelectableChild(previousSibling);
                            range.setStart(previousSibling, previousSibling.nodeValue.length);
                            range.collapse(true);
                        }
                    } else {
                        range.collapse(true);
                    }//end if
                } else {
                    if (ctNode.lastChild && ctNode.lastChild.nodeType === dfx.TEXT_NODE) {
                        ctNode.lastChild.nodeValue += removedChar;
                    } else {
                        var charNode = Viper.document.createTextNode(removedChar);
                        ctNode.appendChild(charNode);
                    }

                    // Update textNode.
                    textNode.nodeValue = beforeText + afterText;
                    if (textNode.nodeValue.length === 0) {
                        // Move the range to the right until there is valid sibling.
                        var found       = false;
                        var nextSibling = textNode.nextSibling;
                        while (found !== true) {
                            ctNode = ViperChangeTracker.getCTNode(nextSibling, 'textRemoved');
                            if (!ctNode) {
                                found = true;
                            } else {
                                nextSibling = nextSibling.nextSibling;
                            }
                        }

                        if (nextSibling) {
                            range.setStart(nextSibling, 0);
                            range.collapse(true);
                        }
                    } else {
                        range.setStart(textNode, 0);
                        range.collapse(true);
                    }//end if
                }//end if

                // TODO: Check if textNode is blank then check next and previous siblings.
                // If they are both textRemove tracking nodes and same user
                // then join them together.
                return;
            }//end if
        }//end if

        if (range.startOffset === textNode.nodeValue.length) {
            // Range is at the end of the text node. Check if next sibling
            // is a CTNode that we can join to.
            var ctNode = ViperChangeTracker.getCTNode(textNode.nextSibling, 'textRemoved');
            if (ctNode) {
                if (ctNode.firstChild && ctNode.firstChild.nodeType === dfx.TEXT_NODE) {
                    ctNode.firstChild.nodeValue = removedChar + ctNode.firstChild.nodeValue;
                } else {
                    var charNode = Viper.document.createTextNode(removedChar);
                    dfx.insertBefore(ctNode.firstChild, charNode);
                }

                // Update textNode.
                textNode.nodeValue = beforeText;
                range.setStart(textNode, textNode.nodeValue.length);
                range.collapse(true);
                return;
            }
        }

        var ctNode  = ViperChangeTracker.createCTNode('del', 'textRemoved');
        var newNode = null;
        if (del !== true) {
            newNode           = textNode.splitText(range.startOffset - 1);
            newNode.nodeValue = newNode.nodeValue.substring(1);
            ViperChangeTracker.addChange('textRemoved', [ctNode]);

            dfx.insertAfter(textNode, newNode);
            ctNode.firstChild.nodeValue = removedChar;
            dfx.insertAfter(textNode, ctNode);
            range.setStart(textNode, textNode.nodeValue.length);
            range.collapse(true);
        } else {
            newNode           = textNode.splitText(range.endOffset);
            newNode.nodeValue = newNode.nodeValue.substring(1);
            ViperChangeTracker.addChange('textRemoved', [ctNode]);

            dfx.insertAfter(textNode, newNode);
            ctNode.firstChild.nodeValue = removedChar;
            dfx.insertAfter(textNode, ctNode);
            range.setStart(newNode, 0);
            range.collapse(true);
        }//end if

    },

    mergeContainers: function(node, mergeToNode)
    {
        if (!node || !mergeToNode) {
            return false;
        }

        if (ViperChangeTracker.isTracking() === true) {
            var del = Viper.document.createElement('del');
            mergeToNode.appendChild(del);
            ViperChangeTracker.addChange('merged', [del]);
        }

        if (node.nodeType === dfx.TEXT_NODE || dfx.isStubElement(node) === true) {
            // Move only this node.
            mergeToNode.appendChild(node);
        } else if (node.nodeType === dfx.ELEMENT_NODE) {
            // Move all the child nodes to the new parent.
            while (node.firstChild) {
                mergeToNode.appendChild(node.firstChild);
            }

            // Remove the node.
            dfx.remove(node);
        }

        return true;

    },

    /**
     * This is not as simple as wrapping a selection with the specified node.
     * For example, if the specified node is a STRONG tag, which is an inline
     * ELEMENT_NODE then it cannot be a parent to block element (i.e. P, DIV).
     */
    surroundContents: function(tag, attributes, range, keepSelection)
    {
        range = range || this.getCurrentRange();

        if (range.collapsed === true) {
            return;
        }

        if (this.rangeInViperBounds(range) !== true) {
            return;
        }

        var otag = tag;

        if (ViperChangeTracker.isTracking() === true
            && ViperChangeTracker.getCurrentMode() === 'original'
        ) {
            // If the original mode is active then new style tags should not be
            // shown, but when final mode is activated they should be.
            tag = 'span';
        }

       var startContainer = range.getStartNode();
       var endContainer   = range.getEndNode();

       if (startContainer === endContainer) {
            // Selected contents from same node.
            if (startContainer.nodeType === dfx.TEXT_NODE) {
                // Selection is a text node.
                // Just wrap the contents with the specified node.
                var node = Viper.document.createElement(tag);
                this._setWrapperElemAttributes(node, attributes);

                var rangeContent = range.toString();
                dfx.setNodeTextContent(node, rangeContent);

                if (ViperChangeTracker.isTracking() === true) {
                    if (ViperChangeTracker.getCurrentMode() === 'original') {
                        ViperChangeTracker.setCTData(node, 'tagName', otag);
                    }

                    ViperChangeTracker.addChange('formatChange', [node]);
                }

                range.deleteContents();
                range.insertNode(node);

                if (keepSelection !== true) {
                    range.setStart(node.firstChild, 0);
                    range.setEnd(node.firstChild, node.firstChild.length);
                    ViperSelection.addRange(range);
                }

                return node;
            } else {
                var self     = this;
                var changeid = null;
                if (ViperChangeTracker.isTracking() === true) {
                    changeid = ViperChangeTracker.addChange('formatChange', [newElem]);
                }

                this._wrapElement(startContainer.childNodes[range.startOffset], tag, function(newElem) {
                    if (changeid !== null) {
                        if (ViperChangeTracker.getCurrentMode() === 'original') {
                            ViperChangeTracker.setCTData(newElem, 'tagName', otag);
                        }

                        // Add new class to wrap element to mark it as "changed".
                        ViperChangeTracker.addNodeToChange(changeid, newElem);
                    }
                }, attributes);
            }//end if
        } else {
            var nodeSelection = range.getNodeSelection();

            if (nodeSelection && dfx.isBlockElement(nodeSelection) === false) {
                var newElement = document.createElement(otag);
                this._setWrapperElemAttributes(newElement, attributes);

                while (nodeSelection.firstChild) {
                    newElement.appendChild(nodeSelection.firstChild);
                }

                nodeSelection.appendChild(newElement);

                range.selectNode(newElement);
                ViperSelection.addRange(range);

                return newElement;
            } else if (startContainer.nodeType === dfx.TEXT_NODE
                && this.getViperElement().firstChild === startContainer
                && dfx.trim(startContainer.data) === ''
            ) {
                startContainer = range._getFirstSelectableChild(this.getViperElement());
            }

            var startBlockParent = dfx.getFirstBlockParent(startContainer);
            if (!endContainer) {
                if (range.endContainer === this.getViperElement()
                    && range.endContainer.childNodes
                    && !range.endContainer.childNodes[range.endOffset]
                ) {
                    endContainer = range._getLastSelectableChild(this.getViperElement());
                } else {
                    endContainer = startContainer;
                }
            }

            var rangeContents  = range.getHTMLContentsObj();
            var endBlockParent = dfx.getFirstBlockParent(endContainer);
            var bookmark       = this.createBookmark();

            if (startBlockParent === endBlockParent
                && !nodeSelection
            ) {
                if (!bookmark.start.previousSibling
                    && bookmark.start.parentNode !== startBlockParent
                ) {
                    // Move bookmark outside of its parent.
                    dfx.insertBefore(bookmark.start.parentNode, bookmark.start);
                }

                if (!bookmark.end.nextSibling
                    && bookmark.end.parentNode !== endBlockParent
                ) {
                    // Move bookmark outside of its parent.
                    dfx.insertAfter(bookmark.end.parentNode, bookmark.end);
                }

                var elements = dfx.getElementsBetween(bookmark.start, bookmark.end);
                dfx.remove(elements);

                if (!bookmark.start.nextSibling) {
                    var parent = bookmark.start.parentNode;
                    while (!parent.nextSibling) {
                        parent = parent.parentNode;
                    }

                    dfx.insertAfter(parent, bookmark.start);
                }

                if (!bookmark.end.previousSibling) {
                    var parent = bookmark.end.parentNode;
                    while (!parent.previousSibling) {
                        parent = parent.parentNode;
                    }

                    dfx.insertBefore(parent, bookmark.end);
                }

                var newElement = null;
                if (otag !== 'span'
                    && bookmark.start.previousSibling
                    && dfx.isTag(bookmark.start.previousSibling, otag) === true
                ) {
                    // If the previous element is the same tag then just join to it.
                    newElement = bookmark.start.previousSibling;
                    newElement.appendChild(bookmark.start);
                    while (rangeContents.firstChild) {
                        newElement.appendChild(rangeContents.firstChild);
                    }
                    newElement.appendChild(bookmark.end);
                } else if (otag !== 'span'
                    && bookmark.end.nextSibling
                    && dfx.isTag(bookmark.end.nextSibling, otag) === true
                ) {
                    // If the next element is the same tag then just join to it.
                    newElement = bookmark.end.nextSibling;
                    if (newElement.firstChild) {
                        dfx.insertBefore(newElement.firstChild, bookmark.end);
                    } else {
                        newElement.appendChild(bookmark.end);
                    }

                    while (rangeContents.lastChild) {
                        dfx.insertBefore(newElement.firstChild, rangeContents.lastChild);
                    }

                    dfx.insertBefore(newElement.firstChild, bookmark.start);
                } else {
                    // Create a new element.
                    newElement = document.createElement(otag);
                    dfx.insertAfter(bookmark.start, newElement);

                    while (rangeContents.firstChild) {
                        newElement.appendChild(rangeContents.firstChild);
                    }
                }

                this._setWrapperElemAttributes(newElement, attributes);

                // Remove same nested tags.
                var nestedTags = dfx.getTag(otag, newElement);
                var nestedTagsCount = nestedTags.length;
                for (var i = 0; i < nestedTagsCount; i++) {
                    if (this.isBookmarkElement(nestedTags[i]) === true || otag === 'span') {
                        continue;
                    }

                    while (nestedTags[i].firstChild) {
                        dfx.insertBefore(nestedTags[i], nestedTags[i].firstChild);
                    }

                    dfx.remove(nestedTags[i]);
                }

                if (keepSelection !== true) {
                    this.selectBookmark(bookmark);
                } else {
                    dfx.remove(bookmark.start);
                    dfx.remove(bookmark.end);
                }

                return newElement;
            }//end if

            var startContainer = null;
            var endContainer   = null;
            startContainer     = bookmark.start.previousSibling;
            endContainer       = bookmark.end.nextSibling;
            if (!endContainer) {
                // If the bookmark.end is at the end of another tag move it outside.
                var bookmarkEnd = bookmark.end.parentNode;
                while (bookmarkEnd) {
                    if (bookmark.start.parentNode === bookmarkEnd.parentNode) {
                        dfx.insertAfter(bookmarkEnd, bookmark.end);
                        break;
                    } else if (bookmark.end.nextSibling || bookmarkEnd === this.getViperElement()) {
                        // Not the last node in this parent so we cannot move it.
                        break;
                    } else {
                        dfx.insertAfter(bookmarkEnd, bookmark.end);
                        if (bookmark.end.nextSibling) {
                            break;
                        } else {
                            bookmarkEnd = bookmark.end.parentNode;
                        }
                    }
                }

                endContainer = Viper.document.createTextNode('');
                dfx.insertAfter(bookmark.end, endContainer);
            }

            if (!startContainer) {
                // If the bookmark.end is at the end of another tag move it outside.
                var bookmarkStart = bookmark.start.parentNode;
                while (bookmarkStart) {
                    if (bookmark.end.parentNode === bookmarkStart.parentNode) {
                        dfx.insertBefore(bookmarkStart, bookmark.start);
                        break;
                    } else if (bookmarkStart.previousSibling || bookmarkStart === this.getViperElement()) {
                        // Not the last node in this parent so we cannot move it.
                        break;
                    }

                    bookmarkStart = bookmarkStart.parentNode;
                }

                startContainer = Viper.document.createTextNode('');
                dfx.insertBefore(bookmark.start, startContainer);
            }

            var elements = dfx.getElementsBetween(startContainer, endContainer);
            var c        = elements.length;
            var self     = this;
            var changeid = null;
            if (ViperChangeTracker.isTracking() === true) {
                changeid = ViperChangeTracker.addChange('formatChange');
            }

            for (var i = 0; i < c; i++) {
                this._wrapElement(elements[i], tag, function(newElem) {
                    if (changeid !== null) {
                        if (ViperChangeTracker.getCurrentMode() === 'original') {
                            ViperChangeTracker.setCTData(newElem, 'tagName', otag);
                        }

                        ViperChangeTracker.addNodeToChange(changeid, newElem);
                    }
                }, attributes);
            }

            if (keepSelection !== true) {
                this.selectBookmark(bookmark);
            } else {
                dfx.remove(bookmark.start);
                dfx.remove(bookmark.end);
            }
        }//end if

    },

    /**
     * Wraps specified tag name around parent node.
     *
     * @param DomNode  parent   A domNode that needs to be wrapped by new tag.
     * @param string   tag      Name of the tag to create.
     * @param function callback A callback function that will be called when a
     *                          new tag is created.
     */
    _wrapElement: function(parent, tag, callback, attributes)
    {
        if (!parent) {
            return;
        } else if (dfx.attr(parent, 'viperbookmark')) {
            return;
        } else if (parent.nodeType === dfx.COMMENT_NODE) {
            if (callback) {
                callback.call(this, parent);
            }
            return;
        }

        if (!attributes && dfx.getParents(parent, tag).length > 0) {
            // This element is already inside the specified tag.
            // TODO: This may cause problems with spans etc and may need to check
            // specific attributes as well.
            // Also, what if we do want to wrap the element anyway? Have force option?
            return;
        }

        if (parent.nodeType === dfx.TEXT_NODE) {
            if (dfx.isBlank(parent.data) !== true) {
                if (parent.previousSibling && parent.previousSibling.nodeType === dfx.TEXT_NODE) {
                    if (parent.previousSibling.nodeValue === '') {
                        dfx.remove(parent.previousSibling);
                    }
                }

                // If the previous/next sibling is type of specified tag then
                // add this text node to that sibling.
                if (parent.previousSibling
                    && dfx.isTag(parent.previousSibling, tag) === true
                    && !dfx.attr(parent.previousSibling, 'viperbookmark')
                    && (!attributes || attributes.cssClass !== '__viper_selHighlight')
                ) {
                    // Add it to the preivous sibling.
                    parent.previousSibling.appendChild(parent);
                } else if (parent.nextSibling
                    && dfx.isTag(parent.nextSibling, tag) === true
                    && !dfx.attr(parent.nextSibling, 'viperbookmark')
                    && (!attributes || attributes.cssClass !== '__viper_selHighlight')
                ) {
                    if (parent.nextSibling.firstChild) {
                        // Add it before the first child of the next sibling.
                        dfx.insertBefore(parent.nextSibling.firstChild, parent);
                    } else {
                        // Add it to the next sibling.
                        parent.nextSibling.appendChild(parent);
                    }
                } else {
                    // Create the tag and add it to DOM.
                    var elem = Viper.document.createElement(tag);
                    this._setWrapperElemAttributes(elem, attributes);

                    dfx.setNodeTextContent(elem, parent.nodeValue);
                    dfx.insertBefore(parent, elem);
                    dfx.remove(parent);

                    if (callback) {
                        callback.call(this, elem);
                    }
                }
            } else if (parent.previousSibling
                && dfx.isTag(parent.previousSibling, tag) === true
                && !dfx.attr(parent.previousSibling, 'viperbookmark')
            ) {
                parent.previousSibling.appendChild(parent);
            }//end if
        } else if (dfx.isStubElement(parent) === false) {
            if (dfx.isBlockElement(parent) === false && this.hasBlockChildren(parent) === false) {
                if (dfx.isTag(parent, tag) !== true) {
                    // Does not have any block elements, so we can
                    // wrap the content inside the specified tag.
                    if (parent.previousSibling
                        && parent.previousSibling.tagName
                        && parent.previousSibling.tagName.toLowerCase() === tag
                        && dfx.isBlockElement(parent) === false
                        && !dfx.attr(parent.previousSibling, 'viperbookmark')) {
                        parent.previousSibling.appendChild(parent);
                    } else {
                        var elem = Viper.document.createElement(tag);
                        this._setWrapperElemAttributes(elem, attributes);

                        dfx.insertBefore(parent, elem);
                        elem.appendChild(parent);
                        this.removeTagFromChildren(elem, tag);

                        if (callback) {
                            callback.call(this, elem);
                        }
                    }
                } else if (!parent.firstChild) {
                    // This is the tag we want however its empty, remove it.
                    parent.parentNode.removeChild(parent);
                } else if (parent.previousSibling
                    && dfx.isTag(parent.previousSibling, tag) === true
                    && !dfx.attr(parent.previousSibling, 'viperbookmark')
                ) {
                    // This is the tag we are looking for but there is already one
                    // of these tags before this one so move its children to that tag.
                    while (parent.firstChild) {
                        parent.previousSibling.appendChild(parent.firstChild);
                    }

                    parent.parentNode.removeChild(parent);
                }
            } else {
                // Because the node contains block level elements
                // we have to find the non block elements and wrap content around them.
                var c        = parent.childNodes.length;
                var children = [];
                for (var i = 0; i < c; i++) {
                    children.push(parent.childNodes[i]);
                }

                for (var i = 0; i < c; i++) {
                    this._wrapElement(children[i], tag, callback, attributes);
                }
            }//end if
        }//end if

    },

    _setWrapperElemAttributes: function(element, attributes)
    {
        if (!element || !attributes) {
            return;
        }

        if (attributes.cssClass) {
            dfx.addClass(element, attributes.cssClass);
        }

        if (attributes.attributes) {
            for (var attr in attributes.attributes) {
                element.setAttribute(attr, attributes.attributes[attr]);
            }
        }

    },


    /**
     * Removes all matching tags from the parent element.
     * Note: This does not remove the contents of the matching elements,
     * it joins them to sibling elements.
     */
    removeTagFromChildren: function(parent, tag, incParent)
    {
        var c          = parent.childNodes.length;
        var childNodes = [];
        for (var i = 0; i < c; i++) {
            childNodes.push(parent.childNodes[i]);
        }

        for (var i = 0; i < c; i++) {
            var child = childNodes[i];
            if (child.nodeType === dfx.ELEMENT_NODE) {
                this.removeTagFromChildren(child, tag, true);
            }
        }

        if (incParent === true) {
            this.removeTag(parent, tag);
        }

    },

    removeTag: function(elem, tag)
    {
        if (elem.parentNode && elem.parentNode.nodeType === dfx.ELEMENT_NODE) {
            if (elem.nodeType === dfx.ELEMENT_NODE) {
                if (elem.tagName.toLowerCase() === tag) {
                    var span = null;
                    if (ViperChangeTracker.isTracking() === true) {
                        span = Viper.document.createElement('span');
                        ViperChangeTracker.setCTData(span, 'tagName', tag);
                        dfx.insertBefore(elem, span);
                        ViperChangeTracker.addChange('removedFormat', [span]);
                    }

                    while (elem.firstChild) {
                        if (span !== null) {
                            span.appendChild(elem.firstChild);
                        } else {
                            dfx.insertBefore(elem, elem.firstChild);
                        }
                    }

                    dfx.remove(elem);
                }
            }//end if
        }//end if

    },

    removeStylesBetweenElems: function(start, end, style)
    {
        var elems = dfx.getElementsBetween(start, end);
        elems.unshift(start);
        var len = elems.length;
        for (var i = 0; i < len; i++) {
            this.removeTagFromChildren(elems[i], style, true);
        }

    },

    removeStyle: function(style)
    {
        var range        = this.getViperRange();
        range            = this.adjustRange(range);
        var startNode    = range.getStartNode();
        var endNode      = range.getEndNode();
        var viperElement = this.getViperElement();

        if (startNode.nodeType === dfx.TEXT_NODE
            && dfx.trim(startNode.data) === ''
            && startNode === viperElement.firstChild
        ) {
            // Firefox sets the first child to be a textNode with \n as its content
            // if whole content is selected. Get the first selectable child.
            startNode = range._getFirstSelectableChild(viperElement);
        }

        if (!endNode) {
            endNode = startNode;
        }

        var startParents = dfx.getParents(startNode, style, this.element);
        var endParents   = dfx.getParents(endNode, style, this.element);

        this.removeStylesBetweenElems(startNode, endNode, style);

        if (startParents.length === 0 && endParents.length === 0) {
            // Start and End is not inside of style tag, so we are done.
            ViperSelection.addRange(range);
            return;
        }

        // Bookmark and get the top style parents.
        var bookmark       = this.createBookmark(range);
        var startTopParent = startParents.pop();
        var endTopParent   = endParents.pop();

        if (startTopParent === endTopParent) {
            var start     = startTopParent.cloneNode(true);
            var selection = startTopParent.cloneNode(true);
            var end       = startTopParent.cloneNode(true);

            // First remove everything from start bookmark to last child.
            var lastChild    = dfx.getLastChild(start);
            var elemsBetween = dfx.getElementsBetween(this.getBookmark(start, 'start'), lastChild);
            elemsBetween.push(this.getBookmark(start, 'start'));
            elemsBetween.push(this.getBookmark(start, 'end'));
            elemsBetween.push(lastChild);
            dfx.remove(elemsBetween);

            // Remove everything from first child to end bookmark.
            var firstChild   = dfx.getFirstChild(end);
            var elemsBetween = dfx.getElementsBetween(firstChild, this.getBookmark(end, 'end'));
            elemsBetween.push(this.getBookmark(end, 'end'));
            elemsBetween.push(this.getBookmark(end, 'start'));
            elemsBetween.push(firstChild);
            dfx.remove(elemsBetween);

            // Remove everything before and after bookmark start and end.
            var firstChild   = dfx.getFirstChild(selection);
            var elemsBetween = dfx.getElementsBetween(firstChild, this.getBookmark(selection, 'start'));
            elemsBetween.push(firstChild);
            dfx.remove(elemsBetween);
            var lastChild    = dfx.getLastChild(selection);
            var elemsBetween = dfx.getElementsBetween(this.getBookmark(selection, 'end'), lastChild);
            elemsBetween.push(lastChild);
            dfx.remove(elemsBetween);

            var div = Viper.document.createElement('div');
            div.appendChild(selection);
            this.removeTagFromChildren(div, style, true);

            dfx.removeEmptyNodes(start);
            dfx.removeEmptyNodes(end);

            dfx.removeEmptyNodes(div, function(elToDel) {
                if (dfx.isTag(elToDel, 'span') === true
                    && dfx.hasClass(elToDel, 'viperBookmark') === true
                ) {
                    // Do not remove bookmark.
                    return false;
                }
            });

            if (start.firstChild) {
                if (dfx.isBlank(dfx.getNodeTextContent(start)) !== true) {
                    dfx.insertBefore(startTopParent, start);
                } else {
                    while (start.firstChild) {
                        dfx.insertBefore(startTopParent, start.firstChild);
                    }
                }
            }

            dfx.insertBefore(startTopParent, div.childNodes);

            if (end.firstChild ) {
                if (dfx.isBlank(dfx.getNodeTextContent(end)) !== true) {
                    dfx.insertBefore(startTopParent, end);
                } else {
                    while (end.firstChild) {
                        dfx.insertBefore(startTopParent, end.firstChild);
                    }
                }
            }

            dfx.remove(startTopParent);

            var originalBookmark = {
                start: this.getBookmark(this.element, 'start'),
                end: this.getBookmark(this.element, 'end')
            };

            this.selectBookmark(originalBookmark);
            return;
        }//end if

        // Start of selection is in the style tag.
        if (startTopParent) {
            var clone = startTopParent.cloneNode(true);

            // Remove everything from bookmark to lastChild (inclusive).
            var lastChild    = dfx.getLastChild(startTopParent);
            var elemsBetween = dfx.getElementsBetween(bookmark.start, lastChild);
            elemsBetween.push(bookmark.start);
            elemsBetween.push(lastChild);
            dfx.remove(elemsBetween);

            // From the cloned node, remove everything from firstChild to start bookmark.
            var firstChild = dfx.getFirstChild(clone);
            elemsBetween   = dfx.getElementsBetween(firstChild, this.getBookmark(clone, 'start'));
            elemsBetween.push(firstChild);
            dfx.remove(elemsBetween);

            // Wrap the clone in to a div then remove its style tag.
            var div = Viper.document.createElement('div');
            div.appendChild(clone);
            this.removeTagFromChildren(div, style);
            dfx.insertAfter(startTopParent, div.childNodes);

            if (dfx.isTag(startTopParent, style) === true) {
                this.removeEmptyNodes(startTopParent);
                if (startTopParent.childNodes.length === 0) {
                    dfx.remove(startTopParent);
                }
            }
        }//end if

        // End of selection is in the style tag.
        if (endTopParent) {
            var clone = endTopParent.cloneNode(true);

            // Remove everything from firstChild to bookmark (inclusive).
            var firstChild   = dfx.getFirstChild(endTopParent);
            var elemsBetween = dfx.getElementsBetween(firstChild, bookmark.end);
            elemsBetween.push(firstChild);
            dfx.remove(elemsBetween);

            // From the cloned node, remove everything from end bookmark to lastChild.
            var lastChild = dfx.getLastChild(clone);
            elemsBetween  = dfx.getElementsBetween(this.getBookmark(clone, 'end'), lastChild);
            elemsBetween.push(lastChild);
            dfx.remove(elemsBetween);

            // Wrap the clone in to a div then remove its style tag.
            var div = Viper.document.createElement('div');
            div.appendChild(clone);
            this.removeTagFromChildren(div, style);
            dfx.insertBefore(endTopParent, div.childNodes);

            if (dfx.isTag(endTopParent, style) === true) {
                this.removeEmptyNodes(endTopParent);
                if (endTopParent.childNodes.length === 0) {
                    dfx.remove(endTopParent);
                }
            }
        }//end if

        var originalBookmark = {
            start: this.getBookmark(this.element, 'start'),
            end: this.getBookmark(this.element, 'end')
        };

        this.selectBookmark(originalBookmark);

    },

    /**
     * Sets the caret position right after the given node.
     *
     * If node does not have a text node sibling then it will be created.
     *
     * @param {DOMNode} node DOMNode to use.
     *
     * @return {boolean} True if it was successful.
     */
    setCaretAfterNode: function(node)
    {
        if (!node || !node.parentNode) {
            return false;
        }

        var range = this.getCurrentRange();
        if (node.nextSibling && node.nextSibling.nodeType === dfx.TEXT_NODE) {
            // Next sibling is a textnode so move the caret to that node.
            node = node.nextSibling;
        } else {
            // Create a new text node and set the caret to that node.
            var text = Viper.document.createTextNode(String.fromCharCode(160));
            dfx.insertAfter(node, text);
            node = text;
        }

        range.setStart(node, 0);
        range.collapse(true);
        ViperSelection.addRange(range);

        this.fireCaretUpdated();

        return true;

    },

    /**
     * Sets the caret position right before the given node.
     *
     * If node does not have a text node sibling then it will be created.
     *
     * @param {DOMNode} node DOMNode to use.
     *
     * @return {boolean} True if it was successful.
     */
    setCaretBeforeNode: function(node)
    {
        if (!node || !node.parentNode) {
            return false;
        }

        var range = this.getCurrentRange();
        if (node.previousSibling && node.previousSibling.nodeType === dfx.TEXT_NODE) {
            // Next sibling is a textnode so move the caret to that node.
            node = node.previousSibling;
        } else {
            // Create a new text node and set the caret to that node.
            var text = this.createSpaceNode();
            dfx.insertBefore(node, text);
            node = text;
        }

        range.setStart(node, node.data.length);
        range.collapse(true);
        ViperSelection.addRange(range);

        this.fireCaretUpdated();

    },

    setCaretAtStart: function(node)
    {
        if (!node || !node.parentNode) {
            return false;
        }

        var range = this.getCurrentRange();
        if (node.nodeType !== dfx.TEXT_NODE) {
            node = range._getFirstSelectableChild(node);
        }

        if (!node) {
            return false;
        }

        range.setStart(node, 0);
        range.collapse(true);
        ViperSelection.addRange(range);

        this.fireCaretUpdated();

        return true;

    },

    setCaretAtEnd: function(node)
    {
        if (!node || !node.parentNode) {
            return false;
        }

        var range = this.getCurrentRange();
        if (node.nodeType !== dfx.TEXT_NODE) {
            node = range._getLastSelectableChild(node);
        }

        if (!node) {
            return false;
        }

        range.setStart(node, node.data.length);
        range.collapse(true);
        ViperSelection.addRange(range);

        this.fireCaretUpdated();

        return true;

    },

    createSpaceNode: function()
    {
        var node = null;
        if (this.isBrowser('msie') === true) {
            node = Viper.document.createTextNode(String.fromCharCode(160));
        } else {
            node = Viper.document.createTextNode(' ');
        }

        return node;

    },

    /**
     * Inserts the newNode after the specified node.
     *
     * Fires 'Viper:beforeInsertAfter' event before inserting the new node so that
     * plugins can prevent or modify node insertion.
     *
     * Also fires 'Viper:nodesChanged' on node.parentNode.
     *
     * @param {DOMNode} node    The node to insert after.
     * @param {DOMNode} newNode The node to insert.
     *
     * @return void
     */
    insertAfter: function(node, newNode)
    {
        // Fire beforeInsertAfter.
        this.fireCallbacks('Viper:beforeInsertAfter', {node: node, newNode: newNode});

        dfx.insertAfter(node, newNode);

        this.fireNodesChanged([node.parentNode]);

    },

    /**
     * Inserts the newNode before the specified node.
     *
     * Fires 'Viper:beforeInsertBefore' event before inserting the new node so that
     * plugins can prevent or modify node insertion.
     *
     * Also fires 'Viper:nodesChanged' on node.parentNode.
     *
     * @param {DOMNode} node    The node to insert before.
     * @param {DOMNode} newNode The node to insert.
     *
     * @return void
     */
    insertBefore: function(node, newNode)
    {
        // Fire beforeInsertAfter.
        this.fireCallbacks('Viper:beforeInsertBefore', {node: node, newNode: newNode});

        dfx.insertBefore(node, newNode);

        this.fireNodesChanged([node.parentNode]);

    },


    selectBookmark: function(bookmark)
    {
        this.blurActiveElement();

        var range       = this.getCurrentRange();
        var startPos    = null;
        var endPos      = null;
        var startOffset = 0;
        var endOffset   = null;
        if (bookmark.start.nextSibling === bookmark.end
            || dfx.getElementsBetween(bookmark.start, bookmark.end).length === 0
        ) {
            // Bookmark is collapsed.
            if (bookmark.end.nextSibling) {
                if ((dfx.isTag(bookmark.end.nextSibling, 'span') !== true || dfx.hasClass(bookmark.end.nextSibling, 'viperBookmark') === false)) {
                    startPos = dfx.getFirstChild(bookmark.end.nextSibling);
                } else {
                    startPos = document.createTextNode('');
                    dfx.insertAfter(bookmark.end, startPos);
                }
            } else if (bookmark.start.previousSibling) {
                startPos = dfx.getFirstChild(bookmark.start.previousSibling);
                if (startPos.nodeType === dfx.TEXT_NODE) {
                    startOffset = startPos.length;
                }
            } else {
                // Create a text node in parent.
                bookmark.end.parentNode.appendChild(Viper.document.createTextNode(''));
                startPos = dfx.getFirstChild(bookmark.end.nextSibling);
            }
        } else {
            if (bookmark.start.nextSibling) {
                startPos = dfx.getFirstChild(bookmark.start.nextSibling);
            } else {
                if (!bookmark.start.previousSibling) {
                    var tmp = Viper.document.createTextNode('');
                    dfx.insertBefore(bookmark.start, tmp);
                }

                startPos    = dfx.getLastChild(bookmark.start.previousSibling);
                startOffset = startPos.length;
            }

            if (bookmark.end.previousSibling) {
                endPos    = dfx.getLastChild(bookmark.end.previousSibling);
                if (endPos.data) {
                    endOffset = endPos.data.length;
                }
            } else {
                endPos    = dfx.getFirstChild(bookmark.end.nextSibling);
                endOffset = 0;
            }
        }//end if

        dfx.remove([bookmark.start, bookmark.end]);

        if (endPos === null) {
            range.setStart(startPos, startOffset);
            range.setEnd(startPos, startOffset);
            range.collapse(false);
        } else {
            var length = 0;

            if (dfx.isStubElement(startPos) === true) {
                // Image etc.
                ViperSelection.removeAllRanges();
                range.selectNode(startPos);
            } else if (dfx.isStubElement(endPos) === true) {
                // Image etc.
                ViperSelection.removeAllRanges();
                range.selectNode(endPos);
            } else {
                // Normalise text nodes and select bookmark.
                while (startPos.previousSibling && startPos.previousSibling.nodeType === dfx.TEXT_NODE) {
                    startOffset += startPos.previousSibling.data.length;

                    if (endPos === startPos) {
                        endOffset += startPos.previousSibling.data.length;
                    }

                    startPos.data = startPos.previousSibling.data + startPos.data;
                    dfx.remove(startPos.previousSibling);
                }

                while (endPos.nextSibling && endPos.nextSibling.nodeType === dfx.TEXT_NODE) {
                    endPos.data += endPos.nextSibling.data;
                    dfx.remove(endPos.nextSibling);
                }

                if (endPos.previousSibling === startPos) {
                    endOffset     += startPos.data.length;
                    startPos.data += endPos.data;
                    dfx.remove(endPos);
                    endPos = startPos;
                } else {
                    while (endPos.previousSibling && endPos.previousSibling.nodeType === dfx.TEXT_NODE) {
                        endPos.data = endPos.previousSibling.data + endPos.data;
                        endOffset  += endPos.previousSibling.data.length;

                        if (endPos.previousSibling === startPos) {
                            startPos = endPos;
                        }

                        dfx.remove(endPos.previousSibling);
                    }

                    if (endPos !== startPos) {
                        while (startPos.nextSibling && startPos.nextSibling.nodeType === dfx.TEXT_NODE) {
                            startPos.data += startPos.nextSibling.data;
                            dfx.remove(startPos.nextSibling);
                        }
                    }
                }

                ViperSelection.removeAllRanges();
                range.setEnd(endPos, endOffset);
                range.setStart(startPos, startOffset);
                range.setEnd(endPos, endOffset);
                range.setStart(startPos, startOffset);
            }//end if
        }

        try {
            ViperSelection.addRange(range);
        } catch (e) {
            // IE may throw exception for hidden elements..
        }

    },

    /*
        TODO: WE need to have id for each bookmark so that we can use
        dfx.getId() to retrieve a specific bookmark on a page. However,
        this will not work if the bookmark is not a part of the DOM tree.
     */
    getBookmark: function(parent, type)
    {
        var bookmarks = dfx.getClass('viperBookmark_' + type, parent);
        var elem      = bookmarks.shift();

        // Remove rest of the bookmarks if there are any..
        dfx.remove(bookmarks);

        return elem;

    },

    isBookmarkElement: function(element)
    {
        if (dfx.hasClass(element, 'viperBookmark') === true) {
            return true;
        }

        return false;

    },

    removeBookmarks: function(elem)
    {
        elem = elem || this.element;
        dfx.remove(dfx.getClass('viperBookmark', elem, 'span'));

    },

    /**
     * Removes the specified bookmark and the contents in it.
     */
    removeBookmark: function(bookmark)
    {
        if (!bookmark.start || !bookmark.end) {
            return false;
        }

        var elems = dfx.getElementsBetween(bookmark.start, bookmark.end);
        elems.push(bookmark.start, bookmark.end);
        dfx.remove(elems);

    },

    createBookmark: function(range, keepOldBookmarks)
    {
        // Remove all bookmarks?
        if (keepOldBookmarks !== true) {
            this.removeBookmarks(this.element);
        }

        var currRange      = range || this.getViperRange();
        var range          = currRange.cloneRange();
        var startContainer = range.startContainer;
        var endContainer   = range.endContainer;
        var startOffset    = range.startOffset;
        var endOffset      = range.endOffset;

        if (range.startContainer
            && range.startContainer === range.endContainer
            && dfx.isTag(range.startContainer, 'br') === true
        ) {
            var prevSibling = range.startContainer.previousSibling;
            var nextSibling = range.startContainer.nextSibling;
            if (prevSibling && prevSibling.nodeType === dfx.TEXT_NODE) {
                range.setStart(prevSibling, prevSibling.data.length);
            } else if (nextSibling && nextSibling.nodeType === dfx.TEXT_NODE) {
                range.setStart(nextSibling, 0);
            } else {
                var tmpNode = document.createTextNode('');
                dfx.insertBefore(range.startContainer, tmpNode);
                range.setStart(tmpNode, 0);
            }

            range.collapse(true);
            ViperSelection.addRange(range);
        } else if (this.isBrowser('firefox') === true
            && startContainer === endContainer
            && startOffset === 0
            && startContainer === this.getViperElement()
            && endOffset >= endContainer.childNodes.length
        ) {
            var firstSelectable = range._getFirstSelectableChild(this.getViperElement());
            var lastSelectable  = range._getLastSelectableChild(this.getViperElement());
            if (firstSelectable && lastSelectable) {
                startContainer = firstSelectable;
                startOffset    = 0;
                range.setStart(firstSelectable, 0);
                range.setEnd(lastSelectable, lastSelectable.data.length);
            }
        }

        // Collapse to the end of range.
        range.collapse(false);

        var endBookmark           = Viper.document.createElement('span');
        endBookmark.style.display = 'none';
        dfx.setHtml(endBookmark, '&nbsp;');
        dfx.addClass(endBookmark, 'viperBookmark viperBookmark_end');
        endBookmark.setAttribute('viperBookmark', 'end');

        var startNode = range.getStartNode();
        range.insertNode(endBookmark);
        if (dfx.isChildOf(endBookmark, this.element) === false) {
            this.element.appendChild(endBookmark);
        }

        // Move the range to where it was before.
        range.setStart(startContainer, startOffset);
        range.collapse(true);

        // Create the start bookmark.
        var startBookmark           = Viper.document.createElement('span');
        startBookmark.style.display = 'none';
        dfx.addClass(startBookmark, 'viperBookmark viperBookmark_start');
        dfx.setHtml(startBookmark, '&nbsp;');
        startBookmark.setAttribute('viperBookmark', 'start');

        try {
            range.insertNode(startBookmark);

            // Make sure start and end are in correct position.
            if (startBookmark.previousSibling === endBookmark) {
                // Reverse..
                dfx.insertBefore(endBookmark, startBookmark);
            }
        } catch (e) {
            // NS_ERROR_UNEXPECTED: I believe this is a Firefox bug.
            // It seems like if the range is collapsed and the text node is empty
            // (i.e. length = 0) then Firefox tries to split the node for no reason and fails...
            dfx.insertBefore(endBookmark, startBookmark);
        }

        if (dfx.isChildOf(startBookmark, this.element) === false) {
            if (this.element.firstChild) {
                dfx.insertBefore(this.element.firstChild, startBookmark);
            } else {
                // Should not happen...
                this.element.appendChild(startBookmark);
            }
        }

        if (this.isBrowser('chrome') === true || this.isBrowser('safari') === true) {
            // Sigh.. Move the range where its suppose to be instead of Webkit deciding that it should
            // move the end of range to the begining of the next sibling -.-.
            if (!endBookmark.previousSibling) {
                var node = endBookmark.parentNode.previousSibling;
                while (node) {
                    if (node.nodeType !== dfx.TEXT_NODE || dfx.isBlank(node.data) === false) {
                        break;
                    }

                    node = node.previousSibling;
                }

                if (node === startBookmark.parentNode) {
                    startBookmark.parentNode.appendChild(endBookmark);
                }
            }
        }

        if (!endBookmark.previousSibling) {
            var tmp = Viper.document.createTextNode('');
            dfx.insertBefore(endBookmark, tmp);
        }

        // The original range object must be changed.
        if (!startBookmark.nextSibling) {
            var tmp = Viper.document.createTextNode('');
            dfx.insertAfter(startBookmark, tmp);
        }

        currRange.setStart(startBookmark.nextSibling, 0);
        currRange.setEnd(endBookmark.previousSibling, (endBookmark.previousSibling.length || 0));

        var bookmark = {
            start: startBookmark,
            end: endBookmark
        };

        return bookmark;

    },

    insertNodeAtBookmark: function(node, bookmark, noSelect)
    {
        if (!bookmark || !node) {
            return;
        }

        dfx.insertBefore(bookmark.start, node);

        if (noSelect !== true) {
            // Select the bookmark.
            this.selectBookmark(bookmark);
        }

    },

    splitNodeAtRange: function(tag, range, copyMidTags)
    {
        range = range || this.getCurrentRange();

        var bookmark = this.createBookmark(range);
        return this.splitNodeAtBookmark(tag, bookmark, copyMidTags);

    },

    /**
        <p>
            sdfsdfsdf <em><strong>ddd<strong><em>sdfkj*sdhf</em>sdfsdfsdf</strong>xxxx</strong></em>
        </p>

        =>
        <p>
            sdfsdfsdf <em><strong>ddd<strong><em>sdfkj</em></strong></strong>
            *<strong>ddd<strong><em>sdhf</em>sdfsdfsdf</strong>xxxx</strong></em>
    */
    splitNodeAtBookmark: function(tag, bookmark, copyMidTags)
    {
        if (!bookmark) {
            return;
        }

        // Get the parent node with specified tag.
        var node      = bookmark.start.parentNode;
        var foundNode = null;
        while (node && node !== this.element) {
            if (dfx.isTag(node, tag) === true) {
                // Note, we do not want to break out of the loop yet..
                // Need to find the most outer parent with specified tag.
                foundNode = node;
            }

            node = node.parentNode;
        }

        var prevNode = null;
        var nextNode = null;
        var midNode  = null;

        if (foundNode === null) {
            // Parent with specified tag was not found.
            prevNode = bookmark.start.previousSibling;
            nextNode = bookmark.end.nextSibling;

            if (!prevNode && !nextNode) {
                prevNode = Viper.document.createTextNode('');
                dfx.insertBefore(bookmark.start, prevNode);
                nextNode = prevNode;
            }
        } else {
            // Construct the end section, which is selection from end bookmark to
            // the end of the found node.
            var selStart = document.createTextNode('');
            var selEnd   = document.createTextNode('');

            dfx.insertAfter(bookmark.end, selStart);
            dfx.insertAfter(foundNode, selEnd);

            var range = this.getViperRange();
            range.setStart(selStart, 0);
            range.setEnd(selEnd, 0);
            var endContents = range.extractContents();

            var tmp = document.createElement('div');
            while (endContents.firstChild) {
                tmp.appendChild(endContents.firstChild);
            }

            var nextNode = null;
            if (this.elementIsEmpty(tmp) === false) {
                while (tmp.lastChild) {
                    nextNode = tmp.lastChild;
                    dfx.insertAfter(selEnd, tmp.lastChild);
                }
            }

            dfx.empty(tmp);

            // Get the mid contents without the specified tag.
            dfx.insertBefore(bookmark.start, selStart);
            dfx.insertAfter(foundNode, selEnd);
            range.setStart(selStart, 0);
            range.setEnd(selEnd, 0);
            var midContents = range.extractContents();

            while (midContents.firstChild) {
                tmp.appendChild(midContents.firstChild);
            }

            var tagsToRemove = dfx.getTag(tag, tmp);
            for (var i = 0; i < tagsToRemove.length; i++) {
                while (tagsToRemove[i].firstChild) {
                    dfx.insertBefore(tagsToRemove[i], tagsToRemove[i].firstChild);
                }

                dfx.remove(tagsToRemove);
            }

            while (tmp.lastChild) {
                dfx.insertAfter(foundNode, tmp.lastChild);
            }

            var prevNode = foundNode;

            dfx.remove(selEnd);

            try {
                selStart.data = '';
            } catch (e) {
                selStart = document.createTextNode('');
            }

            dfx.insertAfter(bookmark.start, selStart);
            midNode = selStart;
        }//end if

        this.selectBookmark(bookmark);

        return {
            prevNode: prevNode,
            nextNode: nextNode,
            midNode: midNode
        };

    },

    /**
     * Highlights the current Viper selection.
     *
     * This method is useful when Viper loses focus and selection needs to be shown,
     * E.g. when a textbox takes focus the Viper selection will be lost, this method
     * will be similar to bookmarking a selection but visible to the user.
     *
     * If the range is collaped nothing will be highlighted.
     *
     * @return {DOMNode}
     */
    highlightSelection: function()
    {
        var highlights = dfx.getClass('__viper_selHighlight', this.element);
        if (highlights.length > 0) {
            return false;
        }

        var range = this.getViperRange();
        if (this.rangeInViperBounds(range) === false) {
            return false;
        }

        var selectedNode = range.getNodeSelection();

        if (selectedNode && selectedNode === this.element) {
            // Viper Element cannot be selected.
            selectedNode = null;
        }

        if (selectedNode && selectedNode.nodeType == dfx.ELEMENT_NODE) {
            dfx.addClass(selectedNode, '__viper_selHighlight __viper_cleanOnly');
        } else if (range.collapsed === true) {
            var span = document.createElement('span');
            dfx.addClass(span, '__viper_selHighlight');
            dfx.setStyle(span, 'border-right', '1px solid #000');
            range.insertNode(span);
            var parentNode = span.parentNode;
            if (parentNode) {
                var tagName = dfx.getTagName(parentNode);
                if (['table', 'tbody', 'tr'].inArray(tagName) === true) {
                    dfx.remove(span);
                }
            }
        } else {
            var attributes = {
                cssClass: '__viper_selHighlight'
            };

            var span = document.createElement('span');
            span.setAttribute('class', '__viper_selHighlight');

            this.surroundContents('span', attributes, range, true);
        }

    },

    highlightToSelection: function(element)
    {
        element = element || this.element;

        // There should be one...
        var highlights = dfx.getClass('__viper_selHighlight', element);
        if (highlights.length === 0) {
            return false;
        }

        var range     = this.getCurrentRange();
        var c         = highlights.length;
        var startNode = false;
        var child     = null;

        if (c === 1 && dfx.hasClass(highlights[0], '__viper_cleanOnly') === true) {
            dfx.removeClass(highlights[0], '__viper_cleanOnly');
            dfx.removeClass(highlights[0], '__viper_selHighlight');
            if (!highlights[0].getAttribute('class')) {
                highlights[0].removeAttribute('class');
            }

            range.selectNode(highlights[0]);
            ViperSelection.addRange(range);
            return true;
        }

        for (var i = 0; i < c; i++) {
            if (highlights[i].firstChild) {
                while (highlights[i].firstChild) {
                    child = highlights[i].firstChild;
                    dfx.insertBefore(highlights[i], child);

                    if (!startNode) {
                        // Set the selection start.
                        startNode = child;
                        range.setStart(child, 0);
                    }
                }

                dfx.remove(highlights[i]);

                if (i === (c - 1)) {
                    if (child.nodeType === dfx.TEXT_NODE) {
                        range.setEnd(child, child.data.length);
                    } else if (startNode === child) {
                        range.selectNode(startNode);
                    } else {
                        var lastSelectable = range._getLastSelectableChild(child);
                        range.setEnd(lastSelectable, lastSelectable.data.length);
                    }
                }
            } else {
                if (highlights[i].nextSibling && highlights[i].nextSibling.nodeType === dfx.TEXT_NODE) {
                    var nextSibling = highlights[i].nextSibling;
                    if (!startNode) {
                        range.setStart(nextSibling, 0);
                        startNode = nextSibling;
                    }

                    dfx.remove(highlights[i]);

                    if (i === (c - 1)) {
                        range.setEnd(nextSibling, 0);
                    }
                } else {
                    var textNode = document.createTextNode('');
                    dfx.insertAfter(highlights[i], textNode);
                    range.setStart(textNode, 0);
                    range.collapse(true);

                    dfx.remove(highlights[i]);

                    if (i === (c - 1)) {
                        range.setEnd(textNode, 0);
                    }
                }//end if
            }//end if
        }//end for

        ViperSelection.addRange(range);

        this._viperRange = range.cloneRange();

        return true;

    },

    removeHighlights: function()
    {
        // There should be one...
        var highlights = dfx.getClass('__viper_selHighlight', this.element);
        if (highlights.length === 0) {
            return;
        }

        for (var i = 0; i < highlights.length; i++) {
            var highlight = highlights[i];

            if (dfx.hasClass(highlight, '__viper_cleanOnly') === true) {
                dfx.removeClass(highlight, '__viper_cleanOnly');
                dfx.removeClass(highlight, '__viper_selHighlight');
                if (!highlight.getAttribute('class')) {
                    highlight.removeAttribute('class');
                }
            } else {
                while (highlight.firstChild) {
                    child = highlight.firstChild;
                    dfx.insertBefore(highlight, child);
                }

                dfx.remove(highlight);
            }
        }//end for

        return true

    },

    isViperHighlightElement: function(element)
    {
        if (dfx.isTag(element, 'span') === true
            && dfx.hasClass(element, '__viper_selHighlight') === true
        ) {
            return true;
        }

        return false;

    },

    hasBlockChildren: function(parent)
    {
        var c = parent.childNodes.length;
        for (var i = 0; i < c; i++) {
            if (parent.childNodes[i].nodeType === dfx.ELEMENT_NODE) {
                if (dfx.isBlockElement(parent.childNodes[i]) === true) {
                    return true;
                }
            }
        }

        return false;

    },

    getBlockChildren: function(parent)
    {
        var children = [];
        var c        = parent.childNodes.length;
        for (var i = 0; i < c; i++) {
            if (parent.childNodes[i].nodeType === dfx.ELEMENT_NODE) {
                if (dfx.isBlockElement(parent.childNodes[i]) === true) {
                    children.push(parent.childNodes[i]);
                }
            }
        }

        return children;

    },

    elementIsEmpty: function(elem)
    {
        if (dfx.isBlank(dfx.getNodeTextContent(elem)) === true) {
            // Might have stub elements.
            var tags = dfx.getTag('*', elem);
            var ln   = tags.length;
            for (var i = 0; i < ln; i++) {
                if (dfx.isStubElement(tags[i]) === true) {
                    return false;
                }
            }

            return true;
        }

        return false;

    },

    fireSelectionChanged: function(range, forceUpdate)
    {
        if (!range) {
            range = this.getViperRange();

            try {
                range = this.adjustRange(range);
            } catch (e) {}
        }

        if (!this._prevRange
            || forceUpdate === true
            || this._prevRange.startContainer !== range.startContainer
            || this._prevRange.endContainer !== range.endContainer
            || this._prevRange.startOffset !== range.startOffset
            || this._prevRange.endOffset !== range.endOffset
            || this._prevRange.collapsed !== range.collapsed
        ) {
            this._prevRange = range;
            this.fireCallbacks('Viper:selectionChanged', range);
        }

    },

    /**
     * Returns true if the given key event matches the given key combinations.
     *
     * @param {event}  e    The DOMEvent.
     * @param {string} keys The key combination string, e.g. CTRL+B or alt+shift+k.
     *
     * @return {boolean} Returns true if keys atch.
     */
    isKey: function(e, keys)
    {
        var eKeys = [];
        if (e.ctrlKey === true || e.metaKey === true) {
            eKeys.push('ctrl');
        }

        if (e.shiftKey === true) {
            eKeys.push('shift');
        }

        if (e.altKey === true) {
            eKeys.push('alt');
        }

        switch (e.keyCode) {
            case 13:
                eKeys.push('enter');
            break;

            case dfx.DOM_VK_LEFT:
                eKeys.push('left');
            break;

            case dfx.DOM_VK_RIGHT:
                eKeys.push('right');
            break;

            case dfx.DOM_VK_UP:
                eKeys.push('up');
            break;

            case dfx.DOM_VK_DOWN:
                eKeys.push('down');
            break;

            case 9:
                eKeys.push('tab');
            break;

            case dfx.DOM_VK_DELETE:
                eKeys.push('delete');
            break;

            case dfx.DOM_VK_BACKSPACE:
                eKeys.push('backspace');
            break;

            default:
                var code = e.which;

                // Other characters (a-z0-9..).
                if (code) {
                    eKeys.push(String.fromCharCode(code).toLowerCase());
                }
            break;
        }//end switch

        eKeys = eKeys.sort();

        keys       = keys.toLowerCase().split('+').sort();
        var kCount = keys.length;
        if (kCount !== eKeys.length) {
            return false;
        }

        for (var i = 0; i < kCount; i++) {
            if (keys[i] !== eKeys[i]) {
                return false;
            }
        }

        return true;

    },

    isInputKey: function(e)
    {
         if ((e.which !== 0 || e.keyCode === 46)
            && e.ctrlKey !== true
            && e.altKey !== true
            && e.metaKey !== true
        ) {
            return true;
        }

        return false;

    },

    /**
     * Returns true if the given key event is using a registered special key.
     *
     * Special keys allow plugins to modify the key events when a specific key is pressed.
     *
     * @param {event} e The DOM key event.
     */
    isSpecialKey: function(e)
    {
        return this._specialKeys.inArray(e.which);

    },

    /**
     * Registers a special key.
     *
     * Special keys allow plugins to modify the key events when a specific key is pressed.
     *
     * @param {integer} keyCode The key code for the key event.
     */
    addSpecialKey: function(keyCode)
    {
        this._specialKeys.push(keyCode);

    },


    /**
     * Keeps track of range status during keydown and keyup event.
     *
     * This var prevents keyUp event firing selectionChanged for each key up event.
     * Its for performance reasons only.
     */
    _keyDownRangeCollapsed: true,

    /**
     * Handle the keyDown event.
     *
     * @param {event} e The event object.
     *
     * return {void|boolean} Returns false if default event needs to be blocked.
     */
    keyDown: function(e)
    {
        this._viperRange = null;

        if (this._keyDownRangeCollapsed === true) {
            var range = this.getCurrentRange();
            this._keyDownRangeCollapsed = range.collapsed;
        }

        if (e.which === dfx.DOM_VK_DELETE
            && ViperChangeTracker.isTracking() === true
            && this.isBrowser('firefox') === false
        ) {
            // Handle delete OP here because some browsers (e.g. Chrome, IE) does not
            // fire keyPress when DELETE is held down.
            this.deleteContents();
            return false;
        }

        var returnValue = this.fireCallbacks('Viper:keyDown', e);
        if (returnValue === false) {
            dfx.preventDefault(e);
            return false;
        }

        if (e.ctrlKey === false
            && e.altKey === false
            && (e.shiftKey === false || e.which !== 16)
            && e.metaKey === false
        ) {
            // Nothing special about this key let the browser handle it unless
            // the track changes is activated or no plugin is direcly modifying it.
            if (this.isSpecialKey(e) === false) {
                if (this.isBrowser('firefox') === true) {
                    this._firefoxKeyDown();
                } else if ((this.isKey(e, 'backspace') === true || this.isKey(e, 'delete') === true)
                    && (this.isBrowser('chrome') === true || this.isBrowser('safari') === true || this.isBrowser('msie') === true)
                ) {
                    // Webkit does not fire keypress event for delete and backspace keys..
                    this.fireNodesChanged();
                }//end if

                return true;
            }//end if
        } else if (e.which === 65 && (e.metaKey === true || e.ctrlKey === true)) {
            // CMD/CTRL + A needs to fire selection changed.
            var self = this;
            setTimeout(function() {
                self.fireSelectionChanged();
            }, 50);
            return true;
        }//end if

    },

    _firefoxKeyDown: function()
    {
        var range = this.getCurrentRange();
        var elem  = this.getViperElement();
        if (elem.childNodes.length === 0
            || (elem.childNodes.length === 1 && dfx.isTag(elem.childNodes[0], 'br') === true)
            || (elem === range.startContainer && elem === range.endContainer && range.startOffset === 0)
        ) {
            var tagName = this.getDefaultBlockTag();
            if (elem.childNodes.length === 1 && dfx.isBlockElement(elem.childNodes[0]) === true) {
                tagName = dfx.getTagName(elem.childNodes[0]);
            }

            var textNode = document.createTextNode('');
            if (!tagName) {
                dfx.setHtml(this.element, '');
                this.element.appendChild(textNode);
            } else {
                dfx.setHtml(this.element, '<' + tagName + '></' + tagName + '>');
                this.element.firstChild.appendChild(textNode);
            }

            range.setStart(textNode, 0);
            range.collapse(true);
            ViperSelection.addRange(range);
        }

        // When element is empty Firefox puts <br _moz_dirty="" type="_moz">
        // in to the element which stops text typing, so remove the br tag
        // and add an empty text node and set the range to that node.
        if (range.startContainer === range.endContainer
            && dfx.isTag(range.startContainer, 'br') === true)
        {
            var textNode = document.createTextNode('');
            dfx.insertAfter(range.startContainer, textNode);
            dfx.remove(range.startContainer);
            range.setStart(textNode, 0);
            range.collapse(true);
            ViperSelection.addRange(range);
        }

    },


    /**
     * Handle the keyPress event.
     *
     * @param {event} e The event object.
     *
     * return {boolean} Returns false if default event needs to be blocked.
     */
    keyPress: function(e)
    {
        if (this._preventKeyPress === true || this.enabled !== true) {
            this._preventKeyPress = false;
            return true;
        }

        // Check that keyCode is not 0 as Firefox fires keyPress for arrow keys which
        // have key code of 0.
        if (e.which !== 0 && ViperChangeTracker.isTracking() === true) {
             if (e.which === dfx.DOM_VK_DELETE) {
                // Handle delete OP here because some browsers (e.g. Chrome, IE) does not
                // fire keyPress when DELETE is held down.
                this.deleteContents();
                return false;
            }

            // Need to call Viper function to track changes for this keyPress.
            if (e.ctrlKey !== true
                && e.altKey !== true
                && e.shiftKey !== true
                && e.metaKey !== true
            ) {
                return this.insertTextAtCaret(String.fromCharCode(e.which));
            }
        }

        var returnValue = this.fireCallbacks('Viper:keyPress', e);
        if (returnValue === false) {
            dfx.preventDefault(e);
            return false;
        }

        if (this.isInputKey(e) === true) {
            this.fireCallbacks('Viper:charInsert', String.fromCharCode(e.which));

            var resetContent = false;
            var range = this.getCurrentRange();
            if (range.startOffset === 0
                && range.endContainer === this.element
                && range.endOffset === (this.element.childNodes.length - 1)
                && range.startContainer === range._getFirstSelectableChild(this.element)
            ) {
                resetContent = true;
            } else if (this.isBrowser('msie') === true
                && range.endContainer === this.element
                && range.endOffset === 0
                && range.startOffset === 0
                && range.startContainer === range._getFirstSelectableChild(this.element)
            ) {
                resetContent = true;
            } else if (range.startOffset === 0
                && range.endContainer === range._getLastSelectableChild(this.element)
                && range.endOffset === range.endContainer.data.length
                && range.startContainer === range._getFirstSelectableChild(this.element)
            ) {
                resetContent = true;
            }

            if (resetContent === true) {
                var tagName = this.getDefaultBlockTag();
                if (this.element.childNodes.length === 1 && dfx.isBlockElement(this.element.childNodes[0]) === true) {
                    // There is only one block element in the content so use its tag
                    // name.
                    tagName = dfx.getTagName(this.element.childNodes[0]);
                }

                // The whole content is selected and a char is being
                // typed. Remove the whole content of the editable element.
                if (!tagName) {
                    dfx.setHtml(this.element, '');
                } else {
                    dfx.setHtml(this.element, '<' + tagName + '>&nbsp;</' + tagName + '>');
                    range.setStart(range._getFirstSelectableChild(this.element), 0);
                }

                range.collapse(true);
                ViperSelection.addRange(range);
            }

            this.fireNodesChanged([range.getStartNode()]);
            return true;
        }

        return true;

    },

    keyUp: function(e)
    {
        if (this.fireCallbacks('Viper:keyUp', e) === false) {
            dfx.preventDefault(e);
            return false;
        }

        if (e.which === dfx.DOM_VK_DELETE) {
            // Check if the content is now empty.
            var html = dfx.getHtml(this.element);
            if (!html || html === '<br>') {
                dfx.setHtml(this.element, '');
                this.initEditableElement();
            }
        }

        // Shift, Control, Alt, Caps lock, esc, CMD.
        var ignoredKeys = [16, 17, 18, 20, 27, 91];

        if ((this._keyDownRangeCollapsed === false && ignoredKeys.inArray(e.which) === false)
            && (e.ctrlKey === false && e.metaKey === false)
            || e.which === 8
            || e.which === 46
            || (e.which >= 37 && e.which <= 40)
        ) {
            this.fireSelectionChanged();
        }

        this._keyDownRangeCollapsed = true;

    },

    mouseDown: function(e)
    {
        var target = dfx.getMouseEventTarget(e);
        var inside = true;

        if (this.element !== target && this.isChildOfElems(target, [this.element]) !== true) {
            inside = false;

            // Ask plugins if its one of their element.
            var pluginName = this.getPluginForElement(target);
            if (!pluginName && this.isChildOfElems(target, [this._viperElementHolder]) !== true) {
                this.setEnabled(false);
                return this.fireCallbacks('Viper:clickedOutside', e);
            } else {
                return true;
            }
        } else if (this.enabled === false) {
            this.setEnabled(true);
        }

        this.removeHighlights();

        this.fireCallbacks('Viper:clickedInside', e);
        this.fireCaretUpdated();

        // Mouse down in active element.
        if (this.fireCallbacks('Viper:mouseDown', e) === false) {
            dfx.preventDefault(e);
            return false;
        }

        if (inside !== true || this.removeHighlights() !== true) {
            var self = this;
            setTimeout(function() {
                var range = null;
                try {
                    range = self.adjustRange();
                } catch (e) {}

                // Delay calling the fireSelectionChanged to get the updated range.
                self.fireSelectionChanged(range);
            }, 5);
        }

        this._viperRange = null;

    },

    mouseUp: function(e)
    {
        if (this.fireCallbacks('Viper:mouseUp', e) === false) {
            dfx.preventDefault(e);
            return false;
        }

        var target     = dfx.getMouseEventTarget(e);
        var pluginName = this.getPluginForElement(target);
        if (pluginName || this.isChildOfElems(target, [this._viperElementHolder]) === true) {
            return;
        }

        // This setTimeout is very strange indeed. We need to wait a bit for browser
        // to update the selection object..
        var self = this;
        setTimeout(function() {
            var range = null;
            try {
                range = self.adjustRange();
            } catch (e) {}

            if (range.collapsed === true && self.isBrowser('msie') === true) {
                // If clicked inside the previous selection then IE takes a lot
                // longer to update the caret position so if the range is collapsed
                // wait nearly half a second to trigger the selection changed
                // event.
                setTimeout(function() {
                    self.fireSelectionChanged(self.adjustRange(), true);
                }, 500);
            } else {
                self.fireSelectionChanged(range, true);
            }
        }, 5);

    },

    /**
     * Adjusts the given range so a better selection is made.
     *
     * @param {ViperDOMRange} The range object.
     *
     * @return {ViperDOMRange} The updated range.
     */
    adjustRange: function(range)
    {
        range = range || this.getViperRange();
        if (range.collapsed !== false) {
            return range;
        }

        // A few range adjustments for double click word selection etc.
        var startNode = range.getStartNode();
        var endNode   = range.getEndNode();

        if (!endNode && startNode && dfx.isStubElement(startNode) === true) {
            return range;
        }

        if (!endNode && range.startContainer && range.startContainer.nodeType === dfx.ELEMENT_NODE) {
            var lastSelectable = range._getLastSelectableChild(range.startContainer);
            if (lastSelectable) {
                endNode = lastSelectable;
                range.endContainer = endNode;
                range.endOffset = endNode.data.length;
                ViperSelection.addRange(range);
            }
        }

        if (startNode && startNode.nodeType === dfx.TEXT_NODE
            && endNode && endNode.nodeType === dfx.TEXT_NODE
            && startNode.data.length === range.startOffset
            && range.endOffset === 0
            && startNode.nextSibling
            && startNode.nextSibling === endNode.previousSibling
            && startNode.nextSibling.nodeType !== dfx.TEXT_NODE
        ) {
            // When a word is double clicked and the word is wrapped with a tag
            // e.g. strong then select the strong tag.
            var firstSelectable = range._getFirstSelectableChild(startNode.nextSibling);
            var lastSelectable  = range._getLastSelectableChild(startNode.nextSibling);
            range.setStart(firstSelectable, 0);
            range.setEnd(lastSelectable, lastSelectable.data.length);
            ViperSelection.addRange(range);
        } else if (endNode && endNode.nodeType === dfx.TEXT_NODE
            && range.endOffset === 0
            && endNode !== startNode
            && endNode.previousSibling
            && endNode.previousSibling.nodeType !== dfx.TEXT_NODE
        ) {
            // When a word at the end of a tag is double clicked then move the
            // end of the range to the last selectable child of that tag.
            var textChild = range._getLastSelectableChild(endNode.previousSibling);
            if (textChild) {
                range.setEnd(textChild, textChild.data.length);
                ViperSelection.addRange(range);
            }
        } else if (startNode
            && endNode
            && startNode.nodeType === dfx.TEXT_NODE
            && endNode.nodeType === dfx.TEXT_NODE
            && range.startOffset === 0
            && range.endOffset === endNode.data.length
        ) {
            if (range.endOffset === 0 && !endNode.previousSibling) {
                // In Webkit, when a whole paragraph is selected sometimes the range
                // starts from the beginning of the next paragraph causing range to
                // span two paragraphs.. If this is the case then move the range...
                var lastSelectable  = range._getLastSelectableChild(endNode.parentNode.previousSibling.previousSibling);
                if (lastSelectable) {
                    range.setEnd(lastSelectable, lastSelectable.data.length);
                    ViperSelection.addRange(range);
                }
            }
        } else if (startNode && startNode.nodeType === dfx.TEXT_NODE
            && endNode && endNode.nodeType === dfx.TEXT_NODE
            && startNode.data.length === range.startOffset
            && startNode !== endNode
            && startNode.nextSibling
            && startNode.nextSibling.nodeType !== dfx.TEXT_NODE
        ) {
            // A range starts at the end of a text node and the next sibling
            // is not a text node so move the range inside the first selectable
            // child of the next sibling. This usually happens in FF when you
            // double click a word which is at the start of a strong/em/u tag,
            // we move the range inside the tag.
            var firstSelectable = range._getFirstSelectableChild(startNode.nextSibling);
            if (firstSelectable) {
                range.setStart(firstSelectable, 0);
                ViperSelection.addRange(range);
            }
        } else if (endNode && endNode.nodeType === dfx.ELEMENT_NODE && dfx.isTag(endNode, 'br') === true) {
            // Firefox adds br tags at the end of new paragraphs sometimes selecting
            // text from somewhere in paragraph to the end of paragraph causes
            // selection issues.
            if (endNode.previousSibling) {
                var child = range._getLastSelectableChild(endNode.previousSibling);
                if (child) {
                    range.setEnd(child, child.data.length);
                    ViperSelection.addRange(range);
                }
            }
        }//end if

        return range;

    },

    focus: function()
    {
        if (this.element) {
            try {
                if (this.isBrowser('msie') === true) {
                    var range = this.getViperRange();
                    ViperSelection.addRange(range);

                    this.fireCaretUpdated();
                    this.fireCallbacks('Viper:focused');
                    return;
                }

                var scrollCoords = dfx.getScrollCoords(this.getDocumentWindow());
                this.element.focus();

                var range = this.getViperRange();
                ViperSelection.addRange(range);

                // IE and Webkit fix.
                Viper.window.scrollTo(scrollCoords.x, scrollCoords.y);

                this.fireCaretUpdated();

                this.fireCallbacks('Viper:focused');
            } catch (e) {
                // Catch the IE error: Can't move focus to control because its invisible.
            }
        }

    },

    setRange: function(elem, pos)
    {
        this.blurActiveElement();

        var range = this.getCurrentRange();

        range.setEnd(elem, pos);
        range.collapse(false);
        ViperSelection.addRange(range);

        return range;

    },

    blurActiveElement: function()
    {
        if (document.activeElement
            && document.activeElement !== this.element
            && document.activeElement.blur
            && document.activeElement !== document.body
        ) {
            // Call the blur method of the active element incase its an input box etc
            // which causes problems on IE when range is set below.
            // Note that the above activeElement != body check is to prevent the best
            // browser in the world changing focus to another window..
            document.activeElement.blur();
        }

    },

    fireCaretUpdated: function(range)
    {
        range = range || this.getCurrentRange();
        this.fireCallbacks('caretPositioned', {range: range});

    },

    fireNodesChanged: function(nodes)
    {
        if (!nodes) {
            nodes = [this.element];
        }

        this.getViperRange().clearNodeSelectionCache();

        this.fireCallbacks('Viper:nodesChanged', nodes);

        // Update the markers.
        ViperChangeTracker.updatePositionMarkers(true);

        if (nodes.length === 1 && nodes[0] && nodes[0].nodeType === dfx.TEXT_NODE) {
            this.ViperHistoryManager.add('Viper', 'text_change');
        } else {
            this.ViperHistoryManager.add();
        }

    },

    isChildOfElems: function(el, parents)
    {
        while (el && el.parentNode) {
            if (parents.inArray(el.parentNode) === true) {
                return true;
            }

            el = el.parentNode;
        }

        return false;

    },

    isChildOfClass: function(el, className, checkSelf)
    {
        if (checkSelf === true
            && el
            && dfx.hasClass(el.parentNode, className) === true
        ) {
            return true;
        }

        while (el && el.parentNode) {
            if (dfx.hasClass(el.parentNode, className) === true) {
                return true;
            }

            el = el.parentNode;
        }

        return false;

    },

    _setupCoreTrackChangeActions: function()
    {
        var self = this;
        ViperChangeTracker.setApproveCallback('textRemoved', function(clone, node) {
            // If removed text is approved then just remove the actual node.
            self.removeElem(node);
        });

        ViperChangeTracker.setRejectCallback('textRemoved', function(clone, node) {
            // Move all the content inside the node to outside.
            while (node.firstChild) {
                if (node.firstChild.nodeType === dfx.ELEMENT_NODE
                    && ViperChangeTracker.isTrackingNode(node.firstChild)
                ) {
                    dfx.remove(node.firstChild);
                } else {
                    dfx.insertBefore(node, node.firstChild);
                }
            }

            self.removeElem(node);
        });

        ViperChangeTracker.setApproveCallback('textAdded', function(clone, node) {
            // Move all the content inside the node to outside.
            while (node.firstChild) {
                dfx.insertBefore(node, node.firstChild);
            }

            self.removeElem(node);
        });

        ViperChangeTracker.setRejectCallback('textAdded', function(clone, node) {
            // Just remove the INS node.
            self.removeElem(node);
        });

        ViperChangeTracker.setApproveCallback('merged', function(clone, node) {
            self.removeElem(node);
        });

        ViperChangeTracker.setDescriptionCallback('merged', function(node) {
            return 'Text';
        });

        ViperChangeTracker.setRejectCallback('merged', function(clone, node) {
            var newParent = node.parentNode.cloneNode(false);
            dfx.insertAfter(node.parentNode, newParent);

            var elems = dfx.getElementsBetween(node, newParent);
            var elem  = null;
            while (elem = elems.shift()) {
                newParent.appendChild(elem);
            }

            self.removeElem(node);
        });

        ViperChangeTracker.setApproveCallback('viperComment', function(clone, node) {
            ViperChangeTracker.removeTrackChanges(node, false);
        });

    },

    getPluginForElement: function(element)
    {
        return this.getPluginManager().getPluginForElement(element);

    },

    registerCallback: function(type, namespace, callback)
    {
        if (dfx.isFn(callback) === false) {
            return;
        }

        if (dfx.isArray(type) === true) {
            for (var i = 0; i < type.length; i++) {
                this.registerCallback(type[i], namespace, callback);
            }

            return;
        }

        if (!this.callbacks[type]) {
            this.callbacks[type] = {
                namespaces: {},
                others: []
            };
        }

        if (namespace) {
            this.callbacks[type].namespaces[namespace] = callback;
        } else {
            this.callbacks[type].others.push(callback);
        }

    },

    fireCallbacks: function(type, data, doneCallback)
    {
        var callbackList = [];
        if (this.callbacks[type]) {
            // Put the callbacks in an array.
            for (var namespace in this.callbacks[type].namespaces) {
                if (this.callbacks[type].namespaces.hasOwnProperty(namespace) === true) {
                    var callback = this.callbacks[type].namespaces[namespace];
                    if (callback) {
                        callbackList.push(callback);
                    }
                }
            }

            var len = this.callbacks[type].others.length;
            for (var i = 0; i < len; i++) {
                callbackList.push(this.callbacks[type].others[i]);
            }
        }

        return this._fireCallbacks(callbackList, data, doneCallback);

    },

    _fireCallbacks: function(callbacks, data, doneCallback, retVal)
    {
        if (callbacks.length === 0 || retVal === false) {
            if (doneCallback) {
                doneCallback.call(this, data, retVal);
            }

            return retVal;
        }

        var callback = callbacks.shift();
        if (callback) {
            var self   = this;
            var retVal = callback.call(this, data, function(retVal) {
                self._fireCallbacks(callbacks, data, doneCallback, retVal);
            });

            return this._fireCallbacks(callbacks, data, doneCallback, retVal);
        }

    },

    removeCallback: function(type, namespace)
    {
        if (!type) {
            if (namespace) {
                // Remove all events for specified namespace.
                for (var type in this.callbacks) {
                    if (this.callbacks.hasOwnProperty(type) === true) {
                        this.removeCallback(type, namespace);
                    }
                }
            }
        } else if (this.callbacks[type]) {
            if (namespace) {
                if (this.callbacks[type].namespaces[namespace]) {
                    //this.callbacks[type].namespaces[namespace] = [];
                    delete this.callbacks[type].namespaces[namespace];
                }
            } else {
                // Remove all.
                delete this.callbacks[type];
            }
        }

    },


    /**
     * Gets the clean source code of the element.
     *
     * @return string.
     */
    getHtml: function(elem, settings)
    {
        elem = elem || this.element;

        if (typeof elem === 'string') {
            var tmp = elem;
            elem    = Viper.document.createElement('div');
            dfx.setHtml(elem, tmp);
        }

        if (!elem) {
            return '';
        }

        var originalSettings = this.getSettings();

        if (!settings) {
            // When getHtml is called the final output of empty table cells should
            // be &nbsp; to make them look fine in all browsers.
            this.setSetting('emptyTableCellContent', '&nbsp;');
        } else {
            this.setSettings(settings);
        }

        // Clone the element so we dont modify the actual contents.
        var clone = elem.cloneNode(true);

        this.removeEmptyNodes(clone);

        // Remove special Viper elements.
        this._removeViperElements(clone);

        // TODO: What if some of the plugins need to run after plugin X, Y, Z
        // e.g. Keyword plugin?
        // Plugins can hookin to this method to modify the HTML
        // before Viper returns its HTML contents.
        this.fireCallbacks('Viper:getHtml', {element: clone});
        var html = dfx.getHtml(clone);
        html     = this.cleanHTML(html);

        html = html.replace(/<\/viper:param>/ig, '');
        html = html.replace(/<viper:param /ig, '<param ');
        html = html.replace(/<:object/ig, '<object');
        html = html.replace(/<\/:object/ig, '</object');

        // Revert to original settings.
        this.setSettings(originalSettings, true);

        return html;

    },

    getRawHTML: function(elem)
    {
        elem = elem || this.element;
        return dfx.getHtml(elem);

    },

    setRawHTML: function(html)
    {
        dfx.setHtml(this.element, html);

    },

    /**
     * Gets the HTML (not source) contents of the editable element.
     * Returned value contains Viper specific elements.
     *
     * @return string.
     */
    getContents: function(elem)
    {
        elem = elem || this.element;

        // Clone the element so we dont modify the actual contents.
        var clone = elem.cloneNode(true);

        // Remove special Viper elements.
        this._removeViperElements(clone);

        // Plugins can hookin to this method to modify the HTML
        // before Viper returns its HTML contents.
        this.fireCallbacks('getContents', {element: clone});
        var html = dfx.getHtml(clone);

        if (this.isBrowser('msie') === true) {
            html = html.replace(/<:object /ig, '<object ');
            html = html.replace(/<\/:object>/ig, '</object>');
        }

        return html;

    },

    _removeViperElements: function(elem)
    {
        var bookmarks = dfx.getClass('viperBookmark', elem);
        if (bookmarks) {
            dfx.remove(bookmarks);
        }

        // Remove viper selection.
        var highlights = dfx.getClass('__viper_selHighlight', elem);
        for (var i = 0; i < highlights.length; i++) {
            if (dfx.hasClass(highlights[i], '__viper_cleanOnly') !== true) {
                while (highlights[i].firstChild) {
                    dfx.insertBefore(highlights[i], highlights[i].firstChild);
                }

                dfx.remove(highlights[i]);
            } else {
                dfx.removeClass(highlights[i], '__viper_selHighlight');
                dfx.removeClass(highlights[i], '__viper_cleanOnly');
                if (!highlights[0].getAttribute('class')) {
                    highlights[0].removeAttribute('class');
                }
            }
        }

    },

    /**
     * Sets the Viper content that may contain Viper specified elements.
     */
    setContents: function(contents)
    {
        if (typeof contents === 'string') {
            this.element.innerHTML = contents;
        } else if (contents) {
            this.element.appendChild(contents);
        }

        this.fireCallbacks('setContents', {element: this.element});

        this.initEditableElement();

    },

    /**
     * Sets the Viper content, content cannot contain Viper specific elements.
     */
    setHtml: function(contents, callback)
    {
        var clone = Viper.document.createElement('div');

        if (typeof contents === 'string') {
            clone.innerHTML = contents;
            dfx.remove(dfx.getTag('script', clone));
        } else if (contents) {
            clone.appendChild(contents);
        }

        this._viperRange = null;

        var range          = this.getCurrentRange();
        var lastSelectable = range._getLastSelectableChild(clone);
        if (lastSelectable && lastSelectable.nodeType === dfx.TEXT_NODE) {
            lastSelectable.data = dfx.rtrim(lastSelectable.data);
        }

        this.removeEmptyNodes(clone);

        var self = this;
        this.fireCallbacks('setHtml', {element: clone}, function() {
            var html = dfx.getHtml(clone);
            if (self.isBrowser('msie') === true && self.getBrowserVersion() === 8) {
                // IE8 has problems with param tags, it removes them from the content
                // so Viper needs to change the tag name when content is being set
                // and change it back to original when content is being retrieved.
                html = html.replace(/<\/param>/ig, '</viper:param>');
                html = html.replace(/<param /ig, '<viper:param ');
            }

            self.element.innerHTML = html;
            self.initEditableElement();

            self.fireNodesChanged();
            if (callback) {
                callback.call(this);
            }
        });

    },

    cleanHTML: function(content, attrBlacklist)
    {
        attrBlacklist  = attrBlacklist || ['sizset'];

        content = content.replace(/<(p|div|h1|h2|h3|h4|h5|h6|li)((\s+\w+(\s*=\s*(?:".*?"|\'.*?\'|[^\'">\s]+))?)+)?\s*>\s*/ig, "<$1$2>");
        content = content.replace(/\s*<\/(p|div|h1|h2|h3|h4|h5|h6|li)((\s+\w+(\s*=\s*(?:".*?"|\'.*?\'|[^\'">\s]+))?)+)?\s*>/ig, "</$1$2>");
        content = content.replace(/<(area|base|basefont|br|hr|input|img|link|meta|embed|viper:param|param)((\s+\w+(\s*=\s*(?:".*?"|\'.*?\'|[^\'">\s]+))?)+)?\s*>/ig, "<$1$2 />");
        content = content.replace(/<\/?\s*([A-Z\d:]+)/g, function(str) {
            return str.toLowerCase();
        });

        content = this.replaceEntities(content);

        // Regex to get list of HTML tags.
        var subRegex  = '\\s+([:\\w]+)(?:\\s*=\\s*("(?:[^"]+)?"|\'(?:[^\']+)?\'|[^\'">\\s]+))?';

        // Regex to get list of attributes in an HTML tag.
        var tagRegex  = new RegExp('(<[\\w:]+)(?:' + subRegex + ')+\\s*(\/?>)', 'g');
        var attrRegex = new RegExp(subRegex, 'g');

        content = content.replace(tagRegex, function(match, tagStart, a, tagEnd) {
            match = match.replace(attrRegex, function(a, attrName, attrValue) {
                // All attribute names must be lowercase.
                attrName = attrName.toLowerCase();

                if (attrBlacklist.inArray(attrName) === true) {
                    // This attribute is not allowed.
                    return '';
                } else if (attrName.indexOf(':') >= 0) {
                    return '';
                } else if (attrName.match(/^sizcache\d+$/)) {
                    return '';
                }

                if (attrName === 'style') {
                    // Style attribute value must be lowercase.
                    attrValue = attrValue.toLowerCase();
                }

                // Remove single and double quotes and then wrap the value with
                // double quotes.
                if (attrValue) {
                    attrValue = dfx.trim(attrValue, '"\'');
                } else {
                    attrValue = '';
                }

                var res = ' ' + attrName + '="' + attrValue + '"';
                return res;
            });

            return match;
        });

        return content;

    },

    /**
     * Cleans the contents of the given DOM element.
     *
     * @param {DOMNode} elem    The element to clean, if not specified Viper element is used.
     * @param {string}  tagName If specified only this type of tag is cleaned.
     *
     * @return {void}
     */
    cleanDOM: function(elem, tagName)
    {
        if (!elem) {
            elem = this.element;
        }

        // Remove attributes with empty values.
        dfx.removeAttr(dfx.find(elem, '[style=""]'), 'style');
        dfx.removeAttr(dfx.find(elem, '[class=""]'), 'class');

        this._cleanDOM(elem, tagName, true);

        var range = this.getViperRange();
        var lastElem = range._getLastSelectableChild(elem);
        if (lastElem && lastElem.nodeType === dfx.TEXT_NODE) {
            lastElem.data = dfx.rtrim(lastElem.data.replace(/(&nbsp;)*$/, ''));
        }

    },

    _cleanDOM: function(elem, tagName, topLevel)
    {
        if (!elem) {
            return;
        }

        if (elem.firstChild && dfx.isTag(elem, 'pre') !== true) {
            this._cleanDOM(elem.firstChild, tagName);
        }

        if (elem === this.element || topLevel === true) {
            return;
        }

        var nextSibling = elem.nextSibling;
        this._cleanNode(elem, tagName);

        if (nextSibling) {
            this._cleanDOM(nextSibling, tagName);
        }

    },

    _cleanNode: function(node, tag)
    {
        if (node === this.element) {
            return;
        }

        if (node.nodeType === dfx.ELEMENT_NODE) {
            var tagName = node.tagName.toLowerCase();
            if (tag && tag != tagName) {
                return;
            }

            switch (tagName) {
                case 'br':
                    if (!node.nextSibling
                        || (node.hasAttribute && node.hasAttribute('_moz_dirty'))
                    ) {
                        if (!node.previousSibling
                            && (dfx.isTag(node.parentNode, 'td') === true
                            || dfx.isTag(node.parentNode, 'th') === true)
                        ) {
                            // This BR element is the only child of the table cell,
                            // depending on emptyTableCellContent, set the cell's
                            // content.
                            var emptyTableCellContent = this.getSetting('emptyTableCellContent');
                            dfx.setHtml(node.parentNode, emptyTableCellContent);
                            return;
                        }

                        if (tag) {
                            var newNode = Viper.document.createTextNode(' ');
                            dfx.insertBefore(node, newNode);
                        }

                        dfx.remove(node);
                    } else {
                        // Also remove the br tags that are at the end of an element.
                        // They are usually added to give the empty element height/width.
                        var next   = node.nextSibling;
                        var brLast = true;
                        while (next) {
                            if (next.nodeType !== dfx.TEXT_NODE || dfx.trim(next.nodeValue) !== '') {
                                brLast = false;
                                break;
                            }

                            next = next.nextSibling;
                        }

                        if (brLast === true) {
                            dfx.remove(node);
                        }
                    }//end if
                break;

                case 'a':
                    if (!node.getAttribute('name') && !node.firstChild) {
                        dfx.remove(node);
                    }
                break;

                case 'td':
                case 'th':
                case 'caption':
                    var html = dfx.trim(dfx.getHtml(node));
                    if (html === '' || dfx.trim(html.replace(/&nbsp;/g, '')) === '') {
                        dfx.setHtml(node, '&nbsp;');
                    }
                break;

                case 'strong':
                case 'em':
                    if (dfx.isTag(node.parentNode, tagName) === true) {
                        // Same as parent tag, move child nodes out and remove this
                        // node.
                        while (node.firstChild) {
                            dfx.insertBefore(node, node.firstChild);
                        }

                        dfx.remove(node);
                        break;
                    } else if (node.previousSibling && dfx.isTag(node.previousSibling, tagName) === true) {
                        while (node.firstChild) {
                            node.previousSibling.appendChild(node.firstChild);
                        }

                        dfx.remove(node);
                        break;
                    }

                default:
                    if (dfx.isStubElement(node) === false && !node.firstChild) {
                        dfx.remove(node);
                    }
                break;
            }//end switch
        } else if (node.nodeType === dfx.TEXT_NODE && !tag) {
            if (dfx.isTag(node.parentNode, 'td') === false) {
                if (dfx.trim(node.data, "\f\n\r\t\v\u2028\u2029") === '') {
                    dfx.remove(node);
                } else if (dfx.trim(node.data) === '' && node.data.indexOf("\n") === 0) {
                    dfx.remove(node);
                }
            } else {
                node.data = node.data.replace(/^\n+\s*$/m, '');
            }
        }//end if

    },

    removeEmptyNodes: function(element, content)
    {
        if (content && !element) {
            element = document.createElement('div');
            dfx.setHtml(element, content);
        } else if (!content) {
            if (!element) {
                element = this.element;
            }
        } else {
            return;
        }

        this.cleanDOM(element);

        return element;

    },

    replaceEntities: function(html)
    {
        // Replace special Word characters with HTML ones..
        var specialCharcodes = {
            '8211': '&ndash;',
            '8212': '&mdash;',
            '8216': '\'',
            '8217': '\'',
            '8220': '"',
            '8221': '"',
            '8226': '*'
        };

        for (var code in specialCharcodes) {
            html = html.replace(new RegExp(String.fromCharCode(code), 'g'), specialCharcodes[code]);
        }

        return dfx.replaceCommonNamedEntities(html);

    },

    removeElem: function(elem)
    {
        if (dfx.isArray(elem) === true) {
            var eln = elem.length;
            for (var i = 0; i < eln; i++) {
                this.removeElem(elem[i]);
            }
        } else if (elem) {
            var parent = elem.parentNode;
            dfx.remove(elem);
            if (parent) {
                for (var node = parent.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType !== dfx.TEXT_NODE || node.nodeValue.length !== 0) {
                        // Not empty.
                        return;
                    }
                }

                // If parent is now empty then remove it.
                dfx.remove(parent);
            }
        }

    }

};
