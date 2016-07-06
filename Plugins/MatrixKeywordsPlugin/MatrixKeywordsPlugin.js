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
	function MatrixKeywordsPlugin(viper)
	{
	    this.viper       = viper;
	}

	Viper.PluginManager.addPlugin('MatrixKeywordsPlugin', MatrixKeywordsPlugin);

	MatrixKeywordsPlugin.prototype = {

	    init: function()
	    {
		    this._initToolbar();
	    },

	    _initToolbar: function()
	    {
		var toolbar = this.viper.PluginManager.getPlugin('ViperToolbarPlugin');
		if (!toolbar) {
		    return;
		}

		var prefix = 'MatrixKeywordsPlugin';
		var self  = this;
		var tools = this.viper.Tools;

		var btnGroup = tools.createButtonGroup('MatrixKeywordsPlugin:vtp:btnGroup');
		
		
		// create content
		var insertKeywordContent = document.createElement('div');
		var insertSnippetContent = document.createElement('div');
		
		// create buttons
		tools.createButton('insertKeywords', '', _('Insert Matrix Keywords'), 'Viper-keywords', null, true);
		tools.createButton('insertSnippets', '', _('Insert Matrix Snippet'), 'Viper-snippet', null, true);

		tools.addButtonToGroup('insertKeywords', prefix + ':vtp:btnGroup');
		tools.addButtonToGroup('insertSnippets', prefix + ':vtp:btnGroup');
		toolbar.addButton(btnGroup);
		
		// create bubble for keyword plugin
		toolbar.createBubble(prefix + ':vtp:keywords', _('Insert Matrix Keywords'), insertKeywordContent, null, null);
		
		// create bubble for snippet plugin
		toolbar.createBubble(prefix + ':vtp:snippet', _('Insert Matrix Snippet'), insertSnippetContent, null, null);
		
		// Keyword Insert Selection.
		var keywordSelect = this._createSelection(prefix + ':insertKeywordSelect', prefix + ':insertKeywordSelect', _('Keyword'), null);
		insertKeywordContent.appendChild(keywordSelect);
		
		// Snippet Insert Selection.
		var snippetSelect = this._createSelection(prefix + ':insertSnippetSelect', prefix + ':insertSnippetSelect', _('Snippet'), null);
		insertSnippetContent.appendChild(snippetSelect);

		
		
		
		// insert buttons
		var insertKeywordButton = tools.createButton(prefix + ':insertKeywordButton', _('Insert'), _('Insert'), 'Viper-insertButton', function() {
		    var keywordToInsert = tools.getItem(prefix + ':insertKeywordSelect').getValue();
		    if(typeof keywordToInsert !== 'undefined') {
			self._insertKeyword('%' + keywordToInsert + '%');
		    }
		}, false);
		var insertSnippetButton = tools.createButton(prefix + ':insertSnippetButton', _('Insert'), _('Insert'), 'Viper-insertButton', function() {
		    var keywordToInsert = tools.getItem(prefix + ':insertSnippetSelect').getValue();
		    if(typeof keywordToInsert !== 'undefined') {
			self._insertKeyword('%' + keywordToInsert + '%');
		    }
		}, false);
		
		insertKeywordContent.appendChild(insertKeywordButton);
		insertSnippetContent.appendChild(insertSnippetButton);
		
		
		toolbar.setBubbleButton(prefix + ':vtp:keywords', 'insertKeywords');
		toolbar.setBubbleButton(prefix + ':vtp:snippet', 'insertSnippets');
		
		    // Update the buttons when the toolbar updates it self.
		    // populate option lists for plugins
		    this.viper.registerCallback('ViperToolbarPlugin:updateToolbar', prefix, function() {
			var editableElement = self.viper.getEditableElement();
			
			// get the keywords current editting div
			var datasetKeywords = ViperUtil.$(editableElement).data('keywords');
			if(typeof datasetKeywords !== 'undefined' && datasetKeywords !== '') {
			    // make sure it's valid JSON assoicate array, not an array object.
			    if(typeof datasetKeywords.length === 'undefined') {
				// enable button and insert those keywords as options
				tools.enableButton('insertKeywords');
				var selectField  = tools.getItem(prefix + ':insertKeywordSelect');
				if(selectField.getValue() === null) {
				    tools.getItem(prefix + ':insertKeywordSelect').setValue(datasetKeywords);
				}
			    }
			}
			
			// get snippet for current div
			var datasetSnippets = ViperUtil.$(editableElement).data('snippets');
			    if(typeof datasetSnippets !== 'undefined' && datasetSnippets !== '') {
			    if(typeof datasetSnippets.length === 'undefined') {		
				// enable button and insert those snippets as options
				tools.enableButton('insertSnippets');
				var selectField  = tools.getItem(prefix + ':insertSnippetSelect');
				if(selectField.getValue() === null) {
				    tools.getItem(prefix + ':insertSnippetSelect').setValue(datasetSnippets);
				}
			    }
			}
		    });
	    },



	/**
	 * Creates a selecton dropdown.
	 *
	 * @parma {string}  id    The id of the selection field
	 * @parma {string}  name    The name of the selection field
	 * @param {string}  label   The label for the selection field
	 * @param {object} options the options assoiciate array (object)
	 *
	 * @return {DOMElement} The selection element.
	 */
	    _createSelection: function(id, name, label, options)
	    {
		var selectionArea = document.createElement('div');
		ViperUtil.addClass(selectionArea, 'Matrix-Viper-selection');

		var labelEl = document.createElement('label');
		ViperUtil.addClass(labelEl, 'Matrix-Viper-selection-label');
		selectionArea.appendChild(labelEl);

		var main = document.createElement('div');
		ViperUtil.addClass(main, 'Matrix-Viper-selection-main');
		labelEl.appendChild(main);

		var title = document.createElement('span');
		ViperUtil.addClass(title, 'Matrix-Viper-selection-title');
		ViperUtil.setHtml(title, label);
		
		// add padding-left css property to the title, 
		var width = 0;
		// Wrap the element in a generic class so the width calculation is correct
		// for the font size.
		var tmp = document.createElement('div');
		ViperUtil.addClass(tmp, 'ViperITP');

		if (navigator.userAgent.match(/iPad/i) !== null) {
		    ViperUtil.addClass(tmp, 'device-ipad');
		}
		ViperUtil.setStyle(tmp, 'display', 'block');
		tmp.appendChild(title);
		this.viper.addElement(tmp);
		width = (ViperUtil.getElementWidth(title) + 10) + 'px';
		tmp.parentNode.removeChild(tmp);
		ViperUtil.setStyle(main, 'padding-left', width);
		main.appendChild(title);

		var select = document.createElement("select");
		ViperUtil.addClass(select, 'Matrix-Viper-selection-input');
		select.setAttribute("name", name);
		select.setAttribute("id", id);



		// add initial options
		if (options !== null) {
		    for( var key in options) {
			if (options.hasOwnProperty(key)) {
			    var option = document.createElement("option");
			    option.setAttribute("value", key);
			    option.innerHTML = options[key];
			    select.appendChild(option);
			}
		    }
		}
	    
		// add the selection input to tool item stack
		this.viper.Tools.addItem(id, {
		    type: 'selection',
		    element: selectionArea,
		    input: select,
		    getValue: function() {
			if(select.length === 0) return null;
			var selected = select.options[select.selectedIndex];
			if(typeof selected === 'undefined') return null;
			return selected.value;
		    },
		    setValue: function(options) {
			 for( var key in options) {
			    if (options.hasOwnProperty(key)) {
				var option = document.createElement("option");
				option.setAttribute("value", key);
				option.innerHTML = options[key];
				select.appendChild(option);
			    }
			}
		    }
		});
		
		main.appendChild(select);
		
		return selectionArea;
	    },
	    
	    
	    /**
	 * Insert keyword to current cursor position
	 *
	 * @parma {string}  keyword    The keyword to insert
	 */
	    _insertKeyword: function(keyword)
	    {
		var range = this.viper.getViperRange();
		if (range.collapsed !== true) {
		    this.viper.deleteContents();

		    // Get the updated range.
		    range = this.viper.getViperRange();
		}

		var newNode = document.createTextNode(keyword);

		var startNode = range.getStartNode(); 
		if (ViperUtil.isStubElement(startNode) === true) { 
			ViperUtil.insertBefore(startNode, newNode) 
		}
		else {
			range.insertNode(newNode);
			range.setStart(newNode, keyword.length);
		}

		if (ViperUtil.isBrowser('msie') === true) {
		    range.moveStart('character', keyword.length);
		}

		range.collapse(true);
		ViperSelection.addRange(range);

		this.viper.fireNodesChanged([this.viper.getViperElement()]);
		this.viper.fireSelectionChanged(range);

	    }
		    
		    
	};
})(Viper.Util, Viper.Selection, Viper._);
