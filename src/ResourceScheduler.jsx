import { Component, createElement } from "react";

import { VisTimeline } from "./components/VisTimeline";
import "./ui/ResourceScheduler.css";

export class ResourceScheduler extends Component {
    dragging = false;
    state = {
        initialize: false,
        groupData: [],
        itemData: []
    };

    componentDidUpdate(prevProps) {
        // items datasource is loaded so we can create timeline items from it
        if (prevProps.groupData.status === "loading" && this.props.groupData.status === "available") {
            this.generateGroups();
        }
        if (prevProps.itemData.status === "loading" && this.props.itemData.status === "available") {
            this.generateItems();
        }

        if (prevProps.itemData && prevProps.itemData !== this.props.itemData) {
            this.generateItems();
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
        const { groupData, groupId, groupContent } = this.props;
        const groupsArray = [];
        groupData.items.forEach(mxObject => {
            const id = groupId.get(mxObject).value;
            const content = groupContent.get(mxObject);
            const groupObj = {
                id,
                content,
                order: 1
            };
            groupsArray.push(groupObj);
        });
        this.setState({
            groupData: groupsArray
        });
    };

    generateItems = () => {
        const { itemData, itemGroupId, itemStart, itemEnd, itemContent, itemTooltipText } = this.props;
        const itemsArray = [];
        itemData.items.forEach(mxObject => {
            const group = itemGroupId.get(mxObject).value;
            const start = itemStart.get(mxObject).value;
            const end = itemEnd.get(mxObject).value;
            const content = itemContent.get(mxObject);
            const title = itemTooltipText?.get(mxObject).value;
            const itemObj = {
                id: mxObject.id,
                start,
                end,
                content,
                group,
                title
            };
            itemsArray.push(itemObj);
        });
        this.setState({
            itemData: itemsArray
        });
    };

    mouseUp = event => {
        if (event && !this.dragging) {
            console.log(event);

            // Handle click on the timeline itself
            if (!event.item) {
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
            else {
                if (this.props.onItemClick) {
                    const clickedItem = this.props.itemData.items.find(mxObject => mxObject.id === event.item);
                    if (clickedItem) {
                        this.props.onItemClick(clickedItem).execute();
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
            const draggedItem = this.props.itemData.items.find(mxObject => mxObject.id === item.id);
            if (draggedItem) {
                this.props.onDrag(draggedItem).execute();
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
                    itemData={this.state.itemData}
                    groupData={this.state.groupData}
                    groupHeightMode={this.props.groupHeightMode}
                    mouseUp={this.mouseUp}
                    mouseDown={this.mouseDown}
                    mouseMove={this.mouseMove}
                    onMove={this.onMove}
                    onRangeChanged={this.onRangeChanged}
                />
            );
        } else {
            return null;
        }
    }
}
