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

function ViperLangToolsPlugin(viper)
{
    this.viper = viper;

    this._originalRange = null;

}

ViperLangToolsPlugin.prototype = {

    init: function()
    {
        this._initToolbar();

    },

    rangeToTag: function(tagName, titleAttribute)
    {
        if (!titleAttribute) {
            return;
        }

        var range   = this.viper.getViperRange();
        var node    = range.getNodeSelection();
        var element = null;

        if (node) {
            if (dfx.isTag(node, tagName) === true) {
                // Update attribute.
                node.setAttribute('title', titleAttribute);
                element = node;
            } else {
                // There is a node selection but not of this tag, check if the tag
                // we are looking for is one of the parents.
                var nodeFromRange = this.getTagFromRange(range, tagName);
                if (nodeFromRange) {
                    nodeFromRange.setAttribute('title', titleAttribute);
                    element = nodeFromRange;
                } else {
                    element = document.createElement(tagName);
                    element.setAttribute('title', titleAttribute);

                    dfx.insertBefore(node, element);
                    element.appendChild(node);
                }
            }
        } else {
            var bookmark = this.viper.createBookmark(range);
            element = document.createElement(tagName);
            element.setAttribute('title', titleAttribute);

            var elems = dfx.getElementsBetween(bookmark.start, bookmark.end);
            var c     = elems.length;
            for (var i = 0; i < c; i++) {
                element.appendChild(elems[i]);
            }

            dfx.insertBefore(bookmark.start, element);

            this.viper.removeBookmark(bookmark);
        }//end if

        range.selectNode(element);
        ViperSelection.addRange(range);

        this.viper.fireSelectionChanged();
        this.viper.fireNodesChanged([this.viper.getViperElement()]);

        return element;

    },

    rangeToLang: function(langAttribute)
    {
        if (!langAttribute) {
            return;
        }

        var range   = this.viper.getViperRange();
        var node    = this.viper.getNodeSelection();
        var element = null;

        if ((node && node.nodeType !== dfx.TEXT_NODE) || range.collapsed === true) {
            if (!node) {
                var node = range.getStartNode();
                if (!node) {
                    node = range.getEndNode();
                    if (!node) {
                        return null;
                    }
                }

                if (node.nodeType === dfx.TEXT_NODE) {
                    node = node.parentNode;
                }
            }//end if

            node.setAttribute('lang', langAttribute);
            element = node;
        } else {
            var bookmark = this.viper.createBookmark(range);
            element = document.createElement('span');
            element.setAttribute('lang', langAttribute);

            var elems = dfx.getElementsBetween(bookmark.start, bookmark.end);
            var c     = elems.length;
            for (var i = 0; i < c; i++) {
                element.appendChild(elems[i]);
            }

            dfx.insertBefore(bookmark.start, element);

            this.viper.removeBookmark(bookmark);
        }//end if

        range.selectNode(element);
        ViperSelection.addRange(range);

        this.viper.fireSelectionChanged();
        this.viper.fireNodesChanged([this.viper.getViperElement()]);

        return element;

    },

    removeElement: function(elem)
    {
        if (!elem && elem.parentNode) {
            return;
        }

        var firstChild = elem.firstChild;
        var lastChild  = elem.lastChild;

        while (elem.firstChild) {
            dfx.insertBefore(elem, elem.firstChild);
        }

        dfx.remove(elem);

        var range = this.viper.getViperRange();
        if (firstChild === lastChild) {
            range.selectNode(firstChild);
        } else {
            range.setStart(firstChild, 0);

            if (lastChild.nodeType === dfx.TEXT_NODE) {
                range.setEnd(lastChild, lastChild.data.length);
            } else {
                var lastSelectable = range._getLastSelectableChild(lastChild);
                if (lastSelectable) {
                    range.setEnd(lastSelectable, lastSelectable.data.length);
                }
            }
        }//end if

        ViperSelection.addRange(range);
        this.viper.fireSelectionChanged(range, true);
        this.viper.fireNodesChanged([this.viper.getViperElement()]);

    },

    getTagFromRange: function(range, tagName)
    {
        var selectedNode = this.viper.getNodeSelection();
        if (selectedNode && selectedNode.nodeType === dfx.ELEMENT_NODE) {
            if (tagName && dfx.isTag(selectedNode, tagName) === true) {
                return selectedNode;
            } else if (tagName === 'lang' && dfx.hasAttribute(selectedNode, 'lang') === true) {
                return selectedNode;
            } else if (!tagName) {
                if (dfx.isTag(selectedNode, 'abbr') === true || dfx.isTag(selectedNode, 'acronym') === true) {
                    return selectedNode;
                } else if (dfx.hasAttribute(selectedNode, 'lang') === true) {
                    return selectedNode;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }

        var viperElem = this.viper.getViperElement();
        var common    = range.getCommonElement();
        while (common) {
            if (tagName) {
                if (dfx.isTag(common, tagName) === true) {
                    return common;
                } else if (tagName === 'lang' && dfx.hasAttribute(common, 'lang') === true) {
                    return common;
                }
            } else {
                if (dfx.isTag(common, 'abbr') === true || dfx.isTag(common, 'acronym') === true) {
                    return common;
                } else if (dfx.hasAttribute(common, 'lang') === true) {
                    return common;
                }
            }

            if (common === viperElem || dfx.isBlockElement(common) === true) {
                break;
            }

            common = common.parentNode;
        }

        return null;

    },

    /**
     * Returns list of parent elements that have only one child.
     *
     * @param node    {DOMNode} The child element to get parents of.
     * @param tagName {string}  The tag name filter.
     *
     * @return {array} Parent elements.
     */
    getSurroundingParents: function(node, tagName)
    {
        if (!node) {
            return;
        }

        var parents = [];
        var parent  = node.parentNode;
        while (parent) {
            var c = parent.childNodes.length;
            for (var i = 0; i < c; i++) {
                var child = parent.childNodes[i];
                if (child.nodeType == dfx.ELEMENT_NODE) {
                    if (child !== node) {
                        return parents;
                    }
                } else if (dfx.isBlank(dfx.trim(child.data)) !== true) {
                    return parents;
                }
            }

            if (!tagName || dfx.isTag(parent, tagName) === true) {
                parents.push(parent);
            }

            parent = parent.parentNode;
            node   = parent;
        }

        return parents;

    },

    handleAcronym: function()
    {
        var value = dfx.trim(this.viper.ViperTools.getItem('VLTP:acronymInput').getValue());

        if (value) {
            this.rangeToTag('acronym', value);
        } else {
            var node = this.viper.getViperRange().getNodeSelection();
            if (node) {
                if (dfx.isTag(node, 'acronym') !== true) {
                    var parents = this.getSurroundingParents(node, 'acronym');
                    for (var i = 0; i < parents.length; i++) {
                        this.removeElement(parents[i]);
                    }
                } else {
                    this.removeElement(node);
                }
            }
        }

    },

    handleAbbreviation: function()
    {
        var value = dfx.trim(this.viper.ViperTools.getItem('VLTP:abbrInput').getValue());

        if (value) {
            this.rangeToTag('abbr', value);
        } else {
            var node = this.viper.getViperRange().getNodeSelection();
            if (node) {
                if (dfx.isTag(node, 'abbr') !== true) {
                    var parents = this.getSurroundingParents(node, 'abbr');
                    for (var i = 0; i < parents.length; i++) {
                        this.removeElement(parents[i]);
                    }
                } else {
                    this.removeElement(node);
                }
            }
        }

    },

    handleLanguage: function()
    {
        var value = dfx.trim(this.viper.ViperTools.getItem('VLTP:langInput').getValue());

        if (value) {
            this.rangeToLang(value);
        } else {
            var node = this.viper.getViperRange().getNodeSelection();
            if (node) {
                if (node && dfx.hasAttribute(node, 'lang') === true) {
                    node.removeAttribute('lang');
                    if (!node.className && !node.id && dfx.isTag(node, 'span') === true) {
                        this.removeElement(node);
                    } else {
                        this.viper.fireNodesChanged();
                    }
                } else {
                    var parents = this.getSurroundingParents(node);
                    for (var i = 0; i < parents.length; i++) {
                        parents[i].removeAttribute('lang');
                        if (!parents[i].className && !parents[i].id && dfx.isTag(parents[i], 'span') === true) {
                            this.removeElement(parents[i]);
                        }
                    }
                }
            }
        }

    },

    getAcronymSubSection: function()
    {
        var self  = this;
        var elem  = document.createElement('div');
        var input = this.viper.ViperTools.createTextbox('VLTP:acronymInput', _('Acronym'));

        elem.appendChild(input);

        return elem;

    },

    getAbbreviationSubSection: function()
    {
        var self  = this;
        var elem  = document.createElement('div');
        var input = this.viper.ViperTools.createTextbox('VLTP:abbrInput', _('Abbreviation'));

        elem.appendChild(input);

        return elem;

    },

    getLangSubSection: function()
    {
        var self  = this;
        var elem  = document.createElement('div');
        var input = this.viper.ViperTools.createTextbox('VLTP:langInput', _('Language'));

        elem.appendChild(input);

        return elem;

    },

    _selectTag: function(tagName)
    {
        // Select the whole node.
        var range   = this._originalRange.cloneRange();
        var element = this.getTagFromRange(range, tagName);
        if (element) {
            range.selectNode(element);
            ViperSelection.addRange(range);
        }

    },

    _initToolbar: function()
    {
        var toolbar = this.viper.ViperPluginManager.getPlugin('ViperToolbarPlugin');
        if (!toolbar) {
            return;
        }

        var self  = this;
        var tools = this.viper.ViperTools;

        // Create the bubble.
        var contents = document.createElement('div');

        toolbar.createBubble('ViperLangToolsPlugin:bubble', _('Language Tools'), null, contents, function() {
            self._originalRange = self.viper.getViperRange().cloneRange();
        }, function() {
            tools.getItem('ViperLangToolsPlugin:bubble').hideSubSection();
        });

        var bubble = tools.getItem('ViperLangToolsPlugin:bubble');

        var toggleBtn = tools.createButton('langTools', '', _('Toggle Language Tools'), 'Viper-langTools', null, true);
        toolbar.setBubbleButton('ViperLangToolsPlugin:bubble', 'langTools');
        toolbar.addButton(toggleBtn);

        // Create all the buttons inside the bubble.
        var acronymButton = tools.createButton('ViperLangToolsPlugin:acronymButton', _('Acronym'), _('Toggle Acronym Options'), '', function() {
            bubble.showSubSection('VLTP:acronymSubSection');
            self._selectTag('acronym');
        });
        var abbrButton = tools.createButton('ViperLangToolsPlugin:abbrButton', _('Abbreviation'), _('Toggle Abbreviation Options'), '', function() {
            bubble.showSubSection('VLTP:abbreviationSubSection');
            self._selectTag('abbr');
        });
        var langButton = tools.createButton('ViperLangToolsPlugin:langButton', _('Language'), _('Toggle Language Options'), '', function() {
            bubble.showSubSection('VLTP:langSubSection');
            self._selectTag('lang');
        });
        contents.appendChild(acronymButton);
        contents.appendChild(abbrButton);
        contents.appendChild(langButton);

        // Subsections.
        bubble.addSubSection('VLTP:acronymSubSection', this.getAcronymSubSection());
        bubble.addSubSection('VLTP:abbreviationSubSection', this.getAbbreviationSubSection());
        bubble.addSubSection('VLTP:langSubSection', this.getLangSubSection());

        bubble.setSubSectionButton('VLTP:acronymSubSection', 'ViperLangToolsPlugin:acronymButton');
        bubble.setSubSectionButton('VLTP:abbreviationSubSection', 'ViperLangToolsPlugin:abbrButton');
        bubble.setSubSectionButton('VLTP:langSubSection', 'ViperLangToolsPlugin:langButton');

        bubble.setSubSectionAction('VLTP:acronymSubSection', function() {
            self.handleAcronym();
        }, ['VLTP:acronymInput']);
        bubble.setSubSectionAction('VLTP:abbreviationSubSection', function() {
            self.handleAbbreviation();
        }, ['VLTP:abbrInput']);
        bubble.setSubSectionAction('VLTP:langSubSection', function() {
            self.handleLanguage();
        }, ['VLTP:langInput']);

        this.viper.registerCallback('ViperToolbarPlugin:updateToolbar', 'ViperLangToolsPlugin', function(data) {
            tools.enableButton('langTools');

            if (data.range.collapsed === true) {
                tools.disableButton('langTools');
                tools.disableButton('ViperLangToolsPlugin:langButton');
                tools.disableButton('ViperLangToolsPlugin:abbrButton');
                tools.disableButton('ViperLangToolsPlugin:acronymButton');
            } else {
                var node = self.viper.getViperRange().getNodeSelection();
                tools.enableButton('ViperLangToolsPlugin:langButton');
                tools.enableButton('langTools');

                if (node && dfx.isBlockElement(node) === true) {
                    tools.disableButton('ViperLangToolsPlugin:abbrButton');
                    tools.disableButton('ViperLangToolsPlugin:acronymButton');
                } else {
                    tools.enableButton('ViperLangToolsPlugin:abbrButton');
                    tools.enableButton('ViperLangToolsPlugin:acronymButton');
                }
            }

            var range     = data.range;
            var tags      = ['acronym', 'abbr', 'lang'];
            var c         = tags.length;
            var hasActive = false;

            self.viper.ViperTools.getItem('VLTP:acronymInput').setValue('');
            self.viper.ViperTools.getItem('VLTP:abbrInput').setValue('');
            self.viper.ViperTools.getItem('VLTP:langInput').setValue('');

            tools.setButtonInactive('ViperLangToolsPlugin:abbrButton');
            tools.setButtonInactive('ViperLangToolsPlugin:acronymButton');
            tools.setButtonInactive('ViperLangToolsPlugin:langButton');

            for (var i = 0; i < c; i++) {
                var element = self.getTagFromRange(range, tags[i]);
                if (element) {
                    // Activate the button.
                    tools.setButtonActive('langTools');
                    hasActive = true;

                    // Also activate the button for the sub section buttons.
                    if (dfx.isTag(element, 'abbr') === true) {
                        // Abbreviation.
                        tools.setButtonActive('ViperLangToolsPlugin:abbrButton');
                        self.viper.ViperTools.getItem('VLTP:abbrInput').setValue(element.getAttribute('title'));
                    } else if (dfx.isTag(element, 'acronym') === true) {
                        // Acronym.
                        tools.setButtonActive('ViperLangToolsPlugin:acronymButton');
                        self.viper.ViperTools.getItem('VLTP:acronymInput').setValue(element.getAttribute('title'));
                    } else {
                        // Lang.
                        tools.setButtonActive('ViperLangToolsPlugin:langButton');
                        self.viper.ViperTools.getItem('VLTP:langInput').setValue(element.getAttribute('lang'));
                    }
                }//end if
            }//end for

            if (hasActive === false) {
                tools.setButtonInactive('langTools');
            }
        });

    }

};