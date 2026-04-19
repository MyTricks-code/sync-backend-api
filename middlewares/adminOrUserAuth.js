import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const adminOrUserAuth = async (req, res, next) => {
	const { token, adminToken } = req.cookies;

	try {
		if (token) {
			const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
			if (decodeToken.id) {
				req.userId = decodeToken.id;
				return next();
			}
		}

		if (adminToken) {
			const decodeToken = jwt.verify(adminToken, process.env.JWT_SECRET);
			if (!decodeToken.email || !decodeToken.club) {
				return res.json({
					success: false,
					message: "Not Authorized. Login Again"
				});
			}

			req.body = {
				...req.body,
				email: decodeToken.email,
				club: decodeToken.club
			};

			const org = await mongoose.connection.collection('organization').findOne({ name: decodeToken.club });
			const admin = org?.admins?.find((item) => item.email === decodeToken.email);

			if (admin?.userId) {
				req.userId = admin.userId.toString();
			}

			return next();
		}

		return res.json({
			success: false,
			message: "Not Authorized. Login Again"
		});
	} catch (err) {
		return res.json({
			success: false,
			message: err.message
		});
	}
};

export default adminOrUserAuth;
