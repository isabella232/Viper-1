(function(ViperUtil, ViperSelection) {
    Viper.KeyboardHandler = function(viper)
    {
        this._viper           = viper;
        this._preventKeyPress = false;

        // When enter key is pressed at the end of these tags, the plugin will handle the
        // enter event instead of the browser.
        this._tagList = ('p|div|h1|h2|h3|h4|h5|h6|blockquote|section|main|article|aside').split('|');

        // These elements are not to be removed when whole of their content is selected and deleted.
        this._keepContainerList = ('td|th').split('|');

        // Make sure Viper fires the keyDown event for ENTER.
        this._viper.addSpecialKey(13);
    }

    Viper.KeyboardHandler.prototype = {
        init: function() {
            var self      = this;
            var elem      = this._viper.getViperElement();
            var namespace = this._viper.getEventNamespace();

            // Add key events. Note that there is a known issue with IME keyboard events
            // see https://bugzilla.mozilla.org/show_bug.cgi?id=354358. This effects
            // change tracking while using Korean, Chinese etc.
            ViperUtil.addEvent(elem, 'keypress.' + namespace, function(e) {
                return self.keyPress(e);
            });

            ViperUtil.addEvent(elem, 'keydown.' + namespace, function(e) {
                return self.keyDown(e);
            });

            // This keydown event will make sure that any selection started outside of Viper element and ended inside
            // Viper element is not going to trigger browser's 'back button'.
            ViperUtil.addEvent(Viper.document, 'keydown.' + namespace, function(e) {
                if (e.which === 8 || e.which === 46) {
                    var range = self._viper.getCurrentRange();
                    if (self._viper.isOutOfBounds(range.startContainer) === true
                        ^ self._viper.isOutOfBounds(range.endContainer) === true
                    ) {
                        ViperUtil.preventDefault(e);
                        return false;
                    }
                }
            });

            ViperUtil.addEvent(elem, 'keyup.' + namespace, function(e) {
                return self.keyUp(e);
            });

            this._viper.registerCallback('ViperFormatPlugin:formatChanged', 'KeyboardHandler', function(type) {
                if (type === 'pre') {
                    self.cleanPreTags();
                }
            });
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
            if (this._preventKeyPress === true || this._viper.isEnabled() !== true) {
                this._preventKeyPress = false;
                return true;
            }

            var returnValue = this._viper.fireCallbacks('Viper:keyPress', e);
            if (returnValue === false) {
                ViperUtil.preventDefault(e);
                return false;
            }

            var viperElement = this._viper.getViperElement();

            if (ViperUtil.isInputKey(e) === true) {
                this._viper.fireCallbacks('Viper:charInsert', String.fromCharCode(e.which));

                var resetContent = false;
                var range        = this._viper.getCurrentRange();
                if (range.startOffset === 0
                    && range.endContainer === viperElement
                    && range.endOffset === (viperElement.childNodes.length - 1)
                    && range.startContainer === range._getFirstSelectableChild(viperElement)
                ) {
                    resetContent = true;
                } else if (ViperUtil.isBrowser('msie') === true
                    && range.endContainer === viperElement
                    && range.endOffset === 0
                    && range.startOffset === 0
                    && range.startContainer === range._getFirstSelectableChild(viperElement)
                ) {
                    resetContent = true;
                } else if (range.startOffset === 0
                    && range.endContainer === range._getLastSelectableChild(viperElement)
                    && range.endOffset === range.endContainer.data.length
                    && range.startContainer === range._getFirstSelectableChild(viperElement)
                ) {
                    resetContent = true;
                } else if (range.startOffset === 0
                    && range.startContainer === range.endContainer
                    && range.startContainer === viperElement
                    && range.endOffset >= viperElement.childNodes.length
                ) {
                    resetContent = true;
                }//end if

                var nodeSelection = null;
                if (resetContent !== true) {
                    nodeSelection = range.getNodeSelection(range, true);
                    if (nodeSelection && nodeSelection === viperElement) {
                        resetContent = true;
                    }
                }

                if (resetContent === true) {
                    var tagName = this._viper.getDefaultBlockTag();
                    if (viperElement.childNodes.length === 1 && ViperUtil.isBlockElement(viperElement.childNodes[0]) === true) {
                        // There is only one block element in the content so use its tag
                        // name.
                        tagName = ViperUtil.getTagName(viperElement.childNodes[0]);
                    }

                    // The whole content is selected and a char is being
                    // typed. Remove the whole content of the editable element.
                    if (!tagName) {
                        ViperUtil.setHtml(viperElement, '');
                    } else {
                        ViperUtil.setHtml(viperElement, '<' + tagName + '>&nbsp;</' + tagName + '>');
                        range.setStart(range._getFirstSelectableChild(viperElement), 0);
                    }

                    range.collapse(true);
                    ViperSelection.addRange(range);
                } else {
                    if (nodeSelection && ViperUtil.isBlockElement(nodeSelection) === true && String.fromCharCode(e.which) !== '') {
                        switch (ViperUtil.getTagName(nodeSelection)) {
                            case 'table':
                            case 'ul':
                            case 'ol':
                                // Must create a new tag before setting the content.
                                var defaultTagName = this._viper.getDefaultBlockTag();
                                var defTag         = null;
                                if (defaultTagName !== '') {
                                    defTag = document.createElement(defaultTagName);
                                    ViperUtil.setHtml(defTag, String.fromCharCode(e.which));
                                } else {
                                    defTag = document.createTextNode(String.fromCharCode(e.which));
                                }

                                ViperUtil.insertAfter(nodeSelection, defTag);
                                ViperUtil.remove(nodeSelection);
                                range.setStart(defTag, 1);
                                range.collapse(true);
                            break;

                            case 'tfooter':
                            case 'tbody':
                            case 'thead':
                            case 'tr':
                            case 'li':
                                // Tags that can be handled by browser.
                            return true;

                            break;

                            default:
                                var textNode = document.createTextNode(String.fromCharCode(e.which));

                                if (ViperUtil.isStubElement(nodeSelection) === true) {
                                    ViperUtil.insertBefore(nodeSelection, textNode);
                                    ViperUtil.remove(nodeSelection);
                                } else {
                                    // Set the content of the existing tag.
                                    ViperUtil.setHtml(nodeSelection, '');

                                    if (ViperUtil.isTag(nodeSelection, 'blockquote') === true) {
                                        // Blockquote must have at least one P tag.
                                        var quoteP = document.createElement('p');
                                        nodeSelection.appendChild(quoteP);
                                        nodeSelection = quoteP;
                                    }

                                    nodeSelection.appendChild(textNode);
                                }

                                range.setStart(textNode, 1);
                                range.collapse(true);
                            break;
                        }//end switch

                        ViperSelection.addRange(range);
                        this._viper.fireNodesChanged([textNode]);
                        return false;
                    } else if (range.startContainer === range.endContainer
                        && ViperUtil.isTag(range.startContainer, 'br') === true
                        && range.collapsed === true
                        && range.startOffset === 0
                    ) {
                        // IE text insert when BR tag is selected.
                        var textNode = document.createTextNode('');
                        ViperUtil.insertBefore(range.startContainer, textNode);
                        ViperUtil.remove(range.startContainer);
                        range.setStart(textNode, 0);
                        range.collapse(true);
                    } else if (range.startContainer === range.endContainer
                        && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.collapsed === true
                        && range.startOffset === range.startContainer.data.length
                    ) {
                        if (range.startContainer.data.charAt(range.startOffset - 1) === ' ') {
                            // Inserting text at the end of a text node that ends with a space to prevent browser removing the
                            // space.
                            if (e.which === 32) {
                                range.startContainer.data = range.startContainer.data.substr(0, range.startOffset - 1);
                                range.startContainer.data += String.fromCharCode(160) + String.fromCharCode(160);
                            } else {
                                range.startContainer.data += String.fromCharCode(e.which);
                            }

                            range.setStart(range.startContainer, range.startContainer.data.length);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                            this._viper.fireNodesChanged([range.startContainer]);
                            //this._viper.contentChanged(true);
                            return false;
                        } else if (range.startContainer.data.length === 0) {
                            if (range.startContainer.previousSibling
                                && range.startContainer.previousSibling.nodeType === ViperUtil.TEXT_NODE
                            ) {
                                var prevSib = range.startContainer.previousSibling;
                                if (prevSib.data.charAt(prevSib.data.length - 1) === ' ') {
                                    prevSib.data += String.fromCharCode(e.which);
                                    range.setStart(prevSib, prevSib.data.length);
                                    range.collapse(true);
                                    ViperSelection.addRange(range);
                                    this._viper.fireNodesChanged([range.startContainer]);
                                    return false;
                                }
                            } else if (range.startContainer.parentNode
                                && ViperUtil.isBlockElement(range.startContainer.parentNode) === false
                                && ViperUtil.isEmptyElement(range.startContainer.parentNode) === true
                            ) {
                                // Parent node is empty.
                                var parentPrevSib = range.startContainer.parentNode.previousSibling;
                                if (parentPrevSib
                                    && parentPrevSib.nodeType === ViperUtil.TEXT_NODE
                                    && parentPrevSib.data.charAt(parentPrevSib.data.length - 1) === ' '
                                ) {
                                    // Parent's previous sibling has white space at the end.
                                    parentPrevSib.data += String.fromCharCode(e.which);
                                    range.setStart(parentPrevSib, parentPrevSib.data.length);
                                    range.collapse(true);
                                    ViperSelection.addRange(range);
                                    this._viper.fireNodesChanged([parentPrevSib]);
                                    return false;
                                }
                            }
                        }
                    }

                    var char = String.fromCharCode(e.which);
                    if (range.collapsed === true
                        && char !== ' '
                        && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.endOffset === range.startContainer.data.length
                        && range.endOffset > 0
                        && range.startContainer.data.lastIndexOf(String.fromCharCode(160)) === (range.startContainer.data.length - 1)
                    ) {
                        // If the last character of a text node is nbsp; and a new character is being inserted then replace the nbsp
                        // with normal space.
                        range.startContainer.data = range.startContainer.data.substr(0, range.startContainer.data.length - 1);
                        range.startContainer.data += ' ' + char;
                        range.setStart(range.startContainer, range.startContainer.data.length);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                        this._viper.fireNodesChanged([range.startContainer]);
                        return false;
                    }

                    if (ViperUtil.isBrowser('msie', '<11') === true
                        && range.collapsed === true
                        && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.startOffset === range.startContainer.data.length
                        && !range.startContainer.nextSibling
                    ) {
                        // Handle: <p><strong>text</strong>*</p> -> <p><strong>text</strong>new text</p>.
                        // See: KeyboardEditorPlugin.
                        var node      = range.startContainer.parentNode;
                        var foundNode = null;
                        if (ViperUtil.isTag(node, 'span') === true && ViperUtil.hasAttribute(node, 'data-viper-span') === true) {
                            foundNode = node;
                        } else {
                            while (node) {
                                if (node.nextSibling) {
                                    var nextSib = node.nextSibling;
                                    if (ViperUtil.isTag(nextSib, 'span') === true
                                        && nextSib.firstChild === nextSib.lastChild
                                        && nextSib.firstChild.nodeType === ViperUtil.TEXT_NODE
                                        && nextSib.firstChild.data.length === 0
                                    ) {
                                        foundNode = nextSibling;
                                    }

                                    break;
                                }
                                node = node.parentNode;
                            }
                        }//end if

                        if (foundNode !== null) {
                            ViperUtil.insertBefore(foundNode, foundNode.firstChild);
                            foundNode.previousSibling.data = String.fromCharCode(e.which);
                            range.setEnd(foundNode.previousSibling, 1);
                            range.collapse(false);
                            ViperSelection.addRange(range);
                            ViperUtil.remove(foundNode);
                            return false;
                        }
                    }

                    var startNode = range.getStartNode();
                    if (e.which !== 0
                        && range.startContainer === range.endContainer
                        && range.collapsed === true
                        && range.startOffset === 0
                    ) {
                        var textContainer = null;
                        if (range.startContainer.nodeType === ViperUtil.ELEMENT_NODE) {
                            if (range.startContainer.childNodes[range.startOffset]
                                && range.startContainer.childNodes[range.startOffset]
                                && range.startContainer.childNodes[range.startOffset].nodeType === ViperUtil.TEXT_NODE
                            ) {
                                textContainer = range.startContainer.childNodes[range.startOffset];
                            }
                        } else {
                            textContainer = range.startContainer;
                        }

                        if (textContainer && textContainer.nodeType === ViperUtil.TEXT_NODE) {
                            // At the start of a text node with an element sibling. Make sure character is inserted in this
                            // text node.
                            // Also make sure that there is no non breaking space at the start text node followed by a non
                            // space character.
                            if (textContainer.data.length > 1
                                && (textContainer.data.charCodeAt(0) === 160 || textContainer.data.charCodeAt(0) === 32)
                                && textContainer.data[1] !== ' '
                            ) {
                                if (char === ' ') {
                                    char = String.fromCharCode(160);
                                } else {
                                    textContainer.data = ' ' + textContainer.data.substr(1);
                                }
                            } else if (!textContainer.previousSibling) {
                                var parent = textContainer.parentNode;
                                while (!parent.previousSibling) {
                                    parent = parent.previousSibling;
                                }

                                if (ViperUtil.isText(parent.previousSibling) === true) {
                                    if (parent.previousSibling.data.length === 0
                                        && ViperUtil.isBrowser('safari') === true
                                    ) {
                                        parent.previousSibling.data = char;
                                        range.setStart(parent.previousSibling, 1);
                                        range.collapse(true);
                                        ViperSelection.addRange(range);
                                        this._viper.fireNodesChanged([textContainer]);
                                        return false;
                                    } else {
                                        range.setStart(parent.previousSibling, parent.previousSibling.data.length);
                                        range.collapse(true);
                                        ViperSelection.addRange(range);
                                        this._viper.fireNodesChanged([textContainer]);
                                        return true;
                                    }
                                }
                            }

                            textContainer.data = char + textContainer.data;
                            range.setStart(textContainer, 1);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                            this._viper.fireNodesChanged([textContainer]);
                            return false;
                        }
                    } else if (ViperUtil.isBrowser('msie', '<11') === true
                        && range.collapsed === true
                        && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.startOffset > 0
                        && range.startOffset < range.startContainer.data.length
                        && char !== ' '
                    ) {
                        var data = range.startContainer.data;

                        // Character being inserted.
                        if (data.charCodeAt(range.startOffset) === 160
                            && (data.charCodeAt(range.startOffset + 1) !== 160 && data.charCodeAt(range.startOffset + 1) !== 32)
                        ) {
                            // Convert non breaking space to normal space.
                            // E.g. <p>t | ext.</p>.
                            var data = range.startContainer.data;

                            if (data.charCodeAt(range.startOffset - 1) === 160
                                && (data.charCodeAt(range.startOffset - 2) !== 160 && data.charCodeAt(range.startOffset - 2) !== 32)
                            ) {
                                // Previous character is nbsp as well, change it.
                                data = data.substr(0, range.startOffset - 1) + ' ';
                            } else {
                                data = data.substr(0, range.startOffset);
                            }

                            data += ' ' + range.startContainer.data.substr(range.startOffset + 1);
                            range.startContainer.data = data;
                            range.setStart(range.startContainer, range.startOffset);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                        }
                    } else if (ViperUtil.isBrowser('chrome') === true) {
                        if (ViperUtil.rangeInDiffBlocks(range) === true) {
                            // Chrome adds extra styles and tags like span, font etc when range is in two different block
                            // tags and a character is typed.
                            this.handleDelete({which: 8, keyCode: 8, preventDefault:function() {}});
                        }
                    }
                }//end if

                var self = this;
                setTimeout(function() {
                    self._viper.fireNodesChanged([range.startContainer]);
                }, 5);

                return true;
            }//end if

            return true;

        },

        keyUp: function(e)
        {
            if (this._viper.fireCallbacks('Viper:keyUp', e) === false) {
                ViperUtil.preventDefault(e);
                return false;
            }

            if (e.which === ViperUtil.DOM_VK_BACKSPACE) {
                // Check if the content is now empty.
                var html = ViperUtil.getHtml(this._viper.element);
                if (!html || html === '<br>') {
                    ViperUtil.setHtml(this._viper.element, '');
                    this._viper.initEditableElement();
                }
            }

            if (e.which >= 37 && e.which <= 40) {
                // Handle the case where selecting whole content and pressing arrow keys puts the caret outside of the
                // first/last selected element. E.g. <p>test</p>*.
                var range = this._viper.getCurrentRange();
                if (e.which >= 39
                    && range.startContainer === range.endContainer
                    && range.startOffset === range.endOffset
                    && range.endOffset >= range.startContainer.childNodes.length
                ) {
                    // Right and down arrow keys.
                    var lastSelectable = range._getLastSelectableChild(range.startContainer.childNodes[range.endOffset - 1]);
                    if (lastSelectable && lastSelectable.nodeType === ViperUtil.TEXT_NODE) {
                        range.setStart(lastSelectable, lastSelectable.data.length);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                    }
                } else if (e.which <= 38
                    && range.startOffset === 0
                    && range.startOffset === range.endOffset
                    && range.startContainer === range.endContainer
                    && range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                    && ViperUtil.isStubElement(range.startContainer.childNodes[range.startOffset]) === false
                ) {
                    // Left and up arrow keys.
                    var firstSelectable = range._getFirstSelectableChild(range.startContainer.childNodes[range.startOffset]);
                    range.setStart(firstSelectable, 0);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                }
            }

            // Shift, Control, Alt, Caps lock, esc, CMD.
            var ignoredKeys = [16, 17, 18, 20, 27, 91];
            if ((this._keyDownRangeCollapsed === false && ViperUtil.inArray(e.which, ignoredKeys) === false)
                && (e.ctrlKey === false && e.metaKey === false)
                || e.which === 8
                || e.which === 46
                || (e.which >= 37 && e.which <= 40)
            ) {
                 this._viper.fireSelectionChanged();
            }

            this._keyDownRangeCollapsed = true;

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
            this._viper._viperRange = null;
            var range        = this._viper.getCurrentRange();

            if (this._keyDownRangeCollapsed === true) {
                this._keyDownRangeCollapsed = range.collapsed;
            }

            if (ViperUtil.isKey(e, 'ENTER') === true) {
                return this.handleEnter();
            } else if (ViperUtil.isKey(e, 'SHIFT+ENTER') === true) {
                return this.handleSoftEnter(e);
            } else if (ViperUtil.isKey(e, 'DELETE') === true || ViperUtil.isKey(e, 'BACKSPACE') === true) {
                return this.handleDelete(e);
            }

            var returnValue = this._viper.fireCallbacks('Viper:keyDown', e);
            if (returnValue === false) {
                ViperUtil.preventDefault(e);
                return false;
            }

            if ((e.ctrlKey === false && e.which === 17)
                && (e.altKey === false && e.which !== 18)
                && (e.shiftKey === false && e.which !== 16)
                && (e.metaKey === false && e.which !== 224)
                && e.which !== 27
            ) {
                // Nothing special about this key let the browser handle it unless
                // the track changes is activated or no plugin is direcly modifying it.
                if (this._viper.isSpecialKey(e) === false) {
                    if (ViperUtil.isBrowser('firefox') === true) {
                        this._firefoxKeyDown(e);
                    } else if ((ViperUtil.isKey(e, 'backspace') === true || ViperUtil.isKey(e, 'delete') === true)
                        && (ViperUtil.isBrowser('chrome') === true || ViperUtil.isBrowser('safari') === true || ViperUtil.isBrowser('msie') === true)
                    ) {
                        // Webkit does not fire keypress event for delete and backspace keys..
                        this._viper.contentChanged(true);
                    } else if (ViperUtil.isBrowser('msie', '10') === true) {
                        // Strange issue with IE10.. If a paragraph has only an anchor tag and caret is at the end
                        // of this anchor tag then typing any chracter removes the whole tag...
                        if (range.startContainer
                            && range.startContainer === range.endContainer
                            && range.startOffset === 0
                            && range.endOffset === range.startOffset
                            && ViperUtil.isBlockElement(range.startContainer) === true
                            && ViperUtil.isTag(range.startContainer.firstChild, 'a') === true
                        ) {
                            var newTextNode = document.createTextNode('');
                            ViperUtil.insertAfter(range.startContainer.firstChild, newTextNode);
                            range.setStart(newTextNode, 0);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                        }
                    }

                    var self = this;
                    setTimeout(function() {
                        self._viper.fireSelectionChanged(null, true);
                    }, 10);

                    return true;
                }//end if
            } else if ((e.which === 65 && (e.metaKey === true || e.ctrlKey === true))
                || ((e.which >= 37 && e.which <= 40) && (e.metaKey === true || e.ctrlKey === true) && e.shiftKey === true)
            ) {
                // CMD/CTRL + A, CMD + SHIF + <arrow keys> needs to fire selection changed as they do not fire key up event.
                var self = this;
                setTimeout(function() {
                    self._viper.fireSelectionChanged();
                }, 10);
                return true;
            }//end if

        },

        _firefoxKeyDown: function(e)
        {
            if (e.which >= 37 && e.which <= 40) {
                // Handle the case where selecting whole content and pressing right arrow key puts the caret outside of the
                // last selected element. E.g. <p>test</p>*.
                var range = this._viper.getCurrentRange();
                if (e.which >= 39
                    && range.startContainer === range.endContainer
                    && range.startOffset === 0
                    && range.endOffset >= range.startContainer.childNodes.length
                ) {
                    var lastSelectable = range._getLastSelectableChild(range.startContainer.childNodes[range.endOffset - 1]);
                    if (lastSelectable && lastSelectable.nodeType === ViperUtil.TEXT_NODE) {
                        range.setStart(lastSelectable, lastSelectable.data.length);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                    }
                }

                // Arrow keys.
                return;
            }

            var range = this._viper.getCurrentRange();
            var elem  = this._viper.getViperElement();
            if (elem.childNodes.length === 0
                || (elem.childNodes.length === 1 && ViperUtil.isTag(elem.childNodes[0], 'br') === true)
                || (elem === range.startContainer && elem === range.endContainer && range.startOffset === 0 && range.endOffset >= range.endContainer.childNodes.length)
            ) {
                var tagName = this._viper.getDefaultBlockTag();
                if (elem.childNodes.length === 1 && ViperUtil.isBlockElement(elem.childNodes[0]) === true) {
                    tagName = ViperUtil.getTagName(elem.childNodes[0]);
                }

                var textNode = document.createTextNode('');
                if (!tagName) {
                    ViperUtil.setHtml(this._viper.element, '');
                    this._viper.element.appendChild(textNode);
                } else {
                    ViperUtil.setHtml(this._viper.element, '<' + tagName + '></' + tagName + '>');
                    this._viper.element.firstChild.appendChild(textNode);
                }

                range.setStart(textNode, 0);
                range.collapse(true);
                ViperSelection.addRange(range);
            } else {
                var startNode = range.getStartNode();
                var endNode   = range.getEndNode();
                if (startNode
                    && startNode === endNode
                    && startNode.nodeType === ViperUtil.ELEMENT_NODE
                    && startNode.parentNode === this._viper.element
                    && range.startOffset === 0
                ) {
                    var firstChild = range._getFirstSelectableChild(startNode);
                    if (firstChild) {
                        range.setStart(firstChild, 0);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                    }
                }
            }

            // When element is empty Firefox puts <br _moz_dirty="" type="_moz">
            // in to the element which stops text typing, so remove the br tag
            // and add an empty text node and set the range to that node.
            if (range.startContainer === range.endContainer
                && ViperUtil.isTag(range.startContainer, 'br') === true) {
                var textNode = document.createTextNode('');
                ViperUtil.insertAfter(range.startContainer, textNode);
                ViperUtil.remove(range.startContainer);
                range.setStart(textNode, 0);
                range.collapse(true);
                ViperSelection.addRange(range);
            }

        },

        handleEnter: function(returnFirstBlock)
        {
            this._viper.fireCallbacks('Viper:beforeEnter');

            var defaultTagName = this._viper.getDefaultBlockTag();
            var self           = this;
            var range          = this._viper.getCurrentRange();
            var endNode        = range.getEndNode();
            var startNode      = range.getStartNode();

            if (!endNode) {
                if (startNode) {
                    endNode = startNode;
                } else if (range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                    && !range.startContainer.childNodes[range.startOffset]
                    && range.startContainer.childNodes[(range.startOffset - 1)]
                ) {
                    endNode = range.startContainer.childNodes[(range.startOffset - 1)];
                } else if (range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                    && range.startContainer.childNodes.length === 0
                    && !endNode
                ) {
                    endNode = range.startContainer;
                }
            }

            try {
                if (!startNode && !endNode && range.collapsed === true && ViperUtil.isTag(range.startContainer, 'br') === true) {
                    startNode = range.startContainer;
                    endNode   = startNode;
                }

                if (endNode
                    && endNode.nodeType === ViperUtil.TEXT_NODE
                    && ViperUtil.trim(ViperUtil.trim(endNode.data)).replace(String.fromCharCode(160), '') === ''
                ) {
                    endNode.data = '';
                }
            } catch (e) {
                // IE error catch...
                return;
            }

            // Break out of blockquote tag when enter is pressed twice at the start, end and middle of a P tag in a
            // blockquote.
            if (range.collapsed === true
                && (startNode && startNode.nodeType === ViperUtil.TEXT_NODE || ViperUtil.isTag(startNode, 'br') === true)
                && !startNode.previousSibling
                && range.startOffset === 0
                && ViperUtil.getParents(startNode, 'blockquote', this._viper.getViperElement()).length > 0
                && ViperUtil.isTag(ViperUtil.getFirstBlockParent(startNode), 'p') === true
            ) {
                // Make sure this is not the first P tag in a blockquote.
                var parentPtag = ViperUtil.getFirstBlockParent(startNode);
                var prevTag    = parentPtag.previousSibling;
                while (prevTag) {
                    if (ViperUtil.isBlockElement(prevTag) === true) {
                        break;
                    }

                    prevTag = prevTag.previousSibling;
                }

                if (prevTag) {
                    var parentBlockquote = ViperUtil.getParents(parentPtag, 'blockquote', this._viper.getViperElement())[0];
                    var newBlockquote    = parentBlockquote.cloneNode(false);

                    // Move the siblings after the current P tag to the new blockquote element.
                    if (parentPtag.nextSibling) {
                        // Do not move empty block elements.
                        while (parentPtag.nextSibling) {
                            if (this.isEmptyBlockElement(parentPtag.nextSibling) === true) {
                                ViperUtil.remove(parentPtag.nextSibling);
                            } else {
                                newBlockquote.appendChild(parentPtag.nextSibling);
                            }
                        }

                        ViperUtil.insertBefore(newBlockquote.firstChild, parentPtag);
                    } else {
                        newBlockquote.appendChild(parentPtag);
                    }

                    // If the current P tag is empty then remove it. This happens when the caret is at the end of a P
                    // tag and enter is pressed twice.
                    if (this.isEmptyBlockElement(parentPtag) === true) {
                        ViperUtil.remove(parentPtag);
                    }

                    // Final check to make sure that we do not create an empty blockquote element.
                    ViperUtil.removeEmptyNodes(newBlockquote);
                    if (this.isEmptyBlockElement(newBlockquote) === false) {
                        ViperUtil.insertAfter(parentBlockquote, newBlockquote);
                    }

                    // Create a new P tag to be placed between two blockquotes.
                    var midP = document.createElement('p');
                    midP.appendChild(document.createElement('br'));
                    ViperUtil.insertAfter(parentBlockquote, midP);

                    // Set the caret to the newly created P tag.
                    range.selectNode(midP.firstChild);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                    this._viper.fireSelectionChanged();
                    return false;
                }
            }//end if

            if (ViperUtil.isTag(endNode, 'li') === true && endNode === startNode && endNode.firstChild === null) {
                var firstBlock = endNode;
            } else {
                var firstBlock = ViperUtil.getFirstBlockParent(endNode);
            }

            if (range.collapsed === true
                && ((endNode.nodeType === ViperUtil.TEXT_NODE && (range.endOffset === endNode.data.length || range.endOffset === ViperUtil.rtrim(endNode.data).length))
                || endNode.nodeType === ViperUtil.ELEMENT_NODE && ViperUtil.isTag(endNode, 'br'))
                && (!endNode.nextSibling || ViperUtil.isTag(endNode.nextSibling, 'br') === true && !endNode.nextSibling.nextSibling)
                && (range._getLastSelectableChild(firstBlock, true) === endNode
                || range._getLastSelectableChild(firstBlock, true) === null && ViperUtil.isTag(endNode, 'br') === true || (endNode.nodeType === ViperUtil.TEXT_NODE && endNode.data.length === 0))
                || ViperUtil.isTag(firstBlock, 'li') === true && endNode === startNode && endNode.firstChild === null
            ) {
                if (firstBlock && !defaultTagName && firstBlock === this._viper.getViperElement()) {
                    var br = document.createElement('br');
                    this._viper.insertNodeAtCaret(br);
                    if (!br.nextSibling) {
                        ViperUtil.insertAfter(br, document.createElement('br'));
                    }

                    range.setStart(br.nextSibling, 0);
                    range.collapse(true);
                    ViperSelection.addRange(range);

                    return false;
                } else if (firstBlock) {
                    var firstBlockTagName = ViperUtil.getTagName(firstBlock);
                    var handleEnter       = false;
                    var removeFirstBlock  = false;
                    if (ViperUtil.inArray(firstBlockTagName, this._tagList) === true) {
                        handleEnter = true;
                    } else if (firstBlockTagName === 'li'
                        && ViperUtil.trim(ViperUtil.getNodeTextContent(firstBlock)) === ''
                    ) {
                        if (defaultTagName === '') {
                            // Default tag name is set to nothing. Move caret after the list.
                            this.splitList(firstBlock);
                            this._viper.contentChanged();
                            return false;
                        } else if (ViperUtil.isBrowser('chrome') === true || ViperUtil.isBrowser('safari') === true || ViperUtil.isBrowser('msie') === true) {
                            handleEnter = true;
                            removeFirstBlock = true;
                        }
                    }

                    if (handleEnter === true) {
                        if (defaultTagName === '') {
                            var br = document.createElement('br');
                            ViperUtil.insertAfter(firstBlock, br);
                            range.setStart(br, 0);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                            return false;
                        }

                        var content = '<br />';
                        if (ViperUtil.isBrowser('msie', '<9') === true) {
                            content = '&nbsp;';
                        }

                        var tagName = defaultTagName;
                        var p = document.createElement(tagName);
                        ViperUtil.setHtml(p, content);

                        // If the firstBlock is a P tag and it's parent is not the
                        // Viper editable element and its the last child then move this
                        // new P tag after its parent element.
                        if (ViperUtil.isTag(firstBlock, 'p') === true
                            && firstBlock.parentNode !== this._viper.getViperElement()
                            && !firstBlock.nextSibling
                            && ViperUtil.trim(ViperUtil.getNodeTextContent(firstBlock)) === ''
                        ) {
                            ViperUtil.insertAfter(firstBlock.parentNode, p);
                            removeFirstBlock = true;
                        } else {
                            if (firstBlockTagName === 'li') {
                                if (ViperUtil.isBrowser('chrome') === true || ViperUtil.isBrowser('safari') === true || ViperUtil.isBrowser('msie') === true) {
                                    var parentListItem = ViperUtil.getFirstBlockParent(firstBlock.parentNode);
                                    if (parentListItem && ViperUtil.isTag(parentListItem, 'li') === true) {
                                        newList = document.createElement('li');
                                        newList.appendChild(document.createElement('br'));

                                        var subList = null;
                                        while (firstBlock.nextSibling) {
                                            if (ViperUtil.isTag(firstBlock.nextSibling, 'li') === true) {
                                                if (!subList) {
                                                    subList = document.createElement(ViperUtil.getTagName(firstBlock.parentNode));
                                                    newList.appendChild(subList);
                                                }

                                                subList.appendChild(firstBlock.nextSibling);
                                            } else if (subList) {
                                                subList.appendChild(firstBlock.nextSibling);
                                            } else {
                                                newList.appendChild(firstBlock.nextSibling);
                                            }
                                        }

                                        ViperUtil.remove(firstBlock);
                                        ViperUtil.insertAfter(parentListItem, newList);
                                        range.selectNode(newList.firstChild);
                                        range.collapse(true);
                                        ViperSelection.addRange(range);
                                        return false;
                                    }
                                }

                                // Need to move rest of the list items to a new
                                // list.
                                var newList = document.createElement(ViperUtil.getTagName(firstBlock.parentNode));
                                while (firstBlock.nextSibling) {
                                    newList.appendChild(firstBlock.nextSibling);
                                }

                                if (ViperUtil.getTag('li', newList).length > 0) {
                                    ViperUtil.insertAfter(firstBlock.parentNode, newList);
                                }

                                ViperUtil.insertAfter(firstBlock.parentNode, p);
                            } else {
                                ViperUtil.insertAfter(firstBlock, p);
                            }
                        }

                        if (removeFirstBlock === true) {
                            ViperUtil.remove(firstBlock);
                        }

                        if (p.firstChild.nodeType === ViperUtil.TEXT_NODE) {
                            if (ViperUtil.isBrowser('msie', '<11') === true
                                && p.firstChild.data === String.fromCharCode(160)
                            ) {
                                range.setEnd(p.firstChild, 1);
                                range.collapse(false);
                                range.moveEnd('character', -1);
                                range.collapse(false);
                            } else {
                                range.setEnd(p.firstChild, 0);
                                range.collapse(false);
                            }
                        } else {
                            range.selectNode(p.firstChild);
                            range.collapse(true);
                        }


                        ViperSelection.addRange(range);

                        this._viper.contentChanged();
                        return false;
                    }//end if
                }//end if
            }//end if

            var startNode   = range.getStartNode();
            var blockParent = null;
            if (!startNode) {
                if (range.startContainer.childNodes.length <= range.startOffset && range.startOffset !== 0) {
                    startNode = range.startContainer.childNodes[(range.startContainer.childNodes.length - 1)];
                } else {
                    startNode = range.startContainer;
                }

                if (ViperUtil.isBlockElement(startNode) === true) {
                    blockParent = startNode;
                }
            } else {
                blockParent = ViperUtil.getFirstBlockParent(startNode);
            }

            if (startNode && ViperUtil.isTag(blockParent, 'pre') === true) {
                if (startNode.parentNode === blockParent
                    && startNode.nodeType === ViperUtil.TEXT_NODE
                    && ViperUtil.trim(startNode.data) === ''
                    && (!startNode.previousSibling
                    || startNode.previousSibling.data === "\n")
                ) {
                    while (startNode.nextSibling) {
                       ViperUtil.remove(startNode.nextSibling);
                    }

                    ViperUtil.remove(startNode);
                    var p = document.createElement('p');
                    ViperUtil.setHtml(p, '<br />');
                    ViperUtil.insertAfter(blockParent, p);
                    range.selectNode(p.firstChild);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                } else {
                    this.insertTextAtRange(range, "\n");
                    this._viper.contentChanged();
                }

                return false;
            } else if ((blockParent === null || blockParent === this._viper.getViperElement()) && !defaultTagName) {
                if (startNode.nodeType === ViperUtil.TEXT_NODE
                    && startNode.data.length > (range.startOffset + 1)
                    && startNode.data.charCodeAt(range.startOffset) === 32
                ) {
                    startNode.data = startNode.data.substring(0, range.startOffset) + String.fromCharCode(160) +  startNode.data.substring(range.startOffset + 1);
                    range.setStart(startNode, range.startOffset);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                }

                var br = document.createElement('br');
                this._viper.insertNodeAtCaret(br);

                if (!br.nextSibling
                    || br.nextSibling.nodeType !== ViperUtil.TEXT_NODE
                    || br.nextSibling.data.charAt(0) === "\n"
                ) {
                    ViperUtil.insertAfter(br, document.createElement('br'));
                    ViperUtil.insertAfter(br, document.createTextNode(''));
                }

                range.setStart(br.nextSibling, 0);
                range.collapse(true);
                ViperSelection.addRange(range);

                return false;
            } else if (ViperUtil.isBrowser('msie') === true
                && range.startOffset === 0
                && range.collapsed === true
                && ViperUtil.isTag(startNode, 'li') === true
            ) {
                if (!startNode.nextSibling || (startNode.nextSibling.nodeType === ViperUtil.TEXT_NODE && !startNode.nextSibling.nextSibling)) {
                    if (startNode.parentNode.parentNode === this._viper.getViperElement()) {
                        var p = document.createElement('p');
                        ViperUtil.setHtml(p, '&nbsp');
                        ViperUtil.insertAfter(startNode.parentNode, p);
                        range.setEnd(p.firstChild, 1);
                        range.moveEnd('character', -1);
                        range.collapse(false);
                        ViperSelection.addRange(range);

                        this._viper.fireSelectionChanged();
                        ViperUtil.remove(startNode);
                        return false;
                    }
                }
            }//end if

            var selectedNode = range.getNodeSelection();
            var viperElem    = this._viper.getViperElement();
            if (selectedNode && selectedNode === viperElem) {
                if (ViperUtil.isBrowser('msie') === true) {
                    // Let IE do it as there is no way of telling if the caret is
                    // before or after the iframe.
                    return;
                }

                var elem = document.createElement(defaultTagName);
                ViperUtil.setHtml(elem, '<br />');
                if (viperElem.firstChild) {
                    ViperUtil.insertBefore(viperElem.firstChild, elem);
                } else {
                    viperElem.appendChild(elem);
                }

                range.selectNode(elem.firstChild);
                range.collapse(true);
                ViperSelection.addRange(range);
                this._viper.fireSelectionChanged();
                return false;
            } else if (!selectedNode
                && startNode
                && startNode === endNode
                && startNode.nodeType === ViperUtil.ELEMENT_NODE
                && (ViperUtil.isBrowser('firefox') !== true || !(ViperUtil.isTag(startNode, 'br') === true && (!blockParent || ViperUtil.isTag(blockParent, 'li') === true)))
                && ViperUtil.isStubElement(startNode) === false
                && ViperUtil.isBlockElement(startNode) === true
            ) {
                var elem = document.createElement(defaultTagName);
                ViperUtil.setHtml(elem, '<br />');
                if (startNode === viperElem.lastChild) {
                    ViperUtil.insertAfter(startNode, elem);
                } else {
                    ViperUtil.insertBefore(startNode, elem);
                }

                range.selectNode(elem.firstChild);
                range.collapse(true);
                ViperSelection.addRange(range);
                this._viper.fireSelectionChanged();
                return false;
            } else if (!selectedNode
                && startNode
                && endNode
                && startNode !== endNode
                && startNode.nodeType === ViperUtil.ELEMENT_NODE
                && endNode.nodeType === ViperUtil.ELEMENT_NODE
            ) {
                var elem = document.createElement(defaultTagName);
                ViperUtil.setHtml(elem, '<br />');

                if (ViperUtil.isStubElement(endNode) === true) {
                    ViperUtil.insertAfter(startNode, elem);
                } else {
                    ViperUtil.insertAfter(endNode, elem);
                }

                range.selectNode(elem.firstChild);
                range.collapse(true);
                ViperSelection.addRange(range);
                this._viper.fireSelectionChanged();
                return false;
            } else if (ViperUtil.isBrowser('firefox') === true
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && endNode === startNode
                && range.startOffset === startNode.data.length
                && range.collapsed === true
                && ViperUtil.isTag(blockParent, 'li') === true
                && ViperUtil.isChildOf(ViperUtil.getFirstBlockParent(range.getNextContainer(startNode)), blockParent)
            ) {
                // There is a sublist and the range is at the end of the main list
                // item. When enter is pressed Firefox creates a new main list item
                // but the caret is placed to the start of the sub list items and
                // its not possible to move the caret to the new main list item.
                var li = document.createElement('li');
                if (!startNode.nextSibling || ViperUtil.isTag(startNode.nextSibling, 'br') === false) {
                    // Do not add extra BR tag.
                    li.appendChild(document.createElement('br'));
                }

                while (startNode.nextSibling) {
                    li.appendChild(startNode.nextSibling);
                }

                ViperUtil.insertAfter(blockParent, li);
                range.selectNode(li.firstChild);
                range.collapse(true);
                ViperSelection.addRange(range);
                return false;
            } else if (selectedNode
                && ViperUtil.isTag(selectedNode, 'li') === true
                && blockParent === selectedNode
                && startNode === endNode
                && ViperUtil.isTag(startNode, 'br') === true
                && range.collapsed === true
                && !startNode.nextSibling
            ) {
                var parentListItem = ViperUtil.getFirstBlockParent(blockParent.parentNode);
                if (parentListItem && ViperUtil.isTag(parentListItem, 'li') === true) {
                    // Pressing enter at the start of an empty sub list item should
                    // be creating a new main list item and moving all remaining
                    // sub list items to the new list item.
                    var li = document.createElement('li');
                    li.appendChild(document.createElement('br'));
                    while (startNode.nextSibling) {
                        li.appendChild(startNode.nextSibling);
                    }

                    var subList = null;
                    while (blockParent.nextSibling) {
                        if (ViperUtil.isTag(blockParent.nextSibling, 'li') === true) {
                            if (!subList) {
                                subList = document.createElement(ViperUtil.getTagName(blockParent.parentNode));
                                li.appendChild(subList);
                            }

                            subList.appendChild(blockParent.nextSibling);
                        } else if (subList) {
                            subList.appendChild(blockParent.nextSibling);
                        } else {
                            li.appendChild(blockParent.nextSibling);
                        }
                    }

                    ViperUtil.remove(blockParent);
                    ViperUtil.insertAfter(parentListItem, li);
                    range.selectNode(li.firstChild);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                    return false;
                } else if (ViperUtil.isBrowser('chrome') === true) {
                    // Latest Chrome is creating DIV element with span tag when
                    // exiting a top level list (hitting enter in an empty top level list item).
                    // Create the default tag instead.
                    var elem = null;
                    if (defaultTagName) {
                        elem = document.createElement(defaultTagName);
                        elem.appendChild(document.createElement('br'));
                    } else {
                        elem = document.createElement('br');
                    }

                    ViperUtil.insertAfter(blockParent.parentNode, elem);

                    // If the list item is not the last one we need to move
                    // the rest of them to a new list.
                    var listItems = [];
                    for (var node = blockParent; node; node = node.nextSibling) {
                        if (ViperUtil.isTag(node, 'li') === true) {
                            listItems.push(node);
                        }
                    }

                    if (listItems.length > 0) {
                        var newList = document.createElement(ViperUtil.getTagName(blockParent.parentNode));
                        ViperUtil.insertAfter(elem, newList);
                        while (listItems.length > 0) {
                            newList.appendChild(listItems.shift());
                        }
                    }

                    ViperUtil.remove(blockParent);

                    if (defaultTagName) {
                        range.selectNode(elem.firstChild);
                    } else {
                        range.selectNode(elem);
                    }

                    range.collapse(true);
                    ViperSelection.addRange(range);
                    return false;
                }
            } else if (range.collapsed === true
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && startNode.data.length > (range.startOffset + 1)
                && startNode.data.charCodeAt(range.startOffset) === 32
            ) {
                // If this is a textnode, range is collapsed and the next
                // character is a space then replace it with a non breaking
                // space char to keep it at the beginning of the new container
                // that will be created.
                startNode.data = startNode.data.substring(0, range.startOffset) + String.fromCharCode(160) +  startNode.data.substring(range.startOffset + 1);
                range.setStart(startNode, range.startOffset);
                range.collapse(true);
                ViperSelection.addRange(range);
            } else if ((ViperUtil.isBrowser('msie') === true || ViperUtil.isBrowser('firefox') === true)
                && range.startOffset === 0
                && range.collapsed === true
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && startNode === range._getFirstSelectableChild(ViperUtil.getFirstBlockParent(startNode))
            ) {
                // IE11 & Firefox (only on 2nd enter) seems to have an issue with creating a new paragraph before the caret. If the caret is at the
                // start of a paragraph and enter is pressed a new paragraph is added before the original P tag.
                // However, in IE11, the innerHTML is '<br>' but firstChild of the paragraph is null..
                // We handle the creation here to prevent issues with toolbar button statuses etc.
                var parent = ViperUtil.getFirstBlockParent(startNode);
                var newEl = document.createElement(ViperUtil.getTagName(parent));
                newEl.appendChild(document.createElement('br'));

                if (ViperUtil.isBrowser('msie', '8') === true) {
                    ViperUtil.setStyle(newEl.firstChild, 'display', 'none');
                }

                ViperUtil.insertBefore(parent, newEl);
                this._viper.contentChanged(true);
                return false;
            } else if (ViperUtil.isBrowser('msie', '>=11') === true
                && startNode === endNode
                && range.collapsed === true
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && startNode.nextSibling === null
                && range.startOffset === startNode.data.length
                && ViperUtil.isTag(ViperUtil.getFirstBlockParent(startNode), 'li') === true
            ) {
                // End of a list item. Create a new list item.
                var li = document.createElement('li');
                ViperUtil.setHtml(li, '<br/>');
                var parentItem = ViperUtil.getFirstBlockParent(startNode);
                ViperUtil.insertAfter(parentItem, li);
                range.selectNode(li.firstChild);
                range.collapse(true);
                ViperSelection.addRange(range);
                this._viper.contentChanged();
                return false;
            } else if (startNode
                && startNode === endNode
                && ViperUtil.isStubElement(startNode) === true
                && startNode.parentNode === self._viper.getViperElement()
            ) {
                // For content like <viperElement><iframe />*</viperElement>. Where * is the caret.
                var defTag = null;
                if (defaultTagName !== '') {
                    defTag = document.createElement(defaultTagName);
                    ViperUtil.setHtml(defTag, '<br/>');
                } else {
                    defTag = document.createTextNode(' ');
                }

                ViperUtil.insertAfter(startNode, defTag);
                range.setStart(defTag, 0);
                range.collapse(true);
                ViperSelection.addRange(range);
                return false;
            } else if (ViperUtil.isBrowser('firefox') === true
                && range.collapsed === true
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && range.endOffset === startNode.data.length
                && startNode.nextSibling
                && ViperUtil.isTag(startNode.nextSibling, 'br')
                && (!startNode.nextSibling.nextSibling || ViperUtil.isTag(startNode.nextSibling.nextSibling, 'br') === false)
            ) {
                // Handle XAX*<br>XBX<br>XCX.
                // Pressing enter changes the content to: <p>XAX</p>*XBX<br>XCX.
                // By adding an extra BR we keep it in the content.
                ViperUtil.insertAfter(startNode, document.createElement('br'));
            } else if ((ViperUtil.isBrowser('msie') === true
                || ViperUtil.isBrowser('firefox') === true)
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && range.endOffset === startNode.data.length
                && startNode.data.length !== 0
                && range.collapsed === true
                && startNode.nextSibling === null
                && ViperUtil.isBlockElement(startNode.parentNode) === false
            ) {
                // Handle: <p>test<strong>test*</strong>test</p>.
                // When enter is pressed make sure the new paragraph does not start with the tag.
                var parent = startNode.parentNode;
                var surroundingParents = ViperUtil.getSurroundingParents(parent);
                if (surroundingParents.length > 0) {
                    parent = surroundingParents.pop();
                }

                var parentNextSibling = parent.nextSibling;
                if (!parentNextSibling || parentNextSibling.nodeType !== ViperUtil.TEXT_NODE) {
                    parentNextSibling = document.createTextNode('');
                    ViperUtil.insertAfter(parent, parentNextSibling);
                }

                range.setStart(parentNextSibling, 0);
                range.collapse(true);
                ViperSelection.addRange(range);
            } else if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.collapsed === true
                && range.startOffset === (range.startContainer.data.length + 1)
                && range.startContainer.previousSibling
                && range.startContainer.previousSibling.nodeType !== ViperUtil.TEXT_NODE
                && (range.startContainer.nextSibling === null || ViperUtil.isTag(range.startContainer.nextSibling, 'br') === true)
                && ViperUtil.trim(range.startContainer.data) === ''
            ) {
                // Handle case where <p>text<strong>text</strong> *</p> or <p>text<strong>text</strong> *<br/></p>
                // causes caret to stay in the same paragraph.
                var parent = ViperUtil.getFirstBlockParent(range.startContainer);
                if (parent) {
                    var newParent = document.createElement(ViperUtil.getTagName(parent));
                    ViperUtil.setHtml(newParent, '<br />');
                    ViperUtil.insertAfter(parent, newParent);
                    range.setStart(newParent.firstChild, 0);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                    self._viper.fireSelectionChanged(null, true);
                    return false;
                }
            } else if ((ViperUtil.isBrowser('chrome') === true || ViperUtil.isBrowser('safari') === true)
                && range.startOffset === 0
                && range.collapsed === true
                && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range._getFirstSelectableChild(ViperUtil.getFirstBlockParent(range.startContainer)) === range.startContainer
            ) {
                // Caret is at the start of a block element and pressing enter needs to create a new element before this. and
                // leave the caret where it is.
                var parent    = ViperUtil.getFirstBlockParent(range.startContainer);
                var newParent = document.createElement(ViperUtil.getTagName(parent));
                ViperUtil.setHtml(newParent, '<br />');
                ViperUtil.insertBefore(parent, newParent);
                this._viper.contentChanged(true);
                return false;
            } else if (range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                && range.collapsed === true
                && range.startOffset === 0
                && range.startContainer.previousSibling
                && range.startContainer.previousSibling.nodeType === ViperUtil.TEXT_NODE
                && range.startContainer.nextSibling === null
                && ViperUtil.isTag(range.startContainer, 'br') === true
            ) {
                // Handle case where <p>test test[<br/>]</p>, element ending with br and range is set to br.
                var parent = ViperUtil.getFirstBlockParent(range.startContainer);
                if (parent) {
                    var newParent = document.createElement(ViperUtil.getTagName(parent));
                    ViperUtil.setHtml(newParent, '<br />');
                    ViperUtil.insertAfter(parent, newParent);
                    range.setStart(newParent.firstChild, 0);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                    self._viper.fireSelectionChanged(null, true);
                    return false;
                }
            } else if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.collapsed === true
                && range.startOffset === range.startContainer.data.length
                && range.startContainer.nextSibling
                && range.startContainer.nextSibling.nodeType !== ViperUtil.TEXT_NODE
                && ViperUtil.isTag(range.startContainer.nextSibling, 'br') === false
                && ViperUtil.isBlockElement(range.startContainer.nextSibling) === false
            ) {
                // Handle <p>test *<strong>text</strong></p>.
                this.splitAtRange();
                return false;
            } else if (range.startContainer === range.endContainer
                && defaultTagName !== ''
                && ViperUtil.isBlockElement(range.startContainer) === true
                && range.collapsed === true
                && range.startOffset === range.startContainer.childNodes.length
                && ViperUtil.isTag(range.startContainer.childNodes[(range.startOffset - 1)], 'table') === true
            ) {
                // Handle: <div>...<table>..</table>*</div>.
                var newTag = document.createElement(defaultTagName);
                ViperUtil.setHtml(newTag, '<br />');
                ViperUtil.insertAfter(range.startContainer.childNodes[(range.startOffset - 1)], newTag);
                range.setStart(newTag.firstChild, 0);
                range.collapse(true);
                ViperSelection.addRange(range);
                this._viper.contentChanged();
                return false;
            }//end if


            if (range.startOffset === 0
                && range.collapsed === true
                && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && (range.startContainer.previousSibling === null || (range.startContainer.previousSibling
                && range.startContainer.previousSibling.nodeType !== ViperUtil.TEXT_NODE))
            ) {
                // Hande enter when <p><strong>test</strong><em>*test</em></p> and  <p><strong>test</strong>*test</p>.
                this.splitAtRange();
                return false;
            }//end if

            setTimeout(function() {
                // Fire selection changed here for enter events after a delay so that
                // range object is pointing to the new location. For example,
                // if enter was pressed at the end of a list and a new paragraph is
                // started by browser then getting range without delay would still
                // point to the empty list item. With delay it will be in the new
                // paragraph tag.
                self._viper.fireSelectionChanged(null, true);
            }, 5);

            // Let the browser handle everything else.
            return true;

        },

        handleDelete: function(e)
        {
            e = e || {which:8, keyCode:8};

            var range = this._viper.getViperRange();
            if (this._viper.fireCallbacks('Viper:beforeDelete', e) === false) {
                return false;
            }

            if (this._isWholeViperElementSelected(range) === true) {
                // The whole Viper element is selected, remove all of its content
                // and then initialise the Viper element.
                ViperUtil.setHtml(this._viper.getViperElement(), '');
                this._viper.initEditableElement();
                this._viper.contentChanged();
                return false;
            }

            if (ViperUtil.isBrowser('chrome') === true || ViperUtil.isBrowser('safari') === true) {
                // Latest Chrome versions have strange issue with all content deletion, handle it in another method.
                return this._handleDeleteForWebkit(e, range);
            }

            if (e.which === 46) {
                // Handle deletion from the right of the caret.
                return this._handleDeleteFromRight(e, range);
            }

            if (range.startOffset !== 0 && range.startContainer.nodeType === ViperUtil.TEXT_NODE) {
                if (range.collapsed === true && ViperUtil.isBrowser('msie', '<11')) {
                    // Delete 1 char in IE.... This resolves the issue where <a href="" />T* backspace here sets the
                    // range to incorrect position..
                    if (range.startOffset === 1) {
                        range.startContainer.data = '';
                        if (range.startContainer.previousSibling
                            && range.startContainer.previousSibling.nodeType !== ViperUtil.TEXT_NODE
                        ) {
                            var span = document.createElement('span');
                            ViperUtil.attr(span, 'data-viper-span', 'true');
                            ViperUtil.insertBefore(range.startContainer, span);
                            span.appendChild(range.startContainer);
                        } else if (!range.startContainer.previousSibling
                            && !range.startContainer.nextSibling
                            && ViperUtil.isBlockElement(range.startContainer.parentNode)
                        ) {
                            range.startContainer.parentNode.appendChild(document.createElement('br'));
                        }
                    } else {
                        range.startContainer.splitText(range.startOffset);
                        range.startContainer.data = range.startContainer.data.substring(0, range.startOffset - 1);
                        if (range.startContainer.nextSibling
                            && range.startContainer.nextSibling.nodeType === ViperUtil.TEXT_NODE
                        ) {
                            // If the range was at the end of the text node then splitText does not
                            // create a new text node.
                            range.startContainer.data += range.startContainer.nextSibling.data;
                            ViperUtil.remove(range.startContainer.nextSibling);
                        }
                    }

                    range.setStart(range.startContainer, range.startOffset - 1)
                    range.collapse(true);
                    ViperSelection.addRange(range);
                    this._viper.contentChanged();
                    return false;
                }
            }

            var defaultTagName  = this._viper.getDefaultBlockTag();
            var viperElement    = this._viper.getViperElement();
            var firstSelectable = range._getFirstSelectableChild(viperElement);
            var startNode       = range.getStartNode();

            if (!startNode
                && range.startOffset === 0
                && range.startContainer.nodeType !== ViperUtil.TEXT_NODE
                && range.collapsed === true
                && !range.startContainer.firstChild
            ) {
                startNode = range.startContainer;
            }

            // TODO: Should use getNodeSelection to simplify this whole delete method.
            if (range.collapsed === true && e.keyCode === 8 && range.startOffset === 0) {
                if (startNode && (startNode.nodeType === ViperUtil.TEXT_NODE || ViperUtil.isTag(startNode, 'br') === true)) {
                    var skippedBlockElem = [];
                    var node      = range.getPreviousContainer(startNode, skippedBlockElem, true, true);
                    if (this._viper.isOutOfBounds(node) === true) {
                        // Range is at the start of the editable element, nothing to delete except any blank block elements.
                        if (skippedBlockElem.length > 0) {
                            for (var i = 0; i < skippedBlockElem.length; i++) {
                                if (ViperUtil.isTag(skippedBlockElem[i], 'p') === true) {
                                    ViperUtil.remove(skippedBlockElem[i]);
                                }
                            }
                        } else if (startNode.nodeType !== ViperUtil.TEXT_NODE || startNode.data.length === 0) {
                            node = range.getNextContainer(startNode, skippedBlockElem, true, true);
                            if (node && this._viper.isOutOfBounds(node) === false) {
                                ViperUtil.remove(ViperUtil.getSurroundingParents(startNode));
                                range.setStart(node, 0);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            }
                        } else {
                            var nonSelectableElements = ViperUtil.getElementsBetween(viperElement, startNode);
                            ViperUtil.remove(nonSelectableElements);
                        }

                        if (((startNode.nodeType === ViperUtil.TEXT_NODE
                            && ViperUtil.trim(startNode.data).length === 0)
                            || ViperUtil.isTag(startNode, 'br') === true)
                            && ViperUtil.isTag(startNode.parentNode, 'li') === true
                            && ViperUtil.getTag('li', startNode.parentNode.parentNode).length === 1
                        ) {
                            // If the list item is the first container in the content and its being removed and its the
                            // only list item then remove the list element.
                            if (startNode.parentNode.parentNode.parentNode === this._viper.getViperElement()
                                && startNode.parentNode.parentNode.nextSibling === null
                                && startNode.parentNode.parentNode.previousSibling === null
                            ) {
                                // This list is the only element in the content, initialise the content
                                // after removing the list.
                                ViperUtil.remove(startNode.parentNode.parentNode);
                                this._viper.initEditableElement();
                            } else {
                                this._viper.moveCaretAway(startNode.parentNode.parentNode, true);
                                ViperUtil.remove(startNode.parentNode.parentNode);
                            }

                            this._viper.contentChanged();
                        }

                        return false;
                    }
                }
            }

            if (this._isWholeViperElementSelected(range) === true) {
                // The whole Viper element is selected, remove all of its content
                // and then initialise the Viper element.
                ViperUtil.setHtml(viperElement, '');
                this._viper.initEditableElement();
                this._viper.contentChanged();
                return false;
            } else if (ViperUtil.isBrowser('msie') === true) {
                var rangeClone = range.cloneRange();

                if (ViperUtil.isBrowser('msie', '>=11') === true) {
                    // Check if the previous sibling of a parent is HR element and then remove it if found.
                    var startElem = startNode;
                    var foundSib  = false;
                    while (startElem) {
                        for (var node = startElem.previousSibling; node; node = node.previousSibling) {
                            if (node.nodeType === ViperUtil.ELEMENT_NODE && ViperUtil.isTag(node, 'hr') === true) {
                                // Found the HR element, remove it.
                                ViperUtil.remove(node);
                                this._viper.contentChanged();
                                return false;
                            } else if (node.nodeType !== ViperUtil.TEXT_NODE || ViperUtil.trim(node.data).length !== 0) {
                                // Not an empty text node or another node type, no need to continue.
                                foundSib = true;
                                break;
                            }
                        }

                        if (foundSib === true) {
                            break;
                        }

                        startElem = startElem.parentNode;
                    }
                } else {
                    // Remove HR elements in <IE11..
                    rangeClone.moveStart('character', -2);
                    if (ViperUtil.trim(rangeClone.getHTMLContents()) === '<HR>') {
                        range.moveStart('character', -2);
                        range.deleteContents();
                        return;
                    }
                }

                if (range.startContainer
                    && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                    && range.endContainer
                    && range.endContainer.nodeType === ViperUtil.TEXT_NODE
                    && range.startOffset === 0
                    && range.endOffset === range.endContainer.data.length
                ) {
                    // Remove a whle list element. IE seems to remove the list
                    // items but not the UL/OL element...
                    var parentLists = ViperUtil.getParents(range.startContainer, 'ul,ol', this._viper.getViperElement());
                    while (parentLists.length > 0) {
                        var parentList = parentLists.shift();
                        var firstSelectable = range._getFirstSelectableChild(parentList);
                        var lastSelectable  = range._getLastSelectableChild(parentList);
                        if (firstSelectable === range.startContainer
                            && lastSelectable === range.endContainer
                        ) {
                            var newSelectable = range.getNextContainer(lastSelectable, null, true);
                            if (!newSelectable || this._viper.isOutOfBounds(newSelectable) === true) {
                                newSelectable = range.getPreviousContainer(firstSelectable, null, true);
                                if (newSelectable) {
                                    ViperUtil.remove(parentList);
                                    range.setEnd(newSelectable, newSelectable.data.length);
                                    range.collapse(false);
                                    ViperSelection.addRange(range);
                                }
                            } else {
                                ViperUtil.remove(parentList);
                                range.setEnd(newSelectable, 0);
                                range.collapse(false);
                                ViperSelection.addRange(range);
                            }

                            this._viper.contentChanged();

                            return false;
                        }//end if
                    }//end if
                }//end if
            }

            if (range.startOffset === 0
                && range.collapsed === true
                && startNode.nodeType === ViperUtil.TEXT_NODE
            ) {
                var firstBlock = ViperUtil.getFirstBlockParent(startNode);
                if (firstBlock
                    && range._getFirstSelectableChild(firstBlock) === startNode
                    && firstBlock.previousElementSibling
                    && ViperUtil.isStubElement(firstBlock.previousElementSibling) === true
                ) {
                    // Firefox does not handle deletion at the start of a block element
                    // very well when the previous sibling is a stub element (e.g. HR).
                    ViperUtil.remove(firstBlock.previousElementSibling);
                    return false;
                } else if (e.keyCode === 8
                    && range.collapsed === true
                    && startNode.nodeType === ViperUtil.TEXT_NODE
                    && (range.startOffset === 0 || (range.startOffset === 1 && startNode.data.charAt(0) === ' '))
                    && (!startNode.previousSibling || ViperUtil.isTag(startNode.previousSibling, 'br') === true)
                ) {
                    // At the start of an element. Check to see if the previous
                    // element is a part of another block element. If it is then
                    // join these elements.
                    var prevSelectable = range.getPreviousContainer(startNode, null, true, true);
                    var currentParent  = ViperUtil.getFirstBlockParent(startNode);
                    var prevParent     = ViperUtil.getFirstBlockParent(prevSelectable);
                    if (currentParent !== prevParent && this._viper.isOutOfBounds(prevSelectable) === false) {
                        // Check if there are any other elements in between.
                        var elemsBetween = ViperUtil.getElementsBetween(prevParent, currentParent);
                        if (elemsBetween.length > 0 && elemsBetween[0].nodeType === ViperUtil.TEXT_NODE && ViperUtil.isBlank(ViperUtil.trim(elemsBetween[0].data)) === false) {
                            // There is at least one non block element in between.
                            // Remove it.
                            ViperUtil.remove(elemsBetween[(elemsBetween.length - 1)]);
                        } else {
                            // If prev parent has BR as last child, remove it.
                            if (prevParent.lastChild && ViperUtil.isTag(prevParent.lastChild, 'br') === true) {
                                ViperUtil.remove(prevParent.lastChild);
                            }

                            if (currentParent.lastChild && ViperUtil.isTag(currentParent.lastChild, 'br') === true) {
                                ViperUtil.remove(currentParent.lastChild);
                            }

                            var firstChild = currentParent.firstChild;
                            while (currentParent.firstChild) {
                                prevParent.appendChild(currentParent.firstChild);
                            }

                            if (ViperUtil.isTag(currentParent, ['td', 'th']) === false) {
                                ViperUtil.remove(currentParent);
                            }

                            if (prevSelectable.nodeType === ViperUtil.TEXT_NODE) {
                                range.setEnd(prevSelectable, prevSelectable.data.length);
                            } else if (prevSelectable.parentNode === null || ViperUtil.isStubElement(prevSelectable) === true) {
                                // Prev selectable was most likely a BR tag that got removed.
                                if (firstChild.nodeType === ViperUtil.TEXT_NODE) {
                                    range.setEnd(firstChild, 0);
                                } else {
                                    range.selectNode(firstChild);
                                }
                            } else {
                                range.selectNode(prevSelectable);
                            }

                            range.collapse(false);
                            ViperSelection.addRange(range);
                        }

                        this._viper.contentChanged();

                        return false;
                    } //end if
                }//end if
            } else if (range.startOffset === 0
                && range.collapsed === false
                && ViperUtil.isBrowser('msie') !== true
            ) {
                // Chrome has issues with removing list items from lists.
                var startNode = range.getStartNode();
                var endNode   = range.getEndNode();

                // First issue is, if a whole list item is selected, it removes the li
                // and it adds a span tag in place of it, creating invalid HTML and
                // causing all sorts of issues. It should only remove the list item
                // contents and leave the list item un touched..
                if (startNode === endNode
                    && startNode.nodeType === ViperUtil.TEXT_NODE
                    && ViperUtil.isTag(startNode.parentNode, 'li') === true
                    && startNode.data.length === range.endOffset
                ) {
                    ViperUtil.setHtml(startNode.parentNode, '<br />');
                    return false;
                } else if ((ViperUtil.isTag(range.commonAncestorContainer, 'ul') || ViperUtil.isTag(range.commonAncestorContainer, 'ol'))) {
                    // Second issue is with removing multiple list items.
                    if (endNode.data.length === range.endOffset) {
                        var endItem = ViperUtil.getParents(endNode, 'li')[0];
                        if (endNode === range._getLastSelectableChild(endItem)) {
                            // Whole list item is selected.
                            // Get the start list item and all other list items until
                            // the end list item.
                            var startItem = ViperUtil.getParents(startNode, 'li')[0];
                            if (startNode === range._getFirstSelectableChild(startItem)) {
                                var elements = ViperUtil.getElementsBetween(startItem, endItem);
                                elements.push(startItem, endItem);

                                var parent = startItem.parentNode;
                                this._viper.moveCaretAway(startItem, true);

                                // Remove list items.
                                ViperUtil.remove(elements);

                                // Remove the list element (ul,ol) if its now empty.
                                if (ViperUtil.getTag('li', parent).length === 0) {
                                    ViperUtil.remove(parent);
                                }

                                this._viper.contentChanged();
                                return false;
                            }//end if
                        }//end if
                    }//end if
                }//end if
            } else if (range.startOffset === 0
                && range.collapsed === true
                && range.startContainer === range.endContainer
                && e.keyCode === 8
                && (ViperUtil.elementIsEmpty(range.startContainer) === true || ViperUtil.getHtml(range.startContainer) === '<br>')
            ) {
                if ((ViperUtil.isTag(range.startContainer, 'br') !== true
                    || (ViperUtil.isTag(range.startContainer.parentNode, 'td') === false
                    && ViperUtil.isTag(range.startContainer.parentNode, 'th') === false))
                    && (ViperUtil.isTag(range.startContainer, 'td') === false
                        && ViperUtil.isTag(range.startContainer, 'th') === false)
                ) {
                    var skippedBlockElem = [];
                    var endCont = range.endContainer;
                    var node    = range.getPreviousContainer(range.startContainer, skippedBlockElem, true, true);
                    var isList  = false;

                    var startOffset = 0;
                    if (!node || ViperUtil.isChildOf(node, this._viper.element) === false) {
                        if (skippedBlockElem.length > 0) {
                            for (var i = 0; i < skippedBlockElem.length; i++) {
                                if (ViperUtil.isTag(skippedBlockElem[i], 'p') === true) {
                                    ViperUtil.remove(skippedBlockElem[i]);
                                }
                            }
                        }

                        node = endCont;
                        if (ViperUtil.isTag(node, 'li') === false) {
                            return false;
                        } else {
                            isList = true;
                        }
                    } else if (node.nodeType === ViperUtil.TEXT_NODE) {
                        startOffset = node.data.length;
                        if (endCont.previousSibling !== null && ViperUtil.isBlockElement(endCont.previousSibling) === false && node.data.length > 0) {
                            startOffset--;
                            node.data = node.data.substr(0, startOffset);
                        }
                    }

                    range.setEnd(node, startOffset);
                    range.collapse(false);
                    ViperSelection.addRange(range);

                    if (endCont
                        && endCont.nodeType === ViperUtil.ELEMENT_NODE
                        && (ViperUtil.isTag(endCont, 'td') === true || ViperUtil.isTag(endCont, 'th') === true)
                    ) {
                        return;
                    }

                    var parent = endCont.parentNode;
                    ViperUtil.remove(endCont);
                    while (parent.childNodes.length === 0) {
                        if (parent === viperElement) {
                            break;
                        }

                        var remove = parent;
                        parent = parent.parentNode;
                        ViperUtil.remove(remove);
                    }

                    if (isList && parent === this._viper.getViperElement()) {
                        node = range._getFirstSelectableChild(parent, true);
                        if (!node) {
                            this._viper.initEditableElement();
                            node = range._getFirstSelectableChild(parent, true);
                        }
                    }

                    range.setEnd(node, startOffset);
                    range.collapse(false);
                    ViperSelection.addRange(range);

                    this._viper.contentChanged();
                    return false;
                } else if (!range.startContainer.previousSibling) {
                    return false;
                } else if (ViperUtil.isTag(range.startContainer, ['td', 'th']) === true) {
                    return false;
                }
            }

            var nodeSelection = range.getNodeSelection();
            if (nodeSelection && ViperUtil.isBlockElement(nodeSelection) === true) {
                // A block element is selected.
                if (ViperUtil.inArray(ViperUtil.getTagName(nodeSelection), this._keepContainerList) === true) {
                    // Cannot remove this parent, clear contents instead.
                    ViperUtil.setHtml(nodeSelection, '<br/>');
                    range.setStart(nodeSelection, 0);
                    range.collapse(true);
                } else {
                    this._viper.moveCaretAway(nodeSelection, true);
                    ViperUtil.remove(nodeSelection);
                }

                this._viper.contentChanged();
                return false;
            }

            if (range.collapsed === true) {
                // Range collapsed.
                if (range.startContainer.nodeType === ViperUtil.ELEMENT_NODE) {
                    // Container is an element node.
                    var childCount = range.startContainer.childNodes.length;
                    if (range.startOffset === childCount || range.startOffset === (childCount - 1)) {
                        // Range is outside of childNodes count.
                        var lastChild = range.startContainer.childNodes[(childCount - 1)];
                        var textNode  = null;

                        // Find the relevant text node.
                        if (ViperUtil.isStubElement(lastChild) === true) {
                            // For stub elements get the previous container.
                            textNode = range.getPreviousContainer(lastChild);
                        } else if (lastChild.nodeType === ViperUtil.ELEMENT_NODE) {
                            // Node with content, get the last selectable child.
                            textNode = range._getLastSelectableChild(lastChild);
                        } else if (lastChild.nodeType === ViperUtil.TEXT_NODE) {
                            // Text node.
                            if (lastChild.data.length > 0) {
                                textNode = lastChild
                            } else {
                                // Empty text node, get previousContainer.
                                textNode = range.getPreviousContainer(lastChild);
                            }
                        }

                        if (textNode) {
                            textNode.data = textNode.data.substr(0, (textNode.data.length - 1));
                            range.setStart(textNode, textNode.data.length);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                            this._viper.contentChanged();
                            return false;
                        }
                    }
                } else {
                    // Text node.
                    if (range.startOffset > 0) {
                        // Delete a character from left.
                        var textNode = range.startContainer;
                        textNode.data = textNode.data.substr(0, range.startOffset - 1) + textNode.data.substr(range.startOffset);

                        // Normalise text nodes.
                        this._normaliseNextNodes(textNode);

                        if (textNode.data === ' '
                            && textNode.nextSibling === null
                            && textNode.previousSibling
                            && ViperUtil.isTag(textNode.previousSibling, 'br') === true
                        ) {
                            // Handle case: <td>text <strong>text</strong><br> t*</td>. This will cause "line" to collapse
                            // which causes caret to appear between previous line and the line where delete happened.
                            // To prevent that add a BR at the end of the container and remove the space as its not
                            // visible.
                            textNode.data = '';
                            var br        = document.createElement('br');
                            textNode.parentNode.appendChild(br);
                            range.setStart(textNode, 0);
                        } else {
                            range.setStart(textNode, range.startOffset - 1);
                        }

                        range.collapse(true);

                        if (textNode.data.length === 0
                            && textNode.nextSibling === null
                            && textNode.previousSibling === null
                            && ViperUtil.isBlockElement(textNode.parentNode) === true
                        ) {
                            // The last character of this text node was deleted and now the block parent has no content.
                            // Add a BR to keep the blockelement 'selectable'.
                            var br = document.createElement('br');
                            textNode.parentNode.appendChild(br);
                        }

                        ViperSelection.addRange(range);
                        this._viper.contentChanged();
                        return false;
                    } else {
                        this._normaliseNextNodes(range.startContainer);

                        // At the beginning of text node.
                        if (range.startContainer.previousSibling === null
                            && (range.startContainer.nextSibling === null || ViperUtil.isTag(range.startContainer.nextSibling, 'br') === true)
                        ) {
                            // This is the only node in the parent.
                            // Set the range before the parent and remove it.
                            var parent            = range.startContainer.parentNode;
                            var previousContainer = range.getPreviousContainer(range.startContainer);
                            if (previousContainer) {
                                // Remove last character.
                                previousContainer.data = previousContainer.data.substr(0, previousContainer.data.length - 1);
                                range.setStart(previousContainer, previousContainer.data.length);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                                ViperUtil.remove(parent);
                                this._viper.contentChanged();
                                return false;
                            }
                        } else if (this._viper.isSpecialElement(range.startContainer.previousSibling) === true) {
                            var node = range.startContainer.previousSibling;
                            var surroundingParents = ViperUtil.getSurroundingParents(node);
                            if (surroundingParents.length > 0) {
                                node = ViperUtil.remove(surroundingParents.pop());
                            }

                            ViperUtil.remove(node);
                            this._viper.contentChanged();
                            return false;
                        } else {
                            var previousContainer = range.getPreviousContainer(range.startContainer);
                            if (previousContainer) {
                                if (previousContainer.nodeType === ViperUtil.TEXT_NODE) {
                                    range.setStart(previousContainer, previousContainer.data.length);
                                } else if (ViperUtil.isStubElement(previousContainer) === true) {
                                    // Handle case <p>text<strong>text</strong><br/>*</p>.
                                    ViperUtil.remove(previousContainer);
                                    this._viper.contentChanged(true);
                                    return false;
                                } else {
                                    range.setStart(previousContainer, 0);
                                }

                                range.collapse(true);
                                ViperSelection.addRange(range);
                                return;
                            }
                        }
                    }
                }
            } else {
                // Selection.
                if (range.startContainer === range.endContainer) {
                    // Same container.
                    if (range.startContainer.nodeType === ViperUtil.TEXT_NODE) {
                        // Text node selection. Modify node content.
                        var textNode = range.startContainer;
                        if (range.startOffset === 0 && range.endOffset === textNode.data.length) {
                            // The whole textnode is selected.
                            // Clear the contents of the text node.
                            textNode.data = '';

                            if (ViperUtil.isEmptyElement(textNode.parentNode) === true) {
                                // Parent is now empty.
                                var parent = textNode.parentNode;
                                if (ViperUtil.isBlockElement(parent) === true) {
                                    this._viper.moveCaretAway(parent, true);
                                    ViperUtil.remove(parent);
                                    this._viper.contentChanged();
                                    return false;
                                } else if (parent.previousSibling && parent.previousSibling.nodeType === ViperUtil.TEXT_NODE) {
                                    textNode = parent.previousSibling;
                                } else {
                                    ViperUtil.insertBefore(parent, textNode)
                                }

                                range.setStart(textNode, textNode.data.length);
                                range.collapse(true);

                                ViperUtil.remove(parent);
                            }

                            this._viper.contentChanged();
                            return false;
                        }
                    }
                } else {
                    // Different start and end containers.
                    if (range.startContainer.nodeType === ViperUtil.TEXT_NODE) {
                        // Start container is text node.
                        if (range.endContainer.nodeType === ViperUtil.TEXT_NODE) {
                            if (this._deleteFromDifferentBlockParents(range) === false) {
                                // Delete op was handled.
                                return false;
                            }

                            // And the end container is text node.
                            var container = null;
                            var offset    = 0;
                            if (range.startOffset === 0) {
                                // Selection is at the start of this text node and the end container is different.
                                // This means the startContainer will be removed, therfore use endContainer unless it is also empty.
                                if (range.endOffset === range.endContainer.data.length) {
                                    // Both the start container and the end container will be removed.
                                    container = document.createTextNode('');
                                    ViperUtil.insertBefore(range.startContainer, container);
                                    offset = 0;
                                } else {
                                    // The endContainer will remain after deletion use it to set the range.
                                    container = range.endContainer;
                                    offset    = 0;
                                }
                            } else {
                                container = range.startContainer;
                                offset    = range.startOffset;
                            }

                            // Let browser delete the contents but adjust the range after.
                            var self = this;
                            setTimeout(function () {
                                if (container.data.length === 0 && container.parentNode.childNodes.length === 1 && ViperUtil.isBlockElement(container.parentNode) === false) {
                                    var parent = container.parentNode;
                                    ViperUtil.insertBefore(container.parentNode, container);
                                    ViperUtil.remove(parent);
                                }

                                if (ViperUtil.isText(container.previousSibling) === true) {
                                    container = container.previousSibling;
                                    offset    = container.data.length;
                                    ViperUtil.normaliseTextNodeSiblings(container);
                                }

                                range.setStart(container, offset);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            }, 10);
                        }
                    }
                }
            }

            if (ViperUtil.isBrowser('msie') === true
                && range.endContainer.nodeType === ViperUtil.TEXT_NODE
                && range.endOffset === range.endContainer.data.length
                && range.startOffset === 0
                && range.endContainer !== range.startContainer
                && ViperUtil.getFirstBlockParent(range.startContainer) !== ViperUtil.getFirstBlockParent(range.endContainer)
                && range._getFirstSelectableChild(ViperUtil.getFirstBlockParent(range.startContainer)) === range.startContainer
                && range._getLastSelectableChild(ViperUtil.getFirstBlockParent(range.endContainer)) === range.endContainer
            ) {
                // Handle: <p><strong>*test</strong>test</p><p>test</p>, <p><strong>test</strong>test</p><p>test<strong>test*</strong></p>
                // In these cases once the paragraphs are removed and a new character is inserted it gets wrapped with the
                // inline tag.
                var startParent = range.startContainer.parentNode;
                if (ViperUtil.isBlockElement(startParent) === false && !startParent.previousSibling) {
                    var surroundingParents = ViperUtil.getSurroundingParents(startParent);
                    if (surroundingParents.length > 0) {
                        startParent = surroundingParents.pop();
                    }

                    var tmpNode = document.createTextNode(' ');
                    ViperUtil.insertBefore(startParent, tmpNode);
                    range.setStart(tmpNode, 0);
                }

                var endParent = range.endContainer.parentNode;
                if (ViperUtil.isBlockElement(endParent) === false && !endParent.nextSibling) {
                    var surroundingParents = ViperUtil.getSurroundingParents(endParent);
                    if (surroundingParents.length > 0) {
                        endParent = surroundingParents.pop();
                    }

                    var tmpNode = document.createTextNode(' ');
                    ViperUtil.insertAfter(endParent, tmpNode);
                    range.setEnd(tmpNode, 1);
                }

                ViperSelection.addRange(range);
            }//end if

            if (range.collapsed === false) {
                var nodeSelection = range.getNodeSelection();
                if (nodeSelection) {
                    if (nodeSelection === this._viper.getViperElement()) {
                        ViperUtil.setHtml(nodeSelection, '');
                        this._viper.initEditableElement();
                    }  else if (ViperUtil.inArray(ViperUtil.getTagName(nodeSelection), this._keepContainerList) === true) {
                        // Remove only the contents when a whole element is selected but the element cannot be
                        // removed (e.g. TD, as it would break the layout).
                        ViperUtil.setHtml(nodeSelection, '<br/>');
                        range.setStart(nodeSelection, 0);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                        this._viper.contentChanged(false, range);
                        return false;
                    } else {
                        var parents = ViperUtil.getSurroundingParents(nodeSelection, null, null, this.viperElement);
                        if (parents.length > 0) {
                            var topParent = parents.pop();
                            if (topParent === this._viper.getViperElement()) {
                                if (parents.length > 0) {
                                    nodeSelection = parents.pop();
                                }
                            } else {
                                nodeSelection = topParent;
                            }
                        }

                        range = this._viper.moveCaretAway(nodeSelection);
                        ViperUtil.remove(nodeSelection);
                        if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                            && range.startContainer.previousSibling
                            && range.startContainer.previousSibling.nodeType === ViperUtil.TEXT_NODE
                        ) {
                            // Join nodes.
                            var length = range.startContainer.previousSibling.data.length;
                            var prev   = range.startContainer.previousSibling;
                            ViperUtil.remove(range.startContainer);
                            if (prev.data.charAt(length - 1) === ' ' && range.startContainer.data.charAt(0) === ' ') {
                                // When joining nodes end and start with a space character, Webkit seems to ignore the 2nd space.
                                // Make sure 2nd space is converted to non breaking space character.
                                prev.data += String.fromCharCode(160);
                                if (range.startContainer.data.length > 1) {
                                    prev.data += range.startContainer.data.substring(1, range.startContainer.data.length);
                                }
                            } else {
                                prev.data += range.startContainer.data;
                            }

                            range.setStart(prev, length);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                        }
                    }

                    this._viper.contentChanged();
                    return false;
                }
            }//end if

            if (this._handleBackspaceAtStartOfLi(e, range) === false) {
                return false;
            }

            if (this._isStartToEndOfMultiContainerSelection(range) === true) {
                return this._removeContentFromStartToEndOfContainers(range)
            }

        },

        _normaliseNextNodes: function (textNode) {
            while (textNode.nextSibling && textNode.nextSibling.nodeType === ViperUtil.TEXT_NODE) {
                if (textNode.nextSibling.data.length > 0) {
                    textNode.data += textNode.nextSibling.data;
                }

                ViperUtil.remove(textNode.nextSibling);
            }

        },

        _deleteFromDifferentBlockParents: function (range)
        {
            if (this._isStartToEndOfMultiContainerSelection(range) === true) {
                return this._removeContentFromStartToEndOfContainers(range);
            }

            var startParent = range.startContainer;
            var endParent   = range.endContainer;

            if (ViperUtil.isBlockElement(startParent) === false) {
                startParent = ViperUtil.getFirstBlockParent(range.startContainer);
            }

            if (ViperUtil.isBlockElement(endParent) === false) {
                endParent = ViperUtil.getFirstBlockParent(range.endContainer);
            }

            if (startParent !== endParent) {
                // Two different parents. We need to join these parents.
                // First remove all elements in between.
                range.deleteContents();

                if (range.startContainer.parentNode && ViperUtil.isEmptyElement(range.startContainer.parentNode) === true) {
                    ViperUtil.remove(range.startContainer.parentNode);
                }

                if (ViperUtil.isEmptyElement(endParent) === false) {
                    // If the startParent is empty remove it if the endParent is the viperElement.
                    if (ViperUtil.isBlank(ViperUtil.trim(ViperUtil.getHtml(startParent))) !== true
                        || endParent != this._viper.getViperElement()
                    ) {
                        // Now bring the contents of the next selectable to the
                        // start parent.
                        var nextSelectable = range.getNextContainer(range.startContainer, null, true);
                        if (this._viper.isOutOfBounds(nextSelectable) === false) {
                            var nextParent = ViperUtil.getFirstBlockParent(nextSelectable);
                            if (startParent !== nextParent) {
                                while (nextParent.firstChild) {
                                    startParent.appendChild(nextParent.firstChild);
                                }

                                if (this.canRemoveNode(nextParent) === true) {
                                    ViperUtil.remove(nextParent);
                                }
                            }
                        }
                    } else {
                        ViperUtil.remove(startParent);
                    }
                } else {
                    ViperUtil.remove(endParent);
                }

                range.collapse(true);
                ViperSelection.addRange(range);
                this._viper.contentChanged();
                return false;
            }

        },

        _handleBackspaceAtStartOfLi: function(e, range)
        {
            if (e.which === 46 || range.startOffset !== 0) {
                return;
            }

            // Handle backspace at the start of a list (LI) element.
            if (range.collapsed === true && range.startContainer.nodeType === ViperUtil.TEXT_NODE) {
                var firstBlock      = ViperUtil.getFirstBlockParent(range.startContainer);
                var firstSelectable = range._getFirstSelectableChild(firstBlock);
                if (firstBlock
                    && ViperUtil.isTag(firstBlock, 'li') === true
                    && firstSelectable === range.startContainer
                    && !firstSelectable.previousSibling
                ) {
                     // Check if there is a parent element with a selectable.
                    var prevSelectable = range.getPreviousContainer(firstSelectable, null, true, true);
                    if (prevSelectable && this._viper.isOutOfBounds(prevSelectable) === false) {
                        while (firstBlock.lastChild) {
                            ViperUtil.insertAfter(prevSelectable, firstBlock.lastChild);
                        }

                        if (ViperUtil.isTag(prevSelectable, 'br') === true) {
                            ViperUtil.remove(prevSelectable);
                        }

                        var firstBlockParent = firstBlock.parentNode;
                        ViperUtil.remove(firstBlock);
                        if (ViperUtil.getTag('li', firstBlockParent).length === 0) {
                            ViperUtil.remove(firstBlockParent);
                        }

                        range.setStart(firstSelectable, 0);
                        range.collapse(true);
                        ViperSelection.addRange(range);

                        this._viper.contentChanged(true);
                        return false;
                    } else {
                        // This is the first LI in the content. Remove it from list.
                        var defaultTagName = this._viper.getDefaultBlockTag();
                        var lastElem       = document.createTextNode('');
                        var newElement     = null;

                        ViperUtil.insertBefore(firstBlock.parentNode, lastElem);
                        while (firstBlock.firstChild) {
                            var child = firstBlock.firstChild;
                            if (ViperUtil.isTag(child, ['ul', 'ol']) === true) {
                                // Child list. It cannot be inside the block element.
                                ViperUtil.insertAfter(lastElem, child);
                                newElement = null;
                                lastElem   = child;
                            } else {
                                if (defaultTagName !== '') {
                                    if (newElement === null) {
                                        newElement = document.createElement(defaultTagName);
                                        ViperUtil.insertAfter(lastElem, newElement);
                                        lastElem = newElement;
                                    }

                                    newElement.appendChild(child);
                                } else {
                                    ViperUtil.insertAfter(lastElem, child);
                                    lastElem = child;
                                }
                            }
                        }

                        ViperUtil.remove(firstBlock);

                        range.setStart(firstSelectable, 0);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                        this._viper.contentChanged(false, range);
                        return false;
                    }//end if
                }//end if
            } else if (range.collapsed === true
                && ViperUtil.isTag(range.startContainer, 'li') === true
                && ViperUtil.getHtml(range.startContainer) === ''
            ) {
                // Happens in IE8, when the list item is empty.

                var offset     = 0;
                var next       = false;
                var li         = range.startContainer;
                var list       = li.parentNode;
                var selectable = range.getPreviousContainer(li, null, true, true);

                if (!selectable || this._viper.isOutOfBounds(selectable) === true) {
                    selectable = range.getNextContainer(li, null, true, true);
                    next       = true;
                    if (!selectable || this._viper.isOutOfBounds(selectable) === true) {
                        // Create a new container.
                        var defaultTagName = this._viper.getDefaultBlockTag();
                        if (defaultTagName !== '') {
                            selectable = document.createElement(defaultTagName);
                            ViperUtil.setHtml(selectable, '&nbsp;');
                        } else {
                            selectable = document.createTextNode(' ');
                        }

                        ViperUtil.insertAfter(list, selectable);
                    }
                } else {
                    offset = selectable.data.length;
                }

                if (selectable) {
                    range.setStart(selectable, offset);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                }

                ViperUtil.remove(li);

                // Check if we need to remove the whole list element.
                if (ViperUtil.getTag('li', list).length === 0) {
                    ViperUtil.remove(list);
                }

                this._viper.contentChanged(false, range);
                return false;
            }//end if

        },

        _handleDeleteFromRight: function(e, range)
        {
            if (range.collapsed !== true) {
                // If range is not collapsed then everything in the selection should be removed which is handled by
                // the browser unless its the whole Viper element selection.
                if (this._isWholeViperElementSelected(range) === true) {
                    // The whole Viper element is selected, remove all of its content
                    // and then initialise the Viper element.
                    ViperUtil.setHtml(this._viper.getViperElement(), '');
                    this._viper.initEditableElement();
                    this._viper.contentChanged();
                    return false;
                } else if (this._isStartToEndOfMultiContainerSelection(range) === true) {
                    return this._removeContentFromStartToEndOfContainers(range);
                } else {
                    var nodeSelection = range.getNodeSelection();
                    if (nodeSelection && ViperUtil.isStubElement(nodeSelection) === false) {
                        // When a block element is selected and removed in Firefox it leaves the content as <p>null char</p>.
                        // Handle the deletion here.
                        if (ViperUtil.isTag(nodeSelection, 'td') === true
                            || ViperUtil.isTag(nodeSelection, 'th') === true
                        ) {
                            // Remove only the contents.
                            ViperUtil.setHtml(nodeSelection, '<br>');
                            range.setStart(nodeSelection.firstChild);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                        } else {
                            range = this._viper.moveCaretAway(nodeSelection, true);
                            ViperUtil.remove(nodeSelection);
                            if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                                && range.startContainer.data === ' '
                                && range.startContainer.previousSibling
                                && range.startContainer.previousSibling.nodeType !== ViperUtil.TEXT_NODE
                            ) {
                                // If content is '<em>test</em> <strong>content</strong>' and the sourceElement is
                                // the strong tag then change the space to non breaking space to prevent caret moving in to <em>.
                                range.startContainer.data = String.fromCharCode(160);
                                range.setStart(range.startContainer, range.startContainer.data.length);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            }
                        }

                        this._viper.contentChanged();
                        return false;
                    } else if (
                        !nodeSelection
                        && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.startOffset === 0
                        && range.endContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.endOffset === 0
                        && range.startContainer !== range.endContainer
                        && ViperUtil.getFirstBlockParent(range.startContainer) === ViperUtil.getFirstBlockParent(range.endContainer)
                    ) {
                        // Handle <p>[<strong>text</strong><br />]more text</p>.
                        var startContainer = range.startContainer;
                        var endContainer   = range.endContainer;
                        var elemsBetween   = ViperUtil.getElementsBetween(startContainer, endContainer);
                        elemsBetween.push(startContainer);
                        ViperUtil.remove(elemsBetween);

                        range.setStart(endContainer, 0);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                        this._viper.contentChanged();
                        return false;
                    } else if (
                        !nodeSelection
                        && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.endContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.endOffset === range.endContainer.data.length
                    ) {
                        // Handle Firefox case: <p>text [text <strong>more text]</strong> more text</p> was resulting in
                        // <p>text <strong>*</strong> more text</p> it should be <p>text * more text</p>.
                        var self = this;
                        setTimeout(function() {
                            var range     = self._viper.getViperRange();
                            var node      = range.startContainer;
                            var rangeNode = node.previousSibling;

                            if (node.nodeType !== ViperUtil.ELEMENT_NODE) {
                                if (node.nextSibling && node.nextSibling.nodeType === ViperUtil.ELEMENT_NODE) {
                                    rangeNode = node;
                                    node = node.nextSibling;
                                } else {
                                    node = null;
                                }
                            }

                            if (node
                                && node
                                && node.nodeType === ViperUtil.ELEMENT_NODE
                                && !range._getFirstSelectableChild(node)
                            ) {
                                ViperUtil.remove(node);
                                range.setStart(rangeNode, range.startOffset);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            } else {
                                node = range.getStartNode();
                                if (node && ViperUtil.isText(node) === false && ViperUtil.elementIsEmpty(node) === true) {
                                    // Node is empty, check siblings and join text nodes if needed.
                                    var rangeNode = null;
                                    var offset    = 0;
                                    if (ViperUtil.isText(node.previousSibling) === true) {
                                        rangeNode = node.previousSibling;
                                        offset    = node.previousSibling.data.length;

                                        if (ViperUtil.isText(node.nextSibling) === true) {
                                            // Join these nodes.
                                            ViperUtil.remove(node);
                                            ViperUtil.normaliseTextNodeSiblings(node)
                                        } else {
                                            ViperUtil.remove(node);
                                        }
                                    } else if (ViperUtil.isText(node.nextSibling) === true) {
                                        rangeNode = node.nextSibling;
                                        ViperUtil.remove(node);
                                    }

                                    range.setStart(rangeNode, offset);
                                    range.collapse(true);
                                    ViperSelection.addRange(range);
                                }
                            }
                        }, 10);
                    }
                }

                return;
            }//end if

            // Range collapsed.
            var startNode = range.getStartNode();
            if (!startNode) {
                if (!range.startContainer
                    || range.startContainer.nodeType !== ViperUtil.ELEMENT_NODE
                    || range.startContainer !== range.endContainer
                ) {
                    return;
                }

                startNode = range.startContainer;
            }

            // Do a few range checks..
            if (startNode.nodeType === ViperUtil.ELEMENT_NODE) {
                if (range.startContainer === startNode
                    && startNode.childNodes.length === range.startOffset
                    && ViperUtil.isText(startNode.lastChild)
                ) {
                    // When the range is set after the last text node of a parent
                    // move the range to the end of the text node.
                    range.setStart(startNode.lastChild, startNode.lastChild.length);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                    startNode = startNode.lastChild;
                }
            }

            if (startNode.nodeType === ViperUtil.TEXT_NODE) {
                // In a text node.
                if (range.startOffset === startNode.data.length) {
                    // End of the text node.
                    if (this._viper.isSpecialElement(startNode.nextSibling) === true) {
                        // Remove the whole special element.
                        ViperUtil.remove(startNode.nextSibling);
                        this._viper.contentChanged();
                        return false;
                    } else if (!startNode.nextSibling) {
                        // Check if the next container is a special element.
                        var nextSelectable = range.getNextContainer(startNode, null, true, true, true);
                        if (nextSelectable && this._viper.isSpecialElement(nextSelectable.parentNode) === true) {
                            ViperUtil.remove(nextSelectable.parentNode);
                        }
                    } else {
                        // There is a next node.
                        if (ViperUtil.isTag(startNode.nextSibling, 'br') === true && !startNode.nextSibling.nextSibling) {
                            ViperUtil.remove(startNode.nextSibling);

                            var selectable = range.getNextContainer(startNode, null, true, true);
                            if (!selectable || this._viper.isOutOfBounds(selectable) === true) {
                                // Stop here nothing else to delete.
                                return false;
                            }

                            var firstBlock = ViperUtil.getFirstBlockParent(selectable);
                            if (firstBlock) {
                                // Move children.
                                var len = startNode.data.length;
                                ViperUtil.moveChildrenToElement(firstBlock, ViperUtil.getFirstBlockParent(startNode), true);
                                ViperUtil.remove(firstBlock);
                                range.setStart(startNode, len);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                                return false;
                            }
                        }
                    }

                    // Check for HR element.
                    var foundSib  = false;
                    while (startNode) {
                        for (var node = startNode.nextSibling; node; node = node.nextSibling) {
                            if (node.nodeType === ViperUtil.ELEMENT_NODE && ViperUtil.isTag(node, 'hr') === true) {
                                // Found the HR element, remove it.
                                ViperUtil.remove(node);
                                this._viper.contentChanged();
                                return false;
                            } else if (node.nodeType !== ViperUtil.TEXT_NODE || ViperUtil.trim(node.data).length !== 0) {
                                // Not an empty text node or another node type, no need to continue.
                                foundSib = true;
                                break;
                            }
                        }

                        if (foundSib === true) {
                            break;
                        } else if (ViperUtil.isTag(startNode, 'td') === true || ViperUtil.isTag(startNode, 'th') === true) {
                            return false;
                        }

                        startNode = startNode.parentNode;
                    }//end while
                } else if (range.startContainer !== startNode && range.startOffset === 0) {
                    range.setStart(startNode, 0);
                } else if (range.startOffset === 0
                    && (ViperUtil.isBrowser('msie', '<9') === true || ViperUtil.isBrowser('edge') === true)
                ) {
                    if (range.startContainer.data.length > 1) {
                        range.startContainer.data = range.startContainer.data.substr(1);
                        if (range.startContainer.data[0] === ' ') {
                            range.startContainer.data = String.fromCharCode(160) + range.startContainer.data.substr(1);
                        }

                        range.setStart(range.startContainer, 0);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                    } else {
                        var surroundingParents = ViperUtil.getSurroundingParents(range.startContainer, null, null, null, true);
                        if (surroundingParents.length > 0) {
                            var parent = surroundingParents.pop();
                            if (ViperUtil.isBlockElement(parent) === false) {
                                if (parent.nextSibling && ViperUtil.isStubElement(parent.nextSibling) === true) {
                                    ViperUtil.insertAfter(parent, document.createTextNode(''));
                                    range.setStart(parent.nextSibling, 0);
                                    range.collapse(true);
                                    ViperSelection.addRange(range);
                                } else {
                                    this._viper.moveCaretAway(range.startContainer);
                                }

                                ViperUtil.remove(parent);
                            } else {
                                range.startContainer.data = '';
                                range.setStart(range.startContainer, 0);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            }
                        } else {
                            this._viper.moveCaretAway(range.startContainer);
                            ViperUtil.remove(range.startContainer);
                        }
                    }

                    this._viper.contentChanged();

                    return false;
                }//end if
            } else {
                // Element Node.
                if (ViperUtil.isStubElement(startNode) === false) {
                    var textNode = range._getFirstSelectableChild(startNode);
                    if (textNode) {
                        range.setStart(textNode, 0);
                    }
                } else if (ViperUtil.isTag(startNode, 'br') === true
                    && startNode.parentNode
                    && (ViperUtil.isBrowser('firefox') === true || ViperUtil.isBrowser('msie') === true || ViperUtil.isBrowser('edge') === true)
                ) {
                    var nextSelectable = range.getNextContainer(startNode, null, true, true);
                    if (this._viper.isOutOfBounds(nextSelectable) === true) {
                        return false;
                    }

                    if (nextSelectable) {
                        var startParent = startNode.parentNode;
                        if (startParent.childNodes.length === 1 && ViperUtil.isTag(startNode.parentNode, ['td', 'th']) === false) {
                            ViperUtil.remove(startParent);
                        } else {
                            // IE sets the range to incorrect place if this node is not removed in a timeout...
                            setTimeout(function() {
                                ViperUtil.remove(startNode);
                            }, 100);
                        }

                        range.setStart(nextSelectable, 0);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                        this._viper.contentChanged();
                        return false;
                    } else if (startNode.parentNode.childNodes.length === 1) {
                        var tmpNode = document.createTextNode('');
                        startNode.parentNode.appendChild(tmpNode);
                        ViperUtil.remove(startNode);
                        range.setStart(tmpNode);
                    } else if (startNode.nextSibling
                        && startNode.nextSibling.nodeType === ViperUtil.TEXT_NODE
                    ) {
                        // Handle <p><strong>[delete key * 2]t</strong><br />more text</p>.
                        range.setStart(startNode.nextSibling, 0);
                        range.collapse(true);
                        ViperUtil.remove(startNode);
                        ViperSelection.addRange(range);
                        this._viper.contentChanged();
                        return false;
                    }
                }
            }//end if

            if (ViperUtil.isTag(startNode, 'br') === true
                && (ViperUtil.isTag(startNode.parentNode, 'td') === true
                || ViperUtil.isTag(startNode.parentNode, 'th') === true)
            ) {
                return false;
            } else if (ViperUtil.isTag(startNode.parentNode, 'li') === true
                && ViperUtil.getHtml(startNode.parentNode) === '<br>'
            ) {
                return false;
            }

            var startContainer = range.startContainer;
            if (startContainer.nodeType !== ViperUtil.TEXT_NODE) {
                var startNode = range.getStartNode();
                if (startNode && startNode.nodeType !== ViperUtil.TEXT_NODE) {
                    var nextSelectable = range.getNextContainer(startContainer, null, true, true, true);

                    if (nextSelectable) {
                        var startParent = range.startContainer;
                        var endParent   = ViperUtil.getFirstBlockParent(nextSelectable);
                        if (ViperUtil.isBlockElement(startParent) === false) {
                            startParent = ViperUtil.getFirstBlockParent(startParent);
                        }

                        if (startParent !== nextSelectable) {
                            // Handle: <p><img />*</p><p>text</p> -> <p><img />text</p>.
                            range.setEnd(nextSelectable, 0);
                            this._deleteFromDifferentBlockParents(range);
                            return false;
                        }
                    }
                }
            } else if (ViperUtil.isBrowser('msie') === true) {
                if (range.startOffset === range.startContainer.data.length
                    && range.startContainer.data.charCodeAt(range.startContainer.data.length - 1) === 160
                    && range.startContainer.nextSibling
                    && range.startContainer.nextSibling.nodeType === ViperUtil.TEXT_NODE
                    && range.startContainer.nextSibling.data[0] === ' '
                ) {
                    // Handle: <p>test * test</p> -> <p>test *test</p>.
                    range.startContainer.data = range.startContainer.data.substr(0, range.startContainer.data.length - 1) + ' ';
                }
            }

        },

        _handleDeleteForWebkit: function(e, range)
        {
            if (this._handleBackspaceAtStartOfLi(e, range) === false) {
                return false;
            }

            // This block of code is a workaround for the delete bug in Chrome.
            // See http://goo.gl/QPB0v
            if (e.keyCode === 46
                && range.collapsed === true
                && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === range.startContainer.data.length
                && (!range.startContainer.nextSibling || ViperUtil.isStubElement(range.startContainer.nextSibling) === true)
            ) {
                // At the end of an element. Check to see if next available
                // element is a block.
                var nextSelectable = range.getNextContainer(range.startContainer, null, false, true);
                var currentParent  = ViperUtil.getFirstBlockParent(range.startContainer);
                var nextParent     = ViperUtil.getFirstBlockParent(nextSelectable);
                if (currentParent !== nextParent && this._viper.isOutOfBounds(nextSelectable) === false) {
                    if (ViperUtil.isTag(currentParent, 'td') === true || ViperUtil.isTag(currentParent, 'th') === true) {
                        // At the end of a cell.. Do nothing.
                        return false;
                    }

                    if (ViperUtil.isTag(currentParent.lastChild, 'br') === true) {
                        ViperUtil.remove(currentParent.lastChild);
                    }

                    while (nextParent.firstChild) {
                        currentParent.appendChild(nextParent.firstChild);
                    }

                    ViperUtil.remove(nextParent);
                    this._viper.contentChanged(true);
                    return false;
                }
            } if (e.keyCode === 46
                && range.collapsed === true
                && range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                && ViperUtil.isTag(range.getStartNode(), 'br') === true
            ) {
                var startNode = range.getStartNode();
                if (ViperUtil.isTag(startNode.parentNode, 'td') === true || ViperUtil.isTag(startNode.parentNode, 'th') === true) {
                    if (!startNode.nextSibling) {
                        return false;
                    }
                }

                var selectable = range.getNextContainer(startNode, null, true, true);
                if (!selectable || this._viper.isOutOfBounds(selectable) === true) {
                    // Stop here nothing else to delete.
                    return false;
                }

                var parent = startNode.parentNode;
                if (!startNode.nextSibling && !startNode.previousSibling) {
                   ViperUtil.remove(startNode.parentNode);
                } else {
                    ViperUtil.remove(startNode);
                }

                if (parent.childNodes.length === 0) {
                    ViperUtil.remove(parent);
                }

                if (selectable) {
                    range.setStart(selectable, 0);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                }

                this._viper.contentChanged(true);
                return false;
            } else if (e.keyCode === 8
                && range.collapsed === true
                && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && (range.startOffset === 0 || (range.startOffset === 1 && range.startContainer.data.charAt(0) === ' '))
                && (!range.startContainer.previousSibling || ViperUtil.isTag(range.startContainer.previousSibling, 'br') === true)
            ) {
                // At the start of an element. Check to see if the previous
                // element is a part of another block element. If it is then
                // join these elements.
                var prevSelectable = range.getPreviousContainer(range.startContainer, null, true, true);
                var currentParent  = ViperUtil.getFirstBlockParent(range.startContainer);
                var prevParent     = ViperUtil.getFirstBlockParent(prevSelectable);

                if (currentParent
                    && range._getFirstSelectableChild(currentParent) === range.startContainer
                    && currentParent.previousElementSibling
                    && ViperUtil.isStubElement(currentParent.previousElementSibling) === true
                ) {
                    // Previous element is a stub element, remove it.
                    ViperUtil.remove(currentParent.previousElementSibling);
                    return false;
                } else if (currentParent !== prevParent && this._viper.isOutOfBounds(prevSelectable) === false) {
                    // Check if there are any other elements in between.
                    var elemsBetween = ViperUtil.getElementsBetween(prevParent, currentParent);
                    var removeParent = true;
                    if (elemsBetween.length > 0) {
                        // There is at least one non block element in between. Remove it.
                        for (var i = (elemsBetween.length - 1); i >= 0; i--) {
                            var el = elemsBetween[(elemsBetween.length - 1)];
                            if (el.nodeType !== ViperUtil.TEXT_NODE || ViperUtil.trim(el.data).length !== 0 ) {
                                if (ViperUtil.isTag(el, 'blockquote') !== true && ViperUtil.isTag(prevParent, 'p') === true) {
                                    removeParent = false;
                                }

                                break;
                            }

                            ViperUtil.remove(el);
                        }
                    }

                    if (removeParent === true) {
                        while (currentParent.firstChild) {
                            prevParent.appendChild(currentParent.firstChild);
                        }

                        if (ViperUtil.isTag(currentParent, ['td', 'th']) === false) {
                            ViperUtil.remove(currentParent);
                        }

                        if (prevSelectable.nodeType === ViperUtil.TEXT_NODE) {
                            range.setStart(prevSelectable, prevSelectable.data.length);
                        } else {
                            range.setStartAfter(prevSelectable);
                        }

                        range.collapse(true);
                        ViperSelection.addRange(range);
                    }

                    this._viper.contentChanged(true);

                    return false;
                } else if (ViperUtil.isTag(prevSelectable, 'br') === true) {
                    ViperUtil.remove(prevSelectable);
                    this._viper.contentChanged(true);
                    return false;
                }
            } else if (
                range.collapsed === false
                && range.startContainer !== range.endContainer
                && range.startContainer.nodeType === ViperUtil.TEXT_NODE
            ) {
                // This is a selection on different text nodes. Check to see
                // if these nodes are part of two different block elements.
                var nodeSelection = range.getNodeSelection();
                if (nodeSelection) {
                    if (nodeSelection === this._viper.getViperElement()) {
                        var defaultTagName = this._viper.getDefaultBlockTag();
                        if (defaultTagName !== '') {
                            ViperUtil.setHtml(nodeSelection, '');
                            this._viper.initEditableElement();
                            range = this._viper.getCurrentRange();
                        } else {
                            ViperUtil.setHtml(nodeSelection, '<br />');
                        }
                    } else {
                        var nextSelectable = range.getNextContainer(nodeSelection, null, true);
                        if (ViperUtil.inArray(ViperUtil.getTagName(nodeSelection), this._keepContainerList) === true) {
                            // Remove only the contents when a whole element is selected but the element cannot be
                            // removed (e.g. TD, as it would break the layout).
                            ViperUtil.setHtml(nodeSelection, '<br/>');
                            range.setStart(nodeSelection, 0);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                            this._viper.contentChanged(true);
                            return false;
                        } else if (this._viper.isOutOfBounds(nextSelectable) === true) {
                            nextSelectable = range.getPreviousContainer(range.startContainer, null, true);
                            if (nextSelectable) {
                                range.setStart(nextSelectable, nextSelectable.data.length);
                            }
                        } else {
                            range.setStart(nextSelectable, 0);
                        }

                        ViperUtil.remove(nodeSelection);
                    }//end if
                } else if (this._isStartToEndOfMultiContainerSelection(range) === true) {
                    return this._removeContentFromStartToEndOfContainers(range);
                } else {
                    var startParent = ViperUtil.getFirstBlockParent(range.startContainer, null, true);
                    var endParent   = ViperUtil.getFirstBlockParent(range.endContainer, null, true);
                    if (startParent === endParent) {
                        // Deletion between two different parents within the same block parent. Let browser handle it.
                        this._viper.contentChanged(true);
                        return;
                    } else {
                        this._deleteFromDifferentBlockParents(range);
                    }
                }//end if

                range.collapse(true);
                ViperSelection.addRange(range);
                this._viper.contentChanged();
                return false;
            } else if (this._isWholeViperElementSelected(range) === true) {
                // The whole Viper element is selected, remove all of its content
                // and then initialise the Viper element.
                ViperUtil.setHtml(this._viper.getViperElement(), '');
                this._viper.initEditableElement();
                this._viper.contentChanged();
                return false;
            } else if (range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                && range.startContainer === range.endContainer
                && range.startOffset === range.endOffset
                && range.startOffset === 0
            ) {
                if (ViperUtil.isTag(range.startContainer, 'li') === true
                    && ViperUtil.getTag('li', range.startContainer.parentNode).length === 1
                ) {
                    // Single empty list item being removed. Remove the whole list.
                    this._placeCaretToValidPosition(range.startContainer.parentNode, range.startContainer.parentNode);
                    ViperUtil.remove(range.startContainer.parentNode);
                    this._viper.contentChanged();
                    return false;
                }
            } else if (range.collapsed === false
                && range.getNodeSelection()
            ) {
                var nodeSelection = range.getNodeSelection();
                if (nodeSelection
                    && ViperUtil.isStubElement(nodeSelection) === false
                    && ViperUtil.isTag(nodeSelection, 'td') === false
                    && ViperUtil.isTag(nodeSelection, 'th') === false
                ) {
                    var surroundingParents = ViperUtil.getSurroundingParents(nodeSelection);
                    if (surroundingParents.length > 0) {
                        nodeSelection = surroundingParents.pop();
                    }

                    // Handle deletion of a whole bold/italic/etc tag.
                    range = this._viper.moveCaretAway(nodeSelection, e.keyCode === 46);
                    ViperUtil.remove(nodeSelection);
                    if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.startContainer.data === ' '
                        && range.startContainer.previousSibling
                        && range.startContainer.previousSibling.nodeType !== ViperUtil.TEXT_NODE
                    ) {
                        // Fix for Chrome.. If content is '<em>test</em> <strong>content</strong>' and the sourceElement is
                        // the strong tag then change the space to non breaking space to prevent caret moving in to <em>.
                        range.startContainer.data = String.fromCharCode(160);
                        range.setStart(range.startContainer, range.startContainer.data.length);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                    } else if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                        && range.startContainer.previousSibling
                        && range.startContainer.previousSibling.nodeType === ViperUtil.TEXT_NODE
                    ) {
                        // Join nodes.
                        var length = range.startContainer.previousSibling.data.length;
                        var prev   = range.startContainer.previousSibling;
                        ViperUtil.remove(range.startContainer);
                        if (prev.data.charAt(length - 1) === ' ' && range.startContainer.data.charAt(0) === ' ') {
                            // When joining nodes end and start with a space character, Webkit seems to ignore the 2nd space.
                            // Make sure 2nd space is converted to non breaking space character.
                            prev.data += String.fromCharCode(160);
                            if (range.startContainer.data.length > 1) {
                                prev.data += range.startContainer.data.substring(1, range.startContainer.data.length);
                            }
                        } else {
                            prev.data += range.startContainer.data;
                        }

                        range.setStart(prev, length);
                        range.collapse(true);
                        ViperSelection.addRange(range);
                    }

                    this._viper.contentChanged();
                    return false;
                }

            }//end if

            if (e.keyCode === 8) {
                if (range.collapsed === true) {
                    if (range.startContainer.nodeType === ViperUtil.TEXT_NODE) {
                        if (this._viper.isSpecialElement(range.startContainer.parentNode) === true) {
                            var prevSib = range.startContainer.parentNode.previousSibling;
                            ViperUtil.remove(range.startContainer.parentNode);
                            if (ViperUtil.isText(prevSib) === true) {
                                var info = ViperUtil.normaliseTextNodeSiblings(prevSib);
                                range.setStart(info.textNode, info.splitOffset);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            }

                            this._viper.contentChanged();
                            return false;
                        } else if (range.startOffset === 1) {
                            // Delete a character from left.
                            var textNode = range.startContainer;
                            textNode.data = textNode.data.substr(0, range.startOffset - 1) + textNode.data.substr(range.startOffset);

                            // Normalise text nodes.
                            this._normaliseNextNodes(textNode);

                            if (textNode.data.length === 0
                                && textNode.nextSibling === null
                                && textNode.previousSibling === null
                            ) {
                                if (ViperUtil.isBlockElement(textNode.parentNode) === true) {
                                    // The last character of this text node was deleted and now the block parent has no content.
                                    // Add a BR to keep the blockelement 'selectable'.
                                    var br = document.createElement('br');
                                    textNode.parentNode.appendChild(br);
                                    range.selectNode(br);
                                    range.collapse(true);
                                    ViperSelection.addRange(range);
                                } else if (textNode.parentNode.previousSibling
                                    && textNode.parentNode.previousSibling.nodeType === ViperUtil.TEXT_NODE
                                ) {
                                    // Remove the parent element and use the previous text node.
                                    var parent = textNode.parentNode;
                                    textNode   = textNode.parentNode.previousSibling;
                                    ViperUtil.remove(parent);

                                    if (textNode.data.charAt(textNode.data.length - 1) === ' ') {
                                        // If this text node ends with space then convert it to a non breaking space to
                                        // prevent Safari/Chrome removing the space.
                                        textNode.data = textNode.data.substr(0, textNode.data.length - 1) + String.fromCharCode(160);
                                    }

                                    range.setStart(textNode, textNode.data.length);
                                    range.collapse(true);
                                    ViperSelection.addRange(range);
                                }
                            } else {
                                range.setStart(textNode, range.startOffset - 1);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            }

                            this._viper.contentChanged();
                            return false;
                        } else if (range.startOffset === 0) {
                            if (this._viper.isSpecialElement(range.startContainer.previousSibling) === true) {
                                ViperUtil.remove(range.startContainer.previousSibling);
                                return false;
                            }
                        }
                    }
                }
            } else {
                // Delete from right.
                if (range.collapsed === true) {
                    var startContainer = range.startContainer;
                    if (startContainer.nodeType === ViperUtil.TEXT_NODE) {
                        if (range.startOffset === 0) {
                            if (startContainer.data.length === 2 && startContainer.data.charAt(1) === ' ') {
                                // When the text node ends with a space and it will be the only remaining character in the
                                // node then replace it with non breaking space character as Webkit destroys the text node
                                // and make it appear like both 2nd last and space deleted.
                                startContainer.data = String.fromCharCode(160);
                                range.setStart(startContainer, 0);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                                this._viper.contentChanged();
                                return false;
                            } else if (startContainer.data.length === 0) {
                                if (this._viper.isSpecialElement(startContainer.nextSibling) === true) {
                                    ViperUtil.remove(startContainer.nextSibling);
                                    return false;
                                }
                            }
                        } else if (range.startOffset === startContainer.data.length) {
                            // At the end of a text node.
                            if (this._viper.isSpecialElement(startContainer.nextSibling) === true) {
                                ViperUtil.remove(startContainer.nextSibling);
                                return false;
                            } else if (!startContainer.nextSibling) {
                                // Check if the next container is a special element.
                                var nextSelectable = range.getNextContainer(startContainer, null, true, true, true);
                                if (nextSelectable && this._viper.isSpecialElement(nextSelectable.parentNode) === true) {
                                    ViperUtil.remove(nextSelectable.parentNode);
                                    return false;
                                }
                            }
                        } else if (range.startOffset - 1 === ViperUtil.rtrim(startContainer.data).length
                            && startContainer.data.length !== ViperUtil.rtrim(startContainer.data).length
                            && this._viper.isSpecialElement(startContainer.nextSibling) === true
                        ) {
                            ViperUtil.remove(startContainer.nextSibling);
                            range.setStart(startContainer, startContainer.data.length);
                            range.collapse(true);
                            ViperSelection.addRange(range);
                            return false;
                        }
                    } else {
                        var startNode = range.getStartNode();
                        if (startNode && startNode.nodeType !== ViperUtil.TEXT_NODE) {
                            var nextSelectable = range.getNextContainer(startContainer, null, true, true, true);

                            if (nextSelectable) {
                                var startParent = range.startContainer;
                                var endParent   = ViperUtil.getFirstBlockParent(nextSelectable);
                                if (ViperUtil.isBlockElement(startParent) === false) {
                                    startParent = ViperUtil.getFirstBlockParent(startParent);
                                }

                                if (startParent !== nextSelectable) {
                                    // Handle: <p><img />*</p><p>text</p> -> <p><img />text</p>.
                                    range.setEnd(nextSelectable, 0);
                                    this._deleteFromDifferentBlockParents(range);
                                    return false;
                                }
                            }
                        }
                    }
                }
            }

            this._viper.contentChanged();

        },

        _placeCaretToValidPosition: function(startNode, endNode)
        {
            // Find a new node we can put caret in.
            var range     = this._viper.getCurrentRange();
            var newOffset = 0;
            var newSelContainer = range.getNextContainer(endNode, null, true);
            if (!newSelContainer || this._viper.isOutOfBounds(newSelContainer) === true) {
                // If out of bounds of Viper try getting the previous selectable.
                newSelContainer = range.getPreviousContainer(startNode, null, true);
                if (!newSelContainer || this._viper.isOutOfBounds(newSelContainer) === true) {
                    // No valid location. Create a new default block tag.
                    var defaultTagName = this._viper.getDefaultBlockTag();
                    newSelContainer = document.createElement('br');
                    if (defaultTagName === '') {
                        ViperUtil.insertAfter(endNode, newSelContainer);
                    } else {
                        var newElem = document.createElement(defaultTagName);
                        newElem.appendChild(newSelContainer);
                        ViperUtil.insertAfter(endNode, newElem);
                    }
                } else {
                    newOffset = newSelContainer.data.length;
                }
            }

            if (newSelContainer) {
                // Set the caret location.
                range.setStart(newSelContainer, newOffset);
                range.collapse(true);
                ViperSelection.addRange(range);
            }

        },

        splitAtRange: function(returnFirstBlock, range)
        {
            range = range || this._viper.getViperRange();

            var selectedNode = range.getNodeSelection();
            if (selectedNode && selectedNode.nodeType === ViperUtil.ELEMENT_NODE) {
                selectedNode.innerHTML = '&nbsp;';
                return selectedNode;
            }

            // If the range is not collapsed then remove the contents of the selection.
            if (range.collapsed !== true) {
                if (ViperUtil.isBrowser('chrome') === true
                    || ViperUtil.isBrowser('safari') === true
                ) {
                    range.deleteContents();
                    ViperSelection.addRange(range);
                } else {
                    this._viper.deleteRangeContent();
                    ViperSelection.addRange(this._viper.getCurrentRange());
                    range = this._viper.getViperRange();
                }
            }

            if (range.startContainer.nodeType === ViperUtil.TEXT_NODE) {
                // Find the first parent block element.
                var parent = range.startContainer.parentNode;
                if (parent === this._viper.getViperElement()) {
                    // Split the text node.
                    var newNode = range.startContainer;
                    if (range.startOffset !== 0 && range.startOffset !== range.startContainer.data.length) {
                        // Not at start or end of text node. Split text node and insert a BR tag in between.
                        newNode = range.startContainer.splitText(range.startOffset);
                        ViperUtil.insertBefore(newNode, document.createElement('br'));
                        return range.startContainer.nextSibling;
                    } else if (range.startOffset === 0) {
                        if (range.previousSibling && ViperUtil.isTag(range.previousSibling, 'br') === true) {
                            ViperUtil.remove(range.previousSibling)
                        }

                        return range.startContainer.previousSibling;
                    } else {
                        return range.startContainer;
                    }
                }

                var blockQuote = ViperUtil.getParents(range.startContainer, 'blockquote', this._viper.element);

                while (parent) {
                    if (ViperUtil.isBlockElement(parent) === true) {
                        if (blockQuote.length === 0 || ViperUtil.isTag(parent, 'blockquote') === true) {
                            break;
                        }
                    }

                    if (parent.parentNode && parent.parentNode === this._viper.element) {
                        break;
                    }

                    parent = parent.parentNode;
                }
            } else if (range.startContainer === range.endContainer
                && ViperUtil.isStubElement(range.startContainer)
                && range.startContainer.parentNode.firstChild === range.startContainer
                && range.startContainer.parentNode.lastChild === range.startContainer
            ) {
                parent = range.startContainer.parentNode;
                ViperUtil.setHtml(parent, '&nbsp;');
                range.setStart(parent.firstChild, 0);
                range.collapse(true);
            } else {
                parent = range.startContainer;
            }//end if

            // Create a new element and a document fragment with the contents of
            // the selection.
            var tag = parent.tagName.toLowerCase();

            // If the parent is not part of the editable element then we need to
            // create two new P tags.
            if (ViperUtil.isChildOf(parent, this._viper.element) === false) {
                // Find the next non block sibling.
                var node = range.endContainer;
                while (ViperUtil.isset(node.nextSibling) === true) {
                    if (ViperUtil.isBlockElement(node.nextSibling) === true) {
                        break;
                    }

                    node = node.nextSibling;
                }

                range.setEndAfter(node);

                var elem    = Viper.document.createElement('p');
                var docFrag = range.extractContents('p');

                this._viper.deleteRangeContent();
                elem.appendChild(docFrag);
                ViperUtil.insertAfter(range.startContainer, elem);
                range.collapse(true);

                // Find the previous non block sibling.
                node = range.startContainer;
                while (ViperUtil.isset(node.previousSibling) === true) {
                    if (ViperUtil.isBlockElement(node.previousSibling) === true) {
                        break;
                    }

                    node = node.previousSibling;
                }

                range.setStartBefore(node);

                var felem = Viper.document.createElement('p');
                docFrag   = range.extractContents('p');
                felem.appendChild(docFrag);
                ViperUtil.insertBefore(elem, felem);

                if (!elem.firstChild) {
                    elem.appendChild(document.createTextNode(''));
                }

                range.setStart(elem.firstChild, 0);
                range.collapse(true);
                return;
            } else if (tag === 'pre') {
                // If the text is in a PRE tag then we need to insert a new line character.
                this.insertTextAtRange(range, "\n");
                return false;
            } else if (tag === 'td' || tag === 'th') {
                // Cannot create a new TD tag so need the move td contents in to a P tag.
                var bookmark = this._viper.createBookmark(range);
                var p        = Viper.document.createElement('P');
                while (parent.firstChild) {
                    p.appendChild(parent.firstChild);
                }

                // Add the new P tag as TD's child node.
                parent.appendChild(p);

                // Update tag name and parent element.
                tag    = 'p';
                parent = p;

                // Update range.
                range = this._viper.selectBookmark(bookmark);
            }//end if

            // If the selection is at the end of text node and has no next sibling
            // then move the range out of its parent node to prevent empty tags being
            // created by range.extractContents().
            if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === range.startContainer.data.length
            ) {
                if (!range.startContainer.nextSibling) {
                    var newTextNode = Viper.document.createTextNode('');
                    ViperUtil.insertAfter(range.startContainer.parentNode, newTextNode);
                    range.setEnd(newTextNode, 0);
                    range.collapse(false);
                }
            }

            try {
                // Select everything from the current position to the end of the parent.
                range.setEndAfter(parent.lastChild);
            } catch (e) {

            }

            ViperSelection.addRange(range);

            // Need to clone the node so that its attributes are also copied.
            // This may cause ID conflicts.
            var elem    = parent.cloneNode(false);
            var docFrag = range.extractContents(tag);

            elem.appendChild(docFrag);

            // Remove DEL tags before getting the text content.
            var elemClone = ViperUtil.cloneNode(elem);
            ViperUtil.remove(ViperUtil.getTag('del', elemClone));

            if (ViperUtil.isBlank(ViperUtil.getNodeTextContent(elemClone)) === true) {
                // Do not need this empty element.
                elem = null;
            }

            if (elem === null || (elem.tagName && elem.tagName.toLowerCase() !== 'li' && ViperUtil.isBlockElement(elem) === false)) {
                // If the newly created element is not a block element then
                // create a P tag and make it the elem's parent.
                var newTag = 'p';

                // If element is in a list block then create a new list item instead of a paragraph.
                if (tag === 'li') {
                    newTag = tag;
                }

                var pelem = Viper.document.createElement(newTag);
                if (elem !== null) {
                    pelem.appendChild(elem);
                } else {
                    ViperUtil.setHtml(pelem, '&nbsp;');
                }

                elem = pelem;
            }//end if

            if (ViperUtil.elementIsEmpty(parent) === true) {
                ViperUtil.setHtml(parent, '&nbsp;');
            }

            // Insert the new element after the current parent.
            ViperUtil.insertAfter(parent, elem);

            try {
                range.setStart(elem, 0);
                range.setStart(elem, 0);
                range.moveStart('character', 1);
                range.moveStart('character', -1);
            } catch (e) {
                // Handle empty node..
            }

            range.collapse(true);
            ViperSelection.addRange(range);

            // Check the parent element contents.
            // If the parent element is now empty and its a block element
            // then add a space to it.
            if (ViperUtil.isBlockElement(parent) === true && ViperUtil.trim(ViperUtil.getHtml(parent)) === '') {
                ViperUtil.setHtml(parent, '&nbsp;');
            }

            if (returnFirstBlock === true) {
                return parent;
            }

            return false;
        },

        /**
         * Handles shift + enter.
         *
         * Creates a new BR tag at the position of the caret. If the caret is inside a
         * PRE tag then it will create a new P tag and move the caret inside the P tag.
         *
         * @return {boolean} False when it modified the content to prevent event bubbling.
         */
        handleSoftEnter: function(e)
        {
            if (e) {
                var range     = this._viper.getCurrentRange();
                var startNode = range.getStartNode();
                if (startNode && ViperUtil.isTag(ViperUtil.getFirstBlockParent(startNode), 'pre') === true) {
                    this.insertTextAtRange(range, "\n");
                    this._viper.contentChanged();
                    return false;
                }
            }

            var node = Viper.document.createElement('br');
            this._viper.insertNodeAtCaret(node);

            if (ViperUtil.isTag(node.previousSibling, 'br') === true) {
                // The previous sibling is also a br tag and to be able to position
                // caret between these two br tags we need to insert a text node in
                // between them.
                this._viper.insertAfter(node.previousSibling, this._viper.createSpaceNode());
            } else if (!node.nextSibling && ViperUtil.isBlockElement(node.parentNode) === false) {
                ViperUtil.insertAfter(node.parentNode, node);
            } else if (!node.previousSibling && node.nextSibling && node.nextSibling.nodeType === ViperUtil.TEXT_NODE) {
                ViperUtil.insertBefore(node.parentNode, node);
            }

            this._viper.contentChanged();
            return !this._viper.setCaretAfterNode(node);

        },

        _isWholeViperElementSelected: function(range)
        {
            return this._viper.isWholeViperElementSelected(range);

        },

        _isStartToEndOfMultiContainerSelection: function(range)
        {
            var nodeSelection = range.getNodeSelection();
            if (nodeSelection) {
                return false;
            }

            if (range.startOffset === 0
                && range.collapsed === false
                && range.startContainer !== range.endContainer
                && range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.endContainer.nodeType === ViperUtil.TEXT_NODE
                && range.endOffset === range.endContainer.data.length
            ) {
                var startParent     = ViperUtil.getFirstBlockParent(range.startContainer);
                var endParent       = ViperUtil.getFirstBlockParent(range.endContainer);
                var firstSelectable = range._getFirstSelectableChild(startParent);
                var lastSelectable  = range._getLastSelectableChild(endParent);
                if (firstSelectable === range.startContainer
                    && lastSelectable === range.endContainer
                ) {
                    return true;
                }
            }

            return false;

        },

        _removeContentFromStartToEndOfContainers: function(range)
        {
            // Remove content from beginning of one container to the end of another container.
            var startParent     = ViperUtil.getFirstBlockParent(range.startContainer);
            var endParent       = ViperUtil.getFirstBlockParent(range.endContainer);
            var defaultTagName  = this._viper.getDefaultBlockTag();
            var common          = ViperUtil.getCommonAncestor(startParent, endParent);

            if (common && (ViperUtil.isTag(common, 'ul') === true || ViperUtil.isTag(common, 'ol') === true)) {
                // Multiple list items selected from the same list.
                defaultTagName = 'li';
            }

            if (defaultTagName !== '') {
                var p = document.createElement(defaultTagName);
                ViperUtil.setHtml(p, '<br />');
                ViperUtil.insertBefore(startParent, p);
                ViperUtil.remove(ViperUtil.getElementsBetween(startParent, endParent));
                ViperUtil.remove(startParent);
                ViperUtil.remove(endParent);

                // If the new P tag is at the end of a UL/OL element move it after.
                if ((ViperUtil.isTag(p.parentNode, 'ul') === true || ViperUtil.isTag(p.parentNode, 'ol') === true)
                    && !p.nextSibling
                ) {
                    ViperUtil.insertAfter(p.parentNode, p);
                }

                range.setStart(p, 0);
                range.collapse(true);
            } else {
                var br = document.createElement('br');

                // Remove any extra white space only text nodes.
                var sibling = startParent.previousSibling;
                while (sibling && sibling.nodeType === ViperUtil.TEXT_NODE && ViperUtil.trim(sibling.data) === '') {
                    ViperUtil.remove(sibling);
                    sibling = sibling.previousSibling;
                }

                ViperUtil.insertBefore(startParent, br);
                ViperUtil.remove(ViperUtil.getElementsBetween(startParent, endParent));
                ViperUtil.remove(startParent);
                ViperUtil.remove(endParent);
                range.setStart(br, 0);
                range.collapse(true);
            }

            ViperSelection.addRange(range);
            this._viper.contentChanged(true);

            // Prevent default action.
            return false;

        },

        insertTextAtRange: function(range, text)
        {
            var node = range.startContainer;
            // Assuming the range is collapsed already.
            if (node.nodeType === ViperUtil.TEXT_NODE) {
                // Split the text node and insert new line char.
                var newNode = node.splitText(range.startOffset);
                ViperUtil.insertBefore(newNode, document.createTextNode(text));
            } else {
                // Element node..
                node = range.startContainer.childNodes[range.startOffset];
                if (node.nodeType === ViperUtil.TEXT_NODE) {
                    // Split the text node and insert new line char.
                    var newNode = node.splitText(range.startOffset);
                    ViperUtil.insertBefore(newNode, document.createTextNode(text));
                } else {
                    newNode = document.createTextNode(text);
                    ViperUtil.insertAfter(node, newNode);
                }
            }

            if (newNode.data.length === 0) {
                newNode.data = ' ';
            }

            range.setStart(newNode, 0);
            range.collapse(true);
            ViperSelection.addRange(range);

        },

        canRemoveNode: function(node)
        {
            if (ViperUtil.inArray(ViperUtil.getTagName(node), this._keepContainerList) === true) {
                return false;
            }

            return true;

        },

        cleanPreTags: function()
        {
            var preTags       = ViperUtil.getTag('pre', this._viper.getViperElement());
            var c             = preTags.length;
            var bookmark      = null;
            var range         = this._viper.getViperRange();
            var nodeSelection = range.getNodeSelection();
            if (!nodeSelection) {
                bookmark = this._viper.createBookmark();
            }

            for (var i = 0; i < c; i++) {
                this.cleanPreTag(preTags[i]);
            }

            if (!nodeSelection) {
                this._viper.selectBookmark(bookmark);
            } else {
                range.selectNode(nodeSelection);
            }

        },

        cleanPreTag: function(pre)
        {
            if (!pre) {
                return;
            }

            var elems = ViperUtil.getTag('p,div', pre);
            var c     = elems.length;

            for (var i = 0; i < c; i++) {
                var elem = elems[i];
                while (elem.firstChild) {
                    ViperUtil.insertBefore(elem, elem.firstChild);
                }

                ViperUtil.insertBefore(elem, document.createTextNode("\n\n"));
                ViperUtil.remove(elem);
            }

            var elems = ViperUtil.getTag('br', pre);
            var c     = elems.length;

            for (var i = 0; i < c; i++) {
                var elem = elems[i];
                ViperUtil.insertBefore(elem, document.createTextNode("\n"));
                ViperUtil.remove(elem);
            }

        },

        isEmptyBlockElement: function(element)
        {
            if (ViperUtil.isBlockElement(element) === false) {
                return false;
            }

            return ViperUtil.isEmptyElement(element);

        },

        splitList: function (li)
        {
            var list = li.parentNode;

            // If there is a list item after this one then split the list in to two.
            if (ViperUtil.isTag(li.nextElementSibling, 'li') === true) {
                var listType = ViperUtil.getTagName(list);
                var newList  = document.createElement(listType);

                // Insert the new list after the current list.
                ViperUtil.insertAfter(list, newList);

                // Move nodes after the current list item to the new list.
                while (li.nextSibling) {
                    newList.appendChild(li.nextSibling);
                }
            }

            if (ViperUtil.trim(ViperUtil.getNodeTextContent(li)) === '') {
                // This list item is empty so it can be removed.
                ViperUtil.remove(li);
            }

            // Now create the spacer element. This element is inserted after the current list.
            var defaultTagName = this._viper.getDefaultBlockTag();
            var elem           = null;
            if (defaultTagName === '') {
                elem = document.createElement('br');
            } else {
                elem = document.createElement(defaultTagName);
            }

            ViperUtil.insertAfter(list, elem);

            if (defaultTagName !== '') {
                elem.appendChild(document.createElement('br'));
            }

            var range = this._viper.getViperRange();
            range.setStart(elem, 0);
            range.collapse(true);
            ViperSelection.addRange(range);
        }

    };

}) (Viper.Util, Viper.Selection);
