const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs.map(blog => blog.toJSON()))
})
blogsRouter.get('/info', (request, response) => {
    response.status(200).send({ infomessage: 'this is database api of blog app' })
})
blogsRouter.post('/', async (request, response) => {
    const blog = new Blog(request.body)

    const savedBlog = await blog.save()
    response.json(savedBlog.toJSON())

})

module.exports = blogsRouter