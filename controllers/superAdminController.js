import mongoose from "mongoose";
import formModel from "../models/formsModel.js";
import responseModel from "../models/responseModel.js";
import Event from "../models/eventModel.js";
import taskModel from "../models/taskModel.js";
import userModel from "../models/userModel.js";


export const deleteClub =
    async (req, res) => {

        const session =
            await mongoose.startSession();

        try {

            session.startTransaction();

            const { clubId } = req.body;

            const org =
                await mongoose.connection
                    .collection("organization")
                    .findOne({
                        _id: new mongoose.Types.ObjectId(clubId)
                    });

            if (!org) {

                await session.abortTransaction();

                return res.json({
                    success: false,
                    message: "Club not found"
                });

            }

            await formModel.deleteMany({
                _id: { $in: org.forms || [] }
            });

            await responseModel.deleteMany({
                formId: { $in: org.forms || [] }
            });

            await Event.deleteMany({
                club: org.name
            });

            await taskModel.deleteMany({
                owner: org.name
            });

            await mongoose.connection
                .collection("organization")
                .deleteOne({
                    _id: org._id
                });

            await session.commitTransaction();

            return res.json({
                success: true,
                message: "Club deleted"
            });

        } catch (err) {

            await session.abortTransaction();

            return res.json({
                success: false,
                message: err.message
            });

        } finally {
            session.endSession();
        }

    }


export const createOrganization =
    async (req, res) => {

        try {

            const {
                name,
                logo,
                faculty
            } = req.body;

            const exists =
                await mongoose.connection
                    .collection("organization")
                    .findOne({ name });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Club already exists"
                });
            }

            const club =
                await mongoose.connection
                    .collection("organization")
                    .insertOne({

                        name,

                        clubLogo: logo,

                        faculty,

                        secretaries: [],

                        members: [],

                        forms: [],

                        responses: [],

                        isActive: true,

                        createdBy: req.admin.adminId,

                        createdAt: new Date(),

                        updatedAt: new Date()
                    });

            return res.json({
                success: true,
                club
            });

        } catch (err) {

            return res.json({
                success: false,
                message: err.message
            });

        }

    }

export const changeFaculty = async (req, res) => {
    try {

        const {
            clubId,
            facultyId
        } = req.body;

        await mongoose.connection
            .collection("organization")
            .updateOne(
                {
                    _id: new mongoose.Types.ObjectId(
                        clubId
                    )
                },
                {
                    $set: {
                        faculty: facultyId
                    }
                }
            );

        return res.json({
            success: true
        });

    } catch (err) {

        return res.json({
            success: false,
            message: err.message
        });

    }

}


export const getGlobalDashboard =
async(req,res)=>{

 try{

  const start =
  new Date();

  start.setDate(
    start.getDate()-5
  );

  const end =
  new Date();

  end.setDate(
    end.getDate()+5
  );

  const clubs =
  await mongoose.connection
  .collection("organization")
  .find({})
  .toArray();

  const totalClubs =
  clubs.length;

  const totalMembers =
  clubs.reduce(
    (acc,item)=>
    acc + (item.members?.length || 0),
    0
  );

  const totalForms =
  await formModel.countDocuments();

  const totalResponses =
  await responseModel.countDocuments();

  const totalEvents =
  await Event.countDocuments();

  const timelineEvents =
  await Event.find({
    date:{
      $gte:start,
      $lte:end
    }
  })
  .sort({date:1});

  return res.json({
    success:true,
    data:{
      totalClubs,
      totalMembers,
      totalForms,
      totalResponses,
      totalEvents,
      timelineEvents
    }
  });

 }catch(err){

  return res.json({
    success:false,
    message:err.message
  });

 }

}

export const generateIqacReport =
async(req,res)=>{

 try{

  const {
    club,
    month,
    year
  } = req.query;

  const startDate =
  new Date(
    Number(year),
    Number(month)-1,
    1
  );

  const endDate =
  new Date(
    Number(year),
    Number(month),
    0,
    23,
    59,
    59
  );

  const events =
  await Event.find({
    club,
    date:{
      $gte:startDate,
      $lte:endDate
    }
  }).sort({date:1});

  return res.json({
    success:true,
    data:{
      club,
      month,
      year,
      totalEvents:
      events.length,
      events
    }
  });

 }catch(err){

  return res.json({
    success:false,
    message:err.message
  });

 }

}