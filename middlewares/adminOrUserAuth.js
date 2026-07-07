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
			if (!decodeToken.email) {
				return res.json({
					success: false,
					message: "Not Authorized. Login Again"
				});
			}

			if (
				decodeToken.role === "director" ||
				decodeToken.role === "principal" ||
				decodeToken.role === "jd"
			) {
				req.userId = decodeToken.adminId;

				// A superadmin who is ALSO an org admin (e.g. faculty) carries the
				// org context in the token — inject it so org-scoped endpoints
				// (like club forms) authorize them through that organization.
				if (decodeToken.club) {
					req.body = {
						...req.body,
						email: decodeToken.email,
						club: decodeToken.club
					};

					const org = await mongoose.connection
						.collection('organization')
						.findOne(
							{ name: decodeToken.club },
							{ projection: { admins: 1 } }  // Only fetch what we need
						);

					const admin = org?.admins?.find(
						item => item.email === decodeToken.email
					);

					if (admin?.userId) {
						req.userId = admin.userId.toString();
					}
				}

				return next();
			}

			req.body = {
				...req.body,
				email: decodeToken.email,
				club: decodeToken.club
			};

			const org = await mongoose.connection
				.collection('organization')
				.findOne(
					{ name: decodeToken.club },
					{ projection: { admins: 1 } }  // Only fetch what we need
				);

			const admin = org?.admins?.find(
				item => item.email === decodeToken.email
			);

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
