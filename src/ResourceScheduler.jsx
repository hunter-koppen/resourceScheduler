import { Component, createElement } from "react";

import { VisTimeline } from "./components/VisTimeline";
import "./ui/ResourceScheduler.css";

export class ResourceScheduler extends Component {
    dragging = false;
    state = {
        initialize: false,
        groupData: [],
        appointmentData: [],
        backgroundData: []
    };

    componentDidUpdate(prevProps) {
        const { groupData, appointmentData, backgroundData, dayStart, dayEnd, hideWeekends } = this.props;
        // datasources are loaded so we can create timeline items from it
        if (prevProps.groupData?.status === "loading" && groupData?.status === "available") {
            this.generateGroups();
        }
        if (prevProps.appointmentData?.status === "loading" && appointmentData?.status === "available") {
            this.generateAppointments();
        }
        if (prevProps.backgroundData?.status === "loading" && backgroundData?.status === "available") {
            this.generateBackgroundItems();
        }

        // Check if the datasource has changed
        if (prevProps.groupData && prevProps.groupData !== groupData) {
            this.generateGroups();
        }
        if (prevProps.appointmentData && prevProps.appointmentData !== appointmentData) {
            this.generateAppointments();
        }
        if (prevProps.backgroundData && prevProps.backgroundData !== backgroundData) {
            this.generateBackgroundItems();
        }

        // Check if all required fields are populated, then render the timeline
        if (!this.state.initialize && dayStart && dayEnd && hideWeekends) {
            this.setState({
                initialize: true
            });
        }
    }

    convertToDate = timeString => {
        const [hour, minute] = timeString.value.split(":").map(Number);
        const date = new Date(2023, 8, 14);
        date.setHours(hour);
        date.setMinutes(minute);
        return date;
    };

    generateGroups = () => {
        const { groupData, groupId, groupContent } = this.props;
        const groupsArray = [];

        groupData.items.forEach((mxObject, index) => {
            const id = groupId.get(mxObject).value;
            const content = groupContent.get(mxObject);
            const order = index;
            const nestedGroups = this.props.groupData.items
                .filter(filterObj => this.props.parentGroupId?.get(filterObj).value === id)
                .map(mapObj => groupId.get(mapObj).value);
            const groupObj = {
                id,
                content,
                order,
                nestedGroups: nestedGroups.length > 0 ? nestedGroups : null
            };
            groupsArray.push(groupObj);
        });

        this.setState({
            groupData: groupsArray
        });
    };

    generateAppointments = () => {
        const {
            appointmentData,
            appointmentGroupId,
            appointmentStart,
            appointmentEnd,
            appointmentContent,
            appointmentTooltipText
        } = this.props;
        const appointmentsArray = [];

        appointmentData.items.forEach(mxObject => {
            const group = appointmentGroupId.get(mxObject).value;
            const start = appointmentStart.get(mxObject).value;
            const end = appointmentEnd.get(mxObject).value;
            const content = appointmentContent.get(mxObject);
            const title = appointmentTooltipText?.get(mxObject).value;
            const appointmentObj = {
                id: mxObject.id,
                start,
                end,
                content,
                group,
                title
            };
            appointmentsArray.push(appointmentObj);
        });

        this.setState({
            appointmentData: appointmentsArray
        });
    };

    generateBackgroundItems = () => {
        const { backgroundData, backgroundGroupId, backgroundStart, backgroundEnd, backgroundContent } = this.props;
        const backgroundsArray = [];

        backgroundData.items.forEach(mxObject => {
            const group = backgroundGroupId.get(mxObject).value;
            const start = backgroundStart.get(mxObject).value;
            const end = backgroundEnd.get(mxObject).value;
            const content = backgroundContent?.get(mxObject);
            const appointmentObj = {
                id: mxObject.id,
                start,
                end,
                content,
                group,
                type: "background"
            };
            backgroundsArray.push(appointmentObj);
        });

        this.setState({
            backgroundData: backgroundsArray
        });
    };

    lastClickTime = 0;

