const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// GET /search - Public endpoint to search for bus schedules
router.get('/search', async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    
    // Validate required parameters
    if (!source || !destination || !date) {
      return res.status(400).json({ 
        message: 'Source, destination, and date are required parameters' 
      });
    }
    
    // Parse the date and set time to start of day for comparison
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    
    // Calculate the end of the day
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find schedules matching the criteria
    const schedules = await Schedule.find({
      source: { $regex: new RegExp(source, 'i') },
      destination: { $regex: new RegExp(destination, 'i') },
      departureTime: { $gte: searchDate, $lte: endOfDay }
    }).populate('bus');
    
    console.log('Search query:', { source, destination, date });
    console.log('Search date range:', { searchDate, endOfDay });
    console.log('Search results:', schedules.length); // Log the number of results
    
    // If no results found, try a more flexible search
    if (schedules.length === 0) {
      console.log('No exact matches found, trying flexible search...');
      
      // Try with case-insensitive exact match first
      const exactMatchSchedules = await Schedule.find({
        source: { $regex: `^${source}$`, $options: 'i' },
        destination: { $regex: `^${destination}$`, $options: 'i' },
        departureTime: { $gte: searchDate, $lte: endOfDay }
      }).populate('bus');
      
      if (exactMatchSchedules.length > 0) {
        console.log('Found', exactMatchSchedules.length, 'exact matches');
        return res.json(exactMatchSchedules);
      }
      
      // If still no results, try with partial match
      const partialMatchSchedules = await Schedule.find({
        source: { $regex: source, $options: 'i' },
        destination: { $regex: destination, $options: 'i' },
        departureTime: { $gte: searchDate, $lte: endOfDay }
      }).populate('bus');
      
      if (partialMatchSchedules.length > 0) {
        console.log('Found', partialMatchSchedules.length, 'partial matches');
        return res.json(partialMatchSchedules);
      }
      
      // If still no results, try without date filter
      const noDateFilterSchedules = await Schedule.find({
        source: { $regex: source, $options: 'i' },
        destination: { $regex: destination, $options: 'i' }
      }).populate('bus');
      
      console.log('Found', noDateFilterSchedules.length, 'matches without date filter');
      return res.json(noDateFilterSchedules);
    }
    
    res.json(schedules);
  } catch (error) {
    console.error('Error searching schedules:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
