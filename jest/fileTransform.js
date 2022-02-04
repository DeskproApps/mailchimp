const path = require("path");
const camelcase = require("camelcase");

module.exports = {
    process(_src, filename) {
        const assetFilename = filename ? JSON.stringify(path.basename(filename)) : "";

        return `module.exports = ${assetFilename};`;
    },
    getCacheKey() {
        return "svgTransform";
    },
};
