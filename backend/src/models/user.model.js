<<<<<<< HEAD
const db = require('../config/db');

exports.getUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows;
};

exports.createUser = async ({ name, email }) => {
  const query = `
    INSERT INTO users (name, email)
    VALUES ($1, $2)
    RETURNING *
  `;
  const values = [name, email];
  const result = await db.query(query, values);
  return result.rows[0];
=======
const db = require('../config/db');

exports.getUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows;
};

exports.createUser = async ({ name, email }) => {
  const query = `
    INSERT INTO users (name, email)
    VALUES ($1, $2)
    RETURNING *
  `;
  const values = [name, email];

  const result = await db.query(query, values);
  return result.rows[0];
>>>>>>> main
};