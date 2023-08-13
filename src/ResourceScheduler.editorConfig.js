import { hidePropertyIn } from "@mendix/pluggable-widgets-tools";

export function getProperties(values, defaultProperties, target) {
    hidePropertyIn(defaultProperties, values, "groupsSelectable");
    return defaultProperties;
}
