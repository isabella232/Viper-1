function ViperKeyboardEditorPlugin(viper)
{
    this.viper = viper;
    var self   = this;

    // Make sure Viper fires the keyDown event for ENTER.
    this.viper.addSpecialKey(13);

    this.viper.registerCallback('Viper:keyDown', 'ViperKeyboardEditorPlugin', function(e) {
        if (viper.isKey(e, 'ENTER') === true) {
            return self.handleEnter();
        } else if (viper.isKey(e, 'SHIFT+ENTER') === true) {
            return self.handleSoftEnter(e);
        } else if (viper.isKey(e, 'DELETE') === true || viper.isKey(e, 'BACKSPACE') === true) {
            return self.handleDelete(e);
        }
    });

    // When enter key is pressed at the end of these tags, the plugin will handle the
    // enter event instead of the browser.
    this._tagList = ('p|div|h1|h2|h3|h4|h5|h6').split('|');

}

ViperKeyboardEditorPlugin.prototype = {
    init: function()
    {
        var self = this;

        this.viper.registerCallback('ViperFormatPlugin:formatChanged', 'ViperKeyboardEditorPlugin', function(type) {
            if (type === 'pre') {
                self.cleanPreTags();
            }
        });

        // Note: Should be a format change since it will be used in the whole
        // container.
        ViperChangeTracker.addChangeType('splitContainer', 'Insert', 'format');
        ViperChangeTracker.setDescriptionCallback('splitContainer', function(node) {
            return self._getChangeDescription(node, 'splitContainer');
        });
        ViperChangeTracker.setApproveCallback('splitContainer', function(clone, node) {
            ViperChangeTracker.removeTrackChanges(node);
        });
        ViperChangeTracker.setRejectCallback('splitContainer', function(clone, node) {
            // Get previous sibling.
            var prev = node.previousSibling;
            if (!prev) {
                return;
            }

            while (node.firstChild) {
                prev.appendChild(node.firstChild);
            }

            dfx.remove(node);
        });

        ViperChangeTracker.addChangeType('createContainer', 'Insert', 'insert');
        ViperChangeTracker.setDescriptionCallback('createContainer', function(node) {
            return self._getChangeDescription(node);
        });
        ViperChangeTracker.setApproveCallback('createContainer', function(clone, node) {
            ViperChangeTracker.removeTrackChanges(node);
        });
        ViperChangeTracker.setRejectCallback('createContainer', function(clone, node) {
            dfx.remove(node);
        });

    },

    _getChangeDescription: function(node, changeType)
    {
        var pImgURL = this.viper.getStylesURL() + '/icon-p_tag.png';
        var pImg    = Viper.document.createElement('img');
        dfx.attr(pImg, 'src', pImgURL);
        dfx.attr(pImg, 'title', 'Paragraph Break');
        var desc = pImg;

        if (changeType !== 'splitContainer') {
            for (var child = node.firstChild; child; child = child.nextSibling) {
                if (child.nodeType === dfx.TEXT_NODE && dfx.trim(child.nodeValue).length === 0) {
                    continue;
                } else if (ViperChangeTracker.isTrackingNode(child) === true) {
                    var ctnType = ViperChangeTracker.getCTNTypeFromNode(child);
                    if (ViperChangeTracker.isInsertType(ctnType) === true) {
                        var extraDesc = ViperChangeTracker.getDescriptionForNode(child);
                        if (dfx.isObj(extraDesc) === false) {
                            extraDesc = Viper.document.createTextNode(extraDesc);
                        }

                        desc = [desc, extraDesc];
                    }
                }//end if

                break;
            }//end for
        }

        return desc;

    },

    _isKeyword: function()
    {
        var keywordPlugin = this.viper.ViperPluginManager.getPlugin('ViperKeywordPlugin');
        if (!keywordPlugin) {
            return false;
        }

        var range = this.viper.getCurrentRange();
        if (keywordPlugin._isKeyword(range.startContainer) === false && keywordPlugin._isKeyword(range.startContainer) === false) {
            return false;
        }

        return true;

    },

    handleTab: function()
    {
        if (this._isKeyword() === true) {
            return true;
        }

        var numSpaces = 4;
        // Insert.
        var sp = String.fromCharCode(160);
        var c  = '';
        while (numSpaces-- > 0) {
            c += sp;
        }

        this.viper.insertNodeAtCaret(c);

        this.viper.fireNodesChanged('ViperKeyboardEditorPlugin:tab');

        return true;

    },

    handleEnter: function(returnFirstBlock)
    {
        if (this.viper.inlineMode === true) {
            return this.handleSoftEnter();
        }

        if (ViperChangeTracker.isTracking() !== true) {
            var range = this.viper.getViperRange();
            if (range.collapsed === true
                && range.endContainer.nodeType === dfx.TEXT_NODE
                && range.endOffset === range.endContainer.data.length
            ) {
                var firstBlock = dfx.getFirstBlockParent(range.endContainer);
                if (firstBlock && this._tagList.inArray(dfx.getTagName(firstBlock)) === true) {
                    var p = document.createElement('p');
                    dfx.setHtml(p, '<br />');
                    dfx.insertAfter(firstBlock, p);
                    range.selectNode(p.firstChild);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                    return false;
                }
            }//end if

            var startNode   = range.getStartNode();
            var blockParent = dfx.getFirstBlockParent(startNode);
            if (startNode && dfx.isTag(blockParent, 'pre') === true) {
                if (startNode.parentNode === blockParent
                    && startNode.nodeType === dfx.TEXT_NODE
                    && dfx.trim(startNode.data) === ''
                ) {
                    if (startNode.nextSibling
                        && !startNode.nextSibling.nextSibling
                        && startNode.nextSibling.nodeType === dfx.TEXT_NODE
                        && dfx.trim(startNode.nextSibling.data) === ''
                    ) {
                        dfx.remove(startNode.nextSibling);
                    }

                    dfx.remove(startNode);
                    var p = document.createElement('p');
                    dfx.setHtml(p, '<br />');
                    dfx.insertAfter(blockParent, p);
                    range.selectNode(p.firstChild);
                    range.collapse(true);
                    ViperSelection.addRange(range);
                } else {
                    this.insertTextAtRange(range, "\n");
                }

                return false;
            }//end if

            // Let the browser handle everything else.
            return true;
        }

        // Because track changes is enabled we need to add extra info to elements
        return this._handleEnter(returnFirstBlock);

    },

    _handleEnter: function(returnFirstBlock)
    {
        if (this.viper.inlineMode === true) {
            return this.handleSoftEnter();
        }

        return this.splitAtRange(returnFirstBlock);

    },

    handleDelete: function(e)
    {
        var range = this.viper.getViperRange();

        if (range.startOffset !== 0) {
            return;
        }

        var viperElement    = this.viper.getViperElement();
        var firstSelectable = range._getFirstSelectableChild(viperElement);

        if (firstSelectable === range.startContainer || viperElement === range.startContainer) {
            var lastSelectable  = range._getLastSelectableChild(viperElement);
            if (range.endContainer === viperElement
                || (range.endContainer === lastSelectable && range.endOffset === lastSelectable.data.length)
            ) {
                // The whole Viper element is selected, remove all of its content
                // and then initialise the Viper element.
                dfx.setHtml(viperElement, '');
                this.viper.initEditableElement();
                return false;
            }
        }

    },

    splitAtRange: function(returnFirstBlock, range)
    {
        range = range || this.viper.getViperRange();

        var selectedNode = range.getNodeSelection();
        if (selectedNode && selectedNode.nodeType === dfx.ELEMENT_NODE) {
            selectedNode.innerHTML = '&nbsp;';
            return selectedNode;
        }

        // If the range is not collapsed then remove the contents of the selection.
        if (range.collapsed !== true) {
            this.viper.deleteContents();
            range = this.viper.getViperRange();
        }

        if (range.startContainer.nodeType === dfx.TEXT_NODE) {
            // Find the first parent block element.
            var parent = range.startContainer.parentNode;
            if (parent === this.viper.getViperElement()) {
                // Check if there are any block elements before this node.
                if (range.startContainer.previousSibling
                    && range.startContainer.previousSibling.nodeType !== dfx.TEXT_NODE
                ) {
                    return range.startContainer.previousSibling;
                } else {
                    // Cretae a new paragraph and insert it at range position.
                    var para = document.createElement('p');
                    dfx.setHtml(para, '&nbsp;');
                    dfx.insertAfter(range.startContainer, para);
                    return para;
                }
            }

            var blockQuote = dfx.getParents(range.startContainer, 'blockquote', this.viper.element);

            while (parent) {
                if (dfx.isBlockElement(parent) === true) {
                    if (blockQuote.length === 0 || dfx.isTag(parent, 'blockquote') === true) {
                        break;
                    }
                }

                if (parent.parentNode && parent.parentNode === this.viper.element) {
                    break;
                }

                parent = parent.parentNode;
            }
        } else {
            parent = range.startContainer;
        }//end if

        // Create a new element and a document fragment with the contents of
        // the selection.
        var tag = parent.tagName.toLowerCase();

        // If the parent is not part of the editable element then we need to
        // create two new P tags.
        if (dfx.isChildOf(parent, this.viper.element) === false) {
            // Find the next non block sibling.
            var node = range.endContainer;
            while (dfx.isset(node.nextSibling) === true) {
                if (dfx.isBlockElement(node.nextSibling) === true) {
                    break;
                }

                node = node.nextSibling;
            }

            range.setEndAfter(node);

            var elem    = Viper.document.createElement('p');
            var docFrag = range.extractContents('p');

            this.viper.deleteContents();
            elem.appendChild(docFrag);
            dfx.insertAfter(range.startContainer, elem);
            range.collapse(true);

            // Find the previous non block sibling.
            node = range.startContainer;
            while (dfx.isset(node.previousSibling) === true) {
                if (dfx.isBlockElement(node.previousSibling) === true) {
                    break;
                }

                node = node.previousSibling;
            }

            range.setStartBefore(node);

            var felem = Viper.document.createElement('p');
            docFrag   = range.extractContents('p');
            felem.appendChild(docFrag);
            dfx.insertBefore(elem, felem);

            range.setStart(elem.firstChild, 0);
            range.collapse(true);
            return;
        } else if (tag === 'pre') {
            // If the text is in a PRE tag then we need to insert a new line character.
            this.insertTextAtRange(range, "\n");
            return false;
        } else if (tag === 'td' || tag === 'th') {
            // Cannot create a new TD tag so need the move td contents in to a P tag.
            var bookmark = this.viper.createBookmark(range);
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
            this.viper.selectBookmark(bookmark);
        }//end if

        // If the selection is at the end of text node and has no next sibling
        // then move the range out of its parent node to prevent empty tags being
        // created by range.extractContents().
        if (range.startContainer.nodeType === dfx.TEXT_NODE
            && range.startOffset === range.startContainer.data.length
        ) {
            if (!range.startContainer.nextSibling) {
                var newTextNode = Viper.document.createTextNode('');
                dfx.insertAfter(range.startContainer.parentNode, newTextNode);
                range.setStart(newTextNode, 0);
                range.collapse(true);
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
        var elemClone = elem.cloneNode(true);
        dfx.remove(dfx.getTag('del', elemClone));

        if (dfx.isBlank(dfx.getNodeTextContent(elemClone)) === true) {
            // Do not need this empty element.
            elem = null;
        }

        if (elem === null || (elem.tagName && elem.tagName.toLowerCase() !== 'li' && dfx.isBlockElement(elem) === false)) {
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
                dfx.setHtml(pelem, '&nbsp;');
            }

            elem = pelem;
            ViperChangeTracker.addChange('createContainer', [elem]);
        } else {
            ViperChangeTracker.removeTrackChanges(elem, true);
            ViperChangeTracker.addChange('splitContainer', [elem]);
        }//end if

        if (this.viper.elementIsEmpty(parent) === true) {
            dfx.setHtml(parent, '&nbsp;');
        }

        // Insert the new element after the current parent.
        dfx.insertAfter(parent, elem);

        range.setStart(elem, 0);
        range.setStart(elem, 0);
        try {
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
        if (dfx.isBlockElement(parent) === true && dfx.trim(dfx.getHtml(parent)) === '') {
            dfx.setHtml(parent, '&nbsp;');
        }

        this.viper.fireNodesChanged('ViperKeyboardEditorPlugin:enter');

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
        if (this._isKeyword() === true) {
            return false;
        }

        if (e) {
            var range     = this.viper.getCurrentRange();
            var startNode = range.getStartNode();
            if (startNode && dfx.isTag(dfx.getFirstBlockParent(startNode), 'pre') === true) {
                this.insertTextAtRange(range, "\n");
                return false;
            }
        }

        var node = Viper.document.createElement('br');
        this.viper.insertNodeAtCaret(node);

        if (dfx.isTag(node.previousSibling, 'br') === true) {
            // The previous sibling is also a br tag and to be able to position
            // caret between these two br tags we need to insert a text node in
            // between them.
            this.viper.insertAfter(node.previousSibling, this.viper.createSpaceNode());
        }

        return !this.viper.setCaretAfterNode(node);

    },

    insertTextAtRange: function(range, text)
    {
        var node = range.startContainer;
        // Assuming the range is collapsed already.
        if (node.nodeType === dfx.TEXT_NODE) {
            // Split the text node and insert new line char.
            var newNode = node.splitText(range.startOffset);
            dfx.insertBefore(newNode, document.createTextNode(text));
        } else {
            // Element node..
            node = range.startContainer.childNodes[range.startOffset];
            if (node.nodeType === dfx.TEXT_NODE) {
                // Split the text node and insert new line char.
                var newNode = node.splitText(range.startOffset);
                dfx.insertBefore(newNode, document.createTextNode(text));
            } else {
                newNode = document.createTextNode(text);
                dfx.insertAfter(node, newNode);
            }
        }

        if (newNode.data.length === 0) {
            newNode.data = ' ';
        }

        range.setStart(newNode, 0);
        range.collapse(true);
        ViperSelection.addRange(range);

        if (ViperChangeTracker.isTracking() === true) {
            var ctNode = null;
            if (newNode.nextSibling) {
                var sibling = newNode.nextSibling;
                ctNode      = ViperChangeTracker.createCTNode('ins', 'textAdd', newNode);
                dfx.insertBefore(sibling, ctNode);
            } else if (newNode.previousSibling) {
                var sibling = newNode.previousSibling;
                ctNode      = ViperChangeTracker.createCTNode('ins', 'textAdd', newNode);
                dfx.insertAfter(sibling, ctNode);
            } else {
                var parent  = newNode.parentNode;
                ctNode      = ViperChangeTracker.createCTNode('ins', 'textAdd', newNode);
                parent.appendChild(ctNode);
            }

            if (ctNode) {
                ViperChangeTracker.addChange('textAdded', [ctNode]);
            }
        }

    },

    cleanPreTags: function()
    {
        var preTags = dfx.getTag('pre', this.viper.getViperElement());
        var c       = preTags.length;

        for (var i = 0; i < c; i++) {
            this.cleanPreTag(preTags[i]);
        }

    },

    cleanPreTag: function(pre)
    {
        if (!pre) {
            return;
        }

        var elems = dfx.getTag('p,div', pre);
        var c     = elems.length;

        for (var i = 0; i < c; i++) {
            var elem = elems[i];
            while (elem.firstChild) {
                dfx.insertBefore(elem, elem.firstChild);
            }

            dfx.insertBefore(elem, document.createTextNode("\n\n"));
            dfx.remove(elem);
        }

    }

};
