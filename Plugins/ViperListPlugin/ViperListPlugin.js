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
    function ViperListPlugin(viper)
    {
        this.viper = viper;
        this.toolbarPlugin = null;

        this.initInlineToolbar();
    }

    Viper.PluginManager.addPlugin('ViperListPlugin', ViperListPlugin);

    ViperListPlugin.prototype = {

        init: function()
        {
            var self = this;
            var toolbarPlugin = this.viper.PluginManager.getPlugin('ViperToolbarPlugin');
            if (toolbarPlugin) {
                var self            = this;
                var tools           = this.viper.Tools;
                this._toolbarPlugin = toolbarPlugin;
                var toolbarButtons  = {
                    ul: 'unorderedList',
                    ol: 'orderedList',
                    indent: 'indentList',
                    outdent: 'outdentList'
                };

                var btnGroup = tools.createButtonGroup('ViperListPlugin:vtp:buttons');
                tools.createButton('unorderedList', '', _('Make Unordered List'), 'Viper-listUL', function() {
                    var statuses = self._getButtonStatuses(null, true);
                    return self._makeListButtonAction(statuses.list, 'ul');
                }, true);
                tools.createButton('orderedList', '', _('Make Ordered List'), 'Viper-listOL', function() {
                    var statuses = self._getButtonStatuses(null, true);
                    return self._makeListButtonAction(statuses.list, 'ol');
                }, true);
                tools.createButton('indentList', '', _('Indent List'), 'Viper-listIndent', function() {
                    if (self.tabRange(null, false, true) === false) {
                        // This should not happen as the button should be disabled when the range cannot be converted
                        // to a list.
                        self.convertRangeToList();
                    } else {
                        self.tabRange();
                    }
                }, true);
                tools.createButton('outdentList', '', _('Outdent List'), 'Viper-listOutdent', function() {
                    self.tabRange(null, true);
                }, true);
                tools.addButtonToGroup('unorderedList', 'ViperListPlugin:vtp:buttons');
                tools.addButtonToGroup('orderedList', 'ViperListPlugin:vtp:buttons');
                tools.addButtonToGroup('indentList', 'ViperListPlugin:vtp:buttons');
                tools.addButtonToGroup('outdentList', 'ViperListPlugin:vtp:buttons');
                this._toolbarPlugin.addButton(btnGroup);

                this.viper.registerCallback('ViperToolbarPlugin:updateToolbar', 'ViperListPlugin', function(data) {
                    self._updateToolbar(toolbarButtons, data.range);
                });
            }//end if

            this.viper.registerCallback('Viper:keyDown', 'ViperListPlugin', function(e) {
                if (e.which === 9) {
                    // Handle tab key.
                    var range     = self.viper.getViperRange();
                    var startNode = range.getStartNode();
                    if (!startNode) {
                        startNode = range.startContainer;
                    }

                    if (!startNode) {
                        return;
                    }

                    if (startNode.nodeType === ViperUtil.TEXT_NODE
                        && range.collapsed === false
                        && startNode.data.length === range.startOffset
                        && ViperUtil.isBrowser('msie') === true
                    ) {
                        // IE sometimes fails with range, if multiple list elements are
                        // selected and range starts from the beginning of a list item
                        // then IE thinks that the range is starting from previous element
                        // which could be a list item causing isListElement() to return
                        // true.. Here, we move range by 1 char right to fix it.
                        range.moveStart(ViperDOMRange.CHARACTER_UNIT, 1);
                        startNode = range.getStartNode();
                    }

                    var firstBlock = ViperUtil.getFirstBlockParent(startNode, null, true);
                    if (ViperUtil.isTag(firstBlock, 'li') === true) {
                        if (range.collapsed === true
                            && ViperUtil.getParents(startNode, 'td,th', self.viper.getViperElement()).length > 0
                        ) {
                            // If the list is inside a TD/TH tag and range is collapsed then do not prevent default action.
                            // This is to allow tabbing inside table cells even if the caret is in a list item.
                            return;
                        } else if (self.tabRange(range, e.shiftKey, true) === true) {
                            self.tabRange(range, e.shiftKey);
                        }

                        ViperUtil.preventDefault(e);
                        return false;
                    } else if (e.shiftKey !== true) {
                        if (ViperUtil.isTag(startNode, 'p') === true
                            || ((startNode.nodeType === ViperUtil.TEXT_NODE || ViperUtil.isStubElement(startNode) === true) && ViperUtil.isTag(ViperUtil.getFirstBlockParent(startNode), 'p') === true)
                        ) {
                            if (ViperUtil.getParents(startNode, 'td,th,blockquote', self.viper.getViperElement()).length === 0) {
                                // Do not allow tab to create list when in table, blockquote.
                                self.convertRangeToList(range);
                                ViperUtil.preventDefault(e);
                                return false;
                            }
                        }
                    }
                }

            });

            this.viper.registerCallback('Viper:editableElementChanged', 'ViperListPlugin', function() {
                var touched = false;
                var x       = null;
                ViperUtil.addEvent(self.viper.getViperElement(), 'touchstart', function(e) {
                    x       = e.pageX;
                    touched = true;
                });

                ViperUtil.addEvent(self.viper.getViperElement(), 'touchmove', function(e) {
                    if (touched === true && x < e.pageX) {
                        self.indentListItems([e.target]);
                    } else if (touched === true && x > e.pageX) {
                        self.outdentListItems([e.target]);
                    }

                    touched = false;
                });

                ViperUtil.addEvent(self.viper.getViperElement(), 'touchend', function(e) {
                    touched = false;
                });
            });

        },

        initInlineToolbar: function()
        {
            var self = this;
            this.viper.registerCallback('ViperInlineToolbarPlugin:initToolbar', 'ViperListPlugin', function(toolbar) {
                self.createInlineToolbar(toolbar);
            });
            this.viper.registerCallback('ViperInlineToolbarPlugin:updateToolbar', 'ViperListPlugin', function(data) {
                self.updateInlineToolbar(data);
            });

        },

        createInlineToolbar: function(toolbar)
        {

            var self  = this;
            var tools = this.viper.Tools;

            var buttonGroup = tools.createButtonGroup('ViperListPlugin:vitp:buttons');
            toolbar.addButton(buttonGroup);

            tools.createButton('vitpUnorderedList', '', _('Make Unordered List'), 'Viper-listUL', function() {
                var statuses = self._getButtonStatuses();
                self._makeListButtonAction(statuses.list, 'ul');
            });

            tools.createButton('vitpOrderedList', '', _('Make Ordered List'), 'Viper-listOL', function() {
                var statuses = self._getButtonStatuses();
                self._makeListButtonAction(statuses.list, 'ol');
            });

            tools.addButtonToGroup('vitpUnorderedList', 'ViperListPlugin:vitp:buttons');
            tools.addButtonToGroup('vitpOrderedList', 'ViperListPlugin:vitp:buttons');

            tools.createButton('vitpIndentList', '', _('Indent List'), 'Viper-listIndent', function() {
                self.tabRange();
            });
            tools.createButton('vitpOutdentList', '', _('Outdent List'), 'Viper-listOutdent', function() {
                self.tabRange(null, true);
            });

            tools.addButtonToGroup('vitpIndentList', 'ViperListPlugin:vitp:buttons');
            tools.addButtonToGroup('vitpOutdentList', 'ViperListPlugin:vitp:buttons');
        },

        updateInlineToolbar: function(data)
        {
            var statuses = this._getButtonStatuses(data.range);
            if (!statuses) {
                return;
            }

            var tools = this.viper.Tools;

            if (statuses.ul === true || statuses.ol === true) {
                data.toolbar.showButton('vitpUnorderedList', !statuses.ul);
                data.toolbar.showButton('vitpOrderedList', !statuses.ol);

                if (statuses.isUL === true) {
                    tools.setButtonActive('vitpUnorderedList');
                    tools.setButtonInactive('vitpOrderedList');
                } else if (statuses.isOL === true) {
                    tools.setButtonActive('vitpOrderedList');
                    tools.setButtonInactive('vitpUnorderedList');
                }
            }

            if (statuses.increaseIndent === true || statuses.decreaseIndent === true) {
                data.toolbar.showButton('vitpIndentList', !statuses.increaseIndent);
                data.toolbar.showButton('vitpOutdentList', !statuses.decreaseIndent);
            }

        },

        removeListItem: function(li, sameList)
        {
            if (!li || !li.parentNode) {
                return false;
            }

            var list = this._getListElement(li);
            if (!list) {
                return;
            }

            var nextLevelList = this._getListElement(list);
            if (!nextLevelList) {
                var newElem = document.createElement('p');
                while (li.firstChild) {
                    newElem.appendChild(li.firstChild);
                }
            }

            // Check if the list item we are removing is at the end of the list or
            // not. If not then we need to break the list in to two parts with the
            // removed list item (as P tag) between those lists.
            if (li.nextSibling) {
                // Create a new list for rest of the list items.
                var clone = list.cloneNode(false);
                for (var node = li.nextSibling; node; node = li.nextSibling) {
                    clone.appendChild(node);
                }

                ViperUtil.insertAfter(list, clone);
            }

            ViperUtil.remove(li);

            if (!nextLevelList) {
                ViperUtil.insertAfter(list, newElem);
            } else {
                var newElem = document.createElement('br');
                ViperUtil.insertAfter(list, newElem);
                ViperUtil.insertAfter(newElem, li.childNodes);
            }

            if (ViperUtil.getNodeTextContent(list) === '') {
                ViperUtil.remove(list);
            }

            return newElem;

        },

        makeList: function(ordered, force)
        {
            var tag = 'ul';
            if (ordered === true) {
                tag = 'ol';
            }

            var range    = this.viper.getViperRange().cloneRange();
            var bookmark = this.viper.createBookmark(range);

            if (bookmark.start.parentNode === bookmark.end.parentNode) {
                // The range is collapsed or is inside the same parent/element.
                var li   = this._getListItem(range.startContainer);
                var elem = this._getBlockParent(range.startContainer);
                if (li !== elem) {
                    li = null;
                }

                if (li !== null) {
                    var br = this._getLineBreak(bookmark.start);
                    if (br) {
                        var tmpDiv = document.createElement('div');
                        ViperUtil.insertBefore(br, tmpDiv);
                        var node = null;
                        while (node = br.nextSibling) {
                            if (node.nodeType === ViperUtil.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') {
                                tmpDiv = document.createElement('div');
                                ViperUtil.insertBefore(node, tmpDiv);
                                ViperUtil.remove(br);
                                br = node;
                                continue;
                            }

                            tmpDiv.appendChild(node);
                        }

                        if (br.parentNode) {
                            ViperUtil.remove(br);
                        }

                        this.viper.selectBookmark(bookmark);
                        this.makeList(ordered, true);
                        return;
                    }//end if
                }//end if

                if (li === null || force === true) {
                    // Create a new list.
                    var list = null;
                    if (elem === null) {
                        elem = [range.startContainer];
                    } else {
                        elem = [elem];
                    }

                    var removeInsAfter = false;
                    var insertAfter    = elem[0].previousSibling;
                    if (!insertAfter) {
                        insertAfter = document.createTextNode('');
                        ViperUtil.insertBefore(elem[0], insertAfter);
                        removeInsAfter = true;
                    }

                    if (ViperUtil.isTag(elem[0], 'td') === true) {
                        var td = elem[0];
                        var p = document.createElement('p');
                        while (td.firstChild) {
                            p.appendChild(td.firstChild);
                        }

                        elem = [p];
                        list = this._makeList(tag, elem);
                        td.appendChild(list);
                    } else {
                        list = this._makeList(tag, elem);
                        ViperUtil.insertAfter(insertAfter, list);
                    }

                    this.viper.selectBookmark(bookmark);
                    return true;
                } else {
                    // Remove item from its list.
                    var listElement = this._getListElement(li);
                    var convert     = (listElement && listElement.tagName.toLowerCase() !== tag);

                    var newElem = this.removeListItem(li);

                    // Select bookmark.
                    this.viper.selectBookmark(bookmark);

                    if (convert === true) {
                        // Need to create a new list with the specified tag.
                        this.makeList(ordered);
                    }
                }//end if
            } else {
                // Range is not collapsed.
                var elements   = ViperUtil.getElementsBetween(bookmark.start, bookmark.end);
                var comParents = this._getCommonParents(elements);
                if (!comParents) {
                    return false;
                }

                var isWholeList = this._isWholeList(comParents);

                // Determine what to do with the selected elements.
                if (ViperUtil.isTag(comParents[0], 'li') === true) {
                    // If the array contains only list items and they are all the same
                    // list type then remove them from their lists.
                    var sameType = true;
                    ViperUtil.foreach(comParents, function(i) {
                        if (ViperUtil.isTag(comParents[i], 'li') !== true
                            || ViperUtil.isTag(comParents[i].parentNode, tag) !== true) {
                            sameType = false;
                            // Break.
                            return false;
                        }
                    });

                    if (sameType === true) {
                        var self = this;
                        ViperUtil.foreach(comParents, function(i) {
                            self.removeListItem(comParents[i], isWholeList);
                        });

                        // Select the range and update caret.
                        this.viper.selectBookmark(bookmark);
                        return;
                    } else {
                        // If the specified list type is same as the first selected items list type
                        // then join the rest of the elements to that list.
                        if (ViperUtil.isTag(comParents[0].parentNode, tag) === true) {
                            var firstItem = comParents.shift();
                            this._joinToList(firstItem.parentNode, comParents, firstItem);
                            // Select the range and update caret.
                            this.viper.selectBookmark(bookmark);
                            return;
                        } else {
                            var self = this;
                            // Remove the list items and then create a new list.
                            ViperUtil.foreach(comParents, function(i) {
                                self.removeListItem(comParents[i], isWholeList);
                            });

                            // Select the range and update caret.
                            this.viper.selectBookmark(bookmark);

                            // Create the new list.
                            return this.makeList(ordered);
                        }//end if
                    }//end if
                }//end if

                // Get insertion point of the new list.
                var removeInsAfter = false;
                var insertAfter    = comParents[0].previousSibling;
                if (!insertAfter) {
                    insertAfter = document.createTextNode('');
                    ViperUtil.insertBefore(comParents[0], insertAfter);
                    removeInsAfter = true;
                }

                var list = this._makeList(tag, comParents);
                ViperUtil.insertAfter(insertAfter, list);
                if (removeInsAfter === true) {
                    ViperUtil.remove(insertAfter);
                }

                this.viper.selectBookmark(bookmark);
            }//end if

        },

        canIncreaseIndent: function(range)
        {
            return this.tabRange(range, false, true);

        },

        canDecreaseIndent: function(range)
        {
            return this.tabRange(range, true, true);

        },

        tabRange: function(range, outdent, testOnly, listType)
        {
            range    = range || this.viper.getViperRange();

            var node = range.getStartNode() || range.getNodeSelection();
            if (!node) {
                node = range.startContainer;
            }

            var firstParent = null;
            if (ViperUtil.isBlockElement(node) === true) {
                firstParent = node;
            } else {
                firstParent = ViperUtil.getFirstBlockParent(node);
            }

            var listItems   = [];
            if (!firstParent || ViperUtil.isTag(firstParent, 'li') === true) {
                listItems = this._getListItemsFromRange(range, testOnly);
            }

            var bookmark = null;
            var updated  = false;
            if (listItems.length > 0) {
                if (testOnly !== true) {
                    bookmark = this.viper.createBookmark();
                }

                if (outdent !== true) {
                    updated = this.indentListItems(listItems, testOnly);
                } else {
                    updated = this.outdentListItems(listItems, testOnly);
                }
            } else if (firstParent && outdent !==  true) {
                updated  = this.convertRangeToList(range, testOnly, listType, true);
                if (updated === true && testOnly !== true) {
                    this.viper.contentChanged();
                }

                return updated;
            }

            if (testOnly !== true) {
                var self = this;
                if (ViperUtil.isBrowser('msie') === true) {
                    setTimeout(function() {
                        // Yet another tiemout for IE.
                        var bookmarkParent  = bookmark.start.parentNode;

                        self.viper.selectBookmark(bookmark);
                        self.viper.adjustRange();

                        var range    = self.viper.getCurrentRange();
                        var nextItem = self.getNextItem(range.startContainer.parentNode);
                        if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                            && range.startOffset === range.startContainer.data.length
                            && range.collapsed === true
                            && range.startContainer.parentNode !== bookmarkParent
                            && (!nextItem || nextItem === bookmarkParent)
                        ) {
                            if (bookmarkParent.firstChild.data === '') {
                                bookmarkParent.firstChild.data = ' ';
                                range.moveStart(ViperDOMRange.CHARACTER_UNIT, 1);
                                range.collapse(true);
                                ViperSelection.addRange(range);
                            }
                        }

                        range = self.viper.getCurrentRange();
                        if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                            && range.startOffset === range.startContainer.data.length
                            && range.collapsed === true
                            && range.startContainer.parentNode !== bookmarkParent
                            && (!nextItem || nextItem === bookmarkParent)
                        ) {
                            range.moveEnd(ViperDOMRange.CHARACTER_UNIT, 1);
                            range.moveEnd(ViperDOMRange.CHARACTER_UNIT, -1);
                            range.collapse(false);
                            ViperSelection.addRange(range);
                        }

                        if (updated === true) {
                            self.viper.contentChanged();
                        }
                    }, 5);
                } else {
                    if (bookmark) {
                        this.viper.selectBookmark(bookmark);
                    }

                    this.viper.adjustRange();

                    if (updated === true) {
                        this.viper.contentChanged();
                    }
                }
            }

            return updated;

        },

        _getListItemsFromRange: function(range, testOnly, expand)
        {
            var startNode = range.getStartNode();
            var endNode   = range.getEndNode();

            if (!startNode && !endNode && range.startContainer) {
                startNode = range.startContainer;
                if (testOnly !== true && ViperUtil.isTag(startNode, 'br') === true) {
                    var textNode = document.createTextNode('');
                    ViperUtil.insertBefore(startNode, textNode);
                    range.setStart(textNode, 0);
                    range.collapse(true);
                }
            }

            if (!endNode && startNode.nodeType === ViperUtil.ELEMENT_NODE) {
                endNode = startNode;
            }

            var listItems = [];
            if (startNode === endNode) {
                if (ViperUtil.isTag(startNode, 'ul') === true || ViperUtil.isTag(startNode, 'ol') === true) {
                    listItems.push(startNode);
                } else {
                    listItems.push(this._getListItem(startNode));
                }
            } else {
                var elems = ViperUtil.getElementsBetween(startNode, endNode);
                if (ViperUtil.inArray(startNode, elems) === false) {
                    elems.unshift(startNode);
                }

                if (ViperUtil.inArray(endNode, elems) === false) {
                    if ((ViperUtil.isBrowser('chrome') === true || ViperUtil.isBrowser('safari') === true)) {
                        if (range.endContainer.nodeType !== ViperUtil.ELEMENT_NODE || ViperUtil.isTag(range.endContainer, 'li') === false || range.endOffset > 0) {
                            elems.push(endNode);
                        }
                    } else if (range.collapsed === true
                        || ViperUtil.isText(range.endContainer) !== true
                        || range.endOffset !== 0
                        || ViperUtil.isTag(ViperUtil.getFirstBlockParent(range.endContainer), 'li') !== true
                    ) {
                        elems.push(endNode);
                    }
                }

                var c = elems.length;
                for (var i = 0; i < c; i++) {
                    var elem = elems[i];
                    if (!elems[i]) {
                        continue;
                    } else if (ViperUtil.isTag(elems[i], 'li') === false && ViperUtil.isTag(elems[i], 'ol') === false && ViperUtil.isTag(elems[i], 'ul') === false) {
                        if (elems[i].nodeType === ViperUtil.TEXT_NODE && elems[i].data.indexOf("\n") === 0) {
                            continue;
                        }

                        var li = this._getListItem(elems[i]);
                        if (li && ViperUtil.inArray(li, listItems) === false) {
                            listItems.push(li);
                        }
                    } else {
                        if (ViperUtil.inArray(elems[i], listItems) === false) {
                            listItems.push(elems[i]);
                        }

                        if (expand === true) {
                            listItems = listItems.concat(ViperUtil.getTag('li', elems[i]));
                        }
                    }
                }
            }

            return listItems;

        },

        indentListItems: function(listItems, testOnly)
        {
            if (!listItems || listItems.length === 0) {
                return false;
            }

            var topListItems   = this.getTopLevelListItems(listItems);
            var includeSublist = false;
            if (listItems.length !== topListItems.length) {
                // If the sub list items selected then move the sublist item together with the top list item.
                includeSublist = true;
            }

            var c = topListItems.length;
            for (var i = 0; i < c; i++) {
                if (this.indentListItem(topListItems[i], includeSublist, testOnly) === false) {
                    return false;
                }
            }

            return true;

        },

        indentListItem: function(li, includeSublist, testOnly)
        {
            if (!li) {
                return false;
            }

            // There is no previous list item, do not indent.
            var prevItem  = this.getPreviousItem(li);
            if (!prevItem) {
                return false;
            }

            // Check if this item has its own sub list. If there is a sub list then
            // move this item in to that list and move the sub list to the previous
            // list item.
            // Check if the previous list item has a sub list.
            var prevSubList = this.getSubListItem(prevItem);
            if (prevSubList && includeSublist !== true) {
                if (testOnly === true) {
                    return true;
                }

                // Previous item has a sub list, add this item to that sub list.
                prevSubList.appendChild(li);
            } else {
                var subList = this.getSubListItem(li);
                if (subList && includeSublist !== true) {
                    if (testOnly === true) {
                        return true;
                    }

                    var itemContents = this.getItemContents(li);
                    var newItem      = document.createElement('li');

                    // Move the contents of the item to the list.
                    while (itemContents.length > 0) {
                        newItem.appendChild(itemContents.shift());
                    }

                    this.addItemToList(newItem, subList, 0);

                    // Move the sublist to the previous item.
                    prevItem.appendChild(subList);

                    // This item is no longer needed..
                    ViperUtil.remove(li);
                } else {
                    if (testOnly === true) {
                        return true;
                    }

                    // If the previous item has a sub list then join to that.
                    if (prevSubList) {
                        prevSubList.appendChild(li);
                    } else {
                        // Create a new list using the same list type.
                        var listElement = this._getListElement(li);

                        var tagName     = ViperUtil.getTagName(listElement);
                        var newList     = document.createElement(tagName);

                        // Add the list item to this new list.
                        newList.appendChild(li);

                        // Add the new list to the previous item.
                        prevItem.appendChild(newList);
                    }
                }
            }

            return true;

        },

        outdentListItems: function(listItems, testOnly)
        {
            if (!listItems || listItems.length === 0) {
                return false;
            }

            // For each list item remove all the sub lists. Construct a new array with the top selected list items.
            var itemsToOutdent = this.getTopLevelListItems(listItems);
            var c              = itemsToOutdent.length;
            for (var i = 0; i < c; i++) {
                if (this.outdentListItem(itemsToOutdent[i], testOnly) === false) {
                    return false;
                }
            }

            return true;

        },

        getTopLevelListItems: function (listItems)
        {
            listItems         = listItems.concat([]);
            var topLevelItems = [listItems.shift()];
            for (var i = 0; i < listItems.length; i++) {
                var add     = true;
                var parents = ViperUtil.getParents(listItems[i], 'li');
                for (var j = 0; j < parents.length; j++) {
                    if (ViperUtil.inArray(parents[j], topLevelItems, true) === true) {
                        add = false;
                        break;
                    }
                }

                if (add === true) {
                    topLevelItems.push(listItems[i]);
                }
            }

            return topLevelItems;

        },

        outdentListItem: function(li, testOnly)
        {
            if (!li) {
                return false;
            }

            var list      = null;
            var isSubList = false;
            if (ViperUtil.isTag(li, 'ul') === true || ViperUtil.isTag(li, 'ol') === true) {
                list      = li;
                isSubList = true;
            } else {
                list = this._getListElement(li);
            }

            var parentListItem = this._getListItem(list);

            var siblingItems = [];
            if (isSubList !== true) {
                for (var node = li.nextSibling; node; node = node.nextSibling) {
                    if (ViperUtil.isTag(node, 'li') === true) {
                        siblingItems.push(node);
                    }
                }
            }

            if (testOnly === true) {
                return true;
            }

            if (parentListItem) {
                if (siblingItems.length > 0) {
                    // Move these (next) siblings under an exisiting sub list or
                    // under a new list (and place the new list under the current item).
                    var subList = this.getSubListItem(li);
                    if (!subList) {
                        // Create a new list of the same type.
                        subList = document.createElement(this.getListType(li));
                        li.appendChild(subList);
                    }

                    for (var i = 0; i < siblingItems.length; i++) {
                        subList.appendChild(siblingItems[i]);
                    }
                }

                if (isSubList === true) {
                    // For each child move them after the parent list item.
                    var childItems = [];
                    for (var node = li.firstChild; node; node = node.nextSibling) {
                        if (ViperUtil.isTag(node, 'li') === true) {
                            childItems.push(node);
                        }
                    }

                    for (var i = childItems.length; i >= 0; i--) {
                        ViperUtil.insertAfter(parentListItem, childItems[i]);
                    }
                } else {
                    // Now move this list item after the parent list item.
                    ViperUtil.insertAfter(parentListItem, li);
                }

                if (ViperUtil.getTag('li', list).length === 0) {
                    // If the old list item is now empty, remove it.
                    ViperUtil.remove(list);
                }

                return true;
            } else {
                // Convert this item to a default block tag.
                var subList = null;
                var bTag    = this.viper.getDefaultBlockTag();
                var p       = null;
                if (bTag !== '') {
                    p       = document.createElement(bTag);
                    while (li.firstChild) {
                        if (ViperUtil.isTag(li.firstChild, 'ul') === true || ViperUtil.isTag(li.firstChild, 'ol') === true) {
                            // Sub list needs to go after the p tag.
                            subList = li.firstChild;
                            li.removeChild(li.firstChild);
                        } else {
                            p.appendChild(li.firstChild);
                        }
                    }
                } else {
                    p = document.createElement('p');
                }

                // If there are more list items after this item then move them in to a
                // new list or if this item is the first in the list then just move it out.
                var firstItem = true;
                for (var node = li.previousSibling; node; node = node.previousSibling) {
                    if (ViperUtil.isTag(node, 'li') === true) {
                        firstItem = false;
                        break;
                    }
                }

                if (siblingItems.length === 0) {
                    if (firstItem === true) {
                        // This is the only item in the list.
                        if (bTag !== '') {
                            ViperUtil.insertBefore(list, p);
                        } else {
                            ViperUtil.insertBefore(list, li.childNodes);
                        }

                        ViperUtil.remove(li);
                    } else {
                        // Last item on the list. Add the p tag after the list.
                        if (bTag !== '') {
                            ViperUtil.insertAfter(list, p);
                        } else {
                            ViperUtil.insertAfter(list, li.childNodes);
                        }

                        ViperUtil.remove(li);
                    }
                } else {
                    if (firstItem === true) {
                        // This is the only item in the list.
                        if (bTag !== '') {
                            ViperUtil.insertBefore(list, p);
                        } else {
                            ViperUtil.insertBefore(list, li.childNodes);
                        }

                        ViperUtil.remove(li);
                    } else {
                        // Move the list items after this item to a new list.
                        var newList = document.createElement(ViperUtil.getTagName(list));
                        for (var i = 0; i < siblingItems.length; i++) {
                            newList.appendChild(siblingItems[i]);
                        }

                        ViperUtil.remove(li);

                        ViperUtil.insertAfter(list, newList);

                        if (bTag !== '') {
                            ViperUtil.insertAfter(list, p);
                        } else {
                            ViperUtil.insertAfter(list, li.childNodes);
                        }
                    }//end if
                }

                if (subList) {
                    // Put the sub list that was in the original list element right after
                    // the P tag. However, if there is already a list of same type then join to that list.
                    if (ViperUtil.isTag(p.nextSibling, ViperUtil.getTagName(subList)) === true) {
                        while (subList.firstChild) {
                            ViperUtil.insertBefore(p.nextSibling.firstChild, subList.firstChild);
                        }
                    } else {
                        ViperUtil.insertAfter(p, subList);
                    }
                }

                if (!ViperUtil.getFirstElementChild(list)) {
                    ViperUtil.remove(list);
                }

                return true;

            }

            return false;

        },

        convertRangeToList: function(range, testOnly, listType, canJoin)
        {
            range    = range || this.viper.getViperRange();
            testOnly = testOnly || false;
            listType = listType || null;

            var startNode = range.getStartNode();
            var endNode   = range.getEndNode();
            var bookmark  = null;

            if (testOnly !== true) {
                bookmark  = this.viper.createBookmark();
            }

            if (!startNode && !endNode) {
                startNode = range.startContainer;
                endNode   = startNode;
            } else if (startNode && !endNode && range.collapsed === true) {
                endNode = startNode;
            }

            var pElems = [];
            if (startNode === endNode) {
                var validParent = null;
                if (bookmark && bookmark.start) {
                    validParent = this._getValidParentElement(bookmark.start);
                } else {
                    validParent = this._getValidParentElement(startNode);
                }

                if (validParent) {
                    if (testOnly !== true
                        && (ViperUtil.isTag(validParent, 'td') === true || ViperUtil.isTag(validParent, 'th') === true)
                    ) {
                        return this.makeList(listType === 'ol');
                    } else {
                        pElems.push(validParent);
                    }
                }
            } else {
                var elems = null;
                if (testOnly === true) {
                    elems = ViperUtil.getElementsBetween(startNode, endNode);
                    elems.unshift(startNode);
                    elems.push(endNode);
                } else {
                    elems = ViperUtil.getElementsBetween(bookmark.start, bookmark.end);
                }

                var c     = elems.length;
                for (var i = 0; i < c; i++) {
                    if (!elems[i]) {
                        continue;
                    }

                    var p = this._getValidParentElement(elems[i]);
                    if (p && ViperUtil.inArray(p, pElems) === false) {
                        pElems.push(p);
                    } else if (!p && elems[i].nodeType === ViperUtil.TEXT_NODE && ViperUtil.isBlank(elems[i].data) === true) {
                        // Remove blank text nodes between these elements.
                        ViperUtil.remove(elems[i]);
                    }
                }
            }

            if (pElems.length === 0) {
                return false;
            } else if (testOnly === true) {
                return true;
            }

            // Get the previous list if there is one.
            var list  = null;
            var atEnd = true;
            if (!listType || canJoin === true) {
                for (var node = pElems[0].previousSibling; node; node = node.previousSibling) {
                    if (node.nodeType === ViperUtil.ELEMENT_NODE) {
                        if ((listType && ViperUtil.isTag(node, listType) === true)
                            || (!listType && (ViperUtil.isTag(node, 'ol') === true || ViperUtil.isTag(node, 'ul') === true))
                        ) {
                            list  = node;
                            atEnd = true;
                        }

                        break;
                    }
                }

                if (list === null) {
                    // There was no list before the first element. Check if there is a list
                    // element after the last p element.
                    for (var node = pElems[(pElems.length - 1)].nextSibling; node; node = node.nextSibling) {
                        if (node.nodeType === ViperUtil.ELEMENT_NODE) {
                            if ((listType && ViperUtil.isTag(node, listType) === true)
                                || (!listType && (ViperUtil.isTag(node, 'ol') === true || ViperUtil.isTag(node, 'ul') === true))
                            ) {
                                list  = node;
                                atEnd = false;
                            }

                            break;
                        }
                    }
                }
            }

            if (list === null) {
                // No list found, create a new list.
                list = document.createElement(listType || 'ul');
                ViperUtil.insertBefore(pElems[0], list);

                atEnd = true;
            }

            var listItems = [];
            var prev      = null;
            for (var i = 0; i < pElems.length; i++) {
                var p  = pElems[i];
                var li = null;
                if (ViperUtil.isTag(p, ['ul', 'ol']) === true) {
                    if (prev !== null) {
                        // Append this list to the previous item as its sub list.
                        prev.appendChild(p);
                    }
                } else {
                    var li = document.createElement('li');
                    while (p.firstChild) {
                        li.appendChild(p.firstChild);
                    }

                    if (ViperUtil.isTag(p, ['td', 'th']) === true) {
                        ViperUtil.insertBefore(list, p);
                        p.appendChild(list);
                    } else {
                        ViperUtil.remove(p);
                    }

                    if (atEnd !== true) {
                        listItems.unshift(li);
                    } else {
                        listItems.push(li);
                    }

                    prev = li;
                }
            }

            if (atEnd === true) {
                // Append the new list items to the end of the list.
                for (var i = 0; i < listItems.length; i++) {
                    list.appendChild(listItems[i]);
                }

                // If there is another list right after the current list, join them.
                var listType = ViperUtil.getTagName(list);
                for (var node = list.nextSibling; node; node = node.nextSibling) {
                    if (node.nodeType !== ViperUtil.TEXT_NODE) {
                        if (ViperUtil.isTag(node, listType) === true) {
                            while(node.firstChild) {
                                list.appendChild(node.firstChild);
                            }

                            ViperUtil.remove(node);
                        }

                        break;
                    } else if (ViperUtil.isBlank(ViperUtil.trim(node.data)) !== true) {
                        break;
                    }
                }
            } else {
                // To the start of the list.
                for (var i = 0; i < listItems.length; i++) {
                    ViperUtil.insertBefore(list.firstChild, listItems[i]);
                }
            }

            // Select bookmark.
            if (ViperUtil.isBrowser('msie', '<9') === true) {
                var self = this;
                setTimeout(function() {
                    self.viper.selectBookmark(bookmark);
                    self.viper.contentChanged();
                }, 10);
            } else {
                this.viper.selectBookmark(bookmark);
                this.viper.contentChanged();
            }

            // TODO: Properly fix fireNodesChanged event firing as this method maybe called by other create list method
            // which also fire nodesChanged event causing multiple history entries.
            if (canJoin === true) {
                return false;
            }

            return true;

        },

        convertRangeToParagraphs: function(range)
        {
            range = range = this.viper.getViperRange();

            var listItems = this._getListItemsFromRange(range, false, true);
            var bookmark  = this.viper.createBookmark();
            var prevElem  = null;
            var prevList  = null;

            for (var i = 0; i < listItems.length; i++) {
                if (ViperUtil.isTag(listItems[i], 'li') === false) {
                    // Must be a whole list. Gell all li tags inside it.
                    var childItems = ViperUtil.getTag('li', listItems[i]);

                    var parent = null;
                    if (!prevElem) {
                        parent   = listItems[i];
                        prevList = parent;
                    }

                    for (var j = 0; j < childItems.length; j++) {
                        var p = this.convertElement(childItems[j], 'p', true);
                        if (prevElem) {
                            ViperUtil.insertAfter(prevElem, p);
                        } else {
                            ViperUtil.insertBefore(parent, p);
                        }

                        prevElem = p;
                    }

                    prevElem = null;
                } else {
                    var parent = listItems[i].parentNode;
                    var p      = this.splitListAtItem(listItems[i]);
                    if (prevElem) {
                        ViperUtil.insertAfter(prevElem, p);
                    }

                    if (prevList !== parent) {
                        prevList = parent;
                    } else {
                        prevElem = p;
                    }
                }//end if
            }//end for

            this.viper.selectBookmark(bookmark);
            this.viper.contentChanged();

        },

        /**
         * Splits the item's list and converts item to a paragraph.
         */
        splitListAtItem: function(li)
        {
            var siblings = [];
            for (var node = li.nextSibling; node; node = node.nextSibling) {
                if (ViperUtil.isTag(node, 'li') === false) {
                    continue;
                }

                siblings.push(node);
            }

            // Create the new P tag.
            var listElem = li.parentNode;
            var newList  = null;

            if (siblings.length > 0) {
                // There are list items after the specified one. Move them to a new list.
                newList = document.createElement(this.getListType(li));
                for (var i = 0; i < siblings.length; i++) {
                    newList.appendChild(siblings[i]);
                }
            }

            var p = this.convertElement(li, 'p', true);
            ViperUtil.insertAfter(listElem, p);

            if (newList) {
                ViperUtil.insertAfter(p, newList);
            }

            // Move block elements inside P to after it.
            var node = p.lastChild;
            while (node) {
                var prevSibling = node.previousSibling;
                if (ViperUtil.isBlockElement(node) === true && ViperUtil.isStubElement(node) === false) {
                    ViperUtil.insertAfter(p, node);
                }

                node = prevSibling;
            }

            if (ViperUtil.getTag('li', listElem).length === 0) {
                // If the old list is now empty, remove it.
                ViperUtil.remove(listElem);
            }

            return p;

        },

        /**
         * Converts given element to the specified element by creating a new element and moving its child nodes.
         */
        convertElement: function(elem, tagName, detached)
        {
            var newElem = document.createElement(tagName);
            while (elem.firstChild) {
                newElem.appendChild(elem.firstChild);
            }

            if (detached !== true) {
                ViperUtil.insertBefore(elem, newElem);
            }

            ViperUtil.remove(elem);
            return newElem;

        },

        changeListType: function(newType, range)
        {
            range = range || this.viper.getViperRange();
            var listItems = this._getListItemsFromRange(range, false, true);

            var bookmark = this.viper.createBookmark();
            var self     = this;

            var convertChildItems = function(list) {
                var children = ViperUtil.find(list, '> li');
                if (children.length === 0) {
                    return;
                }

                var newParent = null;
                var afterList = null;
                for (var i = 0; i < children.length; i++) {
                    if (ViperUtil.inArray(children[i], listItems) === true) {
                        if (newParent === null) {
                            newParent = document.createElement(newType);
                            ViperUtil.insertAfter(list, newParent);
                        }

                        newParent.appendChild(children[i]);
                        var subLists = ViperUtil.find(children[i], '> ul');
                        for (var j = 0; j < subLists.length; j++) {
                            convertChildItems(subLists[j]);
                        }
                    } else if (newParent !== null) {
                        // Create an after list.
                        if (afterList === null) {
                            afterList = document.createElement(ViperUtil.getTagName(list));
                            ViperUtil.insertAfter(newParent, afterList);
                        }

                        afterList.appendChild(children[i]);
                    }
                }

                if (ViperUtil.getTag('li', list).length === 0) {
                    ViperUtil.remove(list);
                    var joinedList = self.joinSiblingLists(newParent);
                    if (joinedList) {
                        processedParents.push(joinedList);
                    }
                }
            };

            var processedParents = [];
            for (var i = 0; i < listItems.length; i++) {
                if (!listItems[i].parentNode || ViperUtil.inArray(listItems[i].parentNode, processedParents) === true) {
                    continue;
                }

                processedParents.push(listItems[i].parentNode);
                convertChildItems(listItems[i].parentNode);
            }

            this.viper.selectBookmark(bookmark);

        },

        listToParagraphs: function(list)
        {
            var pTags = [];
            for (var node = list.firstChild; node; node = node.nextSibling) {
                if (ViperUtil.isTag(node, 'li') !== true) {
                    continue;
                }

                var p = document.createElement('p');
                while (node.firstChild) {
                    p.appendChild(node.firstChild);
                }

                ViperUtil.insertBefore(list, p);
                pTags.push(p);
            }

            if (pTags.length === 1
                && (ViperUtil.isTag(pTags[0].parentNode, 'td') === true || ViperUtil.isTag(pTags[0].parentNode, 'th') === true)
            ) {
                var cellElement = pTags[0].parentNode;

                // Remove the new new P tag so that the only content in the TD,TH is P's child nodes.
                var p = pTags[0];
                while (p.firstChild) {
                    ViperUtil.insertBefore(p, p.firstChild);
                }

                ViperUtil.remove(p);
                pTags = [cellElement];
            }

            ViperUtil.remove(list);

            return pTags;

        },

        getSubListItem: function(li)
        {
            for (var node = li.firstChild; node; node = node.nextSibling) {
                if (ViperUtil.isTag(node, 'ul') === true || ViperUtil.isTag(node, 'ol') === true) {
                    return node;
                }
            }

            return null;

        },

        addItemToList: function(li, list, pos)
        {
            if (!li || !list || ViperUtil.isTag(li, 'li') === false) {
                return false;
            }

            pos = pos || 0;

            var tags = ViperUtil.getTag('li', list);

            if (tags.length <= pos) {
                list.appendChild(li);
            } else {
                ViperUtil.insertBefore(tags[pos], li);
            }

            return true;

        },

        /**
         * Returns item's contents excluding sub lists.
         *
         * @param {DOMNode} li The list item.
         *
         * @return {array} List of DOMNodes.
         */
        getItemContents: function(li)
        {
            var contentElements = [];
            for (var node = li.firstChild; node; node = node.nextSibling) {
                if (ViperUtil.isTag(node, 'ul') === true || ViperUtil.isTag(node, 'ol') === true) {
                    continue;
                }

                contentElements.push(node);
            }

            return contentElements;

        },

        getListType: function(li)
        {
            var list = this._getListElement(li);
            if (!list) {
                return false;
            }

            return ViperUtil.getTagName(list);

        },

        getPreviousItem: function(li)
        {
            while (li.previousSibling) {
                li = li.previousSibling;
                if (ViperUtil.isTag(li, 'li') === true) {
                    return li;
                }
            }

            return null;

        },

        getNextItem: function(li)
        {
            while (li.nextSibling) {
                li = li.nextSibling;
                if (ViperUtil.isTag(li, 'li') === true) {
                    return li;
                }
            }

            return null;

        },

        _getButtonStatuses: function(range, mainToolbar)
        {
            range         = range || this.viper.getViperRange();
            var startNode = range.getStartNode();
            var endNode   = range.getEndNode();
            var makeList  = false;
            var indent    = false;
            var canMakeUL = false;
            var canMakeOL = false;
            var isUL      = false;
            var isOL      = false;
            var list      = null;

            if (!startNode) {
                if (!range.startContainer
                    || range.startContainer !== range.endContainer
                    || (ViperUtil.isStubElement(range.startContainer) !== true && ViperUtil.isTag(range.startContainer, 'li') === false)
                ) {
                    return;
                } else {
                    startNode = range.startContainer;
                    endNode   = startNode;
                }
            }

            if (!endNode) {
                endNode = startNode;
            } else if (endNode === this.viper.getViperElement()) {
                endNode = range._getLastSelectableChild(this.viper.getViperElement());
            }

            var startParent = null;

            var listElement = null;
            if (ViperUtil.isTag(startNode, ['ul', 'ol']) === true) {
                listElement = startNode;
                startNode   = range._getFirstSelectableChild(startNode);
            } else {
                listElement = this._getListElement(startNode);
            }

            var firstBlock  = startNode;

            if (ViperUtil.isBlockElement(startNode) === false) {
                firstBlock  = ViperUtil.getFirstBlockParent(startNode);
            }

            if (listElement
                && firstBlock
                && ViperUtil.isTag(firstBlock, 'li') === false
            ) {
                // Can be converted to a list.
                makeList = true;

                if (mainToolbar === true) {
                    indent   = true;
                }
            } else if (listElement && listElement === this._getListElement(endNode)) {
                if (range.collapsed === true && mainToolbar !== true) {
                    return;
                }

                makeList = true;
                indent   = true;
            } else if (listElement) {
                if (range.collapsed === true && mainToolbar !== true) {
                    return;
                }

                makeList = true;
                indent   = true;
            } else {
                var nodeSelection = range.getNodeSelection();
                if (nodeSelection && nodeSelection !== this.viper.getViperElement()) {
                    startNode = nodeSelection;
                    endNode   = null;
                }

                if (ViperUtil.isBlockElement(startNode) === false) {
                    startParent   = ViperUtil.getFirstBlockParent(startNode);
                } else {
                    startParent = startNode;
                }

                var endParent = null;

                if (!endNode) {
                    endParent = startParent;
                } else {
                    endParent = ViperUtil.getFirstBlockParent(endNode);
                }

                if (!startParent || !endParent) {
                    return;
                } else if (startParent !== endParent
                    && ViperUtil.isTag(startParent, 'p') === true
                    && ViperUtil.isTag(endParent, 'p') === true
                    && ViperUtil.isTag(startParent.parentNode, 'blockquote') === false
                    && ViperUtil.isTag(endParent.parentNode, 'blockquote') === false
                ) {
                    makeList = true;
                    var nextSibling = startParent.nextSibling;
                    while (nextSibling && nextSibling !== endParent) {
                        if (nextSibling.nodeType === ViperUtil.ELEMENT_NODE
                            && ViperUtil.isTag(nextSibling, 'p') !== true
                        ) {
                            makeList = false;
                            break;
                        }

                        nextSibling = nextSibling.nextSibling;
                    }
                } else if (mainToolbar === true
                    && (ViperUtil.isTag(startParent, 'p') === true || ViperUtil.isTag(startParent, 'td') === true)
                    && ViperUtil.isTag(startParent.parentNode, 'blockquote') === false
                ) {
                    makeList = true;
                }
            }//end if

            if (makeList !== true && indent !== true) {
                return;
            }

            if (makeList === true) {
                if (ViperUtil.isTag(firstBlock, 'li') === true) {
                    list = this._getListElement(startNode, true);
                }

                if (!list && this.convertRangeToList(range, true) === true) {
                    canMakeUL = true;
                    canMakeOL = true;
                } else if (ViperUtil.isTag(list, 'ol') === true) {
                    canMakeUL = true;
                    canMakeOL = true;
                    isOL      = true;
                } else if (ViperUtil.isTag(list, 'ul') === true) {
                    canMakeUL = true;
                    canMakeOL = true;
                    isUL      = true;
                }
            }

            var increaseIndent = false;
            var decreaseIndent = false;

            if (indent === true) {
                increaseIndent = this.canIncreaseIndent(range);
                decreaseIndent = this.canDecreaseIndent(range);
            }

            if (mainToolbar === true
                && startParent
                && ViperUtil.isTag(startParent, 'p') === true
            ) {
                increaseIndent = true;
            }

            var statuses = {
                ul: canMakeUL,
                ol: canMakeOL,
                increaseIndent: increaseIndent,
                decreaseIndent: decreaseIndent,
                list: list,
                isUL: isUL,
                isOL: isOL
            };

            return statuses;

        },

        _updateToolbar: function(toolbarButtons, range)
        {
            var toolbarPlugin = this.viper.PluginManager.getPlugin('ViperToolbarPlugin');
            if (!toolbarPlugin) {
                return;
            }

            var tools = this.viper.Tools;

            var statuses = this._getButtonStatuses(range, true);
            if (!statuses) {
                for (var btn in toolbarButtons) {
                    tools.disableButton(toolbarButtons[btn]);
                    tools.setButtonInactive(toolbarButtons[btn]);
                }

                return;
            }

            if (statuses.ul === true) {
                tools.enableButton(toolbarButtons.ul);
                if (ViperUtil.isTag(statuses.list, 'ul') === true) {
                    tools.setButtonActive(toolbarButtons.ul);
                } else {
                    tools.setButtonInactive(toolbarButtons.ul);
                }
            } else {
                tools.disableButton(toolbarButtons.ul);
                tools.setButtonInactive(toolbarButtons.ul);
            }

            if (statuses.ol === true) {
                tools.enableButton(toolbarButtons.ol);
                if (ViperUtil.isTag(statuses.list, 'ol') === true) {
                    tools.setButtonActive(toolbarButtons.ol);
                } else {
                    tools.setButtonInactive(toolbarButtons.ol);
                }
            } else {
                tools.disableButton(toolbarButtons.ol);
                tools.setButtonInactive(toolbarButtons.ol);
            }

            if (statuses.increaseIndent === true) {
                tools.enableButton(toolbarButtons.indent);
            } else {
                tools.disableButton(toolbarButtons.indent);
            }

            if (statuses.decreaseIndent === true) {
                tools.enableButton(toolbarButtons.outdent);
            } else {
                tools.disableButton(toolbarButtons.outdent);
            }

        },

        _makeListButtonAction: function(list, listType)
        {
            var currentType = '';
            var newType     = '';
            if (!list) {
                currentType = listType;
            } else {
                currentType = ViperUtil.getTagName(list);
                if (listType !== currentType) {
                    if (currentType === 'ul') {
                        newType = 'ol';
                    } else {
                        newType = 'ul';
                    }
                } else {
                    newType = listType;
                }
            }

            if (currentType !== listType) {
                this.changeListType(newType);
                this.viper.contentChanged();
                return;
            } else if (currentType !== newType) {
                this.tabRange(null, false, false, listType);
            } else if (currentType === listType) {
                return this.convertRangeToParagraphs();
            } else {
                var bookmark = this.viper.createBookmark();
                if (bookmark.start.nextSibling && ViperUtil.isTag(bookmark.start.nextSibling, 'li') === true) {
                    ViperUtil.insertBefore(bookmark.start.nextSibling.firstChild, bookmark.start);
                }

                if (bookmark.end.previousSibling && ViperUtil.isTag(bookmark.end.previousSibling, 'li') === true) {
                    bookmark.end.previousSibling.appendChild(bookmark.end);
                }

                var pTags = this.listToParagraphs(list);
                this.viper.selectBookmark(bookmark);
                this.viper.contentChanged();
            }

        },

        _joinToList: function(listElem, elements, refNode)
        {
            var self = this;
            ViperUtil.foreach(elements, function(i) {
                var elem = elements[i];
                if (elem.parentNode !== listElem) {
                    // If elem is not a list item then create a new list item.
                    if (ViperUtil.isTag(elem, 'li') === false) {
                        elem = self._createListItem(elem);
                    }

                    if (elem) {
                        if (refNode) {
                            ViperUtil.insertAfter(refNode, elem);
                            refNode = elem;
                        } else {
                            listElem.appendChild(elem);
                        }
                    }
                }
            });

        },

        joinSiblingLists: function(list)
        {
            var listType = ViperUtil.getTagName(list);

            // Check if there is a same type list before this.
            for (var node = list.previousSibling; node; node = node.previousSibling) {
                if (node.nodeType === ViperUtil.TEXT_NODE && ViperUtil.isBlank(ViperUtil.trim(node.data)) === true) {
                    continue;
                } else if (ViperUtil.isTag(node, listType) === false) {
                    break;
                }

                // Found a previous list. Move its children to previous list.
                while (list.firstChild) {
                    node.appendChild(list.firstChild);
                }

                // Remove the original list element.
                ViperUtil.remove(list);
                list = node;
            }

            // Check if there is a list after this list.
            for (var node = list.nextSibling; node; node = node.nextSibling) {
                if (node.nodeType === ViperUtil.TEXT_NODE && ViperUtil.isBlank(ViperUtil.trim(node.data)) === true) {
                    continue;
                } else if (ViperUtil.isTag(node, listType) === false) {
                    break;
                }

                // Found a list. Move all the children of found list to the current list.
                while (node.firstChild) {
                    list.appendChild(node.firstChild);
                }

                // Remove the found list.
                ViperUtil.remove(node);
            }

            return list;

        },

        _getLineBreak: function(ref)
        {
            while (ref = ref.previousSibling) {
                if (ref.nodeType === ViperUtil.ELEMENT_NODE && ref.tagName.toLowerCase() === 'br') {
                    return ref;
                }
            }

            return null;

        },

        _getBlockParent: function(element, tag)
        {
            while (element && element !== this.viper.element) {
                if (ViperUtil.isBlockElement(element) === true) {
                    if (!tag || element.tagName.toLowerCase() === tag) {
                        return element;
                    }
                }

                element = element.parentNode;
            }

            return null;

        },

        _getCommonParents: function(elems)
        {
            // Clone array since it will be modified.
            elems = elems.concat([]);

            var parents = [];

            var eLen = elems.length;
            while (eLen > 0) {
                var elem = elems.shift();
                if (ViperUtil.isBlockElement(elem) === true) {
                    if (elem.tagName.toLowerCase() === 'ol' || elem.tagName.toLowerCase() === 'ul') {
                        // Add this list items as parents.
                        for (var listChild = elem.firstChild; listChild; listChild = listChild.nextSibling) {
                            parents.push(listChild);
                        }
                    } else {
                        parents.push(elem);
                    }
                } else {
                    while (elem) {
                        elem = elem.parentNode;
                        if (elem) {
                            if (elem === this.viper.element) {
                                break;
                            } else if (ViperUtil.isBlockElement(elem) === true) {
                                if (ViperUtil.inArray(elem, parents) === false) {
                                    parents.push(elem);
                                }

                                break;
                            }
                        }
                    }
                }//end if

                eLen = elems.length;
            }//end while

            return parents;

        },

        _makeList: function(tag, elements)
        {
            if (!elements) {
                return;
            }

            tag     = tag || 'ul';
            var eln = elements.length;

            if (eln <= 0) {
                return;
            }

            var list = document.createElement(tag);

            if (eln === 1) {
                // Check for BR tags to create list items out of those.
                // Note that the selection is ignored in this case. All BR tags
                // inside this single element will be used.
                var listItems = [];
                var listLen   = listItems.length;

                // First child might be null but we may have listItems to process.
                while (elements[0].firstChild || listLen > 0) {
                    var child = elements[0].firstChild;
                    if (child) {
                        listItems.push(child);
                    } else if (listItems.length > 0) {
                        var listItem = this._createListItem(listItems.shift());
                        if (listItem) {
                            list.appendChild(listItem);
                            while (listElem = listItems.shift()) {
                                listItem.appendChild(listElem);
                            }
                        }
                    }

                    if (child) {
                        ViperUtil.remove(child);
                    }

                    listLen = listItems.length;
                }

                ViperUtil.remove(elements[0]);
            } else {
                for (var i = 0; i < eln; i++) {
                    var listItem = this._createListItem(elements[i]);
                    if (listItem !== null) {
                        list.appendChild(listItem);
                    }
                }
            }//end if

            return list;

        },

        _createListItem: function(element)
        {
            if (!element || (element.nodeType === ViperUtil.TEXT_NODE && element.data.indexOf("\n") === 0 && ViperUtil.trim(element.data).length === 0)) {
                return null;
            }

            var li = document.createElement('li');

            // If the element is a block element then insert its children.
            if (ViperUtil.isBlockElement(element) === true) {
                if (element.childNodes && element.childNodes.length > 0) {
                    while (element.firstChild) {
                        if (element.firstChild.nodeType === ViperUtil.TEXT_NODE) {
                            if (ViperUtil.trim(element.firstChild.data).length <= 0) {
                                // Don't need empty text nodes.
                                ViperUtil.remove(element.firstChild);
                                continue;
                            }
                        }

                        li.appendChild(element.firstChild);
                    }
                }

                // Remove the empty element.
                ViperUtil.remove(element);

                // If the list element is still empty then dont return it.
                if (li.childNodes.length === 0) {
                    return null;
                }
            } else {
                li.appendChild(element);
            }//end if

            return li;

        },

        /**
         * Given an element it will return its list item (li) node.
         */
        _getListItem: function(element)
        {
            while (element && element !== this.viper.element) {
                if (element.tagName && element.tagName.toLowerCase() === 'li') {
                    return element;
                }

                element = element.parentNode;
            }

            return null;

        },

        _getListElement: function(element, incElement)
        {
            if (incElement === true && ViperUtil.isTag(element, ['ul', 'ol']) === true) {
                return element;
            }

            element = element.parentNode;
            while (element && element !== this.viper.element) {
                if (element.tagName) {
                    var tag = element.tagName.toLowerCase();
                    if (tag === 'ol' || tag === 'ul') {
                        return element;
                    }
                }

                element = element.parentNode;
            }

            return null;

        },

        _getValidParentElement: function(element)
        {
            if (!element || element === this.viper.getViperElement()) {
                return;
            }

            if (ViperUtil.isTag(element, ['p', 'td', 'ul', 'ol']) === true) {
                return element;
            }

            return this._getValidParentElement(element.parentNode);

        },

        _isWholeList: function(elems)
        {
            var sameParent = false;
            // If only 1 item is selected then it is under same parent.
            // If first item and last item are belong to the same list element
            // then they are under same parent.
            var parentList = null;
            if (elems.length > 1) {
                var first = elems[0];
                var last  = elems[(elems.length - 1)];

                if (ViperUtil.isTag(first.previousElementSibling, 'li') === true) {
                    return false;
                }

                var firstParent = first.parentNode;
                var lastParent  = last.parentNode;

                if (firstParent === lastParent) {
                    parentList = firstParent;
                    sameParent = true;
                } else {
                    for (var node = last.parentNode; last; node = node.parentNode) {
                        var tagName = ViperUtil.getTagName(node);
                        if (tagName !== 'li' && tagName !== 'ol' && tagName !== 'ul') {
                            break;
                        } else if (this.getNextItem(node)) {
                            break;
                        } else if (node === firstParent) {
                            return true;
                        }
                    }
                }
            } else if (elems[0]) {
                sameParent = true;
                parentList = elems[0].parentNode;
            } else {
                return;
            }

            if (sameParent === true) {
                var count = 0;
                var child = null;
                var last  = null;
                for (child = parentList.firstChild; child; child = child.nextSibling) {
                    if (ViperUtil.isTag(child, 'li') === true) {
                        if (count === 0 && child !== elems[0]) {
                            // Not the first LI of the list.
                            return false;
                        }

                        last = child;
                        count++;
                    }
                }

                if (last === elems[(elems.length - 1)]) {
                    return true;
                }
            }

            return false;

        },

        remove: function()
        {
            // Remove the toolbar buttons.
            ViperUtil.remove(this.viper.Tools.getItem('unorderedList').element);
            ViperUtil.remove(this.viper.Tools.getItem('orderedList').element);
            ViperUtil.remove(this.viper.Tools.getItem('indentList').element);
            ViperUtil.remove(this.viper.Tools.getItem('outdentList').element);

        }

    };
})(Viper.Util, Viper.Selection, Viper._);
