import { hidePropertyIn } from "@mendix/pluggable-widgets-tools";

export function getProperties(values, defaultProperties, target) {
    if (values.allowDragging === false) {
        hidePropertyIn(defaultProperties, values, "onDrag");
        hidePropertyIn(defaultProperties, values, "allowDraggingOtherGroup");
    }
    if (values.timelineMovable === false) {
        hidePropertyIn(defaultProperties, values, "zoomSetting");
    }
    if (values.customLoader === false) {
        hidePropertyIn(defaultProperties, values, "loadingContent");
    }
    return defaultProperties;
}

export function getPreview(values, isDarkMode) {
    console.log(values);
    const titleHeader = {
        type: "RowLayout",
        columnSize: "fixed",
        borders: true,
        borderWidth: 1,
        children: [
            {
                type: "Container",
                padding: 4,
                children: [
                    {
                        type: "Text",
                        content: "Resource Scheduler"
                    }
                ]
            }
        ]
    };
    const timeLine = {
        type: "RowLayout",
        columnSize: "fixed",
        children: [
            {
                type: "Container",
                borders: true,
                children: [
                    {
                        type: "DropZone",
                        property: values.groupContent,
                        placeholder: "Group content, place widgets here"
                    }
                ]
            },
            {
                type: "Container",
                borders: true,
                grow: 3,
                children: [
                    { type: "DropZone", property: values.itemContent, placeholder: "Item content, place widgets here" }
                ]
            }
        ]
    };
    const loader = {
        type: "Container",
        borders: true,
        children: [
            {
                type: "DropZone",
                property: values.loadingContent,
                placeholder: "Loading timeline, content here will be shown while the timeline is loading."
            }
        ]
    };
    return {
        type: "Container",
        children: [titleHeader, timeLine, loader]
    };
}
