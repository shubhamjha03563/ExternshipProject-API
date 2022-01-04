// gets search results for a collection(Products, Camps, Doctors) and returns search result(Object)
const search = async (model, params) => {
  let { q, pg, pglt } = params;
  if (q == undefined) {
    return {
      success: false,
      message: 'Please provide the search query {q} in query parameters.',
    };
  }

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

  let query = model
    .find({
      $text: { $search: `${q}` },
    })
    .skip(pglt * (pg - 1))
    .limit(pglt);

  let results = await query;

  return {
    success: true,
    page: pg,
    pageLimit: pglt,
    totalResults: results.length,
    results,
  };
};

module.exports = search;
