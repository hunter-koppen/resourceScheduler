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
    startOfDay = new Date(2023, 8, 14, 0, 0, 0, 0);
    endOfDay = new Date(2023, 8, 15, 0, 0, 0, 0);
    rangeStart = null;
    rangeEnd = null;

    componentDidMount() {
        this.initialize();
    }

    componentDidUpdate(prevProps) {
        if (this.timeline) {
            const { groupData, itemData, dayStart, dayEnd, hideWeekends, timelineStart, timelineEnd } = this.props;
            if (prevProps.groupData !== groupData) {
                this.timeline.setGroups(groupData);
            }
            if (prevProps.itemData !== itemData) {
                this.amountOfItems = itemData.length;
                this.timeline.setItems(itemData);
            }

            // Check if any options changed
            let updateOptions = {};

            const hiddenDates = this.timeline.options.hiddenDates;
            if (prevProps.dayStart.getTime() !== dayStart.getTime()) {
                const dayStartIndex = hiddenDates.findIndex(obj => obj.id === "dayStart");
                hiddenDates[dayStartIndex].end = dayStart;
                updateOptions.hiddenDates = hiddenDates;
            }
            if (prevProps.dayEnd.getTime() !== dayEnd.getTime()) {
                const dayEndIndex = hiddenDates.findIndex(obj => obj.id === "dayEnd");
                hiddenDates[dayEndIndex].start = dayEnd;
                updateOptions.hiddenDates = hiddenDates;
            }
            if (prevProps.hideWeekends !== hideWeekends) {
                if (hideWeekends) {
                    hiddenDates.push({
                        id: "hideWeekends",
                        start: "2021-10-02 00:00:00",
                        end: "2021-10-04 00:00:00",
                        repeat: "weekly"
                    });
                } else {
                    const hideWeekendsIndex = hiddenDates.findIndex(obj => obj.id === "hideWeekends");
                    hiddenDates.splice(hideWeekendsIndex, 1);
                    updateOptions.hiddenDates = hiddenDates;
                }
            }
            if (Object.keys(updateOptions).length > 0) {
                this.timeline.setOptions(updateOptions);
            }

            // Check if the timeline view range has changed
            if (prevProps.timelineStart.getTime() !== timelineStart.getTime() || prevProps.timelineEnd.getTime() !== timelineEnd.getTime()) {
                this.rangeStart = timelineStart;
                this.rangeEnd = timelineStart;
                this.timeline.setWindow(timelineStart, timelineEnd);
            }
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

        this.timeline.on("rangechanged", this.onRangeChanged);
    };

    getOptions = () => {
        // options to add later: format, zoomkey, tooltip settings, height & maxheight, moveable, timeaxisscale
        // item titles will be displayed as a tooltip.

        const options = {
            locale: mx.session.sessionData.locale.code,
            editable: {
                add: false, // If true, new items can be created by double tapping an empty space in the Timeline. See section Editing Items for a detailed explanation.
                updateTime: true, // If true, items can be dragged to another moment in time. See section Editing Items for a detailed explanation.
                updateGroup: false, // If true, items can be dragged from one group to another. Only applicable when the Timeline has groups. See section Editing Items for a detailed explanation.
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
            start: this.props.timelineStart,
            end: this.props.timelineEnd,
            groupHeightMode: this.props.groupHeightMode ? this.props.groupHeightMode : "auto",
            horizontalScroll: false,
            template: this.itemTemplateHandler,
            groupTemplate: this.groupTemplateHandler,
            hiddenDates: [
                {
                    id: "dayStart",
                    start: this.startOfDay,
                    end: this.props.dayStart,
                    repeat: "daily"
                },
                {
                    id: "dayEnd",
                    start: this.props.dayEnd,
                    end: this.endOfDay,
                    repeat: "daily"
                }
            ],
            loadingScreenTemplate: () => {
                return "<h4>Loading...</h4>";
            }
        };

        if (this.props.hideWeekends) {
            options.hiddenDates.push({
                id: "hideWeekends",
                start: "2021-10-02 00:00:00",
                end: "2021-10-04 00:00:00",
                repeat: "weekly"
            });
        }

        this.rangeStart = this.props.timelineStart;
        this.rangeEnd = this.props.timelineEnd;

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

    redraw = () => {
        if (this.timeline) {
            this.timeline.redraw();
        }
    };

    onRangeChanged = (view) => {
        if (this.rangeStart?.getTime() !== view.start.getTime() || this.rangeEnd?.getTime() !== view.end.getTime()) {
            this.rangeStart = view.start;
            this.rangeEnd = view.end;
            //this.props.onRangeChanged(view.start, view.end); event for ranged changed later
        }
    }

    render() {
        return (
            <div ref={this.ref} className="resource-scheduler">
                {this.renderPortalGroups()}
                {this.renderPortalItems()}
                <button onClick={this.redraw}>redraw test</button>
            </div>
        );
    }
}
