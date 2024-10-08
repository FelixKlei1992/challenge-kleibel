/**
 * Pimcore
 *
 * This source file is available under two different licenses:
 * - GNU General Public License version 3 (GPLv3)
 * - Pimcore Commercial License (PCL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 * @copyright  Copyright (c) Pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     GPLv3 and PCL
 */

pimcore.registerNS("pimcore.document.settings_abstract");
/**
 * @private
 */
pimcore.document.settings_abstract = Class.create({

    initialize: function(document) {
        this.document = document;
    },

    setDocumentType: function (field, newValue, oldValue) {
        if (!newValue.data.id) {
            return;
        }
        var allowedFields = ["controller", "template"];
        var form = this.getLayout().getForm();
        var element = null;

        for (var i = 0; i < allowedFields.length; i++) {
            element = form.findField(allowedFields[i]);
            if (element) {
                element.setValue(newValue.data[allowedFields[i]]);
            }
        }
    },

    getContentMainFields: function (collapsed) {

        if(collapsed !== true) {
            collapsed = false;
        }

        return {
            xtype:'fieldset',
            title: t('content_main_document'),
            collapsible: true,
            collapsed: collapsed,
            autoHeight:true,
            labelWidth: 200,
            defaultType: 'textfield',
            defaults: {width: 700},
            items :[
                {
                    fieldLabel: t("document"),
                    name: "contentMainDocumentPath",
                    value: this.document.data.contentMainDocumentPath,
                    fieldCls: "input_drop_target",
                    id: "contentMainDocumentPath_" + this.document.id,
                    listeners: {
                        "render": function (el) {
                            new Ext.dd.DropZone(el.getEl(), {
                                reference: this,
                                ddGroup: "element",
                                getTargetFromEvent: function(e) {
                                    return this.getEl();
                                }.bind(el),

                                onNodeOver : function(target, dd, e, data) {
                                    if (data.records.length === 1 && data.records[0].data.elementType === "document" && in_array(data.records[0].data.type, ["page", "snippet"])) {
                                        return Ext.dd.DropZone.prototype.dropAllowed;
                                    }
                                },

                                onNodeDrop : function (target, dd, e, data) {

                                    if(!pimcore.helpers.dragAndDropValidateSingleItem(data)) {
                                        return false;
                                    }

                                    data = data.records[0].data;
                                    if (data.elementType === "document" && in_array(data.type, ["page", "snippet"])) {
                                        this.setValue(data.path);
                                        return true;
                                    }
                                    return false;
                                }.bind(el)
                            });
                        }
                    }
                },
                {
                    xtype: "toolbar",
                    width: 700,
                    items: ["->", {
                        text:t("delete"),
                        iconCls:"pimcore_icon_delete",
                        autoWidth:true,
                        handler:function () {
                            Ext.MessageBox.confirm(t("are_you_sure"), t("all_content_will_be_lost"),
                                function (buttonValue) {
                                    if (buttonValue == "yes") {
                                        Ext.getCmp("contentMainDocumentPath_"
                                            + this.document.id).setValue("");
                                        Ext.Ajax.request({
                                            url:Routing.generate('pimcore_admin_document_page_changemaindocument'),
                                            method: 'PUT',
                                            params:{
                                                id: this.document.id,
                                                contentMainDocumentPath:""
                                            },
                                            success:function () {
                                                this.document.reload();
                                            }.bind(this)
                                        });
                                    }
                                }.bind(this));
                        }.bind(this)
                    }, {
                        text: t("open"),
                        iconCls: "pimcore_icon_open",
                        autoWidth: true,
                        handler: function () {
                            var mainPath = Ext.getCmp("contentMainDocumentPath_" + this.document.id).getValue();
                            pimcore.helpers.openDocumentByPath(mainPath);
                        }.bind(this)
                    },{
                        text:t("apply"),
                        iconCls:"pimcore_icon_apply",
                        autoWidth:true,
                        handler:function () {
                            Ext.MessageBox.confirm(t("are_you_sure"), t("all_content_will_be_lost"),
                                function (buttonValue) {
                                    if (buttonValue == "yes") {
                                        Ext.Ajax.request({
                                            url:Routing.generate('pimcore_admin_document_page_changemaindocument'),
                                            method: 'PUT',
                                            params:{
                                                id: this.document.id,
                                                contentMainDocumentPath:Ext.getCmp(
                                                    "contentMainDocumentPath_" + this.document.id).getValue()
                                            },
                                            success:function () {
                                                this.document.resetChanges();
                                                this.document.reload();
                                            }.bind(this)
                                        });
                                    }
                                }.bind(this));
                        }.bind(this)
                    }]
                }
            ]
        };
    },

    getPathAndKeyFields: function (collapsed) {

        if(collapsed !== true) {
            collapsed = false;
        }

        return {
            xtype:'fieldset',
            title: t('path') + ", " + t('key') + " & " + t('id'),
            collapsible: true,
            collapsed: collapsed,
            autoHeight:true,
            defaultType: 'textfield',
            defaults: {
                width: 700,
                labelWidth: 200
            },
            items :[
                {
                    fieldLabel: t('path'),
                    name: 'path',
                    value: this.document.data.path,
                    disabled: true
                },
                {
                    fieldLabel: t('key'),
                    name: 'key',
                    value: this.document.data.key,
                    disabled: true
                },
                {
                    fieldLabel: t('id'),
                    name: 'id',
                    value: this.document.data.id,
                    disabled: true
                }
            ]
        };
    },

    getControllerViewFields: function (collapsed) {

        if(collapsed !== true) {
            collapsed = false;
        }

        var docTypeStore = new Ext.data.Store({
            proxy: {
                url: Routing.generate('pimcore_admin_document_document_getdoctypes', {type: this.document.getType()}),
                type: 'ajax',
                reader: {
                    type: 'json',
                    rootProperty: "docTypes"
                }
            },
            fields: ["id","controller", "template",{
               name: 'name',
               convert: function(v, rec) {
                   return (rec['data']['group'] ? t(rec['data']['group']) + ' > ' : '') + t(rec['data']['name']);
               }
            }]

        });

        var docTypeValue = this.document.data.docType;
        if (docTypeValue < 1) {
            docTypeValue = "";
        }

        var fieldSet = new Ext.form.FieldSet({
            title: t('controller') + ", " + t('action') + " & " + t('template'),
            id: "pimcore_document_settings_" + this.document.id,
            collapsible: true,
            collapsed: collapsed,
            autoHeight:true,
            defaultType: 'textfield',
            items :[
                {
                    fieldLabel: t('predefined_document_type'),
                    name: 'docType',
                    xtype: "combo",
                    displayField:'name',
                    valueField: "id",
                    store: docTypeStore,
                    editable: false,
                    triggerAction: 'all',
                    value: docTypeValue,
                    listeners: {
                        "select": this.setDocumentType.bind(this)
                    }
                },
                {
                    xtype:'combo',
                    fieldLabel: t('controller'),
                    displayField: 'name',
                    valueField: 'name',
                    name: "controller",
                    typeAhead: true,
                    queryMode: "local",
                    anyMatch: true,
                    editable: true,
                    forceSelection: false,
                    store: new Ext.data.Store({
                        autoDestroy: true,
                        autoLoad: false,
                        proxy: {
                            type: 'ajax',
                            url: Routing.generate('pimcore_admin_misc_getavailablecontroller_references'),
                            reader: {
                                type: 'json',
                                rootProperty: 'data'
                            }
                        },
                        fields: ["name"]
                    }),
                    listeners: {
                        afterrender: function (el) {
                            el.getStore().load();
                        }
                    },
                    triggerAction: "all",
                    value: this.document.data.controller,
                    matchFieldWidth: false,
                    listConfig: {
                        maxWidth: 600
                    }
                },
                {
                    xtype:'combo',
                    fieldLabel: t('template'),
                    displayField: 'path',
                    valueField: 'path',
                    name: "template",
                    typeAhead: true,
                    queryMode: "local",
                    anyMatch: true,
                    editable: true,
                    forceSelection: false,
                    store: new Ext.data.Store({
                        autoDestroy: true,
                        autoLoad: false,
                        proxy: {
                            type: 'ajax',
                            url: Routing.generate('pimcore_admin_misc_getavailabletemplates'),
                            reader: {
                                type: 'json',
                                rootProperty: 'data'
                            }
                        },
                        fields: ["path"]
                    }),
                    listeners: {
                        afterrender: function (el) {
                            el.getStore().load();
                        }
                    },
                    triggerAction: "all",
                    value: this.document.data.template,
                    matchFieldWidth: false,
                    listConfig: {
                        maxWidth: 600
                    }
                }
            ],
            defaults: {
                labelWidth: 300,
                width: 850,
                listeners: {
                    "change": function (field, checked) {
                        Ext.getCmp("pimcore_document_settings_" + this.document.id).dirty = true;
                    }.bind(this)
                },
            }

        });

        return fieldSet;
    },

    getStaticGeneratorFields: function (collapsed) {
        let lastGenerated = '';

        if(collapsed !== true) {
            collapsed = false;
        }

        if (this.document.data.staticLastGenerated) {
            const date = new Date(this.document.data.staticLastGenerated * 1000);
            lastGenerated = Ext.Date.format(date, pimcore.globalmanager.get('localeDateTime').getShortDateTimeFormat());
        }else{
            lastGenerated = t('never');
        }
        
        return {
            xtype:'fieldset',
            title: t('static_generator'),
            collapsible: true,
            collapsed: collapsed,
            autoHeight:true,
            defaultType: 'textfield',
            defaults: {
                labelWidth: 300,
                width: 850
            },
            items :[
                {
                    boxLabel: t('static_generator_enable'),
                    xtype: 'checkbox',
                    name: 'staticGeneratorEnabled',
                    checked: this.document.data.staticGeneratorEnabled
                },
                {
                    fieldLabel: t('static_generator_lifetime'),
                    labelWidth: 300,
                    xtype: 'numberfield',
                    name: 'staticGeneratorLifetime',
                    value: this.document.data.staticGeneratorLifetime,
                    width: 400,
                }, {
                    xtype: "displayfield",
                    value: t("last_generated") + ": " + lastGenerated,
                    hidden: !this.document.data.staticGeneratorEnabled
                }
            ]
        };
    },

    getValues: function () {

        if (!this.layout.rendered) {
            throw "settings not available";
        }

        return this.getLayout().getForm().getFieldValues();
    }
});
