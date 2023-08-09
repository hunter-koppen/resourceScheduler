import { Component, createElement } from "react";

import { VisTimeline } from "./components/VisTimeline";
import "./ui/ResourceScheduler.css";

export class ResourceScheduler extends Component {
    render() {
        return <VisTimeline groupHeightMode={this.props.groupHeightMode} />;
    }
}
