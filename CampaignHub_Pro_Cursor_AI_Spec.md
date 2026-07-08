# CampaignHub Pro - Cursor AI Update Specification

## Overview
Upgrade CampaignHub into a modern SaaS marketing platform with AI-powered content generation, scheduling, analytics, task management, and Gemini AI integration.

---

# Tech Stack

## Frontend
- React
- TypeScript
- TailwindCSS
- Shadcn/UI
- Lucide React
- Framer Motion
- Recharts
- React Big Calendar

## AI Provider
### Google Gemini API

Use Gemini as the primary AI engine.

Environment Variables:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

API Model:

```txt
gemini-2.5-flash
```

Use Gemini for:
- AI Assistant
- Email Generation
- Blog Generation
- Social Media Content
- Marketing Suggestions
- Campaign Analysis

---

# Sidebar Structure

1. Dashboard
2. Campaigns
3. Content Studio
4. AI Assistant
5. Schedule & Events
6. Analytics
7. Team
8. Templates
9. Settings

---

# Dashboard

## KPI Cards

Display:

- Total Campaigns
- Active Campaigns
- Generated Content
- Team Members

## Charts

### Campaign Performance

Show:

- Views
- Clicks
- Conversions

### Monthly Growth

Show monthly statistics.

## Activity Feed

Display:

- Recent Campaigns
- AI Content History
- Team Activities

---

# AI Assistant

Create a full AI Assistant page.

## Features

Chat Interface

Suggested Prompts:

- Generate Marketing Plan
- Create Email Campaign
- Write Social Post
- Analyze Campaign
- Generate Blog Article

## Actions

- Copy Response
- Regenerate Response
- Save Conversation

---

# Content Studio

Replace current Content Generator.

## Content Types

- Email Campaign
- Blog Article
- Social Media Post
- Product Description
- Ad Copy
- Landing Page Content

---

# Content Form

## Basic Settings

Fields:

- Topic
- Content Type
- Tone
- Language
- Target Audience

Examples:

Professional
Friendly
Casual
Luxury
Corporate

---

## Advanced Settings

Fields:

- Keywords
- Brand Voice
- Content Length
- Call To Action
- Additional Details

---

# Generated Content Panel

Actions:

- Copy
- Regenerate
- Download PDF
- Export DOCX
- Save Template
- Publish

---

# Schedule & Events

Create a complete calendar system.

## Views

- Month
- Week
- Day

## Event Types

Campaign
Event
Deadline
Meeting

## Colors

Blue = Campaign

Green = Event

Orange = Deadline

Red = Urgent

## Features

- Create Event
- Edit Event
- Delete Event
- Notifications
- Reminder System

---

# Task Progress

Create Kanban Board.

Columns:

- To Do
- In Progress
- Review
- Completed

Task Data:

- Title
- Description
- Assigned User
- Due Date
- Priority
- Progress Percentage

Dashboard Widgets:

- Completed Tasks
- Pending Tasks
- Overdue Tasks

---

# Analytics

Create modern analytics dashboard.

Metrics:

- Campaign Reach
- Engagement
- Conversion Rate
- Growth Rate

Charts:

- Line Chart
- Bar Chart
- Pie Chart

Use Recharts.

---

# Templates

Allow saving reusable templates.

Template Types:

- Email
- Blog
- Social Post
- Ad Copy

Features:

- Save Template
- Edit Template
- Delete Template

---

# UI Design

Style Reference:

Linear + Notion + HubSpot

Design Goals:

- Clean
- Modern
- Premium
- Fast
- Professional SaaS

Colors:

Primary:
#2563EB

Background:
#F8FAFC

Card:
#FFFFFF

Success:
#22C55E

Warning:
#F59E0B

Danger:
#EF4444

---

# UX Improvements

Add:

- Dark Mode
- Loading Skeletons
- Empty States
- Toast Notifications
- Responsive Design
- Mobile Support

---

# Deliverables

Implement all pages.

Connect Gemini API to:

- AI Assistant
- Content Studio

Create production-ready UI.

Ensure responsive design.

Optimize performance.

Use reusable React components throughout the application.
  


  all in dishbord admin 

  api 