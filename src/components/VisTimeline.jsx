import { Component, createElement, createRef } from "react";
import { createPortal } from "react-dom";

import { Timeline, DataSet } from "vis-timeline/standalone";
import "../../node_modules/vis-timeline/dist/vis-timeline-graph2d.min.css";

export class VisTimeline extends Component {
    ref = createRef();
    timeline = null;
    resizeObserver = null;
    appliedMaxHeight = null;
    itemFlushHandle = null;
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

        // When no explicit max height is configured, bound the timeline to the available
        // viewport height so vis-timeline scrolls its body internally and keeps the
        // time-axis header pinned at the top.
        if (!this.props.maxHeight) {
            this.observeAutoHeight();
        }
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
            const updateOptions = {};

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
                    timelineStart &&
                    timelineEnd &&
                    (this.rangeStart?.getTime() !== timelineStart.getTime() ||
                        this.rangeEnd?.getTime() !== timelineEnd.getTime())
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
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        window.removeEventListener("resize", this.applyAutoHeight);
        if (this.itemFlushHandle != null && typeof window.cancelAnimationFrame === "function") {
            window.cancelAnimationFrame(this.itemFlushHandle);
        }
        if (this.timeline) {
            this.timeline.destroy();
        }
    }

    // Coalesce React commits of the item portals: vis calls the item template once per
    // drawn item during a single draw pass, so we flush once on the next frame rather than
    // re-rendering for every item.
    scheduleItemFlush = () => {
        if (this.itemFlushHandle != null) {
            return;
        }
        const schedule =
            typeof window.requestAnimationFrame === "function"
                ? window.requestAnimationFrame
                : cb => window.setTimeout(cb, 0);
        this.itemFlushHandle = schedule(() => {
            this.itemFlushHandle = null;
            if (this.timeline) {
                this.forceUpdate();
            }
        });
    };

    // Fill the space from the timeline's top down to the bottom of the viewport, so the
    // body scrolls internally (pinning the time-axis header) instead of the whole page
    // scrolling. No-op when a max height is explicitly configured.
    //
    // We cannot measure this reliably on the mount frame: on first page load Mendix runs
    // several async layout passes, so getBoundingClientRect().top reads wrong and the
    // timeline collapses to the minimum height. A ResizeObserver fires once the box has
    // actually settled (and again on later layout / viewport changes), so the height is
    // correct on first render without polling. applyAutoHeight only calls setOptions when
    // the value actually changes, so observing our own element cannot loop.
    observeAutoHeight = () => {
        if (typeof ResizeObserver === "function" && this.ref.current) {
            this.resizeObserver = new ResizeObserver(this.applyAutoHeight);
            this.resizeObserver.observe(this.ref.current);
        }
        window.addEventListener("resize", this.applyAutoHeight);
        this.applyAutoHeight();
    };

    applyAutoHeight = () => {
        if (!this.timeline || this.props.maxHeight || !this.ref.current) {
            return;
        }
        const top = this.ref.current.getBoundingClientRect().top;
        const available = Math.max(150, Math.round(window.innerHeight - top));
        if (available !== this.appliedMaxHeight) {
            this.appliedMaxHeight = available;
            this.timeline.setOptions({ maxHeight: `${available}px` });
        }
    };

    initialize = () => {
        const { itemData, groupData, mouseDown, mouseMove, mouseUp } = this.props;
        this.amountOfItems = itemData.length;
        this.amountOfGroups = groupData.length;
        this.items = new DataSet(itemData);
        this.groups = new DataSet(groupData);

        this.timeline = new Timeline(this.ref.current, this.items, this.groups, this.getOptions());

        this.timeline.on("rangechanged", this.onRangeChanged);
        this.timeline.on("mouseDown", mouseDown);
        this.timeline.on("mouseMove", mouseMove);
        this.timeline.on("mouseUp", mouseUp);
    };

    getOptions = () => {
        const {
            allowDragging,
            allowDraggingOtherGroup,
            maxHeight,
            stack,
            moveable,
            zoomSetting,
            minZoom,
            maxZoom,
            timelineStart,
            timelineEnd,
            onMove,
            groupHeightMode,
            dayStart,
            dayEnd
        } = this.props;
        // options to add later: format, zoomkey, tooltip settings, height & maxheight, moveable, timeaxisscale
        // item titles will be displayed as a tooltip.

        // Mendix passes numeric attributes as Big/decimal objects. vis-timeline validates
        // zoomMin/zoomMax as plain numbers and rejects the whole options object otherwise,
        // so coerce them here.
        const numericMinZoom = minZoom != null ? Number(minZoom) : undefined;
        const numericMaxZoom = maxZoom != null ? Number(maxZoom) : undefined;

        const options = {
            locale: mx.session.sessionData.locale.code,
            editable: {
                add: false, // If true, new items can be created by double tapping an empty space in the Timeline. See section Editing Items for a detailed explanation.
                updateTime: allowDragging, // If true, items can be dragged to another moment in time. See section Editing Items for a detailed explanation.
                updateGroup: allowDraggingOtherGroup, // If true, items can be dragged from one group to another. Only applicable when the Timeline has groups. See section Editing Items for a detailed explanation.
                remove: false, // If true, items can be deleted by first selecting them, and then clicking the delete button on the top right of the item. See section Editing Items for a detailed explanation.
                overrideItems: false // If true, item specific editable properties are overridden by timeline settings
            },
            tooltip: {
                delay: 100
            },
            showWeekScale: true,
            orientation: {
                axis: "top",
                item: "bottom"
            },
            type: "range",
            maxHeight: maxHeight ? maxHeight : "",
            stack,
            moveable,
            align: "left",
            zoomKey: zoomSetting === "scroll" || zoomSetting === "none" ? "" : zoomSetting,
            zoomable: zoomSetting !== "none",
            // Always give the timeline body its own vertical scroll so the pinned
            // time-axis header stays useful when there are many groups. A draggable
            // scrollbar is shown regardless of the zoom setting.
            verticalScroll: true,
            // When zooming is bound to the scroll wheel, keep the wheel dedicated to
            // zooming (vertical scrolling is done via the scrollbar). Without this the
            // wheel would scroll instead of zoom. For the key-based / none settings the
            // wheel scrolls vertically and only zooms while the zoom key is held.
            preferZoom: zoomSetting === "scroll",
            zoomMin: zoomSetting === "none" ? 7200000 : numericMinZoom,
            zoomMax: zoomSetting === "none" ? 315360000000000 : numericMaxZoom,
            start: timelineStart,
            end: timelineEnd,
            onMove,
            itemsAlwaysDraggable: { item: true, range: true },
            groupHeightMode: groupHeightMode ? groupHeightMode : "auto",
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
                    end: dayStart,
                    repeat: "daily"
                },
                {
                    id: "dayEnd",
                    start: dayEnd,
                    end: this.endOfDay,
                    repeat: "daily"
                }
            ]
        };

        if (this.props.hideWeekends) {
            options.hiddenDates.push({
                id: "hideWeekends",
                start: "2021-10-02 00:00:00",
                end: "2021-10-04 00:00:00",
                repeat: "weekly"
            });
        }

        this.rangeStart = timelineStart;
        this.rangeEnd = timelineEnd;

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
            // Paint newly drawn items right away instead of waiting until every item in
            // the dataset has been drawn. On first load vis only draws the items currently
            // in view, so the "all items drawn" check below may never be met and items
            // would otherwise stay blank until a scroll forced another draw.
            this.scheduleItemFlush();
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

        // remove the items from the portalItems list
        toRemove.forEach(item => {
            const itemIndex = this.portalItems.findIndex(obj => obj.item.id === item.id);
            if (itemIndex > -1) {
                this.portalItems.splice(itemIndex, 1);
            }
        });

        // Update the items in the timeline
        this.items.remove(toRemove);
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

        // remove the groups from the portalGroups list
        toRemove.forEach(group => {
            const groupIndex = this.portalGroups.findIndex(obj => obj.group.id === group.id);
            if (groupIndex > -1) {
                this.portalGroups.splice(groupIndex, 1);
            }
        });

        // Update the groups in the timeline
        this.groups.remove(toRemove);
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
        } else {
            return null;
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
        } else {
            return null;
        }
    }

    renderLoader() {
        if (this.ref.current) {
            const timelineloader = this.ref.current.querySelector(".vis-loading-screen");
            if (timelineloader) {
                return createPortal(this.props.loadingContent, timelineloader, 1);
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    render() {
        return (
            <div ref={this.ref} className="resource-scheduler">
                {this.renderLoader()}
                {this.renderGroups()}
                {this.renderItems()}
            </div>
        );
    }
}
