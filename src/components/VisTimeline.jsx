import { Component, createElement, createRef } from "react";

import { Timeline, DataSet } from "vis-timeline/standalone";
import "../../node_modules/vis-timeline/dist/vis-timeline-graph2d.min.css";

export class VisTimeline extends Component {
    ref = createRef();
    timeline = null;

    componentDidMount() {
        this.initialize();
    }

    initialize = () => {
        const items = new DataSet([
            { id: 1, content: "item 1", start: "2014-04-20", group: 1 },
            { id: 2, content: "item 2", start: "2014-04-14", group: 1 },
            { id: 3, content: "item 3", start: "2014-04-18", group: 1 },
            { id: 4, content: "item 4", start: "2014-04-16", type: "range", end: "2014-04-19", group: 1 },
            { id: 5, content: "item 5", start: "2014-04-25", group: 1 },
            { id: 6, content: "item 6", start: "2014-04-27", type: "point", group: 1 }
        ]);

        const groups = [
            {
                id: 1,
                content: "Group 1",
                order: 1
                // Optional: a field 'className', 'style', 'order', [properties]
            }
        ];

        // options to add later: format, 

        const options = {
            editable: {
                add: true, // If true, new items can be created by double tapping an empty space in the Timeline. See section Editing Items for a detailed explanation.
                updateTime: true, // If true, items can be dragged to another moment in time. See section Editing Items for a detailed explanation.
                updateGroup: true, // If true, items can be dragged from one group to another. Only applicable when the Timeline has groups. See section Editing Items for a detailed explanation.
                remove: false, // If true, items can be deleted by first selecting them, and then clicking the delete button on the top right of the item. See section Editing Items for a detailed explanation.
                overrideItems: true // If true, item specific editable properties are overridden by timeline settings
            },
            groupHeightMode: this.props.groupHeightMode ? this.props.groupHeightMode : 'auto'
        };

        this.timeline = new Timeline(this.ref.current, items, groups, options);
    };

    render() {
        return <div ref={this.ref} className="resource-scheduler"></div>;
    }
}
