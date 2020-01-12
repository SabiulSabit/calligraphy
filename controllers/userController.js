const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')
const jwt = require('jsonwebtoken')

exports.sharedProfileData = async function (req, res, next) {
  let isFollowing = false;
  let isVisitorsProfile = false;
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }

  req.isFollowing = isFollowing
  req.isVisitorsProfile = isVisitorsProfile;

  /// counts number
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);
  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;
  next()
}

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash("errors", "You must be logged in to perform that action.")
    req.session.save(function () {
      res.redirect('/')
    })
  }
}

exports.apiMustBeLoggedIn = function(req,res,next){
  try{
   req.apiUser = jwt.verify(req.body.token,process.env.JWTSECRET)
   next()  
  }catch{
   res.json("Need a Valid Token")
  }
}


exports.login = function (req, res) {
  let user = new User(req.body)
  user.login().then(function (result) {
    req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id }
    req.session.save(function () {
      res.redirect('/')
    })
  }).catch(function (e) {
    req.flash('errors', e)
    req.session.save(function () {
      res.redirect('/')
    })
  })
}

exports.apiLogin = function (req, res) {
  let user = new User(req.body)
  user.login().then(function (result) {
    res.json(jwt.sign({_id: user.data._id},process.env.JWTSECRET,{expiresIn: '7d'}))
  }).catch(function (e) {
    res.json("Sorry wrong")
  })
}

exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect('/')
  })
}

exports.register = function (req, res) {
  let user = new User(req.body)
  user.register().then(() => {
    req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id }
    req.session.save(function () {
      res.redirect('/')
    })
  }).catch((regErrors) => {
    regErrors.forEach(function (error) {
      req.flash('regErrors', error)
    })
    req.session.save(function () {
      res.redirect('/')
    })
  })
}

exports.home =async function (req, res) {
  if (req.session.user) {
    let posts =await Post.getFeed(req.session.user._id)
    res.render('home-dashboard',{posts: posts})
  } else {
    res.render('home-guest', { regErrors: req.flash('regErrors') })
  }
}

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username).then(function (userDocument) {
    req.profileUser = userDocument
    next()
  }).catch(function () {
    res.render("404")
  })
}

exports.profilePostsScreen = function (req, res) {

  Post.findByAuthorId(req.profileUser._id).then(function (posts) {
    res.render('profile', {
      currentPage: "posts",
      title: `Profile: ${ req.profileUser.username}`,
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount }
    })
  }).catch(function () {
    res.render("404")
  })

}

exports.profileFollowersScreen = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount }
    })
  }
  catch{
    res.render('404')
  }
}


exports.profileFollowingScreen = async function (req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id)
    res.render('profile-following', {
      currentPage: "following",
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount }
    })
  }
  catch{
    res.render('404')
  }
}

exports.doseUsernameExist = function(req,res){
   User.findByUsername(req.body.username)
   .then(function(){
     res.json(true)
   })
   .catch(function(){
    res.json(false)
  })
}

exports.doseEmailExist =async function(req,res){
  let emailBool = await User.doseEmailExist(req.body.email)
  
  res.json(emailBool);
}

exports.apiGetPostByUsername =async function(req,res){
  try{
    let authorDoc = await User.findByUsername(req.params.username)
    let posts = await Post.findByAuthorId(authorDoc._id)
    res.json(posts);
  }catch{
        res.json("Sorry, Invalid user requested")
  }
}