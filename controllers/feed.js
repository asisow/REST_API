const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');
const User = require('../models/user')

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then(posts => {
      res
        .status(200)
        .json({
          message: 'Fetched posts successfully',
          posts: posts,
          totalItems: totalItems
        });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      };
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
  if (!req.file) {
    const error = new Error("No file attached")
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  let creator;
  const content = req.body.content;
  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: req.userId
  });
  post
    .save()
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user
      user.posts.push(post);
      return user.save();
    })
    .then(result => {
      res
        .status(201)
        .json({
          message: 'Post created successfully',
          post: post,
          creator: { _id: creator._id, name: creator.name }
        });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err)
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post
    .findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      res
        .status(200)
        .json({ message: 'Post fetched', post: post })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      };
      next(err);
    })
};

exports.updatePost = (req, res, next) => {
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
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error;
        error.statusCode = 404;
        throw error;
      };
      if (post.creator.toString() !== req.userId) {
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
      return post.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated', post: result })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
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
      return Post.findByIdAndRemove(postId, { useFindAndModify: false });
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Post deleted' })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}

exports.getStatus = (req, res, next) => {
  const userId = req.userId;
  User.findById(userId)
    .then(user => {
      return user.status;
    })
    .then(result => {
      res.status(200).json({ status: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.setStatus = (req, res, next) => {
  const userId = req.userId;
  const newStatus = req.body.status;
  User.findById(userId)
    .then(user => {
      user.status = newStatus;
      return user.save();
    })
    .then(() => {
      res.status(200).json({ message: `status updated to ${newStatus}` });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
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