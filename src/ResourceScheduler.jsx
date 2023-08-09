import { Component, createElement } from "react";

import { VisTimeline } from "./components/VisTimeline";
import "./ui/ResourceScheduler.css";

export class ResourceScheduler extends Component {
    state = {
        itemData: []
    };

    componentDidUpdate(prevProps) {
        // items datasource is loaded so we can create timeline items from it
        if (prevProps.itemData.status === "loading" && this.props.itemData.status === "available") {
            this.updateItems();
        }
    }

    updateItems = () => {
        const itemsArray = [];
        this.props.itemData.items.forEach(mxObject => {
            const start = this.props.itemStart.get(mxObject).value;
            const end = this.props.itemEnd.get(mxObject).value;
            const content = this.props.itemContent?.get(mxObject);
            const itemObj = {
                id: mxObject.id,
                start,
                end,
                content,
                group: 1
            };
            itemsArray.push(itemObj);
        });
        this.setState({
            itemData: itemsArray
        });
    };

    render() {
        return <VisTimeline itemData={this.state.itemData} groupHeightMode={this.props.groupHeightMode} />;
    }
}
