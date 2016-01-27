ViperAccessibilityPlugin_WCAG2 = {
    viper: null,
    vap: null,
    _contentElement: null,

    getReferenceContent: function(issue, callback, vap)
    {
        this.vap   = vap;
        this.viper = vap.viper;

        var code = this._parseCode(issue.code);

        var content = '<strong>' + code.standard + ' References</strong><br>';
        content    += '<em>Principle: </em> <a target="_blank" href="http://www.w3.org/TR/WCAG20/#' + code.principleName + '">' + Viper.Util.ucFirst(code.principleName) + '</a><br>';
        content    += '<em>Techniques: </em> ';

        var techStrs = [];
        for (var i = 0; i < code.techniques.length; i++) {
            techStrs.push('<a target="_blank" href="http://www.w3.org/TR/WCAG20-TECHS/' + code.techniques[i] + '">' + code.techniques[i] + '</a>');
        }

        content += techStrs.join(', ');

        var element = document.createElement('div');
        Viper.Util.setHtml(element, content);
        Viper.Util.addClass(element, 'Viper-issueWcag');

        callback.call(this, element);

    },

    getResolutionContent: function(issue, contentElement, vap, issueid)
    {
        this.vap   = vap;
        this.viper = vap.viper;

        var code    = this._parseCode(issue.code);
        var objName = 'ViperAccessibilityPlugin_WCAG2_Principle' + code.principle + '_Guideline' + code.guideline.replace('.', '_');
        var obj     = window[objName];
        if (obj) {
            var fn = obj['res_' + code.section.replace('.', '_')];
            if (Viper.Util.isFn(fn) === true) {
                obj.parent = this;
                fn.call(obj, contentElement, issue.element, issue, code, vap.viper, issueid);
            }

            return;
        } else if (Viper.build === true) {
            // If Viper build is being used then do not include any resolution files.
            return;
        }

        var url  = vap.viper.getViperPath();
        url     += '/Plugins/ViperAccessibilityPlugin/Resolutions/WCAG2/';
        url     += 'Principle' + code.principle + '/Guideline' + code.guideline.replace('.', '_');

        var scriptUrl = url + '/resolutions.js';
        var cssUrl    = url + '/resolutions.css';

        var self = this;
        vap.loadObject(scriptUrl, objName, function(obj) {
            if (!obj) {
                return;
            }

            if (obj.hasCss === true) {
                vap.includeCss(cssUrl);
            }

            obj.parent = self;

            var fn = obj['res_' + code.section.replace('.', '_')];
            if (Viper.Util.isFn(fn) === true) {
                fn.call(obj, contentElement, issue.element, issue, code, vap.viper, issueid);
            }
        });

    },

    addActionButton: function(action, resolutionContainer, widgetids, title, enabled, updateCallback)
    {
        title   = title || 'Apply Changes';

        var disabled = !enabled;
        var tools    = this.viper.Tools;
        var self     = this;
        var buttonid = Viper.Util.getUniqueId();
        var button   = tools.createButton(buttonid, title, title, 'Viper-VAP-actionBtn', function() {
            tools.disableButton(buttonid);

            var dismissBtn = Viper.Util.getClass('Viper-VAP-dismissBtn', resolutionContainer);
            if (dismissBtn.length === 1) {
                tools.disableButton(dismissBtn[0].id.replace(self.viper.getId() + '-', ''));
            }

            self.vap.fixIssue();
            self.viper.fireNodesChanged();
            return action.call(this);
        }, disabled);

        if (widgetids) {
            for (var i = 0; i < widgetids.length; i++) {
                if (!widgetids[i]) {
                    continue;
                }

                (function(widgetid) {
                    self.viper.registerCallback('ViperTools:changed:' + widgetid, 'ViperAccessibilityPlugin:wcag2', function() {
                        if (updateCallback && updateCallback.call(this, widgetid) === false) {
                            // Disable button.
                            tools.disableButton(buttonid);
                            return;
                        }

                        tools.enableButton(buttonid);
                    });
                }) (widgetids[i]);
            }
        }

        var actionButtons = Viper.Util.getClass('Viper-actionButtons', resolutionContainer)[0];
        if (actionButtons.firstChild) {
            var otherActionButtons = Viper.Util.getClass('Viper-VAP-actionBtn', actionButtons);
            if (otherActionButtons && otherActionButtons.length > 0) {
                Viper.Util.insertAfter(otherActionButtons[otherActionButtons.length - 1], button);
            } else {
                Viper.Util.insertBefore(actionButtons.firstChild, button);
            }
        } else {
            actionButtons.appendChild(button);
        }

        return buttonid;

    },

    removeActionButtons: function(resolutionContainer)
    {
        var actionButtons = Viper.Util.getClass('Viper-VAP-actionBtn', resolutionContainer);
        Viper.Util.remove(actionButtons);

    },

    getDefaultContent: function(issueid, issue, objName, vap)
    {
        this.vap   = vap;
        this.viper = vap.viper;

        if (!objName) {
            var code = this._parseCode(issue.code);
            objName  = 'ViperAccessibilityPlugin_WCAG2_Principle' + code.principle + '_Guideline' + code.guideline.replace('.', '_');
        }

        var div = document.createElement('div');
        Viper.Util.addClass(div, objName);

        var content = '<div class="Viper-resolutionInstructions">';

        switch (issue.type) {
            case HTMLCS.ERROR:
                content += '<p>Please resolve this issue manually and then click the refresh button to confirm that the issue is resolved.</p>';
            break;

            case HTMLCS.WARNING:
            case HTMLCS.NOTICE:
                content += '<p>Either fix this issue manually and then click the refresh button to confirm that the issue is resolved or, if no changes are required, click the "Dismiss" button.</p>';
            break;
        }

        content += '</div>';
        content += '<div class="Viper-resolutionActions"><div class="Viper-editing"></div><div class="Viper-actionButtons"></div></div>';
        Viper.Util.setHtml(div, content);

        if (issue.type !== HTMLCS.ERROR) {
            var actionButtons = Viper.Util.getClass('Viper-actionButtons', div)[0];

            var self = this;
            var buttonid = Viper.Util.getUniqueId();
            var dismissButton = this.viper.Tools.createButton(buttonid, 'Dismiss', 'Dismiss Issue', 'Viper-VAP-dismissBtn', function() {
                self.viper.Tools.disableButton(buttonid);
                self.vap.dismissIssue(issueid);
            });

            actionButtons.appendChild(dismissButton);
        }

        return div;

    },

    setResolutionInstruction: function(resolutionContainer, content)
    {
        var instructionCont = Viper.Util.getClass('Viper-resolutionInstructions', resolutionContainer)[0];

        if (typeof content === 'string') {
            Viper.Util.setHtml(instructionCont, content);
        } else {
            Viper.Util.empty(instructionCont);
            instructionCont.appendChild(content);
        }

    },

    getResolutionActionsContainer: function(resolutionContainer)
    {
        var instructionCont = Viper.Util.getClass('Viper-editing', resolutionContainer)[0];
        Viper.Util.empty(instructionCont);
        return instructionCont;

    },

    _parseCode: function(code)
    {
        var sections = code.split('.');
        var parsed   = {};
        parsed.standard = sections[0];

        if (sections[1].indexOf('Principle') === 0) {
            var principle = sections[1].replace('Principle', '');
            var principleName = '';
            switch (principle) {
                case '1':
                    principleName = 'perceivable';
                break;

                case '2':
                    principleName = 'operable';
                break;

                case '3':
                    principleName = 'understandable';
                break;

                case '4':
                    principleName = 'robust';
                break;
            }

            parsed.principle     = principle;
            parsed.principleName = principleName;
        }

        if (sections[2].indexOf('Guideline') === 0) {
            parsed.guideline = sections[2].replace('Guideline', '').replace('_', '.');
        }

        parsed.section = sections[3].replace('_', '.');

        parsed.techniques = [];

        var techniques = sections.splice(4, (sections.length - 1)).join('.');
        var techniques = techniques.split(',');
        for (var i = 0; i < techniques.length; i++) {
            parsed.techniques.push(techniques[i]);
        }

        return parsed;

    }

};
