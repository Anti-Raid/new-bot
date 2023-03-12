class functions {
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static removeUnderscores(str) {
    return str.replace(/_/g, " ");
  }
}

module.exports = functions;
