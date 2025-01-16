import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User}from '../models/user.models.js'
import {destroyFromCloudinary, uploadOnCloudinary} from '../utils/Cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'


const generateAccessTokensAndRefreshTokens=async(userId)=>{
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images, check for avatar(required)
    //upload them to cloudinary, avatar
    //create user object -  create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response else send error

    const {username,email,fullName,password}=req.body
    

    if([fullName,email,username,password].some((field)=>
        field?.trim()===""
    ))
    {
        throw new ApiError(400,"All fields are required")
    }
    
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

   

    // const avatarLocalPath=req.files?.avatar[0]?.path
    // const coverImageLocalPath=req.files?.coverImage[0]?.path

    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0){
        avatarLocalPath=req.files.avatar[0].path
    }

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        coverImagePublicId:coverImage?.public_id || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"User Registration Failed")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
})

const loginUser= asyncHandler (async(req,res)=>{
    //take user id password
    //validate if empty
    //check the credentials(password)
    //if no, password wrong
    //if correct password, give accesstoken and refresh token through cookies

    const {username,email,password}=req.body

    if(!(username || email)){
        throw new ApiError(400,"Username or Email is required")
    }

    const user= await User.findOne({
        $or:[{email},{username}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const passwordValidity= await user.isPasswordCorrect(password)
    if(!passwordValidity){
        throw new ApiError(401,"Invalid Password")
    }

    const {accessToken,refreshToken}=await generateAccessTokensAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,refreshToken
            },
            "User Logged In Successfull "
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    //find user first
    //clear cookies, refreshToken
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken||req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,  process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id)
        
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token");
        }
        
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const {accessToken,newRefreshToken}= await generateAccessTokensAndRefreshTokens(user._id)
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        new ApiError(401,error?.message||"Invalid Refresh Token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    
    const {oldPassword, newPassword}=req.body

    const user = await User.findById(req.user?._id) 

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password has been Changed Successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current User Fetched Succesffuly"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName, email } = req.body

    if(!fullName && !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new: true} //new: true returns the updated data into user now
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Updated Successfully"))
})

const updateAvatar= asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is Missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while Uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(200, user, "Avatar Updated Successfully")
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const user1 = await User.findById(req.user?._id)    
    
    const deletedCoverImage=await destroyFromCloudinary(user1.coverImagePublicId)

    if(deletedCoverImage.result !== "ok"){
        throw new ApiError(501, "Error Deleting the Cover Image");
    }
    
    const coverLocalPath=req.file?.path

    if(!coverLocalPath){
        throw new ApiError(400,"Cover Image File is Missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if(!coverImage.url){
        throw new ApiError(401,"Error while Uploading Cover Image");
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image Updated Successfully"))
    
    })

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    
    if(!username?.trim()){
        throw new ApiError(400,"Username is Missing");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                        $size:"$subscribers"
                    },
                channelsSubscribedTo:{
                        $size:"$subscribedTo"
                    },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedTo: 1,
                isSubscribed:1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
        
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel does not Exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User Channel Feteched Successfully")
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"videoOwner",
                            pipeline:[
                                {
                                    $project:{
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1  
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Watch History Fetched Successfully")
    )
})

export {
        registerUser, 
        loginUser,
        logoutUser, 
        refreshAccessToken, 
        changeCurrentPassword, 
        getCurrentUser,
        updateAccountDetails,
        updateAvatar,
        updateCoverImage, 
        getUserChannelProfile, 
        getWatchHistory
    }