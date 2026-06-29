const { OpenAI } = require('openai');
const { Feedback, Driver } = require('../models/Schemas');

// Helper to generate a realistic mock response when OpenAI key is missing or fails
const generateMockFeedback = (data) => {
  const {
    driverName, driverId, reviewMonth, vehicleNumber, route,
    tripsCompleted, tripsDelayed, onTimePercentage, customerRating,
    fuelEfficiency, attendance, safetyViolations, complaints,
    positiveFeedback, managerNotes, strengths, areasOfConcern, additionalRemarks
  } = data;

  const onTimeStatus = onTimePercentage >= 95 ? 'Excellent' : onTimePercentage >= 90 ? 'Good' : 'Needs Improvement';
  const ratingStatus = customerRating >= 4.5 ? 'Exceptional' : customerRating >= 4.0 ? 'Satisfactory' : 'Critical Review Required';

  return `
# Driver Information
- **Driver Name:** ${driverName}
- **Driver ID:** ${driverId}
- **Review Month:** ${reviewMonth}
- **Vehicle Number:** ${vehicleNumber}
- **Assigned Route:** ${route}

# Performance Summary
During the month of ${reviewMonth}, ${driverName} completed **${tripsCompleted} trips** with **${tripsDelayed} delays**, yielding an **On-Time Performance of ${onTimePercentage}%** (${onTimeStatus}). Customer reviews averages **${customerRating}/5 stars** (${ratingStatus}). Fuel consumption rate was recorded at **${fuelEfficiency} km/l** with an attendance score of **${attendance}%**. Safety monitoring registered **${safetyViolations} violations** and **${complaints} customer/public complaints**.

# Strengths
- **Safety & Care:** Outstanding commitment to schedule compliance.
- **Customer Satisfaction:** A solid rating of ${customerRating}/5 highlights strong interpersonal skills and passenger comfort.
${positiveFeedback ? `- **Manager Highlight:** ${positiveFeedback}` : ''}
${strengths ? `- **Noted Strengths:** ${strengths}` : ''}

# Areas for Improvement
- **On-Time Performance Optimization:** Reduce delays (currently at ${tripsDelayed} trips delayed) through proactive route planning.
- **Safety Compliance:** Focus on keeping safety violations at absolute zero (currently ${safetyViolations} recorded).
${areasOfConcern ? `- **Operational Concerns:** ${areasOfConcern}` : ''}

# Coaching Suggestions
1. **Defensive Driving Refresh:** Participate in the monthly safety alignment seminar to reduce traffic violations.
2. **Dynamic Route Analysis:** Coordinate with dispatch 15 minutes before departure to inspect weather/traffic constraints on the ${route} route.

# SMART Action Plan
- **Specific:** Improve On-Time Delivery percentage to 97% or higher.
- **Measurable:** Track weekly trip logs and delay root causes.
- **Achievable:** Utilize real-time GPS tracking adjustments and speed-limit adherence.
- **Relevant:** Enhances Manivtha Tours & Travels' brand reputation and service reliability.
- **Time-Bound:** Target achievement by the next monthly review (end of next month).

# Manager Talking Script
*"Hello ${driverName.split(' ')[0]}, thank you for sitting down with me today. First, I want to express my appreciation for your dedication. Your customer rating of ${customerRating} stars shows our travelers really enjoy riding with you. Your strengths in ${strengths || 'vehicle maintenance and passenger communication'} are a major asset to Manivtha Tours & Travels.*

*Looking at the numbers for ${reviewMonth}, we had ${tripsDelayed} delayed trips, bringing us to ${onTimePercentage}%. I want us to work together to get this above 95%. Also, we noticed ${safetyViolations} safety notifications. Safety is our absolute priority. Let's focus on staying safe and planning ahead. What do you think we can do to make next month even better?"*

# Motivational Closing
${driverName}, your work keeps Manivtha Tours & Travels moving forward. You have shown excellent capability, and we are confident that with a few adjustments, you will hit peak performance next month. Thank you for your hard work and drive safe!

# Final Remarks
${additionalRemarks || 'No additional remarks.'}
  `.trim();
};

