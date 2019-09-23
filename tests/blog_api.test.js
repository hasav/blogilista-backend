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

test('a blog without title or url get 400 bad request', async () => {

    const newBlogNoTitle = {
        'author': 'Empty',
        'url': 'empty url',
        'likes': null
    }
    const newBlogNoUrl = {
        'title': 'Empty blog',
        'author': 'empty auth',
        'likes': null
    }

    await api 
        .post('/api/blogs')
        .send(newBlogNoTitle)
        .expect(400)

    await api 
        .post('/api/blogs')
        .send(newBlogNoUrl)
        .expect(400)

})

test('a blog can be deleted', async () => {
    
    const blogsAtStart = await Blog.find({})
    const blogToDelete = blogsAtStart[0]

    await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)
    
    const blogsAtEnd = await Blog.find({})
    expect(blogsAtEnd.length).toBe(
        blogsAtStart.length -1
    )

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
    
})


test('a blog can be edited', async () => {
    
    const blogsAtStart = await Blog.find({})
    const blogToModify = blogsAtStart[0]

    blogToModify.likes = 25

    await api
        .put(`/api/blogs/${blogToModify.id}`)
        .send(blogToModify)
        .expect(200)
    
    let blogsAtEnd = await Blog.find({})

    const likes = blogsAtEnd.map(blog => blog.likes)
    expect(likes).toContain(25)

    blogToModify.author = 'Karoliina ja Ville Häsä'

    await api 
        .put(`/api/blogs/${blogToModify.id}`)
        .send(blogToModify)
        .expect(200)
    
    blogsAtEnd = await Blog.find({})

    const authors = blogsAtEnd.map(blog => blog.author)
    expect(authors).toContain('Karoliina ja Ville Häsä')
})


afterAll(() => {
    mongoose.connection.close()
})