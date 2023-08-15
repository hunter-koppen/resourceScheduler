import { Component, createElement } from "react";

import { VisTimeline } from "./components/VisTimeline";
import "./ui/ResourceScheduler.css";

export class ResourceScheduler extends Component {
    clicking = false;
    dragging = false;
    state = {
        initialize: false,
        groupData: [],
        itemData: []
    };

    componentDidUpdate(prevProps) {
        // items datasource is loaded so we can create timeline items from it
        if (prevProps.groupData.status === "loading" && this.props.groupData.status === "available") {
            this.updateGroups();
        }
        if (prevProps.itemData.status === "loading" && this.props.itemData.status === "available") {
            this.updateItems();
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

    updateGroups = () => {
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

    updateItems = () => {
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
        if (event && !event.item && !this.dragging) {
            console.log(event);
            if (this.props.clickedDateTime && event.snappedTime) {
                const timestamp = Date.parse(event.snappedTime);
                this.props.clickedDateTime.setValue(new Date(timestamp));
            }
            if (this.props.clickedGroupId && event.group) {
                this.props.clickedGroupId.setValue(event.group);
            }
            if (this.props.onClick && this.props.onClick.canExecute) {
                this.props.onClick.execute();
            }
        }
        this.clicking = false;
        this.dragging = false;
    };

    mouseDown = () => {
        this.clicking = true;
        this.dragging = false;
    };

    mouseMove = () => {
        this.dragging = true;
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
                />
            );
        } else {
            return null;
        }
    }
}
