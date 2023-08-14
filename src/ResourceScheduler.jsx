import { Component, createElement } from "react";

import { VisTimeline } from "./components/VisTimeline";
import "./ui/ResourceScheduler.css";

export class ResourceScheduler extends Component {
    state = {
        initialize: false,
        dayStart: null,
        dayEnd: null,
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
        if (!this.state.initialize && this.props.dayStart && this.props.dayEnd) {

            this.setState({
                initialize: true,
                dayStart: this.convertToDate(this.props.dayStart),
                dayEnd: this.convertToDate(this.props.dayEnd)
            });
        }
    }

    convertToDate = (timeString) => {
        const [hour, minute] = timeString.value.split(":").map(Number);
        const date = new Date(2023, 8, 14);
        date.setHours(hour);
        date.setMinutes(minute);
        return date;
    }

    updateGroups = () => {
        const groupsArray = [];
        this.props.groupData.items.forEach(mxObject => {
            const groupId = this.props.groupId.get(mxObject).value;
            const content = this.props.groupContent.get(mxObject);
            const groupObj = {
                id: groupId,
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
        const itemsArray = [];
        this.props.itemData.items.forEach(mxObject => {
            const groupId = this.props.itemGroupId.get(mxObject).value;
            const start = this.props.itemStart.get(mxObject).value;
            const end = this.props.itemEnd.get(mxObject).value;
            const content = this.props.itemContent.get(mxObject);
            const itemObj = {
                id: mxObject.id,
                start,
                end,
                content,
                group: groupId
            };
            itemsArray.push(itemObj);
        });
        this.setState({
            itemData: itemsArray
        });
    };

    render() {
        if (this.state.initialize) {
            return (
                <VisTimeline
                    dayStart={this.state.dayStart}
                    dayEnd={this.state.dayEnd}
                    itemData={this.state.itemData}
                    groupData={this.state.groupData}
                    groupHeightMode={this.props.groupHeightMode}
                />
            );
        } else {
            return null;
        }
    }
}
