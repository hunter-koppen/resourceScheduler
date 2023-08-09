import React, { Component, createElement, createRef } from "react";
import ReactDOM from 'react-dom'

import { Timeline, DataSet } from "vis-timeline/standalone";
import "../../node_modules/vis-timeline/dist/vis-timeline-graph2d.min.css";

export class VisTimeline extends Component {
    ref = createRef();
    timeline = null;
    templateHandler = this.template.bind(this);

    componentDidMount() {
        this.initialize();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.itemData !== this.props.itemData) {
            this.timeline.setItems(this.props.itemData);
        }
    }

    componentWillUnmount() {
        if (this.timeline) {
            this.timeline.destroy();
        }
    }

    initialize = () => {
        const items = new DataSet([
            { id: 1, content: "item 1", start: "2014-04-20", end: "2014-04-21", group: 1 },
            { id: 2, content: "item 2", start: "2014-04-14", end: "2014-04-21", group: 1 },
            { id: 3, content: "item 3", start: "2014-04-18", end: "2014-04-21", group: 1 },
            { id: 4, content: "item 4", start: "2014-04-16", end: "2014-04-17", group: 1 },
            { id: 5, content: "item 5", start: "2014-04-25", end: "2014-04-26", group: 1 },
            { id: 6, content: "item 6", start: "2014-04-27", end: "2014-04-28", group: 1 }
        ]);

        const groups = [
            {
                id: 1,
                content: "Group 1",
                order: 1
                // Optional: a field 'className', 'style', 'order', [properties]
            }
        ];

        this.timeline = new Timeline(this.ref.current, this.props.itemData, groups, this.getOptions());
    };

    getOptions = () => {
        // options to add later: format, zoomkey, tooltip settings, height & maxheight, start & enddates, moveable, timeaxisscale
        // item titles will be displayed as a tooltip.

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
            zoomMin: 86400000, // 24 hours
            orientation: {
                axis: "top",
                item: "bottom"
            },
            type: "range",
            groupHeightMode: this.props.groupHeightMode ? this.props.groupHeightMode : "auto",
            horizontalScroll: false,
            template: this.templateHandler,
            loadingScreenTemplate: () => {
                return "<h1>Loading...</h1>";
            }
        };
        return options;
    };

    template(item, element, data) {
        if (!item) {
            return "";
        }
        let html = ReactDOM.render(<b>{item.content}</b>, element);
        return "test";
    }

    render() {
        return <div ref={this.ref} className="resource-scheduler"></div>;
    }
}
