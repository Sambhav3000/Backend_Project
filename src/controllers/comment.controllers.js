import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 5} = req.query

    if(!videoId){
        throw new ApiError(402,"Video Id is Required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(402,"Invalid Video Id")
    }

    const allComments = await Comment.find({video:videoId})

    const comments = await Comment
        .find({video:videoId})
        .sort({createdAt: -1})
        .skip((page -1)*limit)
        .limit(parseInt(limit));


    return res
    .status(200)
    .json(
        new ApiResponse(200,comments,`Total Comments = ${allComments.length}`)
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    if (!content){
        throw new ApiError(402,"Content cannot be empty")
    }

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

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if(!comment){
        throw new ApiError(502,"Error while posting the Comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment Posted Successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content}= req.body

    if(!commentId){
        throw new ApiError(402,"Comment Id is Required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(402,"Invalid Comment Id")
    }

    const commentExistence = await Comment.findById(commentId)
    const commentOwner = await Comment.find({_id: commentId, owner:req.user._id})

    if(!commentExistence){
        throw new ApiError(502,"Comment Does Not Exist")
    }

    if(commentOwner.length===0){
        throw new ApiError(502,"Cannot Make Changes to Other User's Comment")
    }

    const updatedComment = await Comment.findOneAndUpdate(
        {_id: commentId, owner: req.user._id},
        {
            $set:{content}
        },
        {new: true}
    )

    if(!updatedComment){
        throw new ApiError(503,"Error while Updating the Comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedComment,"Comment Updated Successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(402,"Comment Id is Required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(402,"Invalid Comment Id")
    }

    const commentExistence = await Comment.findById(commentId)
    const commentOwner = await Comment.find({_id: commentId, owner:req.user._id})

    if(!commentExistence){
        throw new ApiError(502,"Comment Does Not Exist")
    }

    if(commentOwner.length===0){
        throw new ApiError(502,"Cannot Make Changes to Other User's Comment")
    }

    const deletedComment = await Comment.findOneAndDelete(
        {_id: commentId, owner: req.user._id},
        {new: true}
    )

    if(!deletedComment){
        throw new ApiError(503,"Error while Deleting the Comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedComment,"Comment Deleted Successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }