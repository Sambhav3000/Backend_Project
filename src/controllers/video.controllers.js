import mongoose, {isValidObjectId} from "mongoose"
import multer from "multer"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { destroyFromCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"Title and Description is Missing");
    }
   
    let videoFileLocalPath;
    let thumbnailLocalPath;

    if(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length>0){
        videoFileLocalPath = req.files.videoFile[0].path
    }


    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length>0){
         thumbnailLocalPath=req.files.thumbnail[0].path
    }

    if(!videoFileLocalPath){
        throw new ApiError(400,"Video File is Missing");
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is Missing");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(500,"Error while uploading Video on Cloudinary");
    }

    if(!thumbnailFile){
        throw new ApiError(500, "Error while uploading Thumbnail on Cloudinary");
    }

    const owner = await User.findById(req.user?._id)
    .select("-password -email -avatar -createdAt -updatedAt -coverImage -fullName -watchHistory -refreshToken -coverImagePublicId")

    
    const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnailFile.url,
        thumbnailPublicId: thumbnailFile.public_id,
        title,
        description,
        duration:videoFile.duration,
        views:0,
        owner: owner
    })

    const findVideo= await Video.findById(video.id)

    if(!findVideo){
        throw new ApiError(501,"Error Uploading the Video");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(201, video, "Video Published Successfully")
    )


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)
    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video Fetched Successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body
    

    const thumbnailLocalPath=req.file?.path

    if (!title || !description){
        throw new ApiError(400, "Title and Description are Required")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is Required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    

    if(!thumbnail){
        throw new ApiError(500, "Error uploading Thumbnail to Cloudinary")
    }
    
    const oldVideo = await Video.findById(videoId)

    const video = await Video.findByIdAndUpdate(videoId,{
        $set:{
            title: title,
            description: description,
            thumbnail: thumbnail.url,
            thumbnailPublicId: thumbnail.public_id
        }},
        {new: true}
    )
    
    const deleteThumbnail = await destroyFromCloudinary(oldVideo.thumbnailPublicId)

    if(!deleteThumbnail){
        throw new ApiError(501,"Error Deleting the Thumbnail from Cloudinary")
    }

    
    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video Updated Successfully")
    )
    
    
    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video= await Video.findById(videoId)
    
    if(!video){
        throw new ApiError(400,"Video does not exist")
    }

    if (video.owner?._id !== req.user?._id){
        throw new ApiError(401, "Unauthorized Access")
    }

    const oldThumbnail = video.thumbnailPublicId
    const oldVideo = video.videoFilePublicId

    const deleteVideoFile = await destroyFromCloudinary(oldVideo)
    const deleteThumbnail = await destroyFromCloudinary(oldThumbnail)

    if (!deleteVideoFile){
        throw new ApiError(501,"Error Deleting Video File from Cloudinary")
    }

    if (!deleteThumbnail){
        throw new ApiError(501,"Error Deleting Video File from Cloudinary")
    }

    const dlt = await Video.findByIdAndDelete(videoId)
   
    const checkDelete = await Video.findById(videoId)

    if(checkDelete){
        throw new ApiError(500, "Error deleting the Video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,dlt,"Video Deleted Successfully" )
    )
        
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video does not exist")
    }

    let toogling;
    
    if(video.isPublished=== true){
            toogling = await Video.findByIdAndUpdate(videoId,{
            isPublished: false
        })
    

        if(!toogling){
            throw new ApiError(500,"Error while unpublishing the video")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,{isPublished: false},"Video Unpublished Successfully")
        )
    }
    else{
        toogling= await Video.findByIdAndUpdate(videoId,{
            isPublished: true
        })

        if(!toogling){
            throw new ApiError(500, "Error while publishing the video")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,{isPublished: true},"Video Published Successfully")
        )
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}