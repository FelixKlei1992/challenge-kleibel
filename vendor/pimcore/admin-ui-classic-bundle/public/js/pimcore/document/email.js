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

pimcore.registerNS("pimcore.document.email");
/**
 * @private
 */
pimcore.document.email = Class.create(pimcore.document.page_snippet, {

    initialize: function(id, options) {

        this.options = options;
        this.id = intval(id);
        this.setType("email");
        this.addLoadingPanel();

        const preOpenDocument = new CustomEvent(pimcore.events.preOpenDocument, {
            detail: {
                document: this,
                type: this.getType()
            },
            cancelable: true
        });

        const isAllowed = document.dispatchEvent(preOpenDocument);
        if (!isAllowed) {
            this.removeLoadingPanel();
            return;
        }

        this.getData();
    },

    init: function () {

        this.edit = new pimcore.document.edit(this);

        var user = pimcore.globalmanager.get("user");
        if (user.isAllowed("emails")) {
            this.logs = new pimcore.settings.email.log(this);
        }

        if (this.isAllowed("settings")) {
            this.settings = new pimcore.document.emails.settings(this);
            this.scheduler = new pimcore.element.scheduler(this, "document");
        }

        if (user.isAllowed("notes_events")) {
            this.notes = new pimcore.element.notes(this, "document");
        }

        if (this.isAllowed("properties")) {
            this.properties = new pimcore.document.properties(this, "document");
        }
        if (this.isAllowed("versions")) {
            this.versions = new pimcore.document.versions(this);
        }
        if (pimcore.settings.dependency) {
            this.dependencies = new pimcore.element.dependencies(this, "document");
        }

        this.preview = new pimcore.document.pages.preview(this);
        if(pimcore.globalmanager.get('customReportsPanelImplementationFactory').hasImplementation()) {
            this.reports = pimcore.globalmanager.get('customReportsPanelImplementationFactory').getNewReportInstance("document_snippet");
        }
        this.tagAssignment = new pimcore.element.tag.assignment(this, "document");
        this.workflows = new pimcore.element.workflows(this, "document");
    },

    getTabPanel: function () {
        var user = pimcore.globalmanager.get("user");

        var items = [];
        items.push(this.edit.getLayout());
        items.push(this.preview.getLayout());
        if (this.isAllowed("settings")) {
            items.push(this.settings.getLayout());
        }

        if (user.isAllowed("emails")) {
            items.push(this.logs.getLayout());
        }

        if (this.isAllowed("properties")) {
            items.push(this.properties.getLayout());
        }
        if (this.isAllowed("versions")) {
            items.push(this.versions.getLayout());
        }

        if (typeof this.dependencies !== "undefined") {
            items.push(this.dependencies.getLayout());
        }

        if(this.reports) {
            var reportLayout = this.reports.getLayout();
            if (reportLayout) {
                items.push(reportLayout);
            }
        }

        if (user.isAllowed("notes_events")) {
            items.push(this.notes.getLayout());
        }

        if (user.isAllowed("tags_assignment")) {
            items.push(this.tagAssignment.getLayout());
        }

        if (user.isAllowed("workflow_details") && this.data.workflowManagement && this.data.workflowManagement.hasWorkflowManagement === true) {
            items.push(this.workflows.getLayout());
        }

        this.tabbar = pimcore.helpers.getTabBar({items: items});
        return this.tabbar;
    },

    getSaveData : function (only) {

        var parameters = {};
        parameters.id = this.id;

        // get only scheduled tasks
        if (only == "scheduler") {
            try {
                parameters.scheduler = Ext.encode(this.scheduler.getValues());
                return parameters;
            }
            catch (e) {
                console.log("scheduler not available");
                return;
            }
        }


        // save all data allowed
        if (this.isAllowed("properties")) {
            // properties
            try {
                parameters.properties = Ext.encode(this.properties.getValues());
            }
            catch (e2) {
                //console.log(e2);
            }
        }

        if (this.isAllowed("settings")) {
            // settings
            try {
                parameters.settings = Ext.encode(this.settings.getValues());
            }
            catch (e3) {
                //console.log(e3);
            }

            // scheduler
            try {
                parameters.scheduler = Ext.encode(this.scheduler.getValues());
            }
            catch (e4) {
                //console.log(e4);
            }
        }

        // data
        try {
            parameters.data = Ext.encode(this.edit.getValues());
        }
        catch (e5) {
            //console.log(e5);
        }

        return parameters;
    },

    getLayoutToolbar : function ($super) {
        $super();

        const config = {
            text: t('send_test_email'),
            iconCls: "pimcore_material_icon_email pimcore_material_icon",
            scale: "medium",
            handler: function() {
                pimcore.helpers.sendTestEmail(
                    this.settings.document.data['from'] ?? pimcore.settings.mailDefaultAddress,
                    this.settings.document.data['to'],
                    this.settings.document.data['subject'],
                    'document', 
                    this.settings.document.data['path'] + this.settings.document.data['key'], 
                    null
                );
            }.bind(this)
        }

        if (pimcore.helpers.checkIfNewHeadbarLayoutIsEnabled()) {
            const submenu = this.toolbar.query('[cls*=pimcore_headbar_submenu]')[0];
            submenu.menu.add(config);
        } else {
            this.toolbar.add(
                new Ext.Button(config)
            );
        }

        return this.toolbar;
    }

});

