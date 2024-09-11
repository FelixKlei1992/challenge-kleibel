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

pimcore.registerNS("pimcore.document.snippet");
/**
 * @private
 */
pimcore.document.snippet = Class.create(pimcore.document.page_snippet, {

    initialize: function(id, options) {

        this.options = options;
        this.id = intval(id);
        this.setType("snippet");
        this.addLoadingPanel();

        const preOpenDocumentSnippet = new CustomEvent(pimcore.events.preOpenDocument, {
            detail: {
                document: this,
                type: "snippet"
            },
            cancelable: true
        });

        const isAllowed = document.dispatchEvent(preOpenDocumentSnippet);
        if (!isAllowed) {
            this.removeLoadingPanel();
            return;
        }

        this.getData();
    },

    init: function () {

        var user = pimcore.globalmanager.get("user");

        this.edit = new pimcore.document.edit(this);

        if (this.isAllowed("settings")) {
            this.settings = new pimcore.document.snippets.settings(this);
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

        if(pimcore.globalmanager.get('customReportsPanelImplementationFactory').hasImplementation()) {
            this.reports = pimcore.globalmanager.get('customReportsPanelImplementationFactory').getNewReportInstance("document_snippet");
        }
        this.tagAssignment = new pimcore.element.tag.assignment(this, "document");
        this.workflows = new pimcore.element.workflows(this, "document");
    },


    getTabPanel: function () {

        var items = [];
        var user = pimcore.globalmanager.get("user");

        items.push(this.edit.getLayout());

        if (this.isAllowed("settings")) {
            items.push(this.settings.getLayout());
        }
        if (this.isAllowed("properties") && this.properties) {
            items.push(this.properties.getLayout());

        }
        if (this.isAllowed("versions")) {
            items.push(this.versions.getLayout());
        }
        if (this.isAllowed("settings")) {
            items.push(this.scheduler.getLayout());
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
            if(this.edit.areaToolBar && this.edit.areaToolBar.targetGroup && this.edit.areaToolBar.targetGroup.getValue()) {
                parameters.appendEditables = "true";
            }
        }
        catch (e5) {
            //console.log(e5);
        }

        return parameters;
    }

});

