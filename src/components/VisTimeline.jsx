import { Component, createElement, createRef } from "react";

import { Timeline } from "vis-timeline/standalone";
import "../../node_modules/vis-timeline/dist/vis-timeline-graph2d.min.css";

export class VisTimeline extends Component {
    schedulerRef = createRef();

    render() {
        return <div ref={this.schedulerRef} className="resource-scheduler"></div>;
    }
}
