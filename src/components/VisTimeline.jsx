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
    amountOfGroups = null;
    portalItemCounter = 0;
    portalGroupCounter = 0;
    startOfDay = new Date(2023, 8, 14, 0, 0, 0, 0);
    endOfDay = new Date(2023, 8, 15, 0, 0, 0, 0);
    rangeStart = null;
    rangeEnd = null;
    items = null;
    groups = null;
    state = {
        amountOfItemPortals: 0,
        amountOfGroupPortals: 0
    };

    componentDidMount() {
        this.initialize();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.timeline) {
            const { groupData, itemData, dayStart, dayEnd, hideWeekends, timelineStart, timelineEnd } = this.props;

            // Check if the datasource has changed
            if (prevProps.itemData !== itemData) {
                this.updateItems();
            }
            if (prevProps.groupData !== groupData) {
                this.updateGroups();
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
            if (
                prevProps.timelineStart?.getTime() !== timelineStart?.getTime() ||
                prevProps.timelineEnd?.getTime() !== timelineEnd?.getTime()
            ) {
                if (
                    this.rangeStart.getTime() !== timelineStart.getTime() ||
                    this.rangeEnd.getTime() !== timelineEnd.getTime()
                ) {
                    this.rangeStart = timelineStart;
                    this.rangeEnd = timelineEnd;
                    this.timeline.setWindow(timelineStart, timelineEnd);
                }
            }

            // Check if the rendered portals have changed
            if (
                (prevState.amountOfItemPortals !== this.state.amountOfItemPortals &&
                    this.state.amountOfItemPortals === this.amountOfItems) ||
                (prevState.amountOfGroupPortals !== this.state.amountOfGroupPortals &&
                    this.state.amountOfGroupPortals === this.amountOfGroups)
            ) {
                this.timeline.redraw();
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
        this.amountOfGroups = this.props.groupData.length;
        this.items = new DataSet(this.props.itemData);
        this.groups = new DataSet(this.props.groupData);

        this.timeline = new Timeline(this.ref.current, this.items, this.groups, this.getOptions());

        this.timeline.on("rangechanged", this.onRangeChanged);
        this.timeline.on("mouseDown", this.props.mouseDown);
        this.timeline.on("mouseMove", this.props.mouseMove);
        this.timeline.on("mouseUp", this.props.mouseUp);
    };

    getOptions = () => {
        // options to add later: format, zoomkey, tooltip settings, height & maxheight, moveable, timeaxisscale
        // item titles will be displayed as a tooltip.

        const options = {
            locale: mx.session.sessionData.locale.code,
            editable: {
                add: false, // If true, new items can be created by double tapping an empty space in the Timeline. See section Editing Items for a detailed explanation.
                updateTime: this.props.allowDragging, // If true, items can be dragged to another moment in time. See section Editing Items for a detailed explanation.
                updateGroup: this.props.allowDraggingOtherGroup, // If true, items can be dragged from one group to another. Only applicable when the Timeline has groups. See section Editing Items for a detailed explanation.
                remove: false, // If true, items can be deleted by first selecting them, and then clicking the delete button on the top right of the item. See section Editing Items for a detailed explanation.
                overrideItems: false // If true, item specific editable properties are overridden by timeline settings
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
            maxHeight: this.props.maxHeight ? this.props.maxHeight : "",
            stack: this.props.stack,
            moveable: this.props.moveable,
            zoomKey:
                this.props.zoomSetting === "scroll" || this.props.zoomSetting === "none" ? "" : this.props.zoomSetting,
            zoomable: this.props.zoomSetting !== "none",
            start: this.props.timelineStart,
            end: this.props.timelineEnd,
            onMove: this.props.onMove,
            itemsAlwaysDraggable: { item: true, range: true },
            groupHeightMode: this.props.groupHeightMode ? this.props.groupHeightMode : "auto",
            horizontalScroll: false,
            template: this.itemTemplateHandler,
            groupTemplate: this.groupTemplateHandler,
            margin: {
                item: {
                    horizontal: 0,
                    vertical: 10
                },
                axis: 5 // minimal margin between items and the axis
            },
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
                return "";
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
        const itemExists = this.portalItems.some(entry => entry.item.id === item.id);
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

        // Check if the group is already in the portalGroups list
        const groupExists = this.portalGroups.some(entry => entry.group.id === group.id);

        if (groupExists) {
            // If the group exists, set the element again (needed for nested groups)
            const existingGroupIndex = this.portalGroups.findIndex(entry => entry.group.id === group.id);
            this.portalGroups[existingGroupIndex].element = element;
        } else {
            // If the group doesn't exist, add it to the portalGroups list
            this.portalGroups.push({ group, element });
        }

        // Check if all the groups have been rendered in the dom so we can render all reactnodes.
        if (this.amountOfGroups === this.portalGroups.length) {
            this.forceUpdate();
        }

        // return react div here, for some reason that makes it work... DO NOT REMOVE
        return <div></div>;
    }

    updateItems = () => {
        const { itemData } = this.props;

        // First set the amount of items we expect from Mendix so we know when to render the nodes
        this.amountOfItems = itemData.length;

        // Then check if we need to remove old items that dont exist in the latest Mx data
        const toRemove = this.items.get({
            filter: item => !itemData.find(i => i.id === item.id)
        });
        this.items.remove(toRemove);

        // Run the update function based on the latest Mx data
        this.items.update(itemData);
    };

    updateGroups = () => {
        const { groupData } = this.props;

        // First set the amount of groups we expect from Mendix so we know when to render the nodes
        this.amountOfGroups = groupData.length;

        // Check if we need to remove old items that dont exist in the latest Mx data
        const toRemove = this.groups.get({
            filter: group => !groupData.find(g => g.id === group.id)
        });
        this.groups.remove(toRemove);

        // Run the update function based on the latest Mx data
        this.groups.update(groupData);
    };

    onRangeChanged = view => {
        if (this.rangeStart?.getTime() !== view.start.getTime() || this.rangeEnd?.getTime() !== view.end.getTime()) {
            this.rangeStart = view.start;
            this.rangeEnd = view.end;
            this.props.onRangeChanged(view.start, view.end);
        }
    };

    renderItems() {
        if (this.portalItems) {
            return this.portalItems.map(obj => {
                const { item, element } = obj;
                if (!element.innerHTML && this.portalItemCounter <= this.amountOfItems) {
                    this.portalItemCounter += 1;
                    if (this.portalItemCounter === this.amountOfItems) {
                        this.setState({ amountOfItemPortals: this.portalItemCounter });
                    }
                }
                return createPortal(item.content, element, item.id);
            });
        }
    }

    renderGroups() {
        if (this.portalGroups) {
            return this.portalGroups.map(obj => {
                const { group, element } = obj;
                if (!element.innerHTML && this.portalGroupCounter <= this.amountOfGroups) {
                    if (this.portalGroupCounter === this.amountOfGroups) {
                        this.setState({ amountOfGroupPortals: this.portalGroupCounter });
                    }
                }
                return createPortal(group.content, element, group.id);
            });
        }
    }

    renderLoader() {
        if (this.ref.current) {
            const timelineloader = this.ref.current.querySelector(".vis-loading-screen");
            if (timelineloader) {
                return createPortal(this.props.loadingContent, timelineloader, 1);
            }
        }
    }

    redraw = () => {
        // temporary test function
        if (this.timeline) {
            this.timeline.redraw();
        }
    };

    render() {
        return (
            <div ref={this.ref} className="resource-scheduler">
                {this.renderLoader()}
                {this.renderGroups()}
                {this.renderItems()}
                <button onClick={this.redraw}>redraw test</button>
            </div>
        );
    }
}
