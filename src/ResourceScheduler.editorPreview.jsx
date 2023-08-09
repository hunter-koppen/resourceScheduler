import { Component, createElement } from "react";
import { VisTimeline } from "./components/VisTimeline";

export class preview extends Component {
    render() {
        return <VisTimeline sampleText={this.props.sampleText} />;
    }
}

export function getPreviewCss() {
    return require("./ui/ResourceScheduler.css");
}
