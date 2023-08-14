import { Component, createElement, createRef } from "react";
import { createPortal } from "react-dom";

import { Timeline, DataSet } from "vis-timeline/standalone";
import "../../node_modules/vis-timeline/dist/vis-timeline-graph2d.min.css";

export class VisTimeline extends Component {
    ref = createRef();
    timeline = null;
    itemTemplateHandler = this.itemTemplate.bind(this);
    groupTemplateHandler = this.groupTemplate.bind(this);
    portalItems = [];
    portalGroups = [];
    amountOfItems = null;

    componentDidMount() {
        this.initialize();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.groupData !== this.props.groupData) {
            this.timeline.setGroups(this.props.groupData);
        }
        if (prevProps.itemData !== this.props.itemData) {
            this.amountOfItems = this.props.itemData.length;
            this.timeline.setItems(this.props.itemData);
        }
    }

    componentWillUnmount() {
        if (this.timeline) {
            this.timeline.destroy();
        }
    }

    initialize = () => {
        this.amountOfItems = this.props.itemData.length;
        this.timeline = new Timeline(this.ref.current, this.props.itemData, this.props.groupData, this.getOptions());
    };

    getOptions = () => {
        // options to add later: format, zoomkey, tooltip settings, height & maxheight, start & enddates, moveable, timeaxisscale
        // item titles will be displayed as a tooltip.
        const startOfDay = new Date(2023, 8, 14, 0, 0, 0, 0);
        const endOfDay = new Date(2023, 8, 15, 0, 0, 0, 0);

        const options = {
            locale: mx.session.sessionData.locale.code,
            editable: {
                add: true, // If true, new items can be created by double tapping an empty space in the Timeline. See section Editing Items for a detailed explanation.
                updateTime: true, // If true, items can be dragged to another moment in time. See section Editing Items for a detailed explanation.
                updateGroup: true, // If true, items can be dragged from one group to another. Only applicable when the Timeline has groups. See section Editing Items for a detailed explanation.
                remove: false, // If true, items can be deleted by first selecting them, and then clicking the delete button on the top right of the item. See section Editing Items for a detailed explanation.
                overrideItems: true // If true, item specific editable properties are overridden by timeline settings
            },
            tooltip: {
                delay: 100
            },
            showWeekScale: true,
            zoomMin: 7200000, // 2 hours
            orientation: {
                axis: "top",
                item: "bottom"
            },
            type: "range",
            stack: false,
            groupHeightMode: this.props.groupHeightMode ? this.props.groupHeightMode : "auto",
            horizontalScroll: false,
            template: this.itemTemplateHandler,
            groupTemplate: this.groupTemplateHandler,
            hiddenDates: [
                {
                    start: startOfDay,
                    end: this.props.dayStart,
                    repeat: "daily"
                },
                {
                    start: this.props.dayEnd,
                    end: endOfDay,
                    repeat: "daily"
                }
            ],
            loadingScreenTemplate: () => {
                return "<h4>Loading...</h4>";
            }
        };
        return options;
    };

    itemTemplate(item, element, data) {
        if (!item) {
            return "";
        }

        // Check if the item is already in the portalItems list
        const itemExists = this.portalItems.some(entry => entry.item === item);
        if (!itemExists) {
            this.portalItems.push({ item, element });
        }

        // Check if all the items have been rendered in the dom so we can render all reactnodes.
        if (this.amountOfItems === this.portalItems.length) {
            this.forceUpdate();
        }
        return "";
    }

    groupTemplate(group, element, data) {
        if (!group) {
            return "";
        }

        // Check if the item is already in the portalItems list
        const groupExists = this.portalGroups.some(entry => entry.group === group);
        if (!groupExists) {
            this.portalGroups.push({ group, element });
        }
        return "";
    }

    renderPortalItems() {
        return this.portalItems.map((portalItem, index) => {
            const { item, element } = portalItem;
            return createPortal(item.content, element, item.id);
        });
    }

    renderPortalGroups() {
        return this.portalGroups.map((portalGroup, index) => {
            const { group, element } = portalGroup;
            return createPortal(group.content, element, group.id);
        });
    }

    render() {
        return (
            <div ref={this.ref} className="resource-scheduler">
                {this.renderPortalGroups()}
                {this.renderPortalItems()}
            </div>
        );
    }
}
