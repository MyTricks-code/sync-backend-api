import jwt from 'jsonwebtoken'

const connectOrg = async (club) => {
  const org = await mongoose.connection
    .collection("organizations")
    .findOne({ name: club });

  return org;
};

export const adminLogin = async (req, res) => {
  try {

    if (!req.body) {
      return res.json({ success: false, message: "Body not provided" });
    }

    const { email, password, club } = req.body;

    if (!email || !password || !club) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const org = await connectOrg(club);

    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    const admin = org.admins.find(
      (a) => a.email === email && a.password === password
    );

    if (!admin) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin.email }, process.env.JWT_SECRET || 'replace-me', { expiresIn: '7d' })
    res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({
      success: true,
      message: "Admin login successful"
    });

  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    });
  }
};