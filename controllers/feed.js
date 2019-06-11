const Post = require('../models/post')

const {
    validationResult
} = require('express-validator/check');

exports.getPosts = (req, res, next) => {
    Post
        .find()
        .then(posts => {
            console.log(posts);
            res.status(200).json({
                message: 'fetched posts successfully',
                posts: posts
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err,
                statusCode = 500;
            }
            next(err);
        });
    
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: 'images/duck.jpg',
        creator: {
            name: 'Asisow'
        },
    });
    post.save().then(result => {
            res.status(201).json({
                message: 'Post created succesfully!',
                post: result
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err,
                statusCode = 500;
            }
            next(err);
        })

};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find a post.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'Post fetched', post: post })
        })
        .catch(err => {
            if (!err.statusCode) {
                err,
                statusCode = 500;
            }
            next(err);
        })
};