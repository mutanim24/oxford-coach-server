# 🚌 Bus Booking App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
[![React](https://img.shields.io/badge/React-17.0.2-blue)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)

A modern **bus booking web application** built with the MERN stack. Users can search, book, and manage bus trips easily with interactive seat selection, multiple payment options, and a fully functional admin panel.  

---

## Table of Contents
- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## Demo
![App Demo](https://oxford-coach-client.vercel.app/)

---

## Features

### Core (MVP – Must-Have)
These features make the app fully functional:
- **User Registration & Login**: Email/Phone or Google/Facebook login — *Tanim*
- **Search for Buses**: Source → Destination, Date, Time — *Mahdee*
- **View Bus Details**: Operator, Type (AC/Non-AC), Seat Layout, Price, Amenities — *Tanim*
- **Seat Selection**: Interactive seat map — *Mahdee*
- **Booking & Payment**: Mobile banking, cards, or cash-on-delivery — *Mahdee*
- **Booking Confirmation & Ticket Generation**: QR/PNR code, downloadable PDF/e-ticket — *Tanim*
- **Booking History**: Users can see past and upcoming trips — *Mahdee*
- **Admin Panel**: Add/edit buses, schedules, prices, and view bookings — *Tanim*

### Nice-to-Have (Professional Touch)
- Filter & Sort Options (by price, timing, operator, seat type)  
- Real-time Seat Availability  
- Push Notifications / SMS Alerts (booking confirmation, trip reminders, offers)  
- Discounts & Coupons (promo codes, referral system)  
- Multiple Payment Gateways (Stripe)  
- Passenger Profiles (save passenger info for faster booking)  
- Ratings & Reviews (for buses/operators)  
- Cancellation & Refund System (with admin-defined rules)  

---

## Tech Stack
- **Frontend**: React, Redux, Tailwind CSS / Material UI  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB, Mongoose  
- **Authentication**: JWT, OAuth (Custom Authentication)  
- **Payment Integration**: Stripe  
- **Deployment**: Vercel  

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/bus-booking-app.git
   cd bus-booking-app
