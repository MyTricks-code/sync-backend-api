import mongoose from "mongoose";
import responseModel from "../models/responseModel.js";
import formModel from "../models/formsModel.js";
import Event from "../models/eventModel.js";



export const updateSecretaries = async (req, res) => {

   try {

      const { club } = req.admin;
      const { secretaryIds } = req.body;

      const org =
         await mongoose.connection
            .collection("organization")
            .findOne({
               name: club
            });

      if (!org) {
         return res.json({
            success: false,
            message: "Organization not found"
         });
      }

      await mongoose.connection
         .collection("organization")
         .updateOne(
            { _id: org._id },
            {
               $set: {
                  secretaries: secretaryIds
               }
            }
         );

      return res.json({
         success: true,
         message: "Secretaries updated"
      });

   } catch (err) {

      return res.json({
         success: false,
         message: err.message
      });

   }

}

export const getFacultyDashboard =
   async (req, res) => {

      try {

         const { club } = req.admin;

         const org =
            await mongoose.connection
               .collection("organization")
               .findOne({
                  name: club
               });

         if (!org) {
            return res.json({
               success: false,
               message: "Organization not found"
            });
         }

         const totalMembers =
            org.members?.length || 0;

         const totalForms =
            await formModel.countDocuments({
               _id: {
                  $in: org.forms || []
               }
            });

         const totalResponses =
            await responseModel.countDocuments({
               formId: {
                  $in: org.forms || []
               }
            });

         const accepted =
            await responseModel.countDocuments({
               formId: {
                  $in: org.forms || []
               },
               decision: "accepted"
            });

         const rejected =
            await responseModel.countDocuments({
               formId: {
                  $in: org.forms || []
               },
               decision: "rejected"
            });

         const reviewLater =
            await responseModel.countDocuments({
               formId: {
                  $in: org.forms || []
               },
               decision: "reviewLater"
            });

         const upcomingEvents =
            await Event.find({
               club: club,
               date: {
                  $gte: new Date()
               }
            })
               .sort({ date: 1 })
               .limit(10);

         return res.json({
            success: true,
            data: {
               totalMembers,
               totalForms,
               totalResponses,
               accepted,
               rejected,
               reviewLater,
               upcomingEvents
            }
         });

      } catch (err) {

         return res.json({
            success: false,
            message: err.message
         });

      }

   }