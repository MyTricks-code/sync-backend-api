import Event from "../models/eventModel.js"

// ---sare events k liye
export const getAllEvents = async (req, res) => {
  try {

    const { club, from, to } = req.query

    let filter = {}

    if (club) filter.club = club

    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to) filter.date.$lte = new Date(to)
    }

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .lean()

    return res.json({
      success: true,
      events
    })

  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    })
  }
}


// --- ek event k liye
export const getEventById = async (req, res) => {
  try {

    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.json({ success: false, message: "Event not found" })
    }

    return res.json({
      success: true,
      event
    })

  } catch (err) {
    return res.json({ success: false, message: err.message })
  }
}