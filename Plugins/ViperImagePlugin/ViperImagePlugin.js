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
(function(ViperUtil, ViperSelection, _) {
    function ViperImagePlugin(viper)
    {
        this.viper = viper;

        this._previewBox    = null;
        this._resizeImage   = null;
        this._ieImageResize = null;
        this._resizeHandles = null;
        this._inlineToolbar = null;
        this._moveImage     = null;

        this._initInlineToolbar();

    }

    Viper.PluginManager.addPlugin('ViperImagePlugin', ViperImagePlugin);

    ViperImagePlugin.prototype = {

        init: function()
        {
            this.initTopToolbar();

            var self = this;
            this.viper.registerCallback('Viper:mouseDown', 'ViperImagePlugin', function(e) {
                var target = ViperUtil.getMouseEventTarget(e);
                self._ieImageResize = null;

                if (ViperUtil.isTag(target, 'img') === true) {
                    ViperUtil.preventDefault(e);
                    self.hideImageResizeHandles();
                    self.showImageResizeHandles(target);
                    self._cancelMove();
                    self._updateToolbars(target);

                    var range = self.viper.getViperRange();
                    range.selectNode(target);
                    ViperSelection.addRange(range);
                    if (ViperUtil.isBrowser('msie') === true) {
                        self.viper.fireSelectionChanged(range, true);
                    }

                    if (ViperUtil.isBrowser('msie', '<9') === true && ViperUtil.isTag(target, 'img') === true) {
                        self._ieImageResize = target;
                        self.viper.registerCallback('Viper:mouseUp', 'ViperImagePlugin:ie', function(e) {
                           var range = self.viper.getCurrentRange();
                           if (!target.nextSibling || target.nextSibling.nodeType !== ViperUtil.TEXT_NODE) {
                               var textNode = document.createTextNode('');
                               ViperUtil.insertAfter(target, textNode);
                           }

                           if (!target.previousSibling || target.previousSibling.nodeType !== ViperUtil.TEXT_NODE) {
                               var textNode = document.createTextNode('');
                               ViperUtil.insertBefore(target, textNode);
                           }

                           range.setStart(target.previousSibling, target.previousSibling.data.length);
                           range.setEnd(target.nextSibling, 0);
                           ViperSelection.addRange(range);

                           ViperUtil.preventDefault(e);
                           self.viper.removeCallback('Viper:mouseUp', 'ViperImagePlugin:ie');
                           return false;
                        });
                    }

                    // Enable toolbar if its not already due to event cancelation.
                    var toolbar = self.viper.PluginManager.getPlugin('ViperToolbarPlugin');
                    if (toolbar && toolbar.isDisabled() === true) {
                        toolbar.enable();
                    }

                    return false;
                } else {
                    self._updateToolbars();
                    return self.hideImageResizeHandles();
                }
            });

            this.viper.registerCallback('Viper:mouseUp', 'ViperImagePlugin', function(e) {
                if (self.viper.isEnabled() !== true) {
                    return;
                }

                var target = ViperUtil.getMouseEventTarget(e);
                if (ViperUtil.isTag(target, 'img') === true && self.viper.isOutOfBounds(target) !== true) {
                    self.hideImageResizeHandles();
                    self.showImageResizeHandles(target);
                    self._cancelMove();
                    self._updateToolbars(target);

                    var range = self.viper.getViperRange();
                    range.selectNode(target);
                    ViperSelection.addRange(range);
                    self.viper.fireSelectionChanged(range, true);
                }

            });

            this.viper.registerCallback(['Viper:keyDown', 'Viper:beforeDelete'], 'ViperImagePlugin', function(e) {
                if (self._resizeImage
                    && ViperUtil.isInputKey(e)
                    && e.which !== 20
                    && e.which !== 16
                    && e.which !== 9
                ) {
                    self.hideImageResizeHandles();
                }

                if (e.which === 8 || e.which === 46) {
                    var range = self.viper.getViperRange();
                    if (range.getHTMLContentsObj().childNodes.length > 1) {
                        // Other content is also selected.
                        return;
                    }

                    if (self._resizeImage) {
                        if (self.removeImage(self._resizeImage) === true) {
                            self._updateToolbars();
                            self._inlineToolbar.hide();
                            return false;
                        }
                    }

                    if (self._ieImageResize) {
                        ViperUtil.remove(self._ieImageResize);
                        self._ieImageResize = null;
                        self.viper.contentChanged(true);
                        return false;
                    } else {
                        var range        = self.viper.getViperRange();
                        var selectedNode = range.getNodeSelection();
                        if (selectedNode) {
                            if (self.removeImage(selectedNode) === true) {
                                self._updateToolbars();
                                return false;
                            }
                        }
                    }
                }
            });

            this.viper.registerCallback('Viper:getHtml', 'ViperImagePlugin', function(data) {
                var tags = ViperUtil.getClass('ui-resizable', data.element);
                for (var i = 0; i < tags.length; i++) {
                    var parent = tags[i].parentNode;
                    ViperUtil.removeClass(tags[i], 'ui-resizable');
                    ViperUtil.insertBefore(parent, tags[i]);
                    self.hideImageResizeHandles();
                    ViperUtil.remove(parent);

                    // Remove empty style and class attributes.
                    if (!tags[i].getAttribute('style')) {
                        tags[i].removeAttribute('style');
                    }

                    if (!tags[i].getAttribute('class')) {
                        tags[i].removeAttribute('class');
                    }
                }
            });

            this.viper.registerCallback('ViperToolbarPlugin:enabled', 'ViperImagePlugin', function(data) {
                self.viper.Tools.enableButton('image');
            });

            this.viper.registerCallback('ViperCoreStylesPlugin:afterImageUpdate', 'ViperImagePlugin', function(image) {
                self.showImageResizeHandles(image);
            });

            this.viper.registerCallback(
                ['ViperHistoryManager:beforeUndo', 'Viper:clickedOutside', 'ViperTools:popup:open', 'ViperCoreStylesPlugin:beforeImageUpdate', 'Viper:cut', 'Viper:disabled'],
                'ViperImagePlugin',
                function() {
                    self.hideImageResizeHandles();
                }
            );

            this.viper.registerCallback('Viper:dropped', 'ViperImagePlugin', function(data) {
                if (!data.dataTransfer.files) {
                    return;
                }

                self.hideImageResizeHandles();

                var range    = data.range;
                if (data.e.target && ViperUtil.isTag(data.e.target, 'img') === true) {
                    // Image dropped on top of another image. Replace.
                    range.selectNode(data.e.target);
                }

                var bookmark = self.viper.createBookmark(range, null, 'imageDrop');
                if (ViperUtil.isTag(bookmark.start.nextSibling, 'img') === true
                    && bookmark.start.nextSibling.nextSibling === bookmark.end
                ) {
                    // Dropped on an image, insert it after.
                    ViperUtil.insertAfter(bookmark.end, bookmark.start.nextSibling);
                }

                // TODO: For some reason dropping image between two elements sometimes causes bookmark elements to move
                // to the end of the Viper element. Adding this tmp element before it and then re adding the bookmark
                // back to its position seems to resolve this issue.

                for (var i = 0; i < data.dataTransfer.files.length; i++) {
                    self.readDroppedImage(data.dataTransfer.files[i], function(image, file) {
                        self.insertDroppedImage(image, range, file);
                        noImage = false;
                    });
                }

                if (data.dataTransfer.files.length > 0) {
                    return false;
                }
            });

            this.viper.registerCallback(
                'Viper:editableElementChanged',
                'ViperImagePlugin',
                function() {
                    var elemDoc = self.viper.getViperElementDocument();
                    if (elemDoc !== document) {
                        ViperUtil.removeEvent(elemDoc.defaultView, 'scroll.ViperImagePlugin');
                        ViperUtil.addEvent(
                            elemDoc.defaultView,
                            'scroll.ViperImagePlugin',
                            function(e) {
                                if (self._resizeImage) {
                                    self.showImageResizeHandles(self._resizeImage);
                                }
                            }
                        );
                    }//end if
                }
            );

        },

        readDroppedImage: function(file, callback)
        {
            var self   = this;
            var reader = new FileReader();
            reader.onload = function (event) {
                var image = new Image();
                image.src = event.target.result;
                callback.call(self, image, file);
            };

            reader.readAsDataURL(file);

        },

        insertDroppedImage: function(image, range, fileInfo)
        {
            fileInfo    = fileInfo || {};
            range       = range || this.viper.getViperRange();

            var alt = fileInfo.name || '';
            if (alt.length > 0) {
                // Friendly name
                alt = alt.replace(/\.\w+$/, '').replace(/[^a-z0-9]/gi, ' ').replace(/\s+/g, ' ');
                alt = ViperUtil.ucFirst(ViperUtil.trim(alt));
            }

            image.alt = alt;

            this._rangeToImage(range, image);

        },

        moveImage: function(image, range)
        {
            if (!range || !image) {
                return;
            }

            return this._rangeToImage(range, image, null, null, null, true);
        },

        rangeToImage: function(range, url, alt, title)
        {
            if (!range || !url) {
                return;
            }

            return this._rangeToImage(range, null, url, alt, title);

        },

        _rangeToImage: function(range, img, url, alt, title, isMoveAction)
        {
            this._resizeImage = null;

            range = range || this.viper.getViperRange();
            var selectedNode = range.getNodeSelection();

            if (ViperUtil.isBlockElement(selectedNode) === true
                && ViperUtil.isStubElement(selectedNode) === false
            ) {
                ViperUtil.setHtml(selectedNode, '&nbsp');
                range.setStart(selectedNode.firstChild, 0);
                range.collapse(true);
                ViperSelection.addRange(range);
            }

            if (this.viper.rangeInViperBounds(range) === false) {
                range = this.viper.getViperRange();
            }

            var bookmark = this.viper.getBookmarkById('imageDrop') || this.viper.createBookmark(range);
            var elems    = ViperUtil.getElementsBetween(bookmark.start, bookmark.end);
            if (elems.length === 1 && ViperUtil.isTag(elems[0], 'img') === true) {
                // Move outside of bookmark.
                ViperUtil.insertAfter(bookmark.end, elems[0]);
            } else {
                ViperUtil.remove(elems);
            }

            var newImage = false;
            if (!img) {
                newImage = true;
                img = document.createElement('img');

                this.viper.setAttribute(img, 'src', url);

                if (alt !== null) {
                    this.viper.setAttribute(img, 'alt', alt, true);
                }

                if (title !== null && ViperUtil.trim(title).length !== 0) {
                    this.viper.setAttribute(img, 'title', title);
                }
            }

            if (isMoveAction === true) {
                // Image is being moved, make sure its surrounding parents also move with it.
                var surroundingParents = ViperUtil.getSurroundingParents(img, null, null, this.viper.getViperElement());
                if (surroundingParents.length > 0) {
                    var parent = null
                    while (parent = surroundingParents.pop()) {
                        if (ViperUtil.isBlockElement(parent) === false) {
                            ViperUtil.insertBefore(bookmark.start, parent);
                            break;
                        }
                    }

                    if (!parent) {
                        if (bookmark.start.parentNode === img) {
                            this.viper.removeBookmark(bookmark, true);
                            this._cancelMove();
                            return;
                        } else {
                            ViperUtil.insertBefore(bookmark.start, img);
                        }
                    }
                } else if (bookmark.start.parentNode === img) {
                    this.viper.removeBookmark(bookmark, true);
                    this._cancelMove();
                    return;
                } else {
                    ViperUtil.insertBefore(bookmark.start, img);
                }
            } else {
                ViperUtil.insertBefore(bookmark.start, img);
            }

            this.viper.removeBookmark(bookmark);

            ViperSelection.removeAllRanges();

            if (ViperUtil.isBrowser('msie', '>=11') === true) {
                var selectable = img.nextSibling;
                if (!img.nextSibling) {
                    selectable = document.createTextNode(' ');
                    ViperUtil.insertAfter(img, selectable);
                } else if (img.nextSibling.nodeType !== ViperUtil.TEXT_NODE) {
                    selectable = range.getFirstSelectableChild(img.nextSibling);
                    if (selectable) {
                        selectable = document.createTextNode(' ');
                        ViperUtil.insertAfter(img, selectable);
                    }
                }

                range.setStart(selectable, 1);
                range.collapse(true);
                ViperSelection.addRange(range);
            } else if (newImage === true && ViperUtil.isBrowser('msie', '<11') === true) {
                ViperUtil.removeAttr(img, 'width');
                ViperUtil.removeAttr(img, 'height');
            }

            this.viper.contentChanged();

            return img;

        },

        removeImage: function(image)
        {
            if (image && ViperUtil.isTag(image, 'img') === true) {
                this.hideImageResizeHandles();

                // If there are text nodes around then move the range to one of them,
                // else create a new text node and move the range to it.
                var node  = null;
                var start = 0;
                if (image.nextSibling && image.nextSibling.nodeType === ViperUtil.TEXT_NODE) {
                    node = image.nextSibling;
                } else if (image.previousSibling && image.previousSibling.nodeType === ViperUtil.TEXT_NODE) {
                    node  = image.previousSibling;
                    start = node.data.length;
                } else if (image.parentNode && ViperUtil.isTag(image.parentNode, 'a') === true) {
                    if (image.parentNode.nextSibling && image.parentNode.nextSibling.nodeType === ViperUtil.TEXT_NODE) {
                        node = image.parentNode.nextSibling;
                    } else if (image.parentNode.previousSibling && image.parentNode.previousSibling.nodeType === ViperUtil.TEXT_NODE) {
                        node = image.parentNode.previousSibling;
                        start = image.parentNode.previousSibling.data.length;
                    } else {
                        node = document.createTextNode(' ');
                        ViperUtil.insertAfter(image.parentNode, node);
                    }

                    ViperUtil.remove(image.parentNode);
                } else {
                    node = document.createTextNode(' ');
                    ViperUtil.insertAfter(image, node);
                }

                image.parentNode.removeChild(image);

                var range = this.viper.getViperRange();
                range.setStart(node, start);
                range.collapse(true);
                ViperSelection.addRange(range);

                this.viper.contentChanged();

                return true;
            }

            return false;
        },

        setImageAlt: function(image, alt, keepEmptyAttribute)
        {
            if (!image) {
                return;
            }

            this.viper.setAttribute(image, 'alt', alt, keepEmptyAttribute);

        },

        setImageURL: function(image, url)
        {
            if (!image) {
                return;
            }

            this.viper.setAttribute(image, 'src', url);

        },

        setImageTitle: function(image, title)
        {
            if (!image) {
                return;
            } else if (title === null) {
                image.removeAttribute('title');
            } else {
                this.viper.setAttribute(image, 'title', title);
            }

        },

        initTopToolbar: function()
        {
            var toolbar = this.viper.PluginManager.getPlugin('ViperToolbarPlugin');
            if (!toolbar) {
                return;
            }

            // Preview box to display image info and preview.
            var previewBox = document.createElement('div');
            ViperUtil.addClass(previewBox, 'ViperITP-msgBox ViperImagePlugin-previewPanel');
            ViperUtil.setHtml(previewBox, 'Loading preview');
            ViperUtil.setStyle(previewBox, 'display', 'none');
            this._previewBox = previewBox;

            var self       = this;
            var tools      = this.viper.Tools;
            var subContent = this._getToolbarContents('ViperImagePlugin');

            var imgTools = toolbar.createBubble('ViperImagePlugin:bubble', _('Insert Image'), subContent);
            tools.getItem('ViperImagePlugin:bubble').setSubSectionAction('ViperImagePlugin:bubbleSubSection', function() {
                self._setImageAttributes('ViperImagePlugin');
            }, ['ViperImagePlugin:urlInput', 'ViperImagePlugin:altInput', 'ViperImagePlugin:titleInput', 'ViperImagePlugin:isDecorative']);

            // Add the preview panel to the popup contents.
            subContent.appendChild(previewBox);

            var toggleImagePlugin = tools.createButton('image', '', _('Toggle Image Options'), 'Viper-image', null, true);
            toolbar.addButton(toggleImagePlugin);
            toolbar.setBubbleButton('ViperImagePlugin:bubble', 'image');
        },

        _getToolbarContents: function(prefix)
        {
            var self  = this;
            var tools = this.viper.Tools;

            // Create Image button and popup.
            var createImageSubContent = document.createElement('div');

            // URL text box.
            var urlTextbox = null;
            var url = tools.createTextbox(prefix + ':urlInput', _('URL'), '', null, true);
            createImageSubContent.appendChild(url);
            urlTextbox = (ViperUtil.getTag('input', createImageSubContent)[0]);

            // Test URL.
            var inputTimeout = null;
            this.viper.registerCallback('ViperTools:changed:' + prefix + ':urlInput', 'ViperImagePlugin', function() {
                clearTimeout(inputTimeout);

                var url = ViperUtil.trim(tools.getItem('ViperImagePlugin:urlInput').getValue());
                if (!url) {
                     ViperUtil.setStyle(self._previewBox, 'display', 'none');
                     tools.setFieldErrors(prefix + ':urlInput', []);
                } else {
                    if (url === '- Dropped Image -') {
                        url = self._base64ImgSRC;
                    }

                    // After a time period update the image preview.
                    inputTimeout = setTimeout(function() {
                        self._lastPreviewURL = null;
                        self.updateImagePreview(url);
                    }, 1000);
                }
            });

            // Decorative checkbox.
            var decorative = tools.createCheckbox(prefix + ':isDecorative', _('Image is decorative'), false, function(presVal) {
                if (presVal === true) {
                    tools.getItem(prefix + ':altInput').disable();
                    tools.getItem(prefix + ':titleInput').disable();
                    tools.getItem(prefix + ':altInput').setRequired(false);
                } else {
                    tools.getItem(prefix + ':altInput').setRequired(true);
                    tools.getItem(prefix + ':altInput').enable();
                    tools.getItem(prefix + ':titleInput').enable();
                }
            });
            createImageSubContent.appendChild(decorative);

            // Alt text box.
            var alt = tools.createTextbox(prefix + ':altInput', _('Alt'), '', null, true);
            createImageSubContent.appendChild(alt);

            // Title text box.
            var title = tools.createTextbox(prefix + ':titleInput', _('Title'));
            createImageSubContent.appendChild(title);

            return createImageSubContent;

        },

        _setImageAttributes: function(prefix)
        {
            var tools = this.viper.Tools;
            var url   = tools.getItem(prefix + ':urlInput').getValue();
            var alt   = tools.getItem(prefix + ':altInput').getValue();
            var title = tools.getItem(prefix + ':titleInput').getValue();
            var pres  = tools.getItem(prefix + ':isDecorative').getValue();

            if (url === '- Dropped Image -') {
                url = this._base64ImgSRC;
            }

            if (pres === true) {
                title = null;
                alt   = '';
            } else if (title === '') {
                title = null;
            }

            var image = this._resizeImage;
            if (ViperUtil.isBrowser('msie', '<9') === true) {
                image = this._ieImageResize;
            }

            if (!image || ViperUtil.isTag(image, 'img') === false) {
                image = this.rangeToImage(this.viper.getViperRange(), this.getImageUrl(url), alt, title);
            } else {
                this.setImageURL(image, this.getImageUrl(url));
                this.setImageAlt(image, alt, pres);
                this.setImageTitle(image, title);
                this.viper.contentChanged(true);
            }

            this._updateToolbars(image);

            var self = this;
            var imageLoaded = function() {
                // Image is loaded update the handles.
                self.showImageResizeHandles(image);
                self.viper.fireSelectionChanged(null, true);
            };

            image.onload  = imageLoaded;
            image.onerror = imageLoaded;

        },

        _updateToolbars: function(image)
        {
            this._updateToolbar(image, 'ViperImagePlugin');
            this._updateToolbar(image, 'vitpImagePlugin');

        },

        _updateToolbar: function(image, toolbarPrefix)
        {
            var toolbar = this.viper.PluginManager.getPlugin('ViperToolbarPlugin');
            if (!toolbar) {
                return;
            }

            var tools = this.viper.Tools;

            if (image && ViperUtil.isTag(image, 'img') === true) {
                tools.setButtonActive('image');

                var src = this.viper.getAttribute(image, 'src');
                this.setUrlFieldValue(src);
                tools.getItem(toolbarPrefix + ':altInput').setValue(this.viper.getAttribute(image, 'alt') || '');
                tools.getItem(toolbarPrefix + ':titleInput').setValue(this.viper.getAttribute(image, 'title') || '');

                if (!image.getAttribute('alt')) {
                    tools.getItem(toolbarPrefix + ':isDecorative').setValue(true);
                } else {
                    tools.getItem(toolbarPrefix + ':isDecorative').setValue(false);
                }

                // Hide URL field.
                this.hideURLField(toolbarPrefix);

                tools.getItem(toolbarPrefix + ':bubbleSubSection').setActionButtonTitle(_('Update Image'));

                // Update preview pane.
                this.updateImagePreview(src);
            } else {
                // Image is being inserted, show the URL field.
                this.showURLField(toolbarPrefix);

                tools.getItem(toolbarPrefix + ':bubbleSubSection').setActionButtonTitle(_('Insert Image'));

                tools.enableButton('image');
                tools.setButtonInactive('image');

                tools.getItem(toolbarPrefix + ':isDecorative').setValue(false);
                tools.getItem(toolbarPrefix + ':urlInput').setValue('');
                tools.getItem(toolbarPrefix + ':altInput').setValue('');
                tools.getItem(toolbarPrefix + ':titleInput').setValue('');
                tools.setFieldErrors(toolbarPrefix + ':urlInput', []);

                // Update preview pane.
                this._lastPreviewURL = null;
                ViperUtil.empty(this._previewBox);
                ViperUtil.setStyle(this._previewBox, 'display', 'none');
            }//end if

        },

        hideURLField: function (toolbarPrefix) {
            if (ViperUtil.isBrowser('chrome') === true) {
                // Strange Chrome v50 bug. If the textbox is hidden then the decorative checkbox only works when double
                // clicked. So put the element off screen.
                ViperUtil.addClass(this.viper.Tools.getItem(toolbarPrefix + ':urlInput').element, 'Viper-offScreen');
            } else {
                this.viper.Tools.getItem(toolbarPrefix + ':urlInput').hide();
            }

        },

        showURLField: function (toolbarPrefix) {
            if (ViperUtil.isBrowser('chrome') === true) {
                ViperUtil.removeClass(this.viper.Tools.getItem(toolbarPrefix + ':urlInput').element, 'Viper-offScreen');
            } else {
                this.viper.Tools.getItem(toolbarPrefix + ':urlInput').show();
            }
        },


        _initInlineToolbar: function()
        {
            var self = this;
            this.viper.registerCallback('ViperInlineToolbarPlugin:initToolbar', 'ViperImagePlugin', function(toolbar) {
                self.createInlineToolbar(toolbar);
            });

            this.viper.registerCallback('ViperInlineToolbarPlugin:updateToolbar', 'ViperImagePlugin', function(data) {
                self._updateInlineToolbar(data);
            });

        },

        createInlineToolbar: function(toolbar)
        {
            var self       = this;
            var tools      = this.viper.Tools;
            var moveButton = null;
            var image      = null;
            var idPrefix   = 'vitpImagePlugin';

            this._inlineToolbar = toolbar;

            // Create a tooltip that will be shown when the image move icon is clicked.
            tools.createToolTip('ViperImageToolbar-tooltip', _('The selected image will be moved to the next location you click. To cancel, press the move icon again, or ESC'), 'mouse');

            // Image Details.
            var subContent = this._getToolbarContents(idPrefix);
            toolbar.makeSubSection(idPrefix + ':bubbleSubSection', subContent);
            var imageButton = tools.createButton('vitpImage', '', _('Toggle Image Options'), 'Viper-image', null);
            toolbar.setSubSectionButton('vitpImage', idPrefix + ':bubbleSubSection');
            toolbar.setSubSectionAction(idPrefix + ':bubbleSubSection', function() {
                self._setImageAttributes(idPrefix);
            }, [idPrefix + ':urlInput', idPrefix + ':altInput', idPrefix + ':titleInput', idPrefix + ':isDecorative']);

            // Image Move.
            moveButton  = tools.createButton('vitpImageMove', '', _('Move Image'), 'Viper-move', function() {
                self._moveImage = self._resizeImage;

                if (ViperUtil.hasClass(moveButton, 'Viper-selected') === true) {
                    self._cancelMove();
                    return;
                }

                ViperUtil.addClass(moveButton, 'Viper-selected');

                // Show the tooltip under the mouse pointer.
                tools.getItem('ViperImageToolbar-tooltip').show();

                // When mouse is clicked in content move the image to that selection range.
                self.viper.registerCallback('Viper:mouseUp', 'ViperImagePlugin:move', function(e) {
                    var imageElement = self._moveImage;
                    self._cancelMove();

                    var clickTarget = ViperUtil.getMouseEventTarget(e);
                    if (clickTarget) {
                        if (ViperUtil.isTag(clickTarget, 'img') === true
                            || self.viper.isOutOfBounds(clickTarget) === true
                        ) {
                            return;
                        }
                    }

                    var range = self.viper.getViperRange();
                    if (self.viper.rangeInViperBounds(range) === false) {
                        return;
                    }

                    self.moveImage(imageElement, range);
                    ViperSelection.removeAllRanges();
                    range.selectNode(imageElement);
                    ViperSelection.addRange(range);


                    // Show the image resize handles and the toolbar.
                    self.showImageResizeHandles(imageElement);
                    self.viper.fireSelectionChanged(range, true);

                    self._moveImage = null;

                    return false;
                });

                // If ESC key is pressed cancel the image move.
                ViperUtil.addEvent(document, 'keydown.ViperImagePlugin:move', function(e) {
                    if (e.which === 27) {
                        self._cancelMove();
                    }
                });
            });

            var buttonGroup = tools.createButtonGroup('vitpImageBtnGroup');
            buttonGroup.appendChild(imageButton);
            buttonGroup.appendChild(moveButton);

            toolbar.addButton(buttonGroup);

        },

        _updateInlineToolbar: function(data)
        {
            var nodeSelection = data.nodeSelection || data.range.getNodeSelection();
            var self          = this;

            if (!this._resizeImage) {
                this.hideImageResizeHandles();
            }

            if (nodeSelection && ViperUtil.isTag(nodeSelection, 'img') === true) {
                this._resizeImage = nodeSelection;
                this.showInlineToolbarButtons(data);
                nodeSelection.onload = function() {
                    self.showImageResizeHandles(nodeSelection);
                    self._inlineToolbar.update(null, nodeSelection);
                };

                this.viper.Tools.setButtonActive('vitpImage');
                this.showImageResizeHandles(nodeSelection);
                this._updateToolbars(nodeSelection);
            } else if (this._resizeImage
                && !nodeSelection
                &&  ViperUtil.isBrowser('msie', '<11') === true
            ) {
                setTimeout(
                    function() {
                        self._inlineToolbar.update(null, self._resizeImage);
                    },
                    50
                );
            }

        },

        showInlineToolbarButtons: function(data)
        {
            data.toolbar.showButton('vitpImage');
            data.toolbar.showButton('vitpImageMove');

        },

        _cancelMove: function()
        {
            // Cancel method that is called when image is moved or move event is canceled.
            // It will remove callback methods, change toolbar button statuses etc.
            this.viper.Tools.getItem('ViperImageToolbar-tooltip').hide();
            this.viper.removeCallback('Viper:mouseUp', 'ViperImagePlugin:move');
            ViperUtil.removeEvent(document, 'keydown.ViperImagePlugin:move');
            ViperUtil.removeClass(this.viper.Tools.getItem('vitpImageMove').element, 'Viper-selected');

            this._moveImage = null;

        },

        setUrlFieldValue: function(url)
        {
            if (url.indexOf('data:image') === 0) {
                this._base64ImgSRC = url;
                url = '- Dropped Image -';
            }

            this.viper.Tools.getItem('ViperImagePlugin:urlInput').setValue(url);
            this.viper.Tools.getItem('vitpImagePlugin:urlInput').setValue(url);

        },

        getImageUrl: function(url)
        {
            return url;

        },

        updateImagePreview: function(url)
        {
            if (this._lastPreviewURL === url) {
                return;
            }

            this._lastPreviewURL = url;
            ViperUtil.empty(this._previewBox);

            var self = this;
            this.setPreviewContent(false, true);
            this.loadImage(url, function(img) {
                self.setPreviewContent(img);
            });

        },

        loadImage: function(url, callback)
        {
            var img    = new Image();
            img.onload = function() {
                callback.call(this, img);
            };

            img.onerror = function() {
                callback.call(this, false);
            };

            var replacementPlugin = this.viper.getPluginManager().getPlugin('ViperReplacementPlugin');
            if (replacementPlugin && url.indexOf('data:image') === -1) {
                // Replace the url keyword.
                var self = this;
                replacementPlugin.replaceKeywords(
                    url,
                    function(replaced) {
                        self.viper.setAttribute(img, 'src', replaced);
                    }
                )

            } else {
                this.viper.setAttribute(img, 'src', url);
            }

        },

        setPreviewContent: function(img, loading)
        {
            var previewBox = this._previewBox;
            ViperUtil.setStyle(previewBox, 'display', 'block');

            if (loading === true) {
                ViperUtil.removeClass(previewBox, 'Viper-info');
                ViperUtil.setHtml(previewBox, _('Loading preview'));
                this.viper.Tools.setFieldErrors('ViperImagePlugin:urlInput', []);
            } else if (!img) {
                // Failed to load image.
                ViperUtil.removeClass(previewBox, 'Viper-info');
                ViperUtil.setStyle(previewBox, 'display', 'none');
                this.viper.Tools.setFieldErrors('ViperImagePlugin:urlInput', [_('Failed to load image')]);
            } else {
                this.viper.Tools.setFieldErrors('ViperImagePlugin:urlInput', []);
                ViperUtil.addClass(previewBox, 'Viper-info');

                var tmp = document.createElement('div');
                ViperUtil.setStyle(tmp, 'visibility', 'hidden');
                ViperUtil.setStyle(tmp, 'left', '-9999px');
                ViperUtil.setStyle(tmp, 'top', '-9999px');
                ViperUtil.setStyle(tmp, 'position', 'absolute');
                tmp.appendChild(img);
                this.viper.addElement(tmp);

                ViperUtil.setStyle(img, 'width', '');
                ViperUtil.setStyle(img, 'height', '');

                var width  = ViperUtil.getElementWidth(img);
                var height = ViperUtil.getElementHeight(img);
                ViperUtil.remove(tmp);

                img.removeAttribute('height');
                img.removeAttribute('width');

                var maxWidth  = 185;
                var maxHeight = 185;
                if (height > maxHeight && width > maxWidth) {
                    if (height > width) {
                        ViperUtil.setStyle(img, 'height', maxHeight + 'px');
                        ViperUtil.setStyle(img, 'width', 'auto');
                    } else {
                        ViperUtil.setStyle(img, 'width', maxWidth + 'px');
                        ViperUtil.setStyle(img, 'height', 'auto');
                    }
                } else if (width > maxWidth) {
                    ViperUtil.setStyle(img, 'width', maxWidth + 'px');
                    ViperUtil.setStyle(img, 'height', 'auto');
                } else if (height > maxHeight) {
                    ViperUtil.setStyle(img, 'height', maxHeight + 'px');
                    ViperUtil.setStyle(img, 'width', 'auto');
                }

                ViperUtil.empty(previewBox);
                ViperUtil.setHtml(previewBox, width + 'px x ' + height + 'px<br/>');
                previewBox.appendChild(img);
            }//end if

        },

        showImageResizeHandles: function(image)
        {
            this.hideImageResizeHandles(true);

            var self   = this;
            var rect   = ViperUtil.getBoundingRectangle(image);
            var offset = ViperUtil.getDocumentOffset();
            rect.x1 += offset.x;
            rect.x2 += offset.x;
            rect.y1 += offset.y;
            rect.y2 += offset.y;

            if (document !== image.ownerDocument) {
                var scrollCoords = ViperUtil.getScrollCoords(image.ownerDocument.defaultView);
                rect.x1 -= scrollCoords.x;
                rect.x2 -= scrollCoords.x;
                rect.y1 -= scrollCoords.y;
                rect.y2 -= scrollCoords.y;
            }

            this._resizeImage = image;

            // Create the resize box.
            if (!this._resizeBox) {
                // Determine if the image can be resized (e.g. percentage width).
                // TODO: To be safe should the parent be cloned, incase hiding parent cause page jump etc.
                // ViperUtil.setStyle(image.parentNode, 'display', 'none');
                // var widthStyle = ViperUtil.getStyle(image, 'width');
                // Viper.Util.setStyle(image.parentNode, 'display', '');

                var canResize = true;
                if (image.naturalWidth === 0 || image.naturalHeight === 0) {
                    canResize = false;
                }

                // if (widthStyle && widthStyle.indexOf('%') !== -1) {
                //     // Prevent resizing.
                //     canResize = false;
                // }

                var resizeBox   = document.createElement('div');
                this._resizeBox = resizeBox;

                var windowWidth = ViperUtil.getWindowDimensions().width;
                var sizeDiv     = document.createElement('div');
                ViperUtil.addClass(sizeDiv, 'ViperImagePlugin-sizeDiv');
                ViperUtil.addEvent(
                    sizeDiv,
                    'mousedown',
                    function (e) {
                        // Reset size.
                        self.resetImageSize(image);
                        _updateSize();
                        ViperUtil.preventDefault(e);
                        self.viper.fireCallbacks('ViperImagePlugin:imageSizeReset', {image: image});
                        self.hideImageResizeHandles();
                        self.showImageResizeHandles(image);

                    }
                );
                resizeBox.appendChild(sizeDiv);

                var _updateSize = function (force) {
                    if (force === true || ViperUtil.hasAttribute(image, 'width') === true || ViperUtil.hasAttribute(image, 'height') === true) {
                        var sizeHtml = self.getImageSizeDisplayHtml(image);
                        ViperUtil.setHtml(sizeDiv, sizeHtml);
                        ViperUtil.addClass(sizeDiv, 'visible');
                    } else {
                        ViperUtil.removeClass(sizeDiv, 'visible');
                    }

                    // If the image is too small move the size div outside of the image.
                    if (image.width < 60 ||  image.height < 20) {
                        ViperUtil.addClass(sizeDiv, 'smallImage');
                    } else {
                        ViperUtil.removeClass(sizeDiv, 'smallImage');
                    }
                };

                _updateSize();

                ViperUtil.addClass(resizeBox, 'ViperImagePlugin-resizeBox');

                // Set the position of the box.
                ViperUtil.setStyle(resizeBox, 'left', rect.x1 + 'px');
                ViperUtil.setStyle(resizeBox, 'top', rect.y1 + 'px');
                ViperUtil.setStyle(resizeBox, 'width', rect.x2 - rect.x1 + 'px');
                ViperUtil.setStyle(resizeBox, 'height', rect.y2 - rect.y1 + 'px');

                if (canResize === true) {
                    ViperUtil.addClass(resizeBox, 'canResize');

                    // Create the handles for each corner.
                    var _createHandle = function(className) {
                        var handle = document.createElement('div');
                        ViperUtil.addClass(handle, 'ViperImagePlugin-resizeBox-handle ViperImagePlugin-resizeBox-handle-' + className);
                        resizeBox.appendChild(handle);

                        ViperUtil.addEvent(
                            handle,
                            'mousedown.ViperImagePlugin-resize',
                            function (e) {
                                ViperUtil.preventDefault(e);

                                var posx       = e.pageX;
                                var posy       = e.pageY;
                                var ratio      = (image.height / image.width);
                                var width      = image.width;
                                var height     = image.height;
                                var naturalDim = self.getImageNaturalDimensions(image);
                                var both       = e.shiftKey;
                                var resized    = false;
                                var docs       = ViperUtil.getDocuments(true, ViperUtil.getTopDocument());

                                ViperUtil.setStyle(image, 'width', '');
                                ViperUtil.setStyle(image, 'height', '');

                                self._inlineToolbar.hide();
                                _updateSize(true);

                                ViperUtil.addEvent(
                                    docs,
                                    'mousemove.ViperImagePlugin-resize',
                                    function (e) {
                                        var diffx = e.pageX - posx;
                                        var diffy = e.pageY - posy;
                                        posx      = e.pageX;
                                        posy      = e.pageY;
                                        resized   = true;

                                        if (ViperUtil.hasClass(handle, 'ViperImagePlugin-resizeBox-handle-bottomLeft') === true
                                            || ViperUtil.hasClass(handle, 'ViperImagePlugin-resizeBox-handle-topLeft') === true
                                        ) {
                                            width = image.width - diffx;
                                        } else {
                                            width = image.width + diffx;
                                        }

                                        image.setAttribute('width', width);
                                        var widthStyle = parseInt(ViperUtil.getStyle(image, 'width').replace('px', ''));
                                        if (widthStyle !== width) {
                                            image.setAttribute('width', widthStyle);
                                            if (both !== true) {
                                                image.setAttribute('height', parseInt(widthStyle * ratio));
                                            }

                                            _updateSize();
                                            return;
                                        } else if (widthStyle > naturalDim.width) {
                                            image.setAttribute('width', naturalDim.width);
                                            if (both !== true) {
                                                image.setAttribute('height', naturalDim.height);
                                            }

                                            _updateSize();
                                            return;
                                        }

                                        if (both === true) {
                                            height += diffy;
                                            image.setAttribute('height', parseInt(height));
                                        } else {
                                            image.setAttribute('height', parseInt(width * ratio));
                                        }

                                        _updateSize();
                                        self.viper.fireCallbacks('ViperImagePlugin:imageResized', {image: image, size: rect});

                                        // Need to set the pos and size of resize box incase the image moves around.
                                        var rect   = ViperUtil.getBoundingRectangle(image);
                                        var offset = ViperUtil.getDocumentOffset();
                                        rect.x1 += offset.x;
                                        rect.x2 += offset.x;
                                        rect.y1 += offset.y;
                                        rect.y2 += offset.y;

                                        if (document !== image.ownerDocument) {
                                            rect.x1 -= scrollCoords.x;
                                            rect.x2 -= scrollCoords.x;
                                            rect.y1 -= scrollCoords.y;
                                            rect.y2 -= scrollCoords.y;
                                        }

                                        ViperUtil.setStyle(resizeBox, 'left', rect.x1 + 'px');
                                        ViperUtil.setStyle(resizeBox, 'top', rect.y1 + 'px');
                                        ViperUtil.setStyle(resizeBox, 'width', rect.x2 - rect.x1 + 'px');
                                        ViperUtil.setStyle(resizeBox, 'height', rect.y2 - rect.y1 + 'px');

                                        ViperUtil.preventDefault(e);
                                        return false;
                                    }
                                );

                                ViperUtil.addEvent(
                                    docs,
                                    'mouseup.ViperImagePlugin-resize',
                                    function (e) {
                                        ViperUtil.removeEvent(docs, 'mousemove.ViperImagePlugin-resize');
                                        ViperUtil.removeEvent(docs, 'mouseup.ViperImagePlugin-resize');

                                        // If the image width/height is max then remove them.
                                        if (image.width === image.naturalWidth) {
                                            ViperUtil.removeAttr(image, 'width');
                                        }

                                        if (image.height === image.naturalHeight) {
                                            ViperUtil.removeAttr(image, 'height');
                                        }

                                        // If the style attribute is empty, remove it.
                                        if (!image.getAttribute('style')) {
                                            image.removeAttribute('style');
                                        }

                                        if (resized === true) {
                                            self.viper.contentChanged(true);
                                        }

                                        // Show the image toolbar.
                                        self._updateToolbars(image);

                                        self._inlineToolbar.update(null, image);
                                    }
                                );

                                ViperUtil.preventDefault(e);
                                return false;
                            }
                        );

                        return handle;
                    };

                    var handles         = {};
                    handles.topLeft     = _createHandle('topLeft');
                    handles.topRight    = _createHandle('topRight');
                    handles.bottomLeft  = _createHandle('bottomLeft');
                    handles.bottomRight = _createHandle('bottomRight');
                }

                this.viper.addElement(resizeBox);
            }

        },

        getImageNaturalDimensions: function(image)
        {
            var dim = {
                width: image.naturalWidth,
                height: image.naturalHeight
            };

            return dim;

        },

        hideImageResizeHandles: function(noUpdate)
        {
            ViperUtil.remove(this._resizeBox);
            this._resizeBox   = null;
            this._resizeImage = null;

        },

        resetImageSize: function(image)
        {
            ViperUtil.removeAttr(image, 'width');
            ViperUtil.removeAttr(image, 'height');
            this.viper.contentChanged(true);

        },

        getImageSizeDisplayHtml: function(image)
        {
            var naturalDim = this.getImageNaturalDimensions(image);
            var sizeHtml = '<div class="ViperImagePlugin-size';
            if (image.width === naturalDim.width || image.height === naturalDim.height) {
                sizeHtml += ' maximumSize">' + _('Maximum');
            } else {
                sizeHtml += '">' + image.width + ' x ' + image.height;
            }

            sizeHtml += '</div><div class="ViperImagePlugin-reset">' + _('Reset Size') + '</div>';

            return sizeHtml;

        }

    };
})(Viper.Util, Viper.Selection, Viper._);
