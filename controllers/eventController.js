import Event from "../models/eventModel.js"
import { generateEventReport } from "../helpers/generateEventReport.js"

// ---sare events k liye
export const getAllEvents = async (req, res) => {
  try {

    const { club, from, to, page, limit } = req.query

    let filter = {}

    if (club) filter.club = club

    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to) filter.date.$lte = new Date(to)
    }

    // Backward compatible: when no `page` is requested, return up to 500 events
    // (used by the calendar view). Hard cap prevents memory exhaustion on the droplet.
    if (page === undefined) {
      const events = await Event.find(filter)
        .sort({ date: 1 })
        .limit(500)
        .lean()

      return res.json({
        success: true,
        events
      })
    }

    // Paginated path: upcoming events first (ascending), then past events.
    const pageNum = Math.max(1, Number(page) || 1)
    const perPage = Math.min(50, Math.max(1, Number(limit) || 20))
    const skip = (pageNum - 1) * perPage

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          isPast: {
            $cond: [
              { $and: [{ $ne: ["$date", null] }, { $gte: ["$date", todayStart] }] },
              0,
              1
            ]
          }
        }
      },
      { $sort: { isPast: 1, date: 1 } },
      {
        $facet: {
          events: [{ $skip: skip }, { $limit: perPage }, { $project: { isPast: 0 } }],
          meta: [{ $count: "total" }]
        }
      }
    ]

    const [result] = await Event.aggregate(pipeline)
    const events = result?.events || []
    const total = result?.meta?.[0]?.total || 0
    const hasMore = skip + events.length < total

    return res.json({
      success: true,
      events,
      page: pageNum,
      limit: perPage,
      total,
      hasMore
    })

  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    })
  }
}


// --- PDF report of all events (sorted most recent first)
export const getEventReport = async (req, res) => {
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
      .sort({ date: -1 }) // most recent first
      .lean()

    const today = new Date().toISOString().slice(0, 10)
    const filename = `ait-club-events-${today}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)

    generateEventReport(res, events)
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
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