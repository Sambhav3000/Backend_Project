import mongoose, {isValidObjectId, Mongoose} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId){
        throw new ApiError(402,"Channel Id is Required")
    }
    
    const existence = await User.findById(channelId)
    if (!existence){
        throw new ApiError(402,"Could not find the channel")
    }

    if(channelId===req.user?._id.toString()){
        throw new ApiError(402,"You Cannot Subscribe to Your Own Channel")
    }

    const isAlreadySubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if(!isAlreadySubscribed){
        const subscribe=await Subscription.create({
            subscriber: req.user._id,
            channel:channelId
        })

        if(!subscribe){
            throw new ApiError(502,"Error while subscribing")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,{isSubscribed: true},"Channel Successfully Subscribed"
        )
        )
    }

    const unsubscribe = await Subscription.deleteOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if(!unsubscribe){
        throw new ApiError(502,"Error while unsubscribing")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{isSubscribed: false},"Channel Successfully Unsubscribed")
    ) 
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId}=req.params

    if(!subscriberId){
        throw new ApiError(401,"Channel Id is Required")
    }

    const existence = await User.findById(subscriberId)

    if(!existence){
        throw new ApiError(501,"Channel Not Found")
    }

    const subscribers = await Subscription.find({channel: subscriberId})

    if(subscribers.length===0){
        return res
        .status (200)
        .json(
            new ApiResponse(200,subscribers,"Subscribers = 0")
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribers,`Total Subscribers = ${subscribers.length}`)
    )
})



// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    if(!channelId){
        throw new ApiError(401,"Subscriber Id is Required")
    }

    const existence = await User.findById(channelId)

    if(!existence){
        throw new ApiError(501,"Channel not found")
    }

    const subscribedList = await Subscription.find({subscriber:channelId})

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribedList,`Total Subscribed Channels = ${subscribedList.length}`)
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}