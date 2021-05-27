const properties = require("./json/properties.json");
const users = require("./json/users.json");

const pool = require('./db/index.js')



/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((user) => {
      return user.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((user) => {
      return user.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(
      `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
      [user.name, user.email, user.password]
    )
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `,
      [guest_id, limit]
    )
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const city = options.city;
  const minPrice = options.minimum_price_per_night * 100;
  const maxPrice = options.maximum_price_per_night * 100;
  const minRating = options.minimum_rating;

  const queryOptions = [];

  let queryString = ` SELECT properties.*, avg(property_reviews.rating) as average_rating
                      FROM properties
                      JOIN property_reviews ON property_id = properties.id
                      `;
  if (city) {
    queryOptions.push(city);
    queryString += ` WHERE properties.city LIKE $${queryOptions.length}`;
  }

  if (minPrice) {
    queryOptions.push(minPrice);
    if (queryOptions.length > 1) {
      queryString += ` AND properties.cost_per_night > $${queryOptions.length}`;
    } else {
      queryString += ` WHERE properties.cost_per_night > $${queryOptions.length}`;
    }
  }

  if (maxPrice) {
    queryOptions.push(maxPrice);
    if (queryOptions.length > 1) {
      queryString += ` AND properties.cost_per_night < $${queryOptions.length}`;
    } else {
      queryString += ` WHERE properties.cost_per_night < $${queryOptions.length}`;
    }
  }

  if (minRating) {
    queryOptions.push(minRating);
    queryOptions.push(limit);
    queryString += ` GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $${queryOptions.length - 1}
    ORDER BY properties.cost_per_night
    LIMIT $${queryOptions.length};`;
  } else {
    queryOptions.push(limit);
    queryString += ` GROUP BY properties.id
    ORDER BY properties.cost_per_night
    LIMIT $${queryOptions.length};`;
  }
  return pool
    .query(queryString, queryOptions)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  let queryString = ` INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                      RETURNING *;`;
  const paramArr = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
  ];
  return pool
    .query(queryString, paramArr)
    .then((res) => {
      console.log(res.rows);
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addProperty = addProperty;
