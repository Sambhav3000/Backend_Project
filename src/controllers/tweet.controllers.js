import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

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
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}