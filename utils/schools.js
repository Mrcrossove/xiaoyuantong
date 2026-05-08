const groups = require("./school-groups");

module.exports = groups.reduce((result, group) => result.concat(group.schools), []);
