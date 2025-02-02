import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { json } from "express"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    const owner = await User.findById(req.user._id).select("_id username fullName avatar")


    if (!content?.trim()){
        throw new ApiError(401,"Content cannot be empty")
    }

    const tweet = await Tweet.create({
        content,
        owner
    })

    if(!tweet){
        throw new ApiError(501,"Error saving the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(201,tweet,"Tweet Successfully Created")
    )


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId}=req.params;

    if(!userId){
        throw new ApiError(401,"User is required")
    }

    const tweet =await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                _id: 1,
                content: 1, 
                owner:1,
                createdAt: 1
            }
        }
    ])
    
    // const tweet = await Tweet.find({owner:userId})


    if(!tweet){
        throw new ApiError(501,"No Tweets Found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet,"User Tweets Fetched Successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params

    const {content} = req.body

    if(!content){
        throw new ApiError(401,"New content cannot be empty")
    }

    const existence = await Tweet.findById(tweetId)

    if (!existence){
        throw new ApiError(401,"Tweet not found")
    }

    const tweet = await Tweet.findOneAndUpdate({_id:tweetId},{
        content
    },{new: true})

    if(!tweet){
        throw new ApiError(501,"Error updating the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet Successfully Updated")
    )

    

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params 
    
    const existence = await Tweet.findById(tweetId)

    if(!existence){
        throw new ApiError(401,"Tweet Not Found")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if(!tweet){
        throw new ApiError(501,"Could Not Delete the Tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet Deleted Successfully")
    )


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}