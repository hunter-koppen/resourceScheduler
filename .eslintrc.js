const base = require("@mendix/pluggable-widgets-tools/configs/eslint.js.base.json");

module.exports = {
    ...base,
    globals: {
        ...base.globals,
        // Mendix Client API, injected into the page at runtime by the Mendix client
        mx: "readonly"
    }
};
