import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { Video } from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    
    if(!name || !description || [name,description].some((field)=>field?.trim==="")) {
        throw new ApiError(401,"Name and Description is Required")
    }

    const existence = await Playlist.find({name, description})
    if (existence.length>0){
        throw new ApiError(501,"Playlist with this name or description already exists")
    }

    const playlist = await Playlist.create({
        name: name,
        description,
        owner: req.user._id
    })

    if(!playlist){
        throw new ApiError(502,"Something Went Wrong while Creating Playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist Successfully Created")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(402,"User Id is Required")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(501,"Invalid User Id")
    }

    const existence = await User.findById(userId)

    if(!existence){
        throw new ApiError(501,"User does not Exist")
    }

    const userPlaylists = await Playlist.find({owner: userId})

    if(userPlaylists.length===0){
        return res
        .status(200)
        .json(
            new ApiResponse(200,userPlaylists,"User has no Playlist")
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylists,`Total User Playlist = ${userPlaylists.length}`)
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(402,"Playlist Id is Required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(501,"Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)
    
    if(!playlist){
        throw new ApiError (502,"Playlist does not Exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist Fetched Successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(402,"Playlist Id and Video Id are Required")
    }

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(501,"Invalid Playlist Id or Video Id")
    }

    const playlistExistence = await Playlist.findById(playlistId)
    const realPlaylist = await Playlist.find({_id:playlistId, owner:req.user._id})
    const videoExistence = await Video.findById(videoId)

    if(!playlistExistence){
        throw new ApiError(502,"Playlist Does Not Exist")
    }

    if(!videoExistence){
        throw new ApiError(502,"Video Does Not Exist")
    }

    if(realPlaylist.length===0){
        throw new ApiError(502,"Cannot Make Changes on Other User's Playlist")
    }

    if(realPlaylist[0].videos.includes(videoId)){
        throw new ApiError(502,"Video already Exist in Playlist")
    }

    
    const playlistAfterVideoAddition = await Playlist.findByIdAndUpdate(playlistId,{$push:{videos: videoId}},{new: true})

    if(!playlistAfterVideoAddition){
        throw new ApiError(503,"Error while Adding Video to the Playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistAfterVideoAddition,"Video Successfully Added")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId){
        throw new ApiError(402,"Playlist Id and Video Id are Required")
    }

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(501,"Invalid Playlist Id or Video Id")
    }

    const playlistExistence = await Playlist.findById(playlistId)
    const realPlaylist = await Playlist.find({_id:playlistId, owner:req.user._id})
    const videoExistence = await Video.findById(videoId)

    if(!playlistExistence){
        throw new ApiError(502,"Playlist Does Not Exist")
    }

    if(!videoExistence){
        throw new ApiError(502,"Video Does Not Exist")
    }

    if(realPlaylist.length===0){
        throw new ApiError(502,"Cannot Make Changes on Other User's Playlist")
    }

    if(!realPlaylist[0].videos.includes(videoId)){
        throw new ApiError(502,"Video Does Not Exist in Playlist")
    }
    
    const playlistAfterVideoDeletion = await Playlist.findByIdAndUpdate(playlistId,{$pull:{videos: videoId}},{new: true})

    if(!playlistAfterVideoDeletion){
        throw new ApiError(503,"Error while Deleting Video from Playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistAfterVideoDeletion,"Video Deleted from Playlist Successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!playlistId){
        throw new ApiError(402,"Playlist Id is Required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(502,"Invalid Playlist Id")
    }

    const existence = await Playlist.findById(playlistId)

    if(!existence){
        throw new ApiError(503,"Playlist Does Not Exist")
    }

    const playlist = await Playlist.find({_id:playlistId,owner:req.user._id})

    if(playlist.length==0){
        throw new ApiError(503,"Cannot Make Changes to Other User's Playlist")
    }

    const playlistAfterDelete = await Playlist.findByIdAndDelete(playlistId)

    if(!playlistAfterDelete){
        throw new ApiError(502,"Error while Deleting Playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistAfterDelete,"Playlist Deleted Successfully")
    )
    

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}