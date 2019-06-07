exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{
            _id: '1',
            title: 'First Post',
            content: 'This is the first post!',
            imageUrl: 'images/385484m.jpg',
            creator: {
                name: 'asisow'
            },
            createdAt: new Date()
        }]
    });
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    res.status(201).json({
        message: 'Post created succesfully!',
        post: {
            _id: new Date().toISOString(),
            title: title,
            content: content,
            creator: { name: 'Asisow' },
            createdAt: new Date
        }
    });
};