// backend/middleware/trialCheck.js
export default function trialCheck(req, res, next) {
  // Ensure the user is authenticated.
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  const { tier, trial_expires_at } = req.user;

  // Enforce the trial check only for users on the "basic" tier.
  if (tier === 'basic') {
    const now = new Date();
    const trialExpiry = new Date(trial_expires_at);

    // If the trial period has expired, block access with a 403 error.
    if (trialExpiry < now) {
      return res.status(403).json({
        error: "Your free trial has expired. Please upgrade to access this feature.",
      });
    }
  }

  // Trial is still active or user is of a higher tier; proceed to the next middleware.
  next();
}
