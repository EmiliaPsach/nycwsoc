# Key Features Implemented:

## 🔐 Authentication System

- Login screen with email/password
- User profile management
- Mock data store (easily replaceable with real database)

## 📅 Calendar & Scheduling

- Interactive calendar view showing game dates
- Click on dates to see games scheduled
- Team-specific schedule views
- Game attendance polling system

## 👥 Team & League Management

- User can see their team(s) and roster
- "Join Leagues" page with searchable filters:
    - Location, skill level, day of week, season
    - League details modal showing capacity, pricing, etc.
    - Options to join as free agent or with existing team


## 🗳️ Attendance Polling

- 4-day reminder system (placeholder for push notifications)
- Yes/No/Maybe voting for each game
- Poll results visible to team members
- Automatic poll creation for every game

## 👤 Profile Management

- Standard player information: zip code, jersey size, gender, skill level
- Editable profile with data persistence

## 💾 Database Structure

- Lightweight in-memory data store (perfect prototype)
- Easily replaceable with Firebase, Supabase, or other backend
- Structured for scalability

## 🔔 Automatic Reminders

- Schedules notifications 4 days before each game
- Only sends to players who haven't responded to the attendance poll
- Can be enabled/disabled per team by users

## 👑 Manual Reminders

- Captains and admins can send immediate reminders
- Select specific players who haven't responded
- Customized messages showing sender's role (👑 for captain, 🛡️ for admin)

## 📱 Smart Notifications

- Tapping notifications navigates directly to the game detail screen
- Different notification channels for automatic vs manual reminders
- Works offline (local notifications)

## 🎛️ User Control

- Toggle switch to enable/disable automatic reminders
- Shows unresponded player count
- "Select All" functionality for bulk manual reminders