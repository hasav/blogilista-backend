const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

test('There are right amount of blogs', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body.length).toBe(3)
})

afterAll(() => {
    mongoose.connection.close()
})