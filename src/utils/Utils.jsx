import { createPortal } from "react-dom";

export function renderItems(items) {
    if (items) {
        return items.map(obj => {
            const { item, element } = obj;
            return createPortal(item.content, element, item.id);
        });
    }
}

export function renderGroups(groups) {
    if (groups) {
        return groups.map(obj => {
            const { group, element } = obj;
            return createPortal(group.content, element, group.id);
        });
    }
}
