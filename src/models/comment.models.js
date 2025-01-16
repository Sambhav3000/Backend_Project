import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        constent:{
            type: String,
            required: true,
        },
        video:{
            type: Schema.Types.ObjectId,
            ref:"Video"
        },
        onwer:{
            type: Schema.Types.ObjectId,
            ref:"User"
        }
},{timestamps:true})

export const Comment = mongoose.model("Comment",commentSchema)