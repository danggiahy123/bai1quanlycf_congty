require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testDirectAPI() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Test authentication middleware
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2I3Mjg3ODQ5MjVmZDU1MzE2MTBkOCIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgxNjM1OTksImV4cCI6MTc1ODI0OTk5OX0.cD7P7dE-dgsho_DlE7Dyu-NksosvxSk3TDJmdkO0m4Q';
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);

    // Test stats logic
    const totalTables = await Table.countDocuments();
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });
    const totalOrders = await Order.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    const totalRevenueResult = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const todayRevenueResult = await Order.aggregate([
      { 
        $match: { 
          status: 'paid',
          createdAt: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    const totalCustomers = await Customer.countDocuments();
    const totalEmployees = await Employee.countDocuments();

    const stats = {
      totalTables,
      occupiedTables,
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      totalCustomers,
      totalEmployees
    };

    console.log('Stats result:', JSON.stringify(stats, null, 2));

    // Test top items
    const topItems = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuId',
          name: { $first: '$items.name' },
          category: { $first: '$items.category' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    console.log('Top items result:', JSON.stringify(topItems, null, 2));

  } catch (error) {
    console.error('Error testing direct API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testDirectAPI();
