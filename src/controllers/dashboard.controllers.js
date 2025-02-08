import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    let viewCount=0;
    
    const allVideos = (await Video.find({owner:req.user._id}))
    const totalVideos = allVideos.length
    
    const videoIds= allVideos.map(some => new mongoose.Types.ObjectId(some._id) )

    allVideos.map((each)=>(viewCount += each.views))
    const totalViews = viewCount

    const totalLikes = await Like.countDocuments({video:{$in: videoIds } })

    const totalSubscribers = await Subscription.countDocuments({channel:req.user._id})

    const data = [{totalSubscribers},{allVideos},{totalVideos},{totalViews},{totalLikes}]

    return res
    .status(200)
    .json(
        new ApiResponse(200,data,"Channel Stats Fetches Successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos = await Video.find({owner: req.user._id})

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,`Total Videos = ${videos.length}`)
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }