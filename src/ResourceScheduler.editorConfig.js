import { hidePropertyIn } from "@mendix/pluggable-widgets-tools";

export function getProperties(values, defaultProperties, target) {
    if (values.allowDragging === false) {
        hidePropertyIn(defaultProperties, values, "onDrag");
    }
    if (values.timelineMovable === false) {
        hidePropertyIn(defaultProperties, values, "zoomSetting");
    }
    if (values.customLoader === false) {
        hidePropertyIn(defaultProperties, values, "loadingContent");
    }
    return defaultProperties;
}
