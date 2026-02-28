# Loyalty Program App

A modern web application for managing customer loyalty, designed to provide a seamless experience for earning and redeeming points. Built with Next.js 15, this application features real-time QR code scanning, a dynamic rewards catalog, and robust internationalization support.

## Features

- **📱 QR Code Scanning**: Integrated `html5-qrcode` scanner allows users to instantly scan codes to earn points directly from their device camera.
- **📜 Transaction History**: Comprehensive list view of all point transactions (Earned & Redeemed).
- **🎁 Rewards Catalog**: Browse available rewards in a responsive grid layout.
- **🛒 Shopping Cart System**: 
  - Add items to cart.
  - Adjust quantities with easy `+` / `-` controls.
  - "Go to Cart" summary bar for quick access.
- **🛍️ Checkout Flow**: Simple and intuitive form to finalize redemptions with collection details (Name, Mobile, Shop).
- **🌍 Internationalization (i18n)**: 
  - Full support for multiple languages (e.g., English, Hindi).
  - Clean URL structure (no simple locale prefixes visible to user).
  - Cookie-based locale persistence.
- **🔐 Authentication**: Secure Login and Signup pages (Mock implementation ready for backend integration).
- **🎨 Modern UI/UX**:
  - Built with **Shadcn UI** components.
  - Mobile-first responsive design.
  - Dark Mode support.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router & Turbopack)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn/UI](https://ui.shadcn.com/) (Radix Primitives)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Scanning**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd loyalty-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the application**:
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app`: App Router pages and layouts.
  - `(auth)`: Login/Signup routes.
  - `(dashboard)`: Main application routes (Scan, History, Rewards).
- `src/components`: Reusable UI components and specific feature components (`CartProvider`, `Sidebar`, etc.).
- `src/lib`: Utility functions and mock data.
- `messages`: Translation files for i18n (`en.json`, `hi.json`).

