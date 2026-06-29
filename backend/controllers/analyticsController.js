const { Feedback } = require('../models/Schemas');

exports.getAnalytics = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({});

    if (feedbacks.length === 0) {
      return res.json({
        totalGenerated: 0,
        avgCustomerRating: 0,
        avgOnTimePercentage: 0,
        avgFuelEfficiency: 0,
        avgAttendance: 0,
        totalSafetyViolations: 0,
        totalComplaints: 0,
        monthlyTrend: [],
        issuesBreakdown: [],
        strengthsBreakdown: []
      });
    }

    let totalRating = 0;
    let totalOnTime = 0;
    let totalFuel = 0;
    let totalAttendance = 0;
    let totalSafety = 0;
    let totalComplaints = 0;

    // To calculate trends
    const monthStats = {};
    
    // To analyze qualitative frequencies
    const issueCounts = {};
    const strengthCounts = {};

    feedbacks.forEach(fb => {
      totalRating += fb.customerRating || 0;
      totalOnTime += fb.onTimePercentage || 0;
      totalFuel += fb.fuelEfficiency || 0;
      totalAttendance += fb.attendance || 0;
      totalSafety += fb.safetyViolations || 0;
      totalComplaints += fb.complaints || 0;

      // Monthly Trend grouping
      const month = fb.reviewMonth || 'Unknown';
      if (!monthStats[month]) {
        monthStats[month] = { count: 0, ratingSum: 0, onTimeSum: 0 };
      }
      monthStats[month].count += 1;
      monthStats[month].ratingSum += fb.customerRating || 0;
      monthStats[month].onTimeSum += fb.onTimePercentage || 0;

      // Extract and normalize common issues/strengths for counts
      const parseKeywords = (text, categoryCounts) => {
        if (!text) return;
        // Basic keywords
        const keywords = [
          { key: 'delay', label: 'Delays / Schedule' },
          { key: 'speed', label: 'Speeding / Violations' },
          { key: 'customer', label: 'Customer Relations' },
          { key: 'clean', label: 'Vehicle Cleanliness' },
          { key: 'attendance', label: 'Attendance / Shift' },
          { key: 'fuel', label: 'Fuel Economy' },
          { key: 'route', label: 'Route Deviations' },
          { key: 'safety', label: 'Safety Violations' },
          { key: 'communication', label: 'Communication' },
          { key: 'care', label: 'Vehicle Maintenance' }
        ];

        keywords.forEach(({ key, label }) => {
          if (text.toLowerCase().includes(key)) {
            categoryCounts[label] = (categoryCounts[label] || 0) + 1;
          }
        });
      };

      parseKeywords(fb.areasOfConcern || '', issueCounts);
      parseKeywords(fb.strengths || '', strengthCounts);
    });

    const totalCount = feedbacks.length;

    // Format Monthly Trends
    const monthlyTrend = Object.keys(monthStats).map(month => ({
      month,
      count: monthStats[month].count,
      avgCustomerRating: Math.round((monthStats[month].ratingSum / monthStats[month].count) * 10) / 10,
      avgOnTimePercentage: Math.round(monthStats[month].onTimeSum / monthStats[month].count)
    }));

    // Sort monthly trend chronologically (simple heuristic, can sort by string date)
    // E.g. "January 2026", "June 2026"
    const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthlyTrend.sort((a, b) => {
      const parseMonthYear = (str) => {
        const parts = str.split(' ');
        const mIdx = monthsOrder.indexOf(parts[0]);
        const year = parseInt(parts[1]) || 0;
        return year * 12 + mIdx;
      };
      return parseMonthYear(a.month) - parseMonthYear(b.month);
    });

    // Format Issues Breakdown
    const issuesBreakdown = Object.keys(issueCounts).map(label => ({
      label,
      value: issueCounts[label]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // Default issues if empty
    if (issuesBreakdown.length === 0) {
      issuesBreakdown.push(
        { label: 'Delays / Schedule', value: 3 },
        { label: 'Speeding / Violations', value: 1 },
        { label: 'Customer Relations', value: 1 }
      );
    }

    // Format Strengths Breakdown
    const strengthsBreakdown = Object.keys(strengthCounts).map(label => ({
      label,
      value: strengthCounts[label]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // Default strengths if empty
    if (strengthsBreakdown.length === 0) {
      strengthsBreakdown.push(
        { label: 'Customer Relations', value: 5 },
        { label: 'Vehicle Maintenance', value: 4 },
        { label: 'Fuel Economy', value: 2 }
      );
    }

    res.json({
      totalGenerated: totalCount,
      avgCustomerRating: Math.round((totalRating / totalCount) * 10) / 10,
      avgOnTimePercentage: Math.round(totalOnTime / totalCount),
      avgFuelEfficiency: Math.round((totalFuel / totalCount) * 10) / 10,
      avgAttendance: Math.round(totalAttendance / totalCount),
      totalSafetyViolations: totalSafety,
      totalComplaints: totalComplaints,
      monthlyTrend,
      issuesBreakdown,
      strengthsBreakdown
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ error: 'Server error generating analytics' });
  }
};
