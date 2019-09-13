const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({createdAt: -1})
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: 'Fetched posts successfully',
      posts: posts,
      totalItems: totalItems
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    };
    next(error)
  };
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No file attached")
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: req.userId
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    console.log(user.name)
    await user.posts.push(post);
    await user.save();
    io.getIO().emit('posts', { action: 'create', post: {...post._doc, creator: {_id: req.userId, name: user.name}} })
    res
      .status(201)
      .json({
        message: 'Post created successfully',
        post: post,
        creator: { _id: user._id, name: user.name }
      });
  } catch (error) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err)
  };
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    res
      .status(200)
      .json({ message: 'Post fetched', post: post })
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    };
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  try {
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error;
      error.statusCode = 404;
      throw error;
    };
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    };
    post.title = title;
    post.imageUrl = imageUrl.replace('\\', '/');
    post.content = content;
    const result = await post.save();
    io.getIO().emit('posts', { action: 'update', post: result });
    res.status(200).json({ message: 'Post updated', post: result });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Post not found.');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }
    // Check logged user
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId, { useFindAndModify: false });
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    user.save();
    res.status(200).json({ message: 'Post deleted' })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}

exports.getStatus = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    const status = user.status;

    res.status(200).json({ status: status });

  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  };
}

exports.setStatus = async (req, res, next) => {
  const userId = req.userId;
  const newStatus = req.body.status;
  try {
    const user = await User.findById(userId);
    user.status = newStatus;
    user.save();

    res.status(200).json({ message: `status updated to ${newStatus}` });

  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  };
}
// const clearUserPost = (userId, postId) => {
//   User.findById(userId)
//     .then(user => {
//       const userPosts = user.posts;
//       console.log(userPosts)
//       userPosts.filter(post => {
//         console.log(post.toString(), postId.toString())
//         post.toString() !== postId.toString();
//       })
//       console.log(userPosts)
//       user.posts = userPosts;
//       return user.save();
//     })
//     .catch(err => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     })
// }