// Generate AI Feedback Script
exports.generateFeedback = async (req, res) => {
  const data = req.body;

  // Destructure for validation
  const {
    managerName, driverName, driverId, reviewMonth, vehicleNumber, route,
    tripsCompleted, tripsDelayed, onTimePercentage, customerRating,
    fuelEfficiency, attendance, safetyViolations, complaints
  } = data;

  // Simple validations
  if (!managerName || !driverName || !driverId || !reviewMonth || !vehicleNumber || !route) {
    return res.status(400).json({ error: 'Missing primary driver details' });
  }

  if (
    tripsCompleted === undefined || tripsDelayed === undefined || onTimePercentage === undefined ||
    customerRating === undefined || fuelEfficiency === undefined || attendance === undefined ||
    safetyViolations === undefined || complaints === undefined
  ) {
    return res.status(400).json({ error: 'Missing numerical KPI metrics' });
  }

  // Get OpenAI Key (either from request settings or environment)
  const apiKey = req.body.apiKey || process.env.OPENAI_API_KEY;
  const model = req.body.model || process.env.OPENAI_MODEL || 'gpt-4o';

  let scriptText = '';
  let usingMock = false;

  if (!apiKey) {
    console.log('ℹ️ No OpenAI API Key provided. Utilizing high-fidelity local template generator.');
    scriptText = generateMockFeedback(data);
    usingMock = true;
  } else {
    try {
      const openai = new OpenAI({ apiKey });

      const systemPrompt = `
You are an expert HR Performance Coach for transportation companies.
Generate a professional monthly driver performance feedback script for Manivtha Tours & Travels.

Rules:
1. Always appreciate strengths first.
2. Never criticize aggressively. Use supportive, coaching language.
3. Use positive language.
4. Provide constructive coaching tips.
5. Mention KPI analysis explicitly.
6. Create SMART improvement goals.
7. Motivate the driver.
8. End professionally.
9. Return output in MARKDOWN format.

You must structure the output into these exact sections:
# Driver Information
# Performance Summary
# Strengths
# Areas for Improvement
# Coaching Suggestions
# SMART Action Plan
# Manager Talking Script
# Motivational Closing
# Final Remarks
      `.trim();

      const userPrompt = `
Generate feedback script based on the following monthly driver details:
- Manager Name: ${managerName}
- Driver Name: ${driverName}
- Driver ID: ${driverId}
- Review Month: ${reviewMonth}
- Vehicle Number: ${vehicleNumber}
- Route: ${route}

KPI Metrics:
- Trips Completed: ${tripsCompleted}
- Trips Delayed: ${tripsDelayed}
- On-Time Percentage: ${onTimePercentage}%
- Customer Rating: ${customerRating}/5
- Fuel Efficiency: ${fuelEfficiency} km/l
- Attendance: ${attendance}%
- Safety Violations: ${safetyViolations}
- Complaints: ${complaints}

Qualitative Info:
- Positive Customer Feedback: ${data.positiveFeedback || 'None recorded'}
- Manager Notes: ${data.managerNotes || 'None recorded'}
- Strengths: ${data.strengths || 'Good schedule compliance'}
- Areas of Concern: ${data.areasOfConcern || 'None'}
- Additional Remarks: ${data.additionalRemarks || 'Keep up the good work'}
      `.trim();

      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      });

      scriptText = response.choices[0]?.message?.content || '';
      if (!scriptText) {
        throw new Error('Empty AI Response');
      }
    } catch (error) {
      console.error('OpenAI generation error:', error.message);
      scriptText = generateMockFeedback(data);
      usingMock = true;
    }
  }

  try {
    // Save to Feedback History
    const feedbackRecord = await Feedback.create({
      managerName,
      managerId: req.user.id,
      driverName,
      driverId,
      reviewMonth,
      vehicleNumber,
      route,
      tripsCompleted: Number(tripsCompleted),
      tripsDelayed: Number(tripsDelayed),
      onTimePercentage: Number(onTimePercentage),
      customerRating: Number(customerRating),
      fuelEfficiency: Number(fuelEfficiency),
      attendance: Number(attendance),
      safetyViolations: Number(safetyViolations),
      complaints: Number(complaints),
      positiveFeedback: data.positiveFeedback || '',
      managerNotes: data.managerNotes || '',
      strengths: data.strengths || '',
      areasOfConcern: data.areasOfConcern || '',
      additionalRemarks: data.additionalRemarks || '',
      aiFeedbackScript: scriptText
    });

    // Automatically update the driver rating in the Drivers collection (running average)
    const driver = await Driver.findOne({ driverId });
    if (driver) {
      // Simple formula to update driver's active rating based on new feedback rating
      const oldRating = driver.rating || 5.0;
      const newRating = (oldRating + Number(customerRating)) / 2;
      await Driver.findByIdAndUpdate(driver._id, {
        rating: Math.round(newRating * 10) / 10,
        vehicleNumber,
        route
      });
    }

    res.status(201).json({
      feedback: feedbackRecord,
      warning: usingMock ? 'Running in offline fallback mode. Configure your OpenAI Key in Settings for actual AI generation.' : null
    });
  } catch (dbError) {
    console.error('Database save error:', dbError);
    res.status(500).json({ error: 'Failed to save generated feedback script to database.' });
  }
};