    mouseUp = event => {
        if (event && !this.dragging) {
            console.log(event);
            // Handle click on the timeline itself
            if (!event.item && event.what !== "group-label") {
                if (this.props.eventStartTime && event.snappedTime) {
                    const timestamp = Date.parse(event.snappedTime);
                    this.props.eventStartTime.setValue(new Date(timestamp));
                }
                if (this.props.eventGroupId && event.group) {
                    this.props.eventGroupId.setValue(event.group);
                }

                // Throttle the execution of onTimelineClick to prevent double firing
                const now = Date.now();
                if (now - this.lastClickTime > 500) {
                    this.lastClickTime = now;
                    if (this.props.onTimelineClick && this.props.onTimelineClick.canExecute) {
                        this.props.onTimelineClick.execute();
                    }
                }
            } else if (event.item) {
                // Handle click on item
                if (this.props.onItemClick) {
                    const clickedItem = this.props.itemData.items.find(mxObject => mxObject.id === event.item);
                    if (clickedItem) {
                        this.props.onItemClick.get(clickedItem).execute();
                    }
                }
            } else if (event.what === "group-label") {
                // Handle click of group
                if (this.props.onGroupClick) {
                    const clickedGroup = this.props.groupData.items.find(
                        mxObject => this.props.groupId.get(mxObject).value === event.group
                    );
                    if (clickedGroup) {
                        this.props.onGroupClick.get(clickedGroup).execute();
                    }
                }
            }
        }
    };

    mouseDown = () => {
        this.dragging = false;
    };

    mouseMove = () => {
        this.dragging = true;
    };

    onMove = (item, callback) => {
        const { eventStartTime, eventEndTime, eventGroupId, onDrag, appointmentData } = this.props;

        if (eventStartTime) {
            eventStartTime.setValue(item.start);
        }
        if (eventEndTime) {
            eventEndTime.setValue(item.end);
        }
        if (eventGroupId) {
            eventGroupId.setValue(item.group);
        }
        if (onDrag) {
            const draggedItem = appointmentData.items.find(mxObject => mxObject.id === item.id);
            if (draggedItem) {
                onDrag.get(draggedItem).execute();
            }
        }

        // Block the move, should be determined in Mendix if the data can change
        callback(null);
    };

    onRangeChanged = (start, end) => {
        const { timelineStart, timelineEnd, onRangeChanged } = this.props;

        if (timelineStart && timelineEnd && (timelineStart.value !== start || timelineEnd.value !== end)) {
            timelineStart.setValue(start);
            timelineEnd.setValue(end);
            if (onRangeChanged && onRangeChanged.canExecute) {
                onRangeChanged.execute();
            }
        }
    };

    render() {
        if (this.state.initialize) {
            const {
                timelineStart,
                timelineEnd,
                dayStart,
                dayEnd,
                hideWeekends,
                groupHeightMode,
                allowDragging,
                allowDraggingOtherGroup,
                zoomSetting,
                minZoom,
                maxZoom,
                timelineMovable,
                timelineMaxHeight,
                loadingContent,
                stack
            } = this.props;

            return (
                <VisTimeline
                    timelineStart={timelineStart?.value}
                    timelineEnd={timelineEnd?.value}
                    dayStart={this.convertToDate(dayStart)}
                    dayEnd={this.convertToDate(dayEnd)}
                    hideWeekends={hideWeekends.value}
                    itemData={this.state.appointmentData.concat(this.state.backgroundData)}
                    groupData={this.state.groupData}
                    groupHeightMode={groupHeightMode}
                    allowDragging={allowDragging}
                    allowDraggingOtherGroup={allowDraggingOtherGroup}
                    mouseUp={this.mouseUp}
                    mouseDown={this.mouseDown}
                    mouseMove={this.mouseMove}
                    onMove={this.onMove}
                    onRangeChanged={this.onRangeChanged}
                    zoomSetting={zoomSetting}
                    minZoom={minZoom?.value}
                    maxZoom={maxZoom?.value}
                    moveable={timelineMovable}
                    maxHeight={timelineMaxHeight?.value}
                    loadingContent={loadingContent}
                    stack={stack}
                />
            );
        } else {
            return null;
        }
    }
}
