const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const api = supertest(app)

const initialBlogs = [
    {
        'title': 'Villen ja Karon retki islantiin',
        'author': 'Karoliina ja Ville',
        'url': 'www.puppapmau.fi',
        'likes': 10
    },
    {
        'title': 'Villen ja Karon retki talaskankaalle',
        'author': 'Karoliina',
        'url': 'www.pup.fi',
        'likes': 8
    },
    {
        'title': 'Maunon karkumatka',
        'author': 'Lumi',
        'url': 'www.lumppa.fi',
        'likes': 11
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})
    
    let blogObject = new Blog(initialBlogs[0])
    await blogObject.save()

    blogObject = new Blog(initialBlogs[1])
    await blogObject.save()

    blogObject = new Blog(initialBlogs[2])
    await blogObject.save()
})

test('There are right amount of blogs', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body.length).toBe(3)
})

test('Identifying field of returned blogs is named id', async () => {
    const response = await api.get('/api/blogs')
    const returnedBlogs = response.body
    for (let blog of returnedBlogs) {
        expect(blog.id).toBeDefined()
        expect(blog._id).not.toBeDefined()
    }
})

test('a blog can be added', async () => {

    const newBlog = {
        'title': 'Etätyöpäivä',
        'author': 'Ville',
        'url': 'www.ville.fi',
        'likes': 6
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
    const response = await api.get('/api/blogs')

    const authors = response.body.map(r => r.author)

    expect(response.body.length).toBe(initialBlogs.length +1)
    expect(authors).toContain('Ville')

})

test('a blog with no likes given gets value 0 for likes', async () => {
    
    const newBlog = {
        'title': 'Empty blog',
        'author': 'Empty',
        'url': 'empty url',
        'likes': null
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
    const response = await api.get('/api/blogs')

    const likes = response.body.map(r => r.likes)

    expect(response.body.length).toBe(initialBlogs.length +1)
    expect(likes).toContain(0)
})
afterAll(() => {
    mongoose.connection.close()
})