// Get History list (with Search, Pagination, Filters)
exports.getHistory = async (req, res) => {
  const { page = 1, limit = 10, search = '', month = '' } = req.query;

  try {
    const query = {};

    // Search by driver name, driver ID, or vehicle number
    if (search) {
      query.$or = [
        { driverName: { $regex: search, $options: 'i' } },
        { driverId: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by month
    if (month) {
      query.reviewMonth = month;
    }

    // Handled in both mongoose and file fallback
    const allMatching = await Feedback.find(query);

    // Sorting by date descending
    allMatching.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const total = allMatching.length;
    const startIndex = (page - 1) * limit;
    const paginated = allMatching.slice(startIndex, startIndex + Number(limit));

    res.json({
      data: paginated,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Server error fetching history' });
  }
};

// Get Single history item
exports.getHistoryById = async (req, res) => {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Feedback record not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('History single fetch error:', error);
    res.status(500).json({ error: 'Server error fetching feedback details' });
  }
};

// Delete feedback from history
exports.deleteHistory = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Feedback record not found' });
    }
    res.json({ message: 'Feedback history deleted successfully' });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: 'Server error deleting feedback' });
  }
};

// Rate feedback script & give feedback (Post-Generation feedback)
exports.rateFeedback = async (req, res) => {
  const { rating, ratingFeedback } = req.body;
  const { id } = req.params;

  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Please provide rating between 1 and 5' });
  }

  try {
    const updated = await Feedback.findByIdAndUpdate(id, {
      userRating: Number(rating),
      ratingFeedback: ratingFeedback || ''
    }, { new: true });

    if (!updated) {
      return res.status(404).json({ error: 'Feedback record not found' });
    }

    res.json({ message: 'Feedback rated successfully', feedback: updated });
  } catch (error) {
    console.error('Rating update error:', error);
    res.status(500).json({ error: 'Server error updating rating' });
  }
};

// Toggle favorite feedback item
exports.toggleFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await Feedback.findById(id);
    if (!record) {
      return res.status(404).json({ error: 'Feedback record not found' });
    }

    const updated = await Feedback.findByIdAndUpdate(id, {
      isFavorite: !record.isFavorite
    }, { new: true });

    res.json(updated);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Server error toggling favorite' });
  }
};
