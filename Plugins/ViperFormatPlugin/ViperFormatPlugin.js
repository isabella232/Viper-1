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

function ViperFormatPlugin(viper)
{
    this.viper = viper;

    this.styleTags = {
        h1: _('Heading 1'),
        h2: _('Heading 2'),
        h3: _('Heading 3'),
        h4: _('Heading 4'),
        h5: _('Heading 5'),
        h6: _('Heading 6'),
        p: _('Paragraph'),
        pre: _('Preformatted'),
        address: _('Address'),
        blockquote: _('Quote')
    };

    this.toolbarPlugin  = null;
    this.activeStyles   = [];
    this._range         = null;
    this._inlineToolbar = null;

    this._inlineToolbarActiveSubSection = null;

    this.initInlineToolbar();

}

ViperFormatPlugin.prototype = {

    init: function()
    {
        var self = this;

        // Main toolbar.
        this.toolbarPlugin = this.viper.ViperPluginManager.getPlugin('ViperToolbarPlugin');
        if (this.toolbarPlugin) {
            this._createToolbarContent();
        }

        this.viper.registerCallback('ViperTableEditorPlugin:initToolbar', 'ViperFormatPlugin', function(data) {
            self._createTableEditorContent(data.toolbar, data.type);
        });

        this.viper.registerCallback('ViperTableEditorPlugin:updateToolbar', 'ViperFormatPlugin', function(data) {
            self._updateTableEditorContent(data);
        });

        ViperChangeTracker.addChangeType('textFormatChange', 'Formatted', 'format');
        ViperChangeTracker.setDescriptionCallback('textFormatChange', function(node) {
            var format = self._getFormat(node);
            return self.styleTags[format];
        });

        ViperChangeTracker.setApproveCallback('textFormatChange', function(clone, node) {
            ViperChangeTracker.removeTrackChanges(node);
        });

        ViperChangeTracker.setRejectCallback('textFormatChange', function(clone, node) {
            // Remove all nodes insede the specified node before it
            // or to a new P tag if the parent is the top element.
            if (node.parentNode === self.viper.element) {
                var elem = document.createElement('p');
                while (node.firstChild) {
                    elem.appendChild(node.firstChild);
                }

                dfx.insertBefore(node, elem);
            } else {
                while (node.firstChild) {
                    dfx.insertBefore(node, node.firstChild);
                }
            }

            // Remove node.
            dfx.remove(node);
        });

    },

    _getHeadingsSection: function(prefix)
    {
        var self   = this;
        var tools  = this.viper.ViperTools;

        // Headings format section.
        var headingsSubSection = document.createElement('div');

        var headingBtnGroup = tools.createButtonGroup(prefix + 'headingFormats');
        headingsSubSection.appendChild(headingBtnGroup);

        for (var i = 1; i <= 6; i++) {
            (function(headingCount) {
                tools.createButton(prefix + 'heading:h' + headingCount, 'H' + headingCount, dfx.sprintf(_('Convert to Heading %s'), headingCount), null, function() {
                    self.handleFormat('h' + headingCount);
                });
                tools.addButtonToGroup(prefix + 'heading:h' + headingCount, prefix + 'headingFormats');
            }) (i);
        }//end for

        return headingsSubSection;

    },

    _getFormatsSection: function(prefix)
    {
        var self   = this;
        var tools  = this.viper.ViperTools;

        var formatsSubSection = document.createElement('div');
        var formatButtons = {
            p: 'P',
            div: 'DIV',
            blockquote: 'Quote',
            pre: 'PRE'
        };

        for (var tag in formatButtons) {
            (function(tagName) {
                var button = tools.createButton(prefix + 'formats:' + formatButtons[tagName], formatButtons[tagName], dfx.sprintf(_('Convert to %s'), formatButtons[tagName]), null, function() {
                    self.handleFormat(tagName);
                });
                formatsSubSection.appendChild(button);
            })
            (tag);
        }

        return formatsSubSection;

    },

    _getAnchorSection: function(prefix)
    {
        var self  = this;
        var tools = this.viper.ViperTools;

        var anchorSubContent = document.createElement('div');
        var idTextbox = tools.createTextbox(prefix + 'anchor:input', _('ID'), '');
        anchorSubContent.appendChild(idTextbox);

        return anchorSubContent;

    },

    _getClassSection: function(prefix, element)
    {
        var self  = this;
        var tools = this.viper.ViperTools;

        var classSubContent = document.createElement('div');
        var classTextbox = tools.createTextbox(prefix + 'class:input', _('Class'), '');
        classSubContent.appendChild(classTextbox);

        return classSubContent;

    },

    _getToolbarContents: function(toolbarType)
    {
        var prefix = 'ViperFormatPlugin:' + toolbarType + ':';

        return {
            headings: this._getHeadingsSection(prefix),
            formats: this._getFormatsSection(prefix),
            anchor: this._getAnchorSection(prefix),
            cssClass: this._getClassSection(prefix)
        }

    },

    getNodeWithAttributeFromRange: function(attributeName, node)
    {
        if (!attributeName) {
            return null;
        }

        var range        = this.viper.getViperRange();
        var selectedNode = node || range.getNodeSelection();
        if (selectedNode
            && selectedNode.nodeType === dfx.ELEMENT_NODE
            && selectedNode !== this.viper.getViperElement()
            && dfx.hasAttribute(selectedNode, attributeName) === true
        ) {
            return selectedNode;
        }

        return null;

    },

    _getAttributeValue: function(attribute, node)
    {
        node = this.getNodeWithAttributeFromRange(attribute, node);
        if (node) {
            return node.getAttribute(attribute);
        }

        return '';

    },

    getTagFromRange: function(range, tagNames)
    {
        var c = tagNames.length;

        var selectedNode = range.getNodeSelection();
        if (selectedNode && selectedNode.nodeType === dfx.ELEMENT_NODE) {
            if (selectedNode === this.viper.getViperElement()) {
                return null;
            }

            for (var i = 0; i < c; i++) {
                if (dfx.isTag(selectedNode, tagNames[i]) === true) {
                    return selectedNode;
                }
            }
        }

        var viperElem = this.viper.getViperElement();
        var common    = range.getCommonElement();
        while (common) {
            if (common === viperElem) {
                return null;
            }

            for (var i = 0; i < c; i++) {
                if (dfx.isTag(common, tagNames[i]) === true) {
                    return common;
                }
            }

            if (dfx.isBlockElement(common) === true) {
                break;
            }

            common = common.parentNode;
        }

        return null;

    },

    getCommonFormatElement: function(range)
    {
        range = range || this.viper.getViperRange();

        var startNode = range.getStartNode();
        var endNode   = range.getEndNode();
        var common    = range.getCommonElement();

        if (!endNode) {
            endNode = startNode;
        }

        if (dfx.isChildOf(common, this.viper.getViperElement()) === false) {
            return null;
        }

        var startParents = dfx.getParents(startNode, null, common, true);
        var endParents   = dfx.getParents(endNode, null, common, true);

        var startTopParent = common;
        var endTopParent   = common;
        if (startParents.length > 0) {
            startTopParent = startParents[startParents.length - 1];
        }

        if (endParents.length > 0) {
            endTopParent = endParents[endParents.length - 1];
        }

        if (startTopParent === endTopParent) {
            return common;
        }

        var first = false;
        var last  = null;
        for (var node = common.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === dfx.TEXT_NODE) {
                continue;
            } else if (node === startTopParent) {
                first = true;
            } else if (first !== true) {
                return null;
            }

            last = node;
        }

        if (last !== endTopParent) {
            return null;
        }

        return common;

    },

    initInlineToolbar: function()
    {
        var self = this;
        this.viper.registerCallback('ViperInlineToolbarPlugin:initToolbar', 'ViperFormatPlugin', function(toolbar) {
            self.createInlineToolbar(toolbar);
        });
        this.viper.registerCallback('ViperInlineToolbarPlugin:updateToolbar', 'ViperFormatPlugin', function(data) {
            self.updateInlineToolbar(data);
        });

    },

    createInlineToolbar: function(toolbar)
    {
        var tools  = this.viper.ViperTools;
        var prefix = 'ViperFormatPlugin:vitp:';
        var self   = this;

        this._inlineToolbar = this.viper.getPluginManager().getPlugin('ViperInlineToolbarPlugin');

        // Headings format section.
        var headingsSubSection = toolbar.makeSubSection(prefix + 'heading:subSection', this._getHeadingsSection(prefix));

        // Formats section.
        var formatsSubSection = toolbar.makeSubSection(prefix + 'formats:subSection', this._getFormatsSection(prefix));

        var buttonGroup = tools.createButtonGroup(prefix + 'formatsAndHeading:buttons');
        toolbar.addButton(buttonGroup);

        tools.createButton('vitpFormats', '', _('Toggle Formats'), 'Viper-formats');
        tools.addButtonToGroup('vitpFormats', prefix + 'formatsAndHeading:buttons');
        toolbar.setSubSectionButton('vitpFormats', prefix + 'formats:subSection');

        tools.createButton('vitpHeadings', '', _('Toggle Headings'), 'Viper-headings');
        tools.addButtonToGroup('vitpHeadings', prefix + 'formatsAndHeading:buttons');
        toolbar.setSubSectionButton('vitpHeadings', prefix + 'heading:subSection');

        var buttonGroup = tools.createButtonGroup(prefix + 'anchorAndClassButtons');
        toolbar.addButton(buttonGroup);

        // Anchor.
        tools.createButton('vitpAnchor', '', _('Anchor name (ID)'), 'Viper-anchorID');
        tools.addButtonToGroup('vitpAnchor', prefix + 'anchorAndClassButtons');

        toolbar.makeSubSection(prefix + 'anchor:subSection', this._getAnchorSection(prefix));
        toolbar.setSubSectionButton('vitpAnchor', prefix + 'anchor:subSection');
        toolbar.setSubSectionAction(prefix + 'anchor:subSection', function() {
            var value = tools.getItem(prefix + 'anchor:input').getValue();
            self._setAttributeForSelection('id', value);
        }, [prefix + 'anchor:input']);

        // Class.
        tools.createButton('vitpClass', '', _('Class name'), 'Viper-cssClass');
        tools.addButtonToGroup('vitpClass', prefix + 'anchorAndClassButtons');

        toolbar.makeSubSection(prefix + 'class:subSection', this._getClassSection(prefix));
        toolbar.setSubSectionButton('vitpClass', prefix + 'class:subSection');
        toolbar.setSubSectionAction(prefix + 'class:subSection', function() {
            var value = tools.getItem(prefix + 'class:input').getValue();
            self._setAttributeForSelection('class', value);
        }, [prefix + 'class:input']);

    },

    updateInlineToolbar: function(data, removeLinkOnly)
    {
        if (!data.lineage || data.range.collapsed === true) {
            return;
        }

        var tools           = this.viper.ViperTools;
        var prefix          = 'ViperFormatPlugin:vitp:';
        var selectedNode    = data.lineage[data.current];

        // Heading section.
        if (this._canShowHeadingOptions(selectedNode) === true) {
            data.toolbar.showButton('vitpHeadings');

            for (var i = 1; i <= 6; i++) {
                var tagName = 'h' + i;
                for (var j = 0; j < data.lineage.length; j++) {
                    if (dfx.isTag(data.lineage[j], tagName) === true) {
                        tools.setButtonActive(prefix + 'heading:h' + i);
                        tools.setButtonActive('vitpHeadings');
                    } else {
                        tools.setButtonInactive(prefix + 'heading:h' + i);
                    }
                }
            }
        } else {
            tools.setButtonInactive('vitpHeadings');
            for (var i = 1; i <= 6; i++) {
                tools.setButtonInactive(prefix + 'heading:h' + i);
            }
        }//end if

        // Formats section.
        var formatButtons = {
            p: 'P',
            div: 'DIV',
            blockquote: 'Quote',
            pre: 'PRE'
        };

        var ignoredTags = ['caption', 'li', 'ul', 'ol', 'img', 'table', 'tr', 'tbody', 'tfoot', 'thead'];

        var formatButtonStatuses = null;
        var currentElement       = data.lineage[data.current];

        if (dfx.isBlockElement(currentElement) === true && ignoredTags.inArray(dfx.getTagName(currentElement)) === false) {
            if (currentElement.nodeType === dfx.TEXT_NODE && data.lineage.length === 1) {
                formatButtonStatuses = this.getFormatButtonStatuses();
            } else {
                formatButtonStatuses = this.getFormatButtonStatuses(data.lineage[data.current]);
            }

            var enableFormatsButton  = formatButtonStatuses._none;
            for (var button in formatButtonStatuses) {
                if (button === '_none' || button === '_canChange') {
                    continue;
                }

                if (formatButtonStatuses[button] === true) {
                    enableFormatsButton = true;
                    tools.enableButton(prefix + 'formats:' + formatButtons[button]);
                    tools.setButtonInactive(prefix + 'formats:' + formatButtons[button]);
                } else {
                    tools.setButtonInactive(prefix + 'formats:' + formatButtons[button]);
                    tools.disableButton(prefix + 'formats:' + formatButtons[button]);
                }
            }

            tools.getItem('vitpFormats').setIconClass('Viper-formats');
            if (enableFormatsButton === true) {
                tools.enableButton('vitpFormats');

                if (currentElement.nodeType === dfx.TEXT_NODE && data.lineage.length > 1) {
                    currentElement = data.lineage[(data.current - 1)];
                } else if (dfx.isBlockElement(currentElement) === true) {
                    data.toolbar.showButton('vitpFormats');
                }

                var isBlockQuote = false;
                if (dfx.isTag(currentElement, 'p') === true
                    && dfx.isTag(currentElement.parentNode, 'blockquote') === true
                ) {
                    isBlockQuote = true;
                }

                for (var tag in formatButtons) {
                    if (dfx.isTag(currentElement, tag) === true) {
                        if (formatButtonStatuses[tag] === true) {
                            tools.enableButton(prefix + 'formats:' + formatButtons[tag]);

                            if (isBlockQuote !== true) {
                                tools.setButtonActive(prefix + 'formats:' + formatButtons[tag]);
                            }
                        }

                        tools.setButtonActive('vitpFormats');
                        if (isBlockQuote === true) {
                            tools.setButtonActive(prefix + 'formats:' + formatButtons['blockquote']);
                            tools.getItem('vitpFormats').setIconClass('Viper-formats-blockquote');
                        } else {
                            tools.setButtonActive(prefix + 'formats:' + formatButtons[tag]);
                            tools.getItem('vitpFormats').setIconClass('Viper-formats-' + tag);
                        }
                    }
                }
            } else {
                tools.disableButton('vitpFormats');
            }
        } else if ((!currentElement || ignoredTags.inArray(dfx.getTagName(currentElement)) === false) && this.isWholeBlockSelection(data.range)) {
            var pOnly = this._selectionHasPTagsOnly(data.range);

            for (var tag in formatButtons) {
                tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                if (tag === 'div' || (pOnly === true && tag === 'blockquote')) {
                    tools.enableButton(prefix + 'formats:' + formatButtons[tag]);
                } else {
                    tools.disableButton(prefix + 'formats:' + formatButtons[tag]);
                }
            }

            tools.getItem('vitpFormats').setIconClass('Viper-formats');
            tools.enableButton('vitpFormats');
            data.toolbar.showButton('vitpFormats');
        } else {
            tools.disableButton('vitpFormats');
        }

        buttonsToEnable = [];
        var startNode   = data.range.getStartNode();
        var endNode     = data.range.getEndNode();
        if (!endNode) {
            endNode = startNode;
        }
         // Anchor and Class.
        if (selectedNode.nodeType === dfx.ELEMENT_NODE
            || dfx.getFirstBlockParent(startNode) === dfx.getFirstBlockParent(endNode)
        ) {
            var attrId = this._getAttributeValue('id', selectedNode);
            if (attrId) {
                tools.setButtonActive('vitpAnchor');
            }

            var attrClass = this._getAttributeValue('class', selectedNode);
            if (attrClass) {
                tools.setButtonActive('vitpClass');
            }

            tools.getItem(prefix + 'anchor:input').setValue(attrId);
            tools.getItem(prefix + 'class:input').setValue(attrClass);

            data.toolbar.showButton('vitpAnchor');
            data.toolbar.showButton('vitpClass');
        }//end if

    },


    __createInlineToolbarContent: function(data)
    {

        var self         = this;
        var tools        = this.viper.ViperTools;
        var selectedNode = data.lineage[data.current];
        var toolbar      = this.viper.ViperPluginManager.getPlugin('ViperInlineToolbarPlugin');
        var prefix       = 'ViperFormatPlugin:vitp:';


    },

    _createToolbarContent: function()
    {
        var self    = this;
        var tools   = this.viper.ViperTools;
        var toolbar = this.toolbarPlugin;
        var prefix  = 'ViperFormatPlugin:vtp:';

        var content = this._getToolbarContents('vtp');

        // Toolbar buttons.
        var buttonGroup = tools.createButtonGroup(prefix + 'formatAndHeadingButtons');
        tools.createButton('formats', '', _('Formats'), 'Viper-formats', null, true);
        tools.createButton('headings', '', _('Headings'), 'Viper-headings', null, true);
        tools.addButtonToGroup('formats', prefix + 'formatAndHeadingButtons');
        tools.addButtonToGroup('headings', prefix + 'formatAndHeadingButtons');
        toolbar.addButton(buttonGroup);

        var buttonGroup = tools.createButtonGroup(prefix + 'anchorAndClassButtons');
        tools.createButton('anchor', '', _('Anchor ID'), 'Viper-anchorID', null, true);
        tools.createButton('class', '', _('Class'), 'Viper-cssClass', null, true);
        tools.addButtonToGroup('anchor', prefix + 'anchorAndClassButtons');
        tools.addButtonToGroup('class', prefix + 'anchorAndClassButtons');
        toolbar.addButton(buttonGroup);

        // Create the bubbles.
        toolbar.createBubble(prefix + 'formatsBubble', _('Formats'), null, content.formats);
        toolbar.setBubbleButton(prefix + 'formatsBubble', 'formats');

        toolbar.createBubble(prefix + 'headingsBubble', _('Headings'), null, content.headings);
        toolbar.setBubbleButton(prefix + 'headingsBubble', 'headings');

        toolbar.createBubble(prefix + 'anchorBubble', _('Anchor ID'), content.anchor);
        toolbar.setBubbleButton(prefix + 'anchorBubble', 'anchor');
        tools.getItem(prefix + 'anchorBubble').setSubSectionAction(prefix + 'anchorBubbleSubSection', function() {
            var value = tools.getItem(prefix + 'anchor:input').getValue();
            self._setAttributeForSelection('id', value);
        }, [prefix + 'anchor:input']);

        toolbar.createBubble(prefix + 'classBubble', _('Class'), content.cssClass);
        toolbar.setBubbleButton(prefix + 'classBubble', 'class');
        tools.getItem(prefix + 'classBubble').setSubSectionAction(prefix + 'classBubbleSubSection', function() {
            var value = tools.getItem(prefix + 'class:input').getValue();
            self._setAttributeForSelection('class', value);
        }, [prefix + 'class:input']);

        var headingTags   = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        var formatButtons = {
            p: 'P',
            div: 'DIV',
            blockquote: 'Quote',
            pre: 'PRE'
        };

        var ignoredTags = ('tr|table|tbody|thead|tfoot|caption|ul|ol|li|img').split('|');

        // Listen for the main toolbar update and update the statuses of the buttons.
        this.viper.registerCallback('ViperToolbarPlugin:updateToolbar', 'ViperFormatPlugin', function(data) {
            var nodeSelection = data.range.getNodeSelection(null, true);
            var startNode = data.range.getStartNode();
            var endNode   = data.range.getEndNode();
            if (!endNode) {
                endNode = startNode;
            }

            if ((!nodeSelection || nodeSelection.nodeType !== dfx.ELEMENT_NODE || nodeSelection === self.viper.getViperElement())
                && (data.range.collapsed === true || dfx.getFirstBlockParent(startNode) !== dfx.getFirstBlockParent(endNode))
            ) {
                tools.disableButton('anchor');
                tools.disableButton('class');
                tools.setButtonInactive('anchor');
                tools.setButtonInactive('class');
            } else {
                tools.enableButton('anchor');
                tools.enableButton('class');
            }

            if (!startNode
                && !endNode
                && data.range.startContainer === data.range.endContainer
            ) {
                startNode = data.range.startContainer;
            }

            var viperElement    = self.viper.getViperElement();
            var lineage         = self._inlineToolbar.getLineage();
            var currentLinIndex = self._inlineToolbar.getCurrentLineageIndex(true);
            var formatElement   = lineage[currentLinIndex];
            if (formatElement && formatElement.nodeType !== dfx.TEXT_NODE) {
                nodeSelection = formatElement;
            }

            // Anchor.
            var attrId = self._getAttributeValue('id', nodeSelection);
            tools.getItem(prefix + 'anchor:input').setValue(attrId);
            if (attrId) {
                tools.setButtonActive('anchor');
            } else {
                tools.setButtonInactive('anchor');
            }

            // Class.
            var attrClass = self._getAttributeValue('class', nodeSelection);
            tools.getItem(prefix + 'class:input').setValue(attrClass);
            if (attrClass) {
                tools.setButtonActive('class');
            } else {
                tools.setButtonInactive('class');
            }

            // Format and Heading.
            tools.disableButton('headings');
            tools.disableButton('formats');
            tools.setButtonInactive('headings');
            tools.setButtonInactive('formats');

            // Heading button.
            // Heading button will only be enabled if its a whole node selection or
            // no selection and not in a blockquote with multiple paragraphs.
            if (nodeSelection) {
                if (nodeSelection.nodeType === dfx.TEXT_NODE) {
                    if (data.range.collapsed === true) {
                        // Disable the heading tag if the selection is in a blockquote
                        // with multiple paragraph tags.
                        var blockquote = dfx.getParents(nodeSelection, 'blockquote', self.viper.getViperElement());
                        if (blockquote.length === 0 || dfx.getTag('p', blockquote[0]).length <= 1) {
                            tools.enableButton('headings');
                        }
                    }
                } else if ((dfx.isTag(nodeSelection, 'blockquote') !== true
                    || dfx.getTag('p', nodeSelection).length <= 1)
                    && ((dfx.isTag(nodeSelection, 'p') !== true)
                    || dfx.isTag(nodeSelection.parentNode, 'blockquote') === false)
                ) {
                    if (dfx.isBlockElement(nodeSelection) === true && ignoredTags.inArray(dfx.getTagName(nodeSelection)) === false) {
                        // Check if this node contains any block elements, if it does
                        // then headings cannnot be applied.
                        var blockChildren = self.viper.getBlockChildren(nodeSelection);
                        if (blockChildren.length <= 1) {
                            tools.enableButton('headings');
                        }
                    }
                }
            } else if (data.range.collapsed === true && formatElement) {
                var firstBlock = dfx.getFirstBlockParent(formatElement);
                if (ignoredTags.inArray(dfx.getTagName(firstBlock)) === false) {
                    var isBlockQuote = false;
                    if (dfx.isTag(firstBlock, 'p') === true && dfx.isTag(firstBlock.parentNode, 'blockquote') === true) {
                        firstBlock = firstBlock.parentNode;
                        isBlockQuote = true;
                    } else if (dfx.isTag(firstBlock, 'blockquote') === true) {
                        isBlockQuote = true;
                    }

                    if (isBlockQuote === false || dfx.getTag('p', firstBlock).length === 1) {
                        tools.enableButton('headings');
                    }
                }
            }

            for (var i = 0; i < headingTags.length; i++) {
                tools.setButtonInactive(prefix + 'heading:' + headingTags[i]);
            }

            var headingElement = self.getTagFromRange(data.range, headingTags);
            if (headingElement) {
                var tagName = dfx.getTagName(headingElement);
                tools.setButtonActive('headings');
                tools.setButtonActive(prefix + 'heading:' + tagName);
            }

            // Returns the most relevant parent.
            var getValidParent = function(node) {
                var parent = dfx.getFirstBlockParent(node);
                if (parent && dfx.isTag(parent, 'p') === true && dfx.isTag(parent.parentNode, 'blockquote') === true) {
                    parent = parent.parentNode;
                } else if (parent === self.viper.getViperElement()) {
                    // Ignore the Viper element.
                    parent = null;
                }

                return parent;
            };

            // Format button.
            if (self._canEnableFormatButtons(startNode, nodeSelection, data.range) === true) {
                // Reset icon of the main toolbar button.
                tools.getItem('formats').setIconClass('Viper-formats');
                if (data.range.collapsed === true) {
                    // If the range is collapsed then we need to get the most relevant
                    // parent. Which is the first block parent unless its a P tag
                    // inside a blockquote. Then it becomes the blockquote.
                    var parent = getValidParent(startNode);

                    // Enable the main toolbar button.
                    tools.enableButton('formats');

                    // Set the main toolbar button icon.
                    var parentTagName = dfx.getTagName(parent, data.range);
                    if (formatButtons[parentTagName]) {
                        tools.getItem('formats').setIconClass('Viper-formats-' + parentTagName);
                    }

                    var formatButtonStatuses = self.getFormatButtonStatuses(parent);
                    for (var tag in formatButtons) {
                        if (formatButtonStatuses[tag] === true) {
                            tools.enableButton(prefix + 'formats:' + formatButtons[tag]);
                        } else {
                            tools.disableButton(prefix + 'formats:' + formatButtons[tag]);
                        }

                        if (tag === parentTagName) {
                            tools.setButtonActive(prefix + 'formats:' + formatButtons[tag]);
                            tools.setButtonActive('formats');
                        } else {
                            tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                        }
                    }
                } else if (nodeSelection && nodeSelection.nodeType === dfx.ELEMENT_NODE) {
                    // This is an element selection.
                    // First set the correct icon for the main toolbar button.
                    var parentTagName = dfx.getTagName(nodeSelection);
                    var parent        = nodeSelection;
                    if (dfx.isBlockElement(nodeSelection) === false) {
                        parent        = getValidParent(startNode);
                        parentTagName = dfx.getTagName(parent);
                    } else if (parentTagName === 'p' && dfx.isTag(parent.parentNode, 'blockquote') === true) {
                        parent        = parent.parentNode;
                        parentTagName = 'blockquote';
                    }

                    if (formatButtons[parentTagName] && nodeSelection !== viperElement) {
                        tools.getItem('formats').setIconClass('Viper-formats-' + parentTagName);
                    }

                    var isBlockElement  = dfx.isBlockElement(nodeSelection);
                    /*var hasInlineParent = false;
                    if (isBlockElement === true) {
                        var node = nodeSelection.parentNode;
                        while (node && node !== viperElement) {
                            if (dfx.isBlockElement(node) === false) {
                                hasInlineParent = true;
                                break;
                            }

                            node = node.parentNode;
                        }
                    }*/

                    if (isBlockElement === true) {
                        // If this is a P tag selection and P tag belongs to a
                        // blockquote and blockquote has more than one P tag then
                        // do not allow this P tag to be converted to anything else.
                        if (dfx.isTag(nodeSelection, 'p') === true
                            && dfx.isTag(nodeSelection.parentNode, 'blockquote') === true
                            && dfx.getTag('p', nodeSelection.parentNode).length > 1
                        ) {
                            tools.disableButton('formats');
                        } else {
                            tools.enableButton('formats');
                            var formatButtonStatuses = self.getFormatButtonStatuses(parent);
                            for (var tag in formatButtons) {
                                if (formatButtonStatuses[tag] === true) {
                                    tools.enableButton(prefix + 'formats:' + formatButtons[tag]);
                                } else {
                                    tools.disableButton(prefix + 'formats:' + formatButtons[tag]);
                                }

                                if (tag === parentTagName) {
                                    if (nodeSelection !== viperElement) {
                                        tools.setButtonActive(prefix + 'formats:' + formatButtons[tag]);
                                        tools.setButtonActive('formats');
                                    } else {
                                        tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                                    }
                                } else {
                                    tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                                }
                            }
                        }
                    } else if (parentTagName === 'div') {
                        // Its a stub or an inline element and parent is DIV, enable
                        // only the DIV button.
                        for (var tag in formatButtons) {
                            tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                            if (tag === 'div') {
                                tools.enableButton('formats');
                                tools.enableButton(prefix + 'formats:' + formatButtons[tag]);
                            } else {
                                tools.disableButton(prefix + 'formats:' + formatButtons[tag]);
                            }
                        }
                    }
                } else {
                    // Its a text selection.
                    var startBlock    = dfx.getFirstBlockParent(startNode);
                    var commonParent  = self.getCommonFormatElement(data.range);

                    if (commonParent && dfx.isBlockElement(commonParent) === false) {
                        commonParent  = dfx.getFirstBlockParent(commonParent);
                    }

                    var commonTagName = dfx.getTagName(commonParent);

                    if (commonParent && formatButtons[commonTagName]) {
                        if (commonTagName === 'p' && dfx.isTag(commonParent.parentNode, 'blockquote') === true) {
                            tools.getItem('formats').setIconClass('Viper-formats-blockquote');
                        } else {
                            tools.getItem('formats').setIconClass('Viper-formats-' + commonTagName);

                            if (commonTagName === 'div') {
                                // Div tags allow nested tags anywhere in their
                                // content. So enable the top toolbar button.
                                tools.enableButton('formats');
                            }
                        }

                        if (commonParent && startBlock !== commonParent) {
                            // Text inside multiple block elements is selected.
                            tools.enableButton('formats');

                            var formatButtonStatuses = self.getFormatButtonStatuses(commonParent);
                            for (var tag in formatButtons) {
                                if (formatButtonStatuses[tag] === true) {
                                    tools.enableButton(prefix + 'formats:' + formatButtons[tag]);
                                } else {
                                    tools.disableButton(prefix + 'formats:' + formatButtons[tag]);
                                }

                                if (tag === commonTagName) {
                                    if (tag !== 'div' || commonParent !== viperElement) {
                                        tools.setButtonActive(prefix + 'formats:' + formatButtons[tag]);
                                    }

                                    tools.enableButton('formats');
                                    tools.setButtonActive('formats');
                                } else {
                                    tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                                }
                            }
                        } else {
                            // Text inside a single block element is selected.
                            if (commonTagName === 'div') {
                                // Div tag allows nested tags inside it. Set all
                                // buttons to inactive and enable them.
                                for (var tag in formatButtons) {
                                    tools.enableButton(prefix + 'formats:' + formatButtons[tag]);
                                    tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                                }
                            }
                        }
                    } else if (startBlock === self.viper.getViperElement()
                        && self.viper.getViperElement() === dfx.getFirstBlockParent(endNode)
                    ) {
                        // Top level text selection. Allow all formats.
                        tools.enableButton('formats');

                        for (var tag in formatButtons) {
                            tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);
                        }
                    } else {
                        // Text accross multiple block elements is selected.
                        // Only Div is allowed unless selection consists of only P tags
                        // then Blockquote is also allowed.
                        tools.enableButton('formats');

                        var pOnly = self._selectionHasPTagsOnly(data.range);
                        for (var tag in formatButtons) {
                            tools.setButtonInactive(prefix + 'formats:' + formatButtons[tag]);

                            if (tag === 'div' || (pOnly === true && tag === 'blockquote')) {
                                tools.enableButton(prefix + 'formats:' + formatButtons[tag]);
                            } else {
                                tools.disableButton(prefix + 'formats:' + formatButtons[tag]);
                            }
                        }
                    }//end if//end if
                }//end if
            } else {
                tools.getItem('formats').setIconClass('Viper-formats');

                // Pick the right button icon for disabled state as nothing can be
                // changed.
                if (data.range.collapsed === true) {
                    var parent = getValidParent(startNode);

                    var parentTagName = dfx.getTagName(parent);
                    if (formatButtons[parentTagName]) {
                        tools.getItem('formats').setIconClass('Viper-formats-' + parentTagName);
                    }
                }
            }//end if
        });

    },

    _updateTableEditorContent: function(data)
    {
        if (data.type === 'cell'
            || data.type === 'row'
            || data.type === 'table'
        ) {
            var prefix  = 'ViperTableEditor-Format-'+ data.type + ':';
            var element = data.cell;

            switch (data.type) {
                case 'row':
                    element = element.parentNode;
                break;

                case 'table':
                    element = dfx.getParents(element, 'table')[0];
                break;

                default:
                    // Nothing.
                break;
            }

            // Add class button.
            var classBtnActive = false;
            var classAttribute = '';

            if (dfx.hasAttribute(element, 'class') === true) {
                classAttribute = element.getAttribute('class');
                this.viper.ViperTools.setButtonActive(prefix + 'classBtn-' + data.type);
            } else {
                this.viper.ViperTools.setButtonInactive(prefix + 'classBtn-' + data.type);
            }

            this.viper.ViperTools.getItem(prefix + 'class:input').setValue(classAttribute);

            data.toolbar.showButton(prefix + 'classBtn-' + data.type);
        }

    },

    _createTableEditorContent: function(toolbar, type)
    {
        if (type === 'cell'
            || type === 'row'
            || type === 'table'
        ) {
            var prefix      = 'ViperTableEditor-Format-' + type + ':';
            var element     = null;
            var buttonIndex = null;

            switch (type) {
                case 'row':
                    buttonIndex = -1;
                break;

                case 'table':
                    buttonIndex = -1;
                break;

                default:
                    buttonIndex = null;
                break;
            }

            // Add class button.
            var tools = this.viper.ViperTools;

            var button = tools.createButton(prefix + 'classBtn-' + type, '', _('Class name'), 'Viper-cssClass', null, false, false);
            toolbar.addButton(button, buttonIndex);

            var self = this;
            var tableEditorPlugin = this.viper.ViperPluginManager.getPlugin('ViperTableEditorPlugin');
            toolbar.makeSubSection(prefix + 'class:subSection-' + type, this._getClassSection(prefix));
            toolbar.setSubSectionAction(prefix + 'class:subSection-' + type, function() {
                var element  = tableEditorPlugin.getActiveCell();
                switch (type) {
                    case 'row':
                        element = element.parentNode;
                    break;

                    case 'table':
                        element = dfx.getParents(element, 'table')[0];
                    break;

                    default:
                        // Nothing.
                    break;
                }

                var value   = tools.getItem(prefix + 'class:input').getValue();
                if (element) {
                    self._setAttributeForElement(element, 'class', value);
                } else {
                    self._setAttributeForSelection('class', value);
                }

                if (value) {
                    tools.setButtonActive(prefix + 'classBtn-' + type);
                } else {
                    tools.setButtonInactive(prefix + 'classBtn-' + type);
                }

                self.viper.fireNodesChanged();
            }, [prefix + 'class:input']);

            toolbar.setSubSectionButton(prefix + 'classBtn-' + type, prefix + 'class:subSection-' + type);
        }//end if

    },

    _setAttributeForElement: function(element, attr, value)
    {
        if (element.nodeType === dfx.ELEMENT_NODE) {
            // Set the attribute of this element.
            this.viper.setAttribute(element, attr, value);
            return element;
        }

        return null;

    },

    _setAttributeForSelection: function(attr, value)
    {
        var range        = this.viper.getViperRange();
        var selectedNode = this.viper.getNodeSelection();

        if (selectedNode) {
            var oldVal = '';
            if (selectedNode.nodeType === dfx.TEXT_NODE) {
                var span = document.createElement('span');
                dfx.insertBefore(selectedNode, span);
                span.appendChild(selectedNode);
                selectedNode = span;
                range.selectNode(span);
                ViperSelection.addRange(range);
            } else {
                oldVal = selectedNode.getAttribute(attr) || '';
            }

            this.viper.setAttribute(selectedNode, attr, value);
            this.viper.fireSelectionChanged(null, true);
            this.viper.fireNodesChanged();

            this.viper.fireCallbacks('ViperFormatPlugin:elementAttributeSet', {element: selectedNode, oldValue: oldVal, newValue:value});
            return;
        }

        // Wrap the selection with span tag.
        var bookmark = this.viper.createBookmark();

        // Move the elements between start and end of bookmark to the new
        // span tag. Then select the new span tag and update selection.
        var span = null;
        if (bookmark.start && bookmark.end) {
            if (bookmark.start.nextSibling
                && bookmark.start.nextSibling.nodeType === dfx.ELEMENT_NODE
                && bookmark.start.nextSibling === bookmark.end.previousSibling
            ) {
                span = bookmark.start.nextSibling;
                this.viper.removeBookmarks();
                this._setAttributeForElement(span, attr, value);
                range.selectNode(span);
            } else {
                var attributes = {attributes: {}};
                attributes.attributes[attr] = value;
                this.viper.surroundContents('span', attributes, range);

                this.viper.removeBookmarks();
            }//end if

            ViperSelection.addRange(range);
            this.viper.adjustRange();

            this.viper.fireSelectionChanged(range, true);
            this.viper.fireNodesChanged();

            this.viper.fireCallbacks('ViperFormatPlugin:elementAttributeSet', {element: span, oldValue: '', newValue:value});

            return span;
        }

        return null;

    },

    _canShowHeadingOptions: function(node)
    {
        if (!node) {
            return false;
        }

        if (node.nodeType === dfx.TEXT_NODE) {
            // If this is a text selection then dont show the tools.
            return false;
        } else if (dfx.isBlockElement(node) === false) {
            return false;
        } else {
            switch (node.tagName.toLowerCase()) {
                case 'li':
                case 'ul':
                case 'ol':
                case 'img':
                case 'th':
                case 'tr':
                case 'td':
                case 'table':
                case 'caption':
                    return false;
                break;

                case 'blockquote':
                    if (dfx.getTag('p', node).length > 1) {
                        return false;
                    } else {
                        var textContent = dfx.getNodeTextContent(node);
                        if (textContent && textContent.length > 80) {
                            return false;
                        }
                    }
                break;

                default:
                    if (dfx.isTag(node, 'p') === true
                        && dfx.isTag(node.parentNode, 'blockquote') === true
                    ) {
                        return false;
                    }

                    // Check the selection length if the length is too long then
                    // dont show the tools.
                    var textContent = dfx.getNodeTextContent(node);
                    if (textContent && textContent.length > 80) {
                        return false;
                    }

                    return true;
                break;
            }
        }

        return true;

    },

    _canEnableFormatButtons: function(startNode, nodeSelection, range)
    {
        // Direct parent ignore list.
        var ignoredTagsStr = 'tr|table|tbody|thead|tfoot|caption|ul|ol|li|img';
        var ignoredTags    = ignoredTagsStr.split('|');
        var viperElement   = this.viper.getViperElement();

        // If any of the parents of the element is one of these tags then ignore it.
        var parents = dfx.getParents(startNode, 'caption,ul,ol,li,img', viperElement);
        if (parents.length > 0 || (dfx.isStubElement(startNode) === true && dfx.isTag(startNode, 'br') === false)) {
            return false;
        } else if (range.collapsed === true && startNode.nodeType === dfx.TEXT_NODE) {
            var blockquotes = dfx.getParents(startNode, 'blockquote', viperElement);
            if (blockquotes.length === 1 && dfx.getTag('p', blockquotes[0]).length > 1) {
                return false;
            }
        }

        if (nodeSelection) {
            if (ignoredTags.inArray(dfx.getTagName(nodeSelection)) === true) {
                return false;
            } else if (dfx.isBlockElement(nodeSelection) === false
                && ignoredTags.inArray(dfx.getTagName(dfx.getFirstBlockParent(nodeSelection))) === true
            ) {
                return false;
            }
        } else if (startNode) {
            if (ignoredTags.inArray(dfx.getTagName(dfx.getFirstBlockParent(startNode))) === true) {
                return false;
            }
        }

        return true;

    },

    isWholeBlockSelection: function(range)
    {
        range = range || this.viper.getViperRange();

        var nodeSelection = range.getNodeSelection();
        if (nodeSelection && dfx.isBlockElement(nodeSelection) === true) {
            return nodeSelection;
        }

        if (range.startContainer.nodeType === dfx.TEXT_NODE
            && range.endContainer.nodeType === dfx.TEXT_NODE
            && range.startOffset === 0
            && range.endOffset === range.endContainer.data.length
        ) {
            // Now startContainer must be the first selectable child in its block
            // element. And endContainer must be the last selectable child in its
            // block element.
            var startBlock = dfx.getFirstBlockParent(range.startContainer);
            var endBlock   = dfx.getFirstBlockParent(range.endContainer);
            if (range._getFirstSelectableChild(startBlock) === range.startContainer
                && range._getLastSelectableChild(endBlock) === range.endContainer
            ) {
                return true;
            }
        }

        return false;


    },

    _selectionHasPTagsOnly: function(range)
    {
        var startBlock = dfx.getFirstBlockParent(range.startContainer);
        var endBlock   = dfx.getFirstBlockParent(range.endContainer);
        var common     = range.getCommonElement();
        var elements   = dfx.getElementsBetween(startBlock, endBlock);

        if (startBlock) {
            elements.push(startBlock);
        }

        if (endBlock) {
            elements.push(endBlock);
        }

        for (var i = 0; i < elements.length; i++) {
            if (elements[i].nodeType === dfx.TEXT_NODE
                && dfx.trim(elements[i].data) === ''
            ) {
                continue;
            } else if (dfx.isBlockElement(elements[i]) === true
                && dfx.isTag(elements[i], 'p') === false
            ) {
                return false;
            } else {
                var blockParents = dfx.getParents(elements[i], null, common, true);
                for (var j = 0; j < blockParents.length; j++) {
                    if (dfx.isTag(blockParents[j], 'p') === false) {
                        return false;
                    }
                }
            }
        }

        return true;

    },

    /**
     * Returns the statuses of buttons for the current range.
     *
     * @return {object}
     */
    getFormatButtonStatuses: function(element)
    {
        var statuses = {
            p: false,
            pre: false,
            div: false,
            blockquote: false,
            _none: false,
            _canChange: false
        };

        var range        = this.viper.getViperRange();
        var selectedNode = element || range.getNodeSelection();
        var viperElement = this.viper.getViperElement();
        var defaultTag   = this.viper.getDefaultBlockTag();

        if (!selectedNode && range.startContainer === range.endContainer && range.collapsed === true) {
            selectedNode = dfx.getFirstBlockParent(range.startContainer);
        }

        if (selectedNode === viperElement) {
            statuses = {
                p: true,
                pre: true,
                div: true,
                blockquote: true,
                _none: false,
                _canChange: true
            };

            var parasOnly        = true;
            var hasBlockChildren = false;
            for (var node = selectedNode.firstChild; node; node = node.nextSibling) {
                if (dfx.isBlockElement(node) === true) {
                    hasBlockChildren = true;
                    if (dfx.isTag(node, 'p') !== true) {
                        parasOnly = false;
                        break;
                    }
                }
            }

            if (parasOnly === false) {
                statuses.p = false;
                statuses.pre = false;
                statuses.blockquote = false;
            } else if (hasBlockChildren === true) {
                statuses.p = false;
                statuses.pre = false;
            }

            return statuses;
        }

        if (selectedNode && dfx.isBlockElement(selectedNode) === true) {
            var isBlockquote = false;
            if (dfx.isTag(selectedNode, 'p') === true && dfx.isTag(selectedNode.parentNode, 'blockquote') === true) {
                selectedNode = selectedNode.parentNode;
                isBlockquote = true;
            }

            for (var tagName in statuses) {
                if (isBlockquote === true) {
                    statuses[tagName] = true;
                    continue;
                }

                var canConvert = this.canConvert(selectedNode, tagName);
                statuses[tagName] = canConvert;
                if (canConvert === true) {
                    statuses._canChange = true;
                }
            }

            statuses._none = true;
        } else if (selectedNode && selectedNode.nodeType === dfx.TEXT_NODE) {
            var parent = dfx.getFirstBlockParent(selectedNode);
            if (dfx.isTag(parent, 'div') === true) {
                statuses = {
                    p: true,
                    pre: true,
                    div: true,
                    blockquote: true
                };
            }
        } else {
            var start      = range.getStartNode();
            var end        = range.getEndNode();
            var elements   = dfx.getElementsBetween(start, end);
            var commonElem = range.getCommonElement();

            elements.unshift(start);

            if (start !== end && end) {
                elements.push(end);
            }

            var parents = [];
            for (var i = 0; i < elements.length; i++) {
                var elem = elements[i];
                if (elem.nodeType === dfx.TEXT_NODE && dfx.trim(elem.data) === '') {
                    continue;
                }

                if (dfx.isBlockElement(elem) === true) {
                    parents.push(elem);
                }

                var elemParents = dfx.getParents(elem, null, commonElem);
                for (var j = 0; j < elemParents.length; j++) {
                    if (dfx.isBlockElement(elemParents[j]) === true) {
                        parents.push(elemParents[j]);
                    }
                }
            }

            if (parents.length === 0) {
                // A text node is selected inside the same block parent.
                var parent = dfx.getFirstBlockParent(start);
                if (dfx.isTag(parent, 'div') === true) {
                    statuses = {
                        p: true,
                        pre: true,
                        div: true,
                        blockquote: true,
                        _canChange: true
                    };
                }
            } else {
                statuses.div = true;
                statuses._canChange = true;

                if (parents.length > 0) {
                    statuses.blockquote = true;
                }
            }
        }//end if

        return statuses;

    },

    canConvert: function(element, toTagName)
    {
        var tagName = dfx.getTagName(element);
        if (tagName === 'p') {
            // If the original tag is a P tag and its parent is a blockquote then
            // it cannot be converted or removed.
            if (dfx.isTag(element.parentNode, 'blockquote') === true) {
                return false;
            }
        }

        if (toTagName === '_none') {
            if (this.viper.getDefaultBlockTag() === '') {
                // Tag can be removed.
                return true;
            }

            return false;
        } else if (tagName === toTagName && this.viper.getDefaultBlockTag() !== '') {
            return false;
        }

        switch (toTagName) {
            case 'p':
                // Any element can be converted to a P unless there are child block
                // elements.
                if (this.hasBlockChildren(element) === true) {
                    return false;
                }

                // Or its in a PRE tag.
                var preTags = dfx.getParents(element, 'pre', this.viper.getViperElement());
                if (preTags.length > 0) {
                    return false;
                }
            break;

            case 'pre':
                if (this.hasBlockChildren(element) === true) {
                    return false;
                }
            break;

            case 'blockquote':
                var tags = dfx.getTag('*', element);
                for (var i = 0; i < tags.length; i++) {
                    if (dfx.isBlockElement(tags[i]) === true && dfx.isTag(tags[i], 'p') === false && dfx.isStubElement(tags[i]) === false) {
                        return false;
                    }
                }
            break;
        }

        return true;

    },

    hasBlockChildren: function(element)
    {
        var isBlockQuote = dfx.isTag(element, 'blockquote');
        var hasBlock     = false;

        var tags = dfx.getTag('*', element);
        for (var i = 0; i < tags.length; i++) {
            if (dfx.isBlockElement(tags[i]) === true && dfx.isStubElement(tags[i]) === false) {
                if (isBlockQuote === true && hasBlock === false && dfx.isTag(tags[i], 'p') === true) {
                    // In blockquote element only return true if there is more than
                    // one block element.
                    hasBlock = true;
                    continue;
                }

                return true;
            }
        }

        return false;

    },

    /**
     * Handles the format change.
     *
     * @param {string} type The type of the element.
     */
    handleFormat: function(type)
    {
        var lineage         = this._inlineToolbar.getLineage();
        var currentLinIndex = this._inlineToolbar.getCurrentLineageIndex();
        var range           = this.viper.getViperRange();
        var selectedNode    = selectedNode || range.getNodeSelection();
        var nodeSelection   = selectedNode;
        var viperElement    = this.viper.getViperElement();

        var formatElement   = lineage[currentLinIndex];
        if (formatElement && formatElement.nodeType !== dfx.TEXT_NODE) {
            selectedNode = formatElement;
        }

        if (selectedNode === viperElement) {
            selectedNode = null;
        } else if (dfx.isBlockElement(selectedNode) === false) {
            // Not a block element selection, check if its being wrapped with
            // block elements e.g. <p><strong>text</strong></p>.
            var surroundingBlockElems = dfx.getSurroundingParents(selectedNode, null, true);
            if (surroundingBlockElems.length > 0) {
                selectedNode = surroundingBlockElems[0];
            }
        }

        if (selectedNode
            && (selectedNode.nodeType !== dfx.ELEMENT_NODE
            || dfx.isBlockElement(selectedNode) === false
            || dfx.isStubElement(selectedNode) === true
            )
        ) {
            if (dfx.isBlockElement(selectedNode) === false) {
                selectedNode = null;
            } else {
                // Text node, get the first block parent.
                selectedNode = dfx.getFirstBlockParent(selectedNode);
            }
        } else if (!selectedNode && (range.collapsed === true || type.match(/^h\d$/))) {
            selectedNode = dfx.getFirstBlockParent(range.startContainer);
        }

        if (selectedNode) {
            var ignoreTags = ['li'];
            if (ignoreTags.inArray(dfx.getTagName(selectedNode)) === true) {
                return false;
            }

            if (selectedNode !== viperElement) {
                var bookmark = this.viper.createBookmark();

                if (dfx.isTag(selectedNode, 'td') === true
                    || dfx.isTag(selectedNode, 'th') === true
                    || dfx.isTag(selectedNode, 'caption') === true
                ) {
                    // Do not convert the TD tag.
                    var newElem = document.createElement(type);
                    if (type === 'blockquote' && dfx.getTag(selectedNode, 'p').length === 0) {
                        newElem.appendChild(document.createElement('p'));
                        while (selectedNode.firstChild) {
                            newElem.firstChild.appendChild(selectedNode.firstChild);
                        }
                    } else if (type.match(/^h\d$/)) {
                        while (selectedNode.firstChild) {
                            if (dfx.isBlockElement(selectedNode.firstChild) === true) {
                                while (selectedNode.firstChild.firstChild) {
                                    newElem.appendChild(selectedNode.firstChild.firstChild);
                                }

                                dfx.remove(selectedNode.firstChild);
                            } else {
                                newElem.appendChild(selectedNode.firstChild);
                            }
                        }
                    } else {
                        while (selectedNode.firstChild) {
                            newElem.appendChild(selectedNode.firstChild);
                        }
                    }

                    selectedNode.appendChild(newElem);
                    this.viper.selectBookmark(bookmark);
                } else {
                    var newElem = this._convertSingleElement(selectedNode, type);

                    this.viper.selectBookmark(bookmark);
                    if (nodeSelection && newElem) {
                        range.selectNode(newElem);
                        ViperSelection.addRange(range);
                    }
                }

                this.viper.fireSelectionChanged(null, true);
                this.viper.fireNodesChanged();
            } else {
                // We cannot convert the Viper element so we need to create a new
                // element from the textnodes that are around the current range.
                this._handleTopLevelFormat(type, range);
            }
        } else {
            var start    = range.getStartNode();
            var end      = range.getEndNode();
            var elements = dfx.getElementsBetween(start, end);
            elements.unshift(start);

            if (start !== end && end) {
                if (end.nodeType === dfx.TEXT_NODE && range.endOffset > 0) {
                    elements.push(end);
                } else {
                    var elem = range.getPreviousContainer(end, null, true);
                    range.setEnd(elem, elem.data.length);
                    ViperSelection.addRange(range);
                }
            }

            var parents = [];
            var c       = elements.length;
            for (var i = 0; i < c; i++) {
                if (elements[i].nodeType === dfx.TEXT_NODE && dfx.isBlank(dfx.trim(elements[i].data)) === true) {
                    continue;
                } else if (dfx.isBlockElement(elements[i]) === true) {
                    parents.push(elements[i]);
                } else {
                    var parent    = dfx.getFirstBlockParent(elements[i]);
                    if (parent && parents.inArray(parent) === false) {
                        parents.push(parent);
                    }
                }
            }

            if (parents.length === 1 && range.collapsed === false) {
                // Convert only the selection to specified element.
                // This will create the new element inside the parent element.
                var parent     = parents[0];
                var newElement = document.createElement(type);
                var contents   = range.getHTMLContents();

                if (type === 'blockquote') {
                    contents = '<p>' + contents + '</p>';
                }

                dfx.setHtml(newElement, contents);

                var bookmark = this.viper.createBookmark();
                dfx.remove(dfx.getElementsBetween(bookmark.start, bookmark.end));
                dfx.insertAfter(bookmark.start, newElement);
                this.viper.selectBookmark(bookmark);

                this.viper.fireNodesChanged([parent]);
                this.viper.fireSelectionChanged(null, true);
                this.viper.fireCallbacks('ViperFormatPlugin:formatChanged', type);

                return;
            }

            // Check if all the parents are siblings. If there is a parent element
            // that is not a sibling see if its the only child of its parent and if
            // that is a sibling.
            var prevParent = null;
            var siblings   = true;
            var commonElem = range.getCommonElement();
            var newParents = [];

            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];
                if (parent !== commonElem && parent.parentNode !== commonElem) {
                    var parentParents = dfx.getParents(parent, null, commonElem);

                    // Check if any of these parents are already in newParents array.
                    var skip = false;
                    if (newParents.length !== 0) {
                        for (var j = 0; j < parentParents.length; j++) {
                            if (newParents.inArray(parentParents[j]) === true) {
                                skip = true;
                                break;
                            }
                        }
                    }

                    if (skip === true) {
                        continue;
                    }

                    // Check if its the first child of its parent.
                    for (var j = 0; j < parentParents.length; j++) {
                        var parentParent = parentParents[j];
                        for (var node = parent.previousSibling; node; node = node.previousSibling) {
                            if (node && node.nodeType === dfx.ELEMENT_NODE || dfx.trim(node.data) !== '') {
                                return false;
                            }
                        }

                        parent = parentParent;
                    }

                    newParents.push(parent);
                } else {
                    newParents.push(parent);
                }//end if
            }//end for

            if (newParents.length > 0) {
                var removeType = false;

                if (dfx.isTag(commonElem, type) === true && commonElem !== viperElement) {
                    var lastSelectableParent = range._getLastSelectableChild(commonElem).parentNode;
                    var lastParent = newParents[(newParents.length - 1)];
                    while (lastSelectableParent !== commonElem) {
                        if (lastSelectableParent === lastParent) {
                            removeType = true;
                            break;
                        }

                        lastSelectableParent = lastSelectableParent.parentNode;
                    }
                }

                var bookmark = this.viper.createBookmark();

                if (removeType === true) {
                    for (var i = 0; i < newParents.length; i++) {
                        dfx.insertBefore(commonElem, newParents[i]);
                    }

                    dfx.remove(commonElem);
                } else {
                    var newElem = document.createElement(type);
                    dfx.insertBefore(newParents[0], newElem);
                    for (var i = 0; i < newParents.length; i++) {
                        if (type === 'blockquote' && dfx.isTag(newParents[i], 'p') === false) {
                            // Replace any block elements with P tags.
                            var pTag = document.createElement('p');
                            while (newParents[i].firstChild) {
                                pTag.appendChild(newParents[i].firstChild);
                            }
                            newElem.appendChild(pTag);
                            dfx.remove(newParents[i]);
                        } else {
                            newElem.appendChild(newParents[i]);
                        }
                    }

                }

                this.viper.selectBookmark(bookmark);
                this.viper.fireNodesChanged([viperElement]);
                this.viper.fireSelectionChanged(null, true);
            }
        }//end if

        this.viper.fireCallbacks('ViperFormatPlugin:formatChanged', type);

    },

    _convertSingleElement: function(element, type)
    {
        var isBlockQuote = false;
        if (dfx.isTag(element, 'p') === true && dfx.isTag(element.parentNode, 'blockquote') === true) {
            element      = element.parentNode;
            isBlockQuote = true;
        } else if (dfx.isTag(element, 'blockquote') === true) {
            isBlockQuote = true;
        }

        if (dfx.isTag(element, type) === true) {
            if (element.parentNode === this.viper.getViperElement()) {
                if (this.viper.getDefaultBlockTag() !== '') {
                    if (type === this.viper.getDefaultBlockTag()) {
                        return null;
                    } else if (this.viper.hasBlockChildren(element) === false) {
                        return this._convertSingleElement(element, this.viper.getDefaultBlockTag());
                    } else {
                        var parentElem = null;
                        while (element.firstChild) {
                            if (dfx.isBlockElement(element.firstChild) === false) {
                                if (!parentElem) {
                                    parentElem = document.createElement(this.viper.getDefaultBlockTag());
                                    dfx.insertBefore(element, parentElem);
                                }

                                parentElem.appendChild(element.firstChild);
                            } else {
                                parentElem = null;
                                dfx.insertBefore(element, element.firstChild);
                            }
                        }

                        dfx.remove(element);
                        return;
                    }
                }
            }

            if (type.indexOf('h') === 0) {
                // Heading to P tag.
                var p = document.createElement('p');
                while (element.firstChild) {
                    p.appendChild(element.firstChild);
                }

                dfx.insertBefore(element, p);
            } else {
                // This is element is already the specified type remove the element.
                while (element.firstChild) {
                    dfx.insertBefore(element, element.firstChild);
                }
            }

            if (type === 'pre') {
                this._convertNewLineToBr(element);
            }

            dfx.remove(element);
        } else if (type === 'blockquote') {
            var newElem = document.createElement(type);
            dfx.insertBefore(element, newElem);

            if (dfx.isTag(element, 'p') === true) {
                newElem.appendChild(element);
            } else if (dfx.getTag('p', element).length > 0) {
                while (element.firstChild) {
                    newElem.appendChild(element.firstChild);
                }

                dfx.remove(element);
            } else {
                var p = document.createElement('p');
                newElem.appendChild(p);
                while (element.firstChild) {
                    p.appendChild(element.firstChild);
                }

                dfx.remove(element);
            }

            return newElem;
        } else {
            var newElem = document.createElement(type);

            if (isBlockQuote === true && (type === 'p' || type === 'pre')) {
                for (var childPTag = element.firstChild; childPTag; childPTag = childPTag.nextSibling) {
                    while (childPTag.firstChild) {
                        newElem.appendChild(childPTag.firstChild);
                    }
                }
            } else if (isBlockQuote === true && type.match(/^h\d$/)) {
                while (element.firstChild) {
                    newElem.appendChild(element.firstChild);
                }

                var pTag = dfx.getTag('p', newElem)[0];
                while (pTag.firstChild) {
                    newElem.appendChild(pTag.firstChild);
                }

                dfx.remove(pTag);
            } else if (isBlockQuote === true && type === 'div') {
                var childPTags = dfx.getTag('p', element);
                for (var i = 0; i < childPTags.length; i++) {
                    var childPTag = childPTags[i];

                    var div = document.createElement('div');
                    dfx.insertBefore(element, div);
                    while (childPTag.firstChild) {
                        div.appendChild(childPTag.firstChild);
                    }
                }

                newElem = null;
            } else if (type.match(/^h\d$/)) {
                while (element.firstChild) {
                    if (dfx.isBlockElement(element.firstChild) === true) {
                        var firstChild = element.firstChild;
                        if (dfx.isTag(firstChild, 'blockquote') === true) {
                            firstChild = firstChild.firstChild;
                        }

                        while (firstChild.firstChild) {
                            newElem.appendChild(firstChild.firstChild);
                        }

                        dfx.remove(element.firstChild);
                    } else {
                        newElem.appendChild(element.firstChild);
                    }
                }
            } else {
                while (element.firstChild) {
                    newElem.appendChild(element.firstChild);
                }
            }

            if (newElem) {
                if (type === 'pre') {
                    this._convertBrToNewLine(newElem);
                } else if (dfx.isTag(element, 'pre') === true) {
                    this._convertNewLineToBr(newElem);
                }

                dfx.insertBefore(element, newElem);
            }

            dfx.remove(element);

            return newElem;
        }

        return null;

    },

    _convertBrToNewLine: function(element)
    {
        var brTags = dfx.getTag('br', element);
        for (var i = 0; i < brTags.length; i++) {
            var node = document.createTextNode("\n");
            dfx.insertBefore(brTags[i], node);
            dfx.remove(brTags[i]);
        }

    },

    _convertNewLineToBr: function(element)
    {
        if (element.nodeType === dfx.TEXT_NODE) {
            var nlIndex = -1;

            do {
                nlIndex = element.data.lastIndexOf("\n");
                if (nlIndex >= 0) {
                    var newNode = element.splitText(nlIndex);
                    var br      = document.createElement('br');
                    dfx.insertBefore(newNode, br);

                    if (newNode.data.length === 1) {
                        dfx.remove(newNode);
                    } else {
                        newNode.data = newNode.data.substring(1, newNode.data.length);
                    }
                }
            } while (nlIndex >= 0);
        } else {
            var textNodes = dfx.getTextNodes(element);
            var c         = textNodes.length;
            for (var i = 0; i < c; i++) {
                var textNode = textNodes[i];
                this._convertNewLineToBr(textNode);
            }
        }

    },

    _handleTopLevelFormat: function(type, range)
    {
        var bookmark = this.viper.createBookmark();

        // Find the block parent before and after the bookmarks.
        var elements = [];

        // Elements before..
        var node     = bookmark.start;
        while (node && dfx.isBlockElement(node) === false) {
            elements.unshift(node);
            node = node.previousSibling;
        }

        var insideSelection = dfx.getElementsBetween(bookmark.start, bookmark.end);
        var count = insideSelection.length;
        for (var i = 0; i < count; i++) {
            if (dfx.isBlockElement(insideSelection[i]) === true && dfx.isStubElement(insideSelection[i]) === false) {
                var group = [];
                for (var j = 0; j < insideSelection[i].childNodes.length; j++) {
                    group.push(insideSelection[i].childNodes[j]);
                }
                elements.push(group);
            } else {
                elements.push(insideSelection[i]);
            }
        }

        // Elements after..
        node = bookmark.end;
        while (node && dfx.isBlockElement(node) === false) {
            elements.push(node);
            node = node.nextSibling;
        }

        if (elements.length === 0) {
            return;
        }

        var newBlock    = document.createElement(type);
        var prevBlock   = newBlock;
        dfx.insertBefore(elements[0], newBlock);

        var c = elements.length;
        for (var i = 0; i < c; i++) {
            if (elements[i] instanceof Array) {
                newBlock = document.createElement(type);
                for (var j = 0; j < elements[i].length; j++) {
                    newBlock.appendChild(elements[i][j]);
                }

                dfx.insertAfter(prevBlock, newBlock);
                prevBlock = newBlock;
                newBlock = null;
            } else {
                if (!newBlock) {
                    newBlock = document.createElement(type);
                    dfx.insertAfter(prevBlock, newBlock);
                    prevBlock = newBlock;
                }

                newBlock.appendChild(elements[i]);
            }
        }

        this.viper.selectBookmark(bookmark);

        this.viper.fireNodesChanged([this.viper.getViperElement()]);
        this.viper.fireSelectionChanged(null, true);

    },

    _getFormat: function(startNode)
    {
        while (startNode.parentNode) {
            if (startNode === document) {
                return null;
            }

            if (startNode.tagName) {
                var tagName = startNode.tagName.toLowerCase();
                if (this.styleTags[tagName]) {
                    return tagName;
                }
            }

            startNode = startNode.parentNode;
        }

        return null;

    },

    _addChangeTrackInfo: function(node)
    {
        if (ViperChangeTracker.isTracking() === true) {
            ViperChangeTracker.addChange('textFormatChange', [node]);
        }

    }

};