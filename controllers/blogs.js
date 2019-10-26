const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({}).populate('user', {username: 1, name: 1})
    response.json(blogs.map(blog => blog.toJSON()))
})
blogsRouter.get('/info', (request, response) => {
    response.status(200).send({ infomessage: 'this is database api of blog app' })
})
blogsRouter.post('/', async (request, response, next) => {
    const token = request.token
    const body = request.body 

    try {

        const decodedToken = jwt.verify(token, process.env.SECRET)
        if (!token || !decodedToken.id) {
            return response.status(401).json({error: 'token missing'})
        }

        const user = await User.findById(decodedToken.id)

        const blog = new Blog({
            title: body.title,
            author: body.author,
            url: body.url,
            likes: body.likes || 0,
            user: user._id
        })

        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()
        const res = await Blog.findById(savedBlog._id).populate('user', {username: 1, name: 1})
        response.json(res.toJSON())
    } catch (exception) {
        next(exception)
    }

})

blogsRouter.delete('/:id', async (request, response, next) => {

    const token = request.token
    const blogId = request.params.id
    const blog = await Blog
        .findById(blogId).populate('user',{id: 1}) 
    const user = await User.findById(blog.user.id)
    const userId = user.id
    try {
        const decodedToken = jwt.verify(token, process.env.SECRET)
        if (!token || !decodedToken.id) {
            return response.status(401).json({error: 'token missing'})
        }

        if (userId.toString() !== decodedToken.id.toString()) {
            return response.status(401).json({error: 'no valid token'})
        }
        user.blogs = user.blogs.filter(b => b.id.toString() !== blogId.toString())
        await user.save()
        await Blog.findByIdAndDelete(blogId)
        response.status(204).end()
    } catch (exception) {
        next(exception)
    }

})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = request.body 

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    }

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true})
            .populate('user', {username: 1, name: 1})
        response.json(updatedBlog.toJSON())
    } catch (exception) {
        next(exception)
    }
})
module.exports = blogsRouter