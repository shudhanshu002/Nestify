// @desc    Create a Company Admin (Platform Admin Only)
// @route   POST /api/v1/admin/onboard-company
export const onboardCompanyAdmin = async (req, res, next) => {
  try {
    const { email, firstName, lastName, companyName } = req.body;

    // 1. Create the User with the restricted role
    const newAdmin = await User.create({
      firstName,
      lastName,
      email,
      role: 'COMPANY_ADMIN',
      password: Math.random().toString(36).slice(-12), // Temporary random password
    });

    // 2. Create the Company Profile linked to them
    const company = await Company.create({
      name: companyName,
      admin: newAdmin._id,
      isVerified: true
    });

    res.status(201).json({
      success: true,
      message: `Account created for ${companyName}. Invitation sent to ${email}.`
    });
  } catch (error) {
    next(error);
  }
};