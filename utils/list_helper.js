const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    
    const reducer = (sum, item) => {
        return sum + item.likes
    }
    return blogs.length === 0
        ? 0
        : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {

    const reducer = (fav, item) => {
        if (fav === 0 || fav.likes < item.likes) {
            return item
        }
        return fav
    }

    return blogs.reduce(reducer, 0)
}

const mostBlogs = (blogs) => {

    const blogSumsReducer = (auths, item) => {
        if(auths[item.author]) {
            auths[item.author] += 1
        } else {
            auths[item.author] = 1
        }
        return auths
    }
    if (blogs.length === 0) {
        return 0
    }

    const blogSums = blogs.reduce(blogSumsReducer, {})

    const topAuth = Object.keys(blogSums).reduce((prev,cur) => blogSums[prev] > blogSums[cur] ? prev : cur)

    return {author: topAuth, blogs: blogSums[topAuth]}
    
}

const mostLikes = (blogs) => {

    const reducer = (auths, item) => {
        if(auths[item.author]) {
            auths[item.author] += item.likes
        } else {
            auths[item.author] = item.likes
        }
        return auths
    }
    if (blogs.length === 0) {
        return 0
    }
    const likeSums =  blogs.reduce(reducer, {})
    const topAuth = Object.keys(likeSums).reduce((prev,cur) => likeSums[prev] > likeSums[cur] ? prev : cur)

    return {author: topAuth, likes: likeSums[topAuth]}
}
  
module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}