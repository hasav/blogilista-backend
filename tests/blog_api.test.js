const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
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

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

describe('when there is initially one user at db', () => {
    beforeEach(async () => {
        await User.deleteMany({})
        const user = new User({ username: 'first_user', name: 'Eino Ensimmäinen', password: 'sekret' })
        await user.save()
    })
  
    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await usersInDb()
  
        const newUser = {
            username: 'ville1',
            name: 'Ville Testaaja',
            password: 'testi',
        }
  
        await api
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)
  
        const usersAtEnd = await usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length + 1)
  
        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await usersInDb()
    
        const newUser = {
            username: 'first_user',
            name: 'Timo Toinen',
            password: 'salainen',
        }
    
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('`username` to be unique')
    
        const usersAtEnd = await usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length)
    })

    test('proper response when trying to create user without username', async () => {
        const usersAtStart = await usersInDb()

        const newUser = {
            name: 'Tommi Tyhja',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('`username` is required.')
    
        const usersAtEnd = await usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length)
    })

    test('proper response when trying to create user with too short username', async () => {
        const usersAtStart = await usersInDb()

        const newUser = {
            username: 'ts',
            name: 'Tommi Tyhja',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('`username` (`ts`) is shorter than the minimum allowed length (3).')
    
        const usersAtEnd = await usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length)
    })

    test('proper response when trying to create user without passoword', async () => {
        const usersAtStart = await usersInDb()

        const newUser = {
            username: 'tts',
            name: 'Tommi Tyhja',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('password missing or too short')
    
        const usersAtEnd = await usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length)
    })
})

test('proper response when trying to create user with too short password', async () => {
    const usersAtStart = await usersInDb()

    const newUser = {
        username: 'tts',
        name: 'Tommi Tyhja',
        password: '12'
    }

    const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password missing or too short')

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
})

afterAll(() => {
    mongoose.connection.close()
})