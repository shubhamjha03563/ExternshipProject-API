// gets search results for a collection(Products, Camps, Doctors) and returns search result(Object)
const checkPaginationParams = (params) => {
  let { pg, pglt } = params;
  pg = pg == undefined ? 1 : pg;
  pglt = pglt == undefined ? 100 : pglt;

  // If page is <= 0
  if (pg <= 0) {
    return {
      success: false,
      message: '{pg} - page value should be greater than 0.',
    };
  }

  // if page limit is <= 0
  if (pglt <= 0) {
    return {
      success: false,
      message: '{pglt} - page limit value should be greater than 0.',
    };
  }

  return {
    success: true,
    page: pg,
    pageLimit: pglt,
  };
};

module.exports = checkPaginationParams;
