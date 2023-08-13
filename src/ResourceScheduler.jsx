import { Component, createElement } from "react";

import { VisTimeline } from "./components/VisTimeline";
import "./ui/ResourceScheduler.css";

export class ResourceScheduler extends Component {
    state = {
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
            debugger;
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
        return <VisTimeline itemData={this.state.itemData} groupData={this.state.groupData} groupHeightMode={this.props.groupHeightMode} />;
    }
}
