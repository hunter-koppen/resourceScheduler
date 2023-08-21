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
        // datasources are loaded so we can create timeline items from it
        if (prevProps.groupData.status === "loading" && this.props.groupData.status === "available") {
            this.generateGroups();
        }
        if (prevProps.appointmentData.status === "loading" && this.props.appointmentData.status === "available") {
            this.generateAppointments();
        }
        if (prevProps.backgroundData.status === "loading" && this.props.backgroundData.status === "available") {
            this.generateBackgroundItems();
        }

        // Check if the datasource has changed
        if (prevProps.groupData && prevProps.groupData !== this.props.groupData) {
            this.generateGroups();
        }
        if (prevProps.appointmentData && prevProps.appointmentData !== this.props.appointmentData) {
            this.generateAppointments();
        }
        if (prevProps.backgroundData && prevProps.backgroundData !== this.props.backgroundData) {
            this.generateBackgroundItems();
        }

        // Check if all required fields are populated, then render the timeline
        if (!this.state.initialize && this.props.dayStart && this.props.dayEnd && this.props.hideWeekends) {
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
        const { groupData, groupId, groupContent, groupSort } = this.props;
        const groupsArray = [];
        groupData.items.forEach(mxObject => {
            const id = groupId.get(mxObject).value;
            const content = groupContent.get(mxObject);
            const order = groupSort.get(mxObject).value;
            const nestedGroups = this.props.groupData.items
                .filter(mxObject => this.props.parentGroupId?.get(mxObject).value === id)
                .map(mxObject => groupId.get(mxObject).value);
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
        const { appointmentData, appointmentGroupId, appointmentStart, appointmentEnd, appointmentContent, appointmentTooltipText } = this.props;
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
                if (this.props.onTimelineClick && this.props.onTimelineClick.canExecute) {
                    this.props.onTimelineClick.execute();
                }
            }
            // Handle click on item
            else if (event.item) {
                if (this.props.onItemClick) {
                    const clickedItem = this.props.itemData.items.find(mxObject => mxObject.id === event.item);
                    if (clickedItem) {
                        this.props.onItemClick.get(clickedItem).execute();
                    }
                }
            }
            // Handle click of group
            else if (event.what === "group-label") {
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
        if (this.props.eventStartTime) {
            this.props.eventStartTime.setValue(item.start);
        }
        if (this.props.eventEndTime) {
            this.props.eventEndTime.setValue(item.end);
        }
        if (this.props.eventGroupId) {
            this.props.eventGroupId.setValue(item.group);
        }
        if (this.props.onDrag) {
            const draggedItem = this.props.appointmentData.items.find(mxObject => mxObject.id === item.id);
            if (draggedItem) {
                this.props.onDrag.get(draggedItem).execute();
            }
        }
        // Block the move, should be determined in Mendix if the data can change
        callback(null);
    };

    onRangeChanged = (start, end) => {
        if (
            this.props.timelineStart &&
            this.props.timelineEnd &&
            (this.props.timelineStart.value !== start || this.props.timelineEnd.value !== end)
        ) {
            this.props.timelineStart.setValue(start);
            this.props.timelineEnd.setValue(end);
            if (this.props.onRangeChanged && this.props.onRangeChanged.canExecute) {
                this.props.onRangeChanged.execute();
            }
        }
    };

    render() {
        if (this.state.initialize) {
            return (
                <VisTimeline
                    timelineStart={this.props.timelineStart?.value}
                    timelineEnd={this.props.timelineEnd?.value}
                    dayStart={this.convertToDate(this.props.dayStart)}
                    dayEnd={this.convertToDate(this.props.dayEnd)}
                    hideWeekends={this.props.hideWeekends.value}
                    itemData={this.state.appointmentData.concat(this.state.backgroundData)}
                    groupData={this.state.groupData}
                    groupHeightMode={this.props.groupHeightMode}
                    allowDragging={this.props.allowDragging}
                    allowDraggingOtherGroup={this.props.allowDraggingOtherGroup}
                    mouseUp={this.mouseUp}
                    mouseDown={this.mouseDown}
                    mouseMove={this.mouseMove}
                    onMove={this.onMove}
                    onRangeChanged={this.onRangeChanged}
                    zoomSetting={this.props.zoomSetting}
                    moveable={this.props.timelineMovable}
                    maxHeight={this.props.timelineMaxHeight?.value}
                    loadingContent={this.props.loadingContent}
                    stack={this.props.stack}
                />
            );
        } else {
            return null;
        }
    }
}
