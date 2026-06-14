import mongoose from "mongoose";

/**
 * Resolve an organization document from any identifier we might receive:
 *   - Mongo _id (string or ObjectId)
 *   - name           (case-insensitive exact match)
 *   - abbr           (case-insensitive exact match)
 *   - instagram handle (matched against the org's instagramHandles array)
 *
 * Returns the raw organization document, or null if nothing matches.
 * Shared by the resolveOrg middleware (HTTP routes) and the scrape job.
 */
export const findOrg = async (identifier) => {
  if (!identifier) return null;

  const orgs = mongoose.connection.collection("organization");
  const value = String(identifier).trim();

  // 1) Try by _id when it looks like a valid ObjectId.
  if (mongoose.Types.ObjectId.isValid(value)) {
    const byId = await orgs.findOne({ _id: new mongoose.Types.ObjectId(value) });
    if (byId) return byId;
  }

  // 2) Case-insensitive exact match on name / abbr, or membership in instagramHandles.
  const ci = new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  return orgs.findOne({
    $or: [
      { name: ci },
      { abbr: ci },
      { instagramHandles: value },
    ],
  });
};

/**
 * Express middleware — resolves an organization from the request and attaches
 * `req.org` (full doc) and `req.orgId` (ObjectId). Looks in query/body for
 * clubId | club | org | handle. Responds 200-json error if unresolved
 * (kept consistent with the rest of this codebase's error style).
 */
export const resolveOrg = async (req, res, next) => {
  try {
    const src = { ...req.query, ...req.body };
    const identifier = src.clubId || src.club || src.org || src.handle || src.orgId;

    if (!identifier) {
      return res.json({ success: false, message: "Organization identifier required" });
    }

    const org = await findOrg(identifier);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    req.org = org;
    req.orgId = org._id;
    next();
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export default resolveOrg;
