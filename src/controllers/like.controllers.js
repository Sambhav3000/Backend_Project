import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Video} from "../models/video.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.models.js"
import { Tweet } from "../models/tweet.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(402,"Video Id is Required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(402,"Invalid Video Id")
    }

    const existence = await Video.findById(videoId)

    if(!existence){
        throw new ApiError(502,"Could Not Find the Video")
    }

    const like = await Like.findOne({video: videoId, likedBy: req.user._id})

    if(!like){
        const liked = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        if(!liked){
            throw new ApiError(501,"Error while Liking the Video")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,liked,"Video Liked Successfully")
        )
    }

    const unlike = await Like.findOneAndDelete({video: videoId, likedBy: req.user._id})

    if(!unlike){
        throw new ApiError(502,"Error while Unliking the Video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,unlike,"Video Unliked Successfully")
    )

    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(402,"Comment Id is Required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(402,"Invalid Comment Id")
    }
    const existence = await Comment.findById(commentId)

    if(!existence){
        throw new ApiError(402,"Could Not Find the Comment")
    }

    const like = await Like.findOne({Comment: commentId, likedBy: req.user._id})

    if(!like){
        const liked = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        if(!liked){
            throw new ApiError(502,"Error while Liking the Comment")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,liked,"Comment liked Successfully")
        )
    }

    const unlike = await Like.findOneAndDelete({comment: commentId, likedBy: req.user._id})

    if (!unlike){
        throw new ApiError(502,"Error while unliking Comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,unlike,"Comment Unliked Successfully")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(402,"Tweet Id is Required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(402,"Invalid Tweet Id")
    }

    const existence = await Tweet.findById(tweetId)

    if(!existence){
        throw new ApiError(502,"Could Not Find the Tweet")
    }

    const like = await Like.findOne({tweet: tweetId, likedBy:req.user._id})

    if(!like){
        const liked = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        if(!liked){
            throw new ApiError(503,"Error while Liking the Tweet")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,liked,"Tweet Liked Successfully")
        )
    }

    const unlike= await Like.findOneAndDelete({tweet: tweetId, likedBy: req.user._id})

    if(!unlike){
        throw new ApiError(503,"Error while Unliking the Tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,unlike,"Tweet Unliked Successfully")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const allLiked = await Like.find({likedBy:req.user._id, video:{$ne: null}})
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,allLiked,`Total Liked Videos = ${allLiked.length}`)
    )
    
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}