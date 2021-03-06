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
(function(ViperUtil, ViperSelection) {
    Viper.DOMRange = function(rangeObj)
    {
        this.rangeObj = rangeObj;

        /*
         * The container where the range starts.
         *
         * @type Node
         */
        this.startContainer = null;

        /*
         * The container where the range end.
         *
         * @type Node
         */
        this.endContainer = null;

        /*
         * The offset within the start container where the range starts.
         *
         * @type Integer (unsigned)
         */
        this.startOffset = 0;

        /*
         *  The offset within the end container where the range ends.
         *
         * @type Integer (unsigned)
         */
        this.endOffset = 0;

        /*
         * If TRUE the start and end points of the range are equal.
         *
         * @type boolean
         */
        this.collapsed = true;

        /*
         * The first parent element that is shared by the startContainer and
         * endContainer.
         *
         * @type Node
         */
        this.commonAncestorContainer = null;

        /*
         * If TRUE the anchor point will exist at the start of the range. Otherwise
         * it will exist at the end of the range.
         *
         * @type boolean
         */
        this.anchorToStart = 'undefined';

    }

    /*
     * Compares the start of a range with the start of another range.
     *
     * @type Integer
     * @see compareBoundaryPoints()
     */
    Viper.DOMRange.START_TO_START = 0;

    /*
     * Compares the start of a range with the end of another range.
     *
     * @type Integer
     * @see compareBoundaryPoints()
     */
    Viper.DOMRange.START_TO_END = 1;

    /*
     * Compares the end of a range with the end of another range.
     *
     * @type Integer
     * @see compareBoundaryPoints()
     */
    Viper.DOMRange.END_TO_END = 3;

    /*
     * Compares the end of a range with the start of another range.
     *
     * @type Integer
     * @see compareBoundaryPoints()
     */
    Viper.DOMRange.END_TO_START = 4;

    /*
     * Specifies the unit moved to be a chracter when used with moveStart() and moveEnd().
     */
    Viper.DOMRange.CHARACTER_UNIT = 'character';

    /*
     * Specifies the unit moved to be a word when used as an argument to moveStart()
     * and moveEnd().
     */
    Viper.DOMRange.WORD_UNIT = 'word';

    /*
     * Specifies the unit moved to be a line when used as an argument to moveStart()
     * and moveEnd().
     *
     * If the range ends in a text node, the range
     * will be moved to a point within the below line so that the end coordinates
     * are appropimately equal the start coordinates, unless the there is an insuffient
     * amount of text, in which case the end of the range will exist at the end
     * of the text below. If the range ends in a childless element, the end coords for
     * consequent selected lines will begin at approximately the same coordinates
     * as the left position of the element.
     *
     * @type Integer
     */
    Viper.DOMRange.LINE_UNIT = 'line';



    Viper.DOMRange.prototype = {

        /**
         * Moves the start point of the range to the offset within the specified node.
         *
         * @param Node    node   The node where the range should start.
         * @param Integer offset The offset within the node where the range should start.
         *
         * @return void
         * @throws RangeException, DomException
         */
        setStart: function(node, offset) {},

        /**
         * Moves the end point of the range to the offset within the specified node.
         *
         * @param Node    node   The node where the range should end.
         * @param Integer offset The offset within the node where the range should end.
         *
         * @return void
         * @throws RangeException, DomException
         */
        setEnd: function(node, offset) {},

        /**
         * Moves the start point of the range to before the specified node.
         *
         * @param Node node The node where the range should start before.
         *
         * @return void
         * @throws RangeException, DomException
         */
        setStartBefore: function(node) {},

        /**
         * Moves the start point of the range to after the specified node.
         *
         * @param Node node The node where the range should start after.
         *
         * @return void
         * @throws RangeException, DomException
         */
        setStartAfter: function(node) {},

        /**
         * Moves the end point of the range to before the specified node.
         *
         * @param Node node The node where the range should end before.
         *
         * @return void
         * @throws RangeException, DomException
         */
        setEndBefore: function(node) {},

        /**
         * Moves the end point of the range to after the specified node.
         *
         * @param Node node The node where the range should end after.
         *
         * @return void
         * @throws RangeException, DomException
         */
        setEndAfter: function(node) {},

        /**
         * Selects the node, including its element.
         *
         * @param Node node The node to be selected.
         *
         * @return void
         * @throws RangeException, DomException
         */
        selectNode: function(node) {},

        /**
         * Selects the node, excluding its element.
         *
         * @param Node node The node who's contents should be selected.
         *
         * @return void
         * @throws RangeException, DomException
         */
        selectNodeContents: function(node) {},

        /**
         * Selects the node, excluding its element.
         *
         * @param Node node The node who's contents should be selected.
         *
         * @return void
         * @throws RangeException, DomException
         */
        surroundContents: function(node) {},

        /**
         * Collapses the range to the start or end of the current boundary points.
         *
         * @param boolean toStart If TRUE the range will be collapsed the the start of
         *                        the range, otherwise it will be collapsed to the end
         *                        of the range.
         *
         * @return void
         * @throws DOMException
         */
        collapse: function(toStart) {},

        // Range Comparisons.
        /**
         * Compare the boundary-points of two Ranges in a document and returns
         * -1, 0 or 1 depending on whether the corresponding boundary-point of the
         * Range is respectively before, equal to, or after the corresponding
         * boundary-point of sourceRange.
         *
         * @param integer  how         A flag as to how to compare the boundary points
         *                             of the range, which should be one of
         *                             START_TO_START, END_TO_END, START_TO_END and
         *                             END_TO_START.
         * @param W3CRange sourceRange The source range to compare to this range.
         *
         * @return integer
         * @see W3CRange.START_TO_START
         * @see W3CRange.START_TO_END
         * @see W3CRange.END_TO_END
         * @see W3CRange.END_TO_START
         * @thows DOMException
         */
        compareBoundaryPoints: function(how, sourceRange) {},

        // Extract Content.
        /**
         * Deletes the contents within the current range.
         *
         * @return void
         * @throws DOMException
         */
        deleteContents: function() {},

        /**
         * Extracts the contents from the current document, returning the contents in
         * a document fragment.
         *
         * @return DocumentFragment
         * @throws DOMException
         */
        extractContents: function() {},

        /**
         * Clones the contents of the range, returning the content in a DocumentFragment
         * without modifying the current Viper.document.
         *
         * @return DocumentFragment.
         * @throws DOMException
         */
        cloneContents: function() {},

        // Inserting.
        /**
         * Inserts a node into the Document or DocumentFragment at the start of the Range.
         * If the container is a Text node, this will be split at the start of the Range
         * (as if the Text node's splitText method was performed at the insertion point)
         * and the insertion will occur between the two resulting Text nodes. Adjacent Text
         * nodes will not be automatically merged. If the node to be inserted is a
         * DocumentFragment node, the children will be inserted rather than the
         * DocumentFragment node itself.
         *
         * @param Node node The node to be inserted.
         *
         * @return void
         * @throws DOMException, RangeException
         */
        insertNode: function(node) {},

        // Misc.
        /**
         * Clones this range object and returns an exact copy.
         *
         * @return W3CRange.
         */
        cloneRange: function() {},

        /**
         * Returns the string contents of the selected text within the range. The contents
         * will not contain any markup.
         *
         * @return string
         */
        toString: function() {},

        /**
         * Detaches the range from the document releasing any resources used.
         *
         * @return void
         * @throws DOMException
         */
        detach: function() {},

        /*
         * Extensions the W3C Range, including some of the Internet Explorer Range
         * methods.
         */

        /**
         * Returns the DOMElement that is common between the start and end positions
         * of the range.
         *
         * @return DOMElement
         */
        getCommonElement: function () {},

        /**
         * Moves the start of the range using the specified unitType, by the specified
         * number of units. Defaults to Viper.DOMRange.CHARACTER_UNIT and units of 1.
         *
         * @param int unitType The unitType to move, which should be one of
         *                     Viper.DOMRange.CHARACTER_UNIT, Viper.DOMRange.WORD_UNIT or Viper.DOMRange.LINE_UNIT.
         * @param int units    The number of units to move. If positive the range will
         *                     be moved RIGHT for LTR languages, or LEFT or RTL languages.
         *
         * @return void
         */
        moveStart: function(unitType, units) {},

        /**
         * Moves the end of the range using the specified unitType, by the specified
         * number of units. Defaults to Viper.DOMRange.CHARACTER_UNIT and units of 1.
         *
         * @param int unitType The unitType to move, which should be one of
         *                     Viper.DOMRange.CHARACTER_UNIT, Viper.DOMRange.WORD_UNIT or Viper.DOMRange.LINE_UNIT.
         * @param int units    The number of units to move. If positive the range will
         *                     be moved RIGHT for LTR languages, or LEFT or RTL languages.
         *
         * @return void
         */
        moveEnd: function(unitType, units) {},

        /**
         * Sets the anchor point of the range to the start or end of the range. Once
         * the anchor point is set, the focus point becomes the other end of the range.
         *
         * @param boolean toStart If TRUE the anchor point will be set to the start
         *                        of the range, other the focus will be set the the
         *                        end.
         *
         * @see setFocus()
         * @see moveFocus()
         */
        setAnchor: function(toStart) {},

        /**
         * Sets the focus point to exist in the node at the specified offset. The
         * anchor point should be set using setAnchor before calling this method.
         *
         * @param DomNode node   The node where the focus should exist.
         * @param integer offset The offset within the node where the offset should
         *                       exist.
         *
         * @see setAnchor()
         * @see moveFocus()
         * @throws RangeException If no anchor point is set.
         */
        setFocus: function(node, offset) {},

        /**
         * Moves the focus point by the specified unitType by the number of specified
         * units. Defaults to Viper.DOMRange.CHARACTER_UNIT and units of 1.
         *
         * @param string unitType  The unitType to move, which should be one of
         *                         Viper.DOMRange.CHARACTER_UNIT, Viper.DOMRange.WORD_UNIT
         *                         or Viper.DOMRange.LINE_UNIT.
         * @param integer units    The number of units to move. If positive the range will
         *                         be moved RIGHT for LTR languages, or LEFT or RTL languages.
         *
         * @see setAnchor()
         * @see moveFocus()
         * @throws RangeException If no anchor point is set.
         */
        moveFocus: function(unitType, units) {},

        /**
         * Returns the coordinates where the range starts.
         *
         * If true, the start coodinates of the range will be return, otherwise the
         * end coordinates will be returned.
         *
         * @return Object[x, y]
         */
        getRangeCoords: function(toStart) {},

        /**
         * Returns the bounding rectangle for the range.
         *
         * @return Object[left, top, right, bottom]
         */
        getBoundingClientRect: function() {},

        /**
         * Returns the deepest previous container that the range can be extended to.
         * For example, if the previous container is an element that contains text nodes,
         * the the container's lastChild is returned.
         *
         * @param {DomNode} container        The current container.
         * @param {array}   skippedBlockElem Skipped block elements.
         *
         * @return The text container that range can extend to.
         * @type   {TextNode}
         */
        getPreviousContainer: function(container, skippedBlockElem, skipEmptyNodes, stubElementIsSelectable, stopAtBlockElement)
        {
            if (!container) {
                return null;
            }

            while (container.previousSibling) {
                container = container.previousSibling;
                if (container.nodeType !== ViperUtil.TEXT_NODE) {
                    if (ViperUtil.isStubElement(container) === true) {
                        return container;
                    } else {
                        var child = this._getLastSelectableChild(container, skipEmptyNodes, stubElementIsSelectable);
                        if (child !== null) {
                            return child;
                        }
                    }
                } else if (this._isSelectable(container) === true) {
                    return container;
                }
            }

            // Look at parents next sibling.
            while (container && !container.previousSibling) {
                container = container.parentNode;
            }

            if (!container) {
                return null;
            }

            if (stopAtBlockElement === true && ViperUtil.isBlockElement(container) === true) {
                return null;
            }

            container = container.previousSibling;
            if (this._isSelectable(container) === true) {
                return container;
            } else if (skippedBlockElem && ViperUtil.isBlockElement(container) === true) {
                skippedBlockElem.push(container);
            }

            if (container && container.nodeType !== ViperUtil.TEXT_NODE) {
                var selChild = this._getLastSelectableChild(container, skipEmptyNodes, stubElementIsSelectable);
                if (selChild !== null) {
                    return selChild;
                }
            }

            return this.getPreviousContainer(container, skippedBlockElem, skipEmptyNodes, stubElementIsSelectable);

        },

        _isSelectable: function(container)
        {
            if (container
                && container.nodeType === ViperUtil.TEXT_NODE
                && container.data.length !== 0
                && container.data.match(/^\n\s*$/) === null
            ) {
                return true;
            }

            return false;

        },

        /**
         * Returns the deepest next container that the range can be extended to.
         * For example, if the next container is an element that contains text nodes,
         * the the container's firstChild is returned.
         *
         * @param {DomNode} container        The current container.
         * @param {array}   skippedBlockElem Skipped block elements.
         *
         * @return The text container that range can extend to.
         * @type   {TextNode}
         */
        getNextContainer: function(container, skippedBlockElem, skipSpaceTextNodes, stubElementIsSelectable, stopAtBlockElement)
        {
            if (!container) {
                return null;
            }

            while (container.nextSibling) {
                container = container.nextSibling;
                if (container.nodeType !== ViperUtil.TEXT_NODE) {
                    var child = this._getFirstSelectableChild(container, stubElementIsSelectable);
                    if (child !== null) {
                        return child;
                    }
                } else if (this._isSelectable(container) === true) {
                    return container;
                }
            }

            // Look at parents next sibling.
            while (container && !container.nextSibling) {
                container = container.parentNode;
            }

            if (!container) {
                return null;
            }

            if (stopAtBlockElement === true && ViperUtil.isBlockElement(container) === true) {
                return null;
            }

            container = container.nextSibling;
            if (this._isSelectable(container) === true) {
                return container;
            } else if (skippedBlockElem && ViperUtil.isBlockElement(container) === true) {
                skippedBlockElem.push(container);
            }

            var selChild = this._getFirstSelectableChild(container, stubElementIsSelectable);
            if (selChild !== null
                && ((stubElementIsSelectable === true && ViperUtil.isTag(selChild, 'br') === true)
                || (skipSpaceTextNodes !== true || ViperUtil.trim(selChild.data) !== ''))
            ) {
                if (selChild.nodeType !== ViperUtil.TEXT_NODE || selChild.data.charCodeAt(0) !== 10) {
                    return selChild;
                }
            }

            return this.getNextContainer(container, skippedBlockElem, skipSpaceTextNodes, stubElementIsSelectable);

        },

        _getFirstSelectableChild: function(element, stubElementIsSelectable)
        {
            if (element) {
                if (element.nodeType !== ViperUtil.TEXT_NODE) {
                    var child = element.firstChild;
                    while (child) {
                        if (ViperUtil.attr(child, 'contenteditable') === 'false') {
                            // Create a new text node if this element is not editable.
                            var newNode = document.createTextNode('');
                            ViperUtil.insertBefore(child, newNode);
                            return newNode;
                        } else if (this._isSelectable(child) === true || (stubElementIsSelectable === true && ViperUtil.isStubElement(child) === true)) {
                            return child;
                        } else if (child.firstChild) {
                            // This node does have child nodes.
                            var res = this._getFirstSelectableChild(child, stubElementIsSelectable);
                            if (res !== null) {
                                return res;
                            } else {
                                child = child.nextSibling;
                            }
                        } else {
                            child = child.nextSibling;
                        }
                    }
                } else {
                    // Given element is a text node so return it.
                    return element;
                }//end if
            }//end if

            return null;

        },

        _getLastSelectableChild: function(element, skipEmptyNodes, stubElementIsSelectable)
        {
            if (element) {
                if (element.nodeType !== ViperUtil.TEXT_NODE) {
                    var child = element.lastChild;
                    while (child) {
                        if (ViperUtil.attr(child, 'contenteditable') === 'false') {
                            // Create a new text node if this element is not editable.
                            var newNode = document.createTextNode('');
                            ViperUtil.insertAfter(child, newNode);
                            return newNode;
                        } else if (this._isSelectable(child) === true || (stubElementIsSelectable === true && ViperUtil.isStubElement(child) === true)) {
                            return child;
                        } else if (child.lastChild) {
                            // This node does have child nodes.
                            var res = this._getLastSelectableChild(child, skipEmptyNodes, stubElementIsSelectable);
                            if (res !== null) {
                                return res;
                            } else {
                                child = child.previousSibling;
                            }
                        } else {
                            child = child.previousSibling;
                        }
                    }
                } else {
                    if (skipEmptyNodes !== true || element.data.match(/^\n\s*$/) === null) {
                        // Given element is a text node so return it.
                        return element;
                    }
                }//end if
            }//end if

            return null;

        },

        moveCaretAway: function(sourceElement, parentElement, defaultTagName, back)
        {
            var next       = true;
            var selectable = null;

            if (back === true) {
                next = false;
                selectable = this.getPreviousContainer(sourceElement, null, true, true);
                if (!selectable || (selectable !== parentElement && ViperUtil.isChildOf(selectable, parentElement) === false) === true) {
                    next       = true;
                    selectable = this.getNextContainer(sourceElement, null, true, true);
                }
            } else {
                selectable = this.getNextContainer(sourceElement, null, true, true);
                if (!selectable || (selectable !== parentElement && ViperUtil.isChildOf(selectable, parentElement) === false) === true) {
                    next       = false;
                    selectable = this.getPreviousContainer(sourceElement, null, true, true);
                }
            }

            if (!selectable || (selectable !== parentElement && ViperUtil.isChildOf(selectable, parentElement) === false) === true) {
                // Create a new default container.
                var defTag = null;
                if (defaultTagName !== '') {
                    defTag = document.createElement(defaultTagName);
                    ViperUtil.setHtml(defTag, '<br/>');
                } else {
                    defTag = document.createTextNode(' ');
                }

                ViperUtil.insertAfter(sourceElement, defTag);
                this.setStart(defTag, 0);
                this.collapse(true);
                ViperSelection.addRange(this);
                return false;
            } else if (next === true || selectable.nodeType !== ViperUtil.TEXT_NODE) {
                this.setStart(selectable, 0);
                this.collapse(true);
            } else {
                this.setStart(selectable, selectable.data.length);
                this.collapse(true);
            }

            ViperSelection.addRange(this);
            return this;

        },

        _normalizeNode: function(node)
        {
            // Joins all sibling text elements.
            if (node.nodeType === ViperUtil.ELEMENT_NODE) {
                var c      = node.childNodes.length;
                var str    = '';
                var mChild = null;
                for (var i = 0; i < c; i++) {
                    var child = node.childNodes[i];
                    if (child.nodeType === ViperUtil.TEXT_NODE) {
                        str += child.data;
                        if (mChild === null) {
                            mChild = child;
                        } else {
                            // Remove this node.
                            ViperUtil.remove(child);
                        }
                    } else if (mChild !== null) {
                        mChild.data = str;
                        mCHild      = null;
                    }
                }

                if (mChild !== null) {
                    mChild.nodeValue = str;
                }
            } else if (node.nodeType === ViperUtil.TEXT_NODE) {
                this._normalizeNode(node.parentNode);
            }//end if

        },

        getNodeIndex: function(node)
        {
            if (!node || !node.parentNode) {
                return;
            }

            var index = 0;
            var prev  = node.previousSibling;

            while (prev) {
                prev = prev.previousSibling;
                index++;
            }

            return index;

        },

        getStartNode: function()
        {
            if (!this.startContainer) {
                return null;
            }

            if (this.startContainer.nodeType === ViperUtil.ELEMENT_NODE) {
                var ln = this.startContainer.childNodes.length;
                if (ln > this.startOffset) {
                    return this.startContainer.childNodes[this.startOffset];
                } else if (ln === this.startOffset && ViperUtil.isStubElement(this.startContainer.childNodes[this.startOffset - 1]) === true) {
                    // When the last child is a stub element (e.g. img) and range is set after it the offset becomes greater
                    // than the number of children.
                    return this.startContainer.childNodes[this.startOffset - 1];
                } else if (ln > 0 && ln === this.startOffset && this.startContainer.childNodes[this.startOffset - 1].nodeType !== ViperUtil.TEXT_NODE && this.collapsed === true) {
                    return this._getLastSelectableChild(this.startContainer.childNodes[this.startOffset - 1]);
                }
            }

            return this.startContainer;

        },

        getEndNode: function()
        {
            if (!this.endContainer) {
                return null;
            }

            if (this.endContainer.nodeType === ViperUtil.ELEMENT_NODE) {
                var ln = this.endContainer.childNodes.length;
                if (ln > this.endOffset) {
                    return this.endContainer.childNodes[this.endOffset];
                } else if (ln === this.endOffset && ln !== 0) {
                    var lastChild = this.endContainer.childNodes[this.endOffset - 1];
                    if (ViperUtil.isStubElement(lastChild) === true) {
                        // When the last child is a stub element (e.g. img) and range is set after it the offset becomes greater
                        // than the number of children.
                        return this.endContainer.childNodes[this.endOffset - 1];
                    } else if (lastChild.nodeType === ViperUtil.ELEMENT_NODE
                        && lastChild.lastChild.nodeType === ViperUtil.TEXT_NODE
                        && this.startContainer.nodeType === ViperUtil.TEXT_NODE
                    ) {
                        return lastChild.lastChild;
                    } else if (ln > 0 && ln === this.endOffset && this.endContainer.childNodes[this.endOffset - 1].nodeType !== ViperUtil.TEXT_NODE && this.collapsed === true) {
                        return this._getLastSelectableChild(this.endContainer.childNodes[this.endOffset - 1]);
                    }
                }
            }

            return this.endContainer;

        },

        /**
         * Caching for the getNodeSelection method.
         */
        _nodeSel: {},

        /**
         * Clears the getNodeSelection() method cache.
         */
        clearNodeSelectionCache: function()
        {
            this._nodeSel = {};
        },

        getNodeSelection: function(range, forceUpdate)
        {
            range = range || this;

            if (forceUpdate !== true
                && this._nodeSel
                && this._nodeSel.startContainer === range.startContainer
                && this._nodeSel.endContainer === range.endContainer
                && this._nodeSel.startOffset === range.startOffset
                && this._nodeSel.endOffset === range.endOffset
                && this._nodeSel.collapsed === range.collapsed
                && this._nodeSel.commonAncestor === range.commonAncestorContainer
                && this._nodeSel.startNode === range.getStartNode()
                && this._nodeSel.endNode === range.getEndNode()
            ) {
                return this._nodeSel.node;
            }

            this._nodeSel.startContainer = range.startContainer;
            this._nodeSel.endContainer   = range.endContainer;
            this._nodeSel.startOffset    = range.startOffset;
            this._nodeSel.endOffset      = range.endOffset;
            this._nodeSel.collapsed      = range.collapsed;
            this._nodeSel.startNode      = range.getStartNode();
            this._nodeSel.endNode        = range.getEndNode();
            this._nodeSel.commonAncestor = range.commonAncestorContainer;
            this._nodeSel.node           = null;

            // Webkit seems to get the range incorrectly when range is set on a node.
            // For example: <p>text</p><p>text</p> if the range.selectNode is called for
            // the first P then the next getCurrentRange call returns range start as
            // first P and range end as before the first character of the next 2nd P tag.
            var startNode = range.getStartNode();
            var endNode   = range.getEndNode();
            var common    = range.getCommonElement();

            if (!startNode && !endNode) {
                this._nodeSel.node = null;
                return null;
            } else if (startNode
                && endNode
                && startNode === endNode
                && startNode.nodeType !== ViperUtil.TEXT_NODE
                && range.startOffset === range.endOffset
                && this.startContainer.childNodes.length >= range.startOffset
                && ViperUtil.isStubElement(startNode) === false
            ) {
                // Case: <p><img />*</p> and a character is typed. It should not return img as selected.
                this._nodeSel.node = null;
                return null;
            } else if (startNode
                && endNode
                && startNode === endNode
                && startNode.nodeType !== ViperUtil.TEXT_NODE
                && (range.startOffset + 1) === range.endOffset
                && this.startContainer.childNodes.length >= range.startOffset
            ) {
                // Case: <p>[<img />]</p>. Image clicked.
                this._nodeSel.node = startNode;
                return startNode;
            } else if (startNode
                && endNode
                && startNode.nodeType === ViperUtil.ELEMENT_NODE
                && endNode.nodeType === ViperUtil.ELEMENT_NODE
                && startNode !== endNode
                && endNode === common
                && !startNode.nextElementSibling
                && ((range.startOffset + 1) === range.endOffset)
            ) {
                // Last element in the container however the range start node is the last element but end node is the common
                // parent with endOffset = startOffset + 1.
                this._nodeSel.node = startNode;
                return startNode;
            } else if (startNode && !endNode) {
                if (startNode.nodeType === ViperUtil.TEXT_NODE) {
                    if (range.endContainer.nodeType === ViperUtil.ELEMENT_NODE
                        && range.endOffset >= range.endContainer.childNodes.length
                        && startNode.nodeType === ViperUtil.TEXT_NODE
                        && range.startOffset === 0
                        && range.endContainer === range.commonAncestorContainer
                        && (common.firstChild === startNode || this._getFirstSelectableChild(common) === startNode)
                    ) {
                        // Selection starts from the start of the first editable element to the end of the
                        // common element, make the selected node as the common element.
                        this._nodeSel.node = range.commonAncestorContainer;
                        return this._nodeSel.node;
                    } else if (this._nodeSel.startOffset === startNode.data.length
                        && startNode.nextSibling
                        && startNode.nextSibling.nodeType === ViperUtil.ELEMENT_NODE
                        && this._nodeSel.endContainer.childNodes.length === this._nodeSel.endOffset
                        && this._nodeSel.endContainer.childNodes[(this._nodeSel.endOffset - 1)] === startNode.nextSibling
                    ) {
                        // Inline element selection at the end of a block element (IE).
                        this._nodeSel.node = startNode.nextSibling;
                        return this._nodeSel.node;
                    } else if (ViperUtil.trim(startNode.data) === '') {
                        this._nodeSel.node = null;
                        return null;
                    } else {
                        this._nodeSel.node = null;
                        return null;
                    }
                } else if (startNode.nodeType === ViperUtil.ELEMENT_NODE
                    && this.endContainer === this.startContainer
                    && this.startOffset === 0
                    && this.endOffset >= this.endContainer.childNodes.length
                ) {
                    if (this.endOffset === 1 && this.endContainer.childNodes.length === 1) {
                        // Singe element exists in the container.
                        startNode = this.endContainer.childNodes[0];
                    } else {
                        startNode = this.endContainer;
                    }
                }

                this._nodeSel.node = startNode;
                return startNode;
            } else if (!startNode && endNode) {
                this._nodeSel.node = endNode;
                return endNode;
            } else if (startNode.nodeType === ViperUtil.TEXT_NODE
                && endNode.nodeType === ViperUtil.TEXT_NODE
                && startNode === endNode
                && range.startOffset === 0
                && range.endOffset === endNode.data.length
                && range.collapsed === false
                && endNode.nextSibling
                && (!ViperUtil.isTag(endNode.nextSibling, 'br') || endNode.nextSibling.nextSibling)
            ) {
                this._nodeSel.node = null;
                return null;
            } else if (startNode.nodeType === ViperUtil.TEXT_NODE
                && endNode.nodeType === ViperUtil.TEXT_NODE
                && startNode === endNode
                && range.startOffset === startNode.data.length
                && range.collapsed === true
            ) {
                // Image Selection checks for IE.
                if (ViperUtil.isBrowser('msie', '<11') === true
                    && startNode.nextSibling
                    && ViperUtil.isTag(startNode.nextSibling, 'img') === true
                    && endNode.previousSibling
                    && ViperUtil.isTag(startNode.previousSibling, 'img') === true
                    && range.endOffset === 0
                    && range.startOffset === 0
                ) {
                    this._nodeSel.node = startNode.nextSibling;
                    return this._nodeSel.node;
                } else if (ViperUtil.isBrowser('msie', '<11') === true
                    && startNode.nextSibling
                    && ViperUtil.isTag(startNode.nextSibling, 'img') === true
                    && endNode === startNode
                    && range.endOffset === 0
                    && range.startOffset === 0
                ) {
                    this._nodeSel.node = startNode.nextSibling;
                    return this._nodeSel.node;
                }

                this._nodeSel.node = null;
                return null;
            } else if (startNode.nodeType === ViperUtil.ELEMENT_NODE
                && range.endContainer.nodeType === ViperUtil.ELEMENT_NODE
                && startNode.nextSibling === endNode
            ) {
                this._nodeSel.node = startNode;
                return startNode;
            } else if (startNode.nodeType === ViperUtil.TEXT_NODE
                && endNode.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === 0
                && range.endOffset === endNode.data.length
                && this._getFirstSelectableChild(common) === startNode
                && this._getLastSelectableChild(common) === endNode
            ) {
                this._nodeSel.node = common;
                return common;
            } else if (range.startContainer === range.endContainer
                && range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                && range.startOffset === 0
                && range.endOffset === 0
                && (range.startContainer.childNodes.length === 0
                || (range.startContainer.childNodes.length === 1
                    && ViperUtil.isStubElement(range.startContainer.childNodes[0]) === false
                    && (range.startContainer.childNodes[0].nodeType !== ViperUtil.TEXT_NODE || range.startContainer.childNodes[0].data.length === 0)))
            ) {
                this._nodeSel.node = range.startContainer;
                return range.startContainer;
            } else if (startNode.nodeType === ViperUtil.ELEMENT_NODE
                && endNode.nodeType === ViperUtil.TEXT_NODE
                && range.endOffset === endNode.data.length
                && this._getLastSelectableChild(startNode) === endNode
            ) {
                this._nodeSel.node = startNode;
                return startNode;
            } else if (startNode.nodeType === ViperUtil.TEXT_NODE
                && endNode.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === 0
                && range.endOffset === endNode.data.length
                && range.commonAncestorContainer
                && range.commonAncestorContainer.nodeType === ViperUtil.ELEMENT_NODE
                && this._getFirstSelectableChild(range.commonAncestorContainer) === startNode
                && this._getLastSelectableChild(range.commonAncestorContainer) === endNode
            ) {
                this._nodeSel.node = range.commonAncestorContainer;
                return range.commonAncestorContainer;
            } else if (startNode.nodeType === ViperUtil.TEXT_NODE
                && endNode.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === 0
                && range.endOffset === endNode.data.length
                && common
                && this._getFirstSelectableChild(common) === startNode
                && this._getLastSelectableChild(common) === endNode
            ) {
                this._nodeSel.node = common;
                return common;
            } else if (ViperUtil.isBrowser('chrome') === true
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === 0
                && range.endOffset === 0
                && range.endContainer.nodeType === ViperUtil.ELEMENT_NODE
                && ViperUtil.isBlockElement(range.endContainer) === true
                && this._getFirstSelectableChild(ViperUtil.getFirstBlockParent(startNode)) === startNode
                && this.getNextContainer(ViperUtil.getFirstBlockParent(startNode), null, false, true) === range._getFirstSelectableChild(range.endContainer)
            ) {
                this._nodeSel.node = ViperUtil.getFirstBlockParent(startNode);
                return this._nodeSel.node;
            } else if (startNode !== endNode
                && startNode.nodeType === ViperUtil.TEXT_NODE
                && endNode.nodeType === ViperUtil.ELEMENT_NODE
                && this.endOffset === 0
                && this.endContainer.nodeType === ViperUtil.ELEMENT_NODE
                && this._getFirstSelectableChild(this.endContainer) === startNode
                && ViperUtil.isBrowser('msie', '<11') === true
            ) {
                this._nodeSel.node = this.endContainer;
                return this._nodeSel.node;
            } else if (endNode !== startNode
                && endNode === common
                && (startNode === common.firstElementChild || startNode === common.firstChild)
                && range.startOffset === 0
            ) {
                // <div>[<p><em>text</em></p><p><em>text</em></p>]</div>.
                this._nodeSel.node = common;
                return this._nodeSel.node;
            } else if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === range.startContainer.data.length
                && range.endContainer.nodeType === ViperUtil.ELEMENT_NODE
                && range.endOffset === 1
                && ViperUtil.isBlockElement(range.endContainer) === false
            ) {
                // (IE) Handling drag selection of EM tag in this case:
                // <p>test [<em><a href="..">test</a></em>] text</p>.
                // Need to select the most inner child.
                var surroundedChildren = ViperUtil.getSurroundedChildren(range.endContainer);
                var selNode            = range.endContainer;
                if (surroundedChildren.length > 0) {
                    selNode = surroundedChildren.pop();
                }

                this._nodeSel.node = selNode;
                return this._nodeSel.node;
            } else if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === range.startContainer.data.length
                && range.endContainer.nodeType === ViperUtil.ELEMENT_NODE
                && range.endOffset === range.endContainer.childNodes.length
                && ViperUtil.isText((range.endContainer.childNodes[range.endContainer.childNodes.length - 1]).previousSibling) === true
            ) {
                // <p>text[<img />]</p>.
                this._nodeSel.node = range.endContainer.childNodes[range.endContainer.childNodes.length - 1];
                return this._nodeSel.node;
            } else if (range.startContainer.nodeType === ViperUtil.TEXT_NODE
                && range.endContainer.nodeType === ViperUtil.TEXT_NODE
                && range.startOffset === range.startContainer.data.length
                && range.endOffset === 0
                && range.startContainer.nextSibling === range.endContainer.previousSibling
                && range.startContainer.nextSibling.nodeType === ViperUtil.ELEMENT_NODE
            ) {
                this._nodeSel.node = range.startContainer.nextSibling;
                return this._nodeSel.node;
            } else if (range.startContainer.nodeType === ViperUtil.ELEMENT_NODE
                && range.startContainer.childNodes[range.startOffset]
                && range.startContainer.childNodes[range.startOffset].nodeType === ViperUtil.ELEMENT_NODE
                && range.endContainer.nodeType === ViperUtil.TEXT_NODE
                && range.endOffset === 0
                && range.endContainer.previousSibling === range.startContainer.childNodes[range.startOffset]
            ) {
                this._nodeSel.node = range.endContainer.previousSibling;
                return this._nodeSel.node;
            } else if (ViperUtil.isText(startNode) === true
                && range.startOffset === startNode.data.length
                && ViperUtil.isElement(range.endContainer) === true
                && ViperUtil.isText(range.endContainer.childNodes[range.endOffset]) === true
                && ViperUtil.isElement(startNode.nextSibling) === true
                && startNode.nextSibling.nextSibling === range.endContainer.childNodes[range.endOffset]
            ) {
                // Case: <p>text [<span>text</span>] more text.
                // range endContainer actually is the P instead of the ' more text' text node.
                this._nodeSel.node = startNode.nextSibling;
                return this._nodeSel.node;
            } else if (ViperUtil.isText(startNode) === true
                && range.startOffset === 0
                && ViperUtil.isElement(range.endContainer) === true
                && !startNode.previousSibling
                && ViperUtil.isText(range.endContainer.childNodes[range.endOffset]) === true
                && startNode.parentNode.nextSibling === range.endContainer.childNodes[range.endOffset]
            ) {
                this._nodeSel.node = startNode.parentNode;
                return this._nodeSel.node;
            } else if (ViperUtil.isBrowser('msie') === true) {
                // IE specific checks.
                if (range.startOffset === 0) {
                    if (ViperUtil.isText(range.startContainer) === true) {
                        if (ViperUtil.isElement(range.endContainer) === true) {
                            if (!range.startContainer.previousSibling
                                && startNode === endNode
                                && !startNode.nextSibling
                            ) {
                                // Case: <p>text <em>[text</em>]</p>.
                                this._nodeSel.node = startNode.parentNode;
                                return this._nodeSel.node;
                            }
                        }
                    }
                }
            }

            // We may need to adjust the "startNode" depending on its offset.
            var startMoved = null;
            if (startNode.nodeType === ViperUtil.TEXT_NODE) {
                if (range.startOffset !== 0) {
                    if (range.startOffset !== startNode.data.length) {
                        this._nodeSel.node = null;
                        return null;
                    } else {
                        // Range is at the end of a text node, find the first selectable
                        // node in the next siblong and change the startNode to that.
                        if (startNode.nextSibling) {
                            startNode = this._getFirstSelectableChild(startNode.nextSibling);
                            if (!startNode) {
                                this._nodeSel.node = null;
                                return null;
                            }
                        } else {
                            startMoved = {
                                startContainer: this.startContainer,
                                startOffset: this.startOffset
                            };

                            // There is no sibling move range by 1 char.
                            this.moveStart(Viper.DOMRange.CHARACTER_UNIT, 1);
                            startNode = range.getStartNode();
                        }
                    }
                }
            } else if (startNode.nodeType === ViperUtil.ELEMENT_NODE
                && endNode.nodeType === ViperUtil.ELEMENT_NODE
                && common === startNode
            ) {
                this._nodeSel.node = startNode;
                return startNode;
            }

            if (startNode.previousSibling) {
                if (startNode.previousSibling.nodeType !== ViperUtil.TEXT_NODE
                    || startNode.previousSibling.data.length !== 0
                ) {
                    if (startMoved) {
                        this.setStart(startMoved.startContainer, startMoved.startOffset);
                    } else if (ViperUtil.isBrowser('msie', '<11') === true) {
                        if (startNode.parentNode === endNode && range.startOffset + 1 === range.endOffset) {
                            // Handle <div><p>text</p>*<blockquote><p>text</p></blockquote>*</div>.
                            this._nodeSel.node = startNode;
                            return startNode;
                        }
                    }

                    this._nodeSel.node = null;
                    return null;
                }
            }

            if (endNode.nodeType === ViperUtil.TEXT_NODE) {
                if (range.endOffset !== 0) {
                    if (range.endOffset === endNode.data.length
                        && !endNode.nextSibling
                        && (startNode.parentNode === endNode.parentNode
                        || this._getLastSelectableChild(startNode.parentNode) === endNode)
                    ) {
                        this._nodeSel.node = startNode.parentNode;
                        return startNode.parentNode;
                    } else {
                        this._nodeSel.node = null;
                        return null;
                    }
                }
            } else if (!endNode.nextSibling && ViperUtil.isTag(endNode, 'br') === true) {
                // Handle Firefox _moz_dirty at the end of an element.
                if (this._getLastSelectableChild(startNode.parentNode) === endNode.previousSibling) {
                    this._nodeSel.node = startNode.parentNode;
                    return startNode.parentNode;
                }
            }

            this._nodeSel.node = null;
            return null;

        }

    };

})(Viper.Util, Viper.Selection);
