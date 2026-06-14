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

  const clubsList =
  clubs.map((c)=>({
    _id: c._id,
    name: c.name,
    faculty: c.faculty || null,
    clubLogo: c.clubLogo || c.logo || null,
    membersCount: c.members?.length || 0,
    secretariesCount: c.secretaries?.length || 0,
    formsCount: c.forms?.length || 0,
    isActive: c.isActive !== false
  }));

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
      timelineEvents,
      clubs:clubsList
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
    month,
    year
  } = req.query;

  // req.org / req.orgId are populated by the resolveOrg middleware.
  const org = req.org;

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
    organization: req.orgId,
    date:{
      $gte:startDate,
      $lte:endDate
    }
  }).sort({date:1});

  return res.json({
    success:true,
    data:{
      club: org?.name,
      clubId: req.orgId,
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


export const generateQuarterReport =
async(req,res)=>{

 try{

  const months =
  Math.max(
    1,
    Math.min(
      24,
      Number(req.query.months) || 4
    )
  );

  const now = new Date();

  // Month-aligned window: covers `months` full months ending with the current month.
  const startDate =
  new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1
  );

  const endDate =
  new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const events =
  await Event.find({
    date:{
      $gte:startDate,
      $lte:endDate
    }
  }).sort({date:1}).lean();

  // Build org id -> name map for the orgs referenced by these events.
  const orgIds =
  [...new Set(
    events
      .filter(e=>e.organization)
      .map(e=>String(e.organization))
  )];

  const orgDocs =
  orgIds.length
    ? await mongoose.connection
        .collection("organization")
        .find({
          _id:{
            $in:orgIds.map(
              id=>new mongoose.Types.ObjectId(id)
            )
          }
        })
        .toArray()
    : [];

  const orgNameById = {};
  orgDocs.forEach(o=>{ orgNameById[String(o._id)] = o.name; });

  const resolveClubName = (e)=>
    (e.organization && orgNameById[String(e.organization)])
    || e.club
    || "Unassigned";

  // Group events by club name.
  const groupMap = new Map();
  const enriched = events.map(e=>{
    const clubName = resolveClubName(e);
    if(!groupMap.has(clubName)){
      groupMap.set(clubName,{
        club: clubName,
        clubId: e.organization || null,
        count: 0,
        events: []
      });
    }
    const g = groupMap.get(clubName);
    g.count += 1;
    g.events.push(e);
    return { ...e, clubName };
  });

  const clubs =
  [...groupMap.values()].sort(
    (a,b)=>b.count - a.count
  );

  return res.json({
    success:true,
    data:{
      months,
      startDate,
      endDate,
      totalEvents: events.length,
      totalClubs: clubs.filter(c=>c.club !== "Unassigned").length,
      clubs,
      events: enriched
    }
  });

 }catch(err){

  return res.json({
    success:false,
    message:err.message
  });

 }

}


// ── Faculty management ───────────────────────────────────────────────
// A "faculty" is an entry in the organization's `admins` array with
// role === "faculty". All three handlers run AFTER resolveOrg, so
// req.org / req.orgId are set and the organization exists.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getFaculties = async (req, res) => {
  try {
    const admins = Array.isArray(req.org?.admins) ? req.org.admins : [];
    const faculties = admins
      .filter((a) => a?.role === "faculty")
      .map((a) => ({ name: a.name, email: a.email, role: a.role }));
    return res.json({ success: true, faculties });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const addFaculty = async (req, res) => {
  try {
    // NOTE: `adminAuth` overwrites req.body.email with the CALLER's email when
    // their token carries a club (anti-spoofing). The new faculty's email
    // therefore travels in a distinct field (facultyEmail) to avoid collision.
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.facultyEmail === "string" ? req.body.facultyEmail.trim().toLowerCase() : "";

    if (!name || !email) {
      return res.json({ success: false, message: "Name and email are required" });
    }
    if (name.length > 100) {
      return res.json({ success: false, message: "Name is too long" });
    }
    if (email.length > 200 || !EMAIL_RE.test(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    const orgs = mongoose.connection.collection("organization");

    // Prevent duplicate email among this club's admins (any role).
    const dup = await orgs.findOne({ _id: req.orgId, "admins.email": email });
    if (dup) {
      return res.json({ success: false, message: "An admin/faculty with this email already exists in this club" });
    }

    const faculty = {
      name,
      email,
      role: "faculty",
      loginOtp: "",
      loginOtpExpireAt: 0,
    };

    await orgs.updateOne({ _id: req.orgId }, { $push: { admins: faculty } });

    return res.json({ success: true, faculty });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const removeFaculty = async (req, res) => {
  try {
    const email = typeof req.body?.facultyEmail === "string" ? req.body.facultyEmail.trim().toLowerCase() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return res.json({ success: false, message: "Valid faculty email is required" });
    }

    const orgs = mongoose.connection.collection("organization");

    // Only pull admins that are faculty — never remove a director/principal/jd/admin.
    const result = await orgs.updateOne(
      { _id: req.orgId },
      { $pull: { admins: { email, role: "faculty" } } }
    );

    if (result.modifiedCount === 0) {
      return res.json({ success: false, message: "Faculty not found" });
    }

    return res.json({ success: true, message: "Faculty removed" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};