# Foresight for YNAB

A web application that provides enhanced insights into your YNAB budget by analyzing future transactions and repeating patterns. Built with Laravel, Inertia.js, and Vue.js.

## Overview

Foresight for YNAB helps you better understand your financial future by:
- Analyzing your repeating transactions
- Identifying patterns in your spending
- Providing insights into upcoming expenses
- Helping you make more informed budgeting decisions

This application integrates with YNAB's API to access your budget data and provides additional analysis tools that complement YNAB's core functionality.

## Features

### 🔍 **Transaction Analysis**
- View and analyze repeating transactions
- Get insights into future income and expenses

### 📊 **Budget Insights**
- Enhanced visualization of your budget data
- Future expense forecasting from repeating transactions

### 🔐 **Privacy-First Design**
- No server-side data storage
- All data processed locally in your browser
- Secure OAuth integration with YNAB
- Transparent privacy practices with automatic update notifications

### 📱 **Responsive Design**
- Works seamlessly on desktop and mobile devices
- Modern, intuitive interface
- Fast and responsive user experience

## Technology Stack

- **Backend**: Laravel 12 (PHP)
- **Frontend**: Vue.js 3 + Inertia.js
- **Styling**: Tailwind CSS
- **Authentication**: YNAB OAuth (Implicit Grant Flow)
- **Data Storage**: Browser localStorage + cookies
- **Testing**: Vitest + PHPUnit

## Prerequisites

- PHP 8.2+
- Node.js 18+
- Composer
- YNAB API access

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YnabAddOns/foresightforynab.git
   cd foresightforynab
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure YNAB API**
   Add your YNAB API credentials to `.env`:
   ```env
   YNAB_CLIENT_ID=your_client_id
   YNAB_REDIRECT_URI=your_redirect_uri
   YNAB_REFERRAL_LINK=your_referral_link
   ```

6. **Build assets**
   ```bash
   npm run build
   ```

   or, for continuous build,

   ```bash
   npm run dev
   ```

7. **Start the development server**
   ```bash
   php artisan serve
   ```

   Alternatively, you may use Laravel Herd and access your application via a named url (e.g., https://foresightforynab.test).

   Learn more: https://herd.laravel.com/

## Usage

1. **Visit the application** in your browser
2. **Authorize with YNAB** using the OAuth flow
3. **Select your budget** from the available options
4. **Explore your data** using the various analysis tools

## Privacy & Data Handling

This application is designed with privacy as a priority:

- **No Server Storage**: Your YNAB data is never stored on our servers
- **Local Processing**: All analysis happens in your browser
- **Secure Authentication**: Uses YNAB's official OAuth flow
- **Transparent Updates**: Automatic notifications when privacy practices change

### Privacy Policy Updates

When we make changes to how we handle your data, we automatically notify users through a privacy policy update system. See [Privacy Policy Updates Documentation](docs/PRIVACY_POLICY_UPDATES.md) for details on how this works.

## Development

### Project Structure

```
foresightforynab/
├── app/                    # Laravel application logic
├── resources/
│   ├── js/                # Vue.js components and logic
│   │   ├── components/    # Reusable Vue components
│   │   ├── pages/         # Page components
│   │   ├── layouts/       # Layout components
│   │   └── composables/   # Vue composables
│   └── views/             # Blade templates
├── config/                # Configuration files
├── routes/                # Application routes
└── docs/                  # Documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start Vite development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run Vitest tests
php artisan test         # Run PHPUnit tests

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
```

### Key Components

- **Privacy Policy System**: Automatic notification system for privacy updates
- **YNAB Integration**: Secure OAuth flow and API integration
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Data Analysis**: Local processing of YNAB data for insights

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Laravel and Vue.js best practices
- Write tests for new features
- Ensure responsive design works on all devices
- Update privacy policy documentation when data handling changes
- Follow the existing code style and conventions

## Security

- All YNAB data is processed locally in the browser
- No sensitive data is transmitted to or stored on our servers
- Uses secure OAuth flow with YNAB
- Implements proper CORS and security headers
- Regular security updates and dependency management

## Support

- **Documentation**: Check the [docs](docs/) folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Privacy**: See [Privacy Policy Updates](docs/PRIVACY_POLICY_UPDATES.md) for privacy-related information

## Acknowledgments

- Built for the YNAB community
- Uses YNAB's official API
- Inspired by the need for better budget insights
- Thanks to all contributors and the YNAB team

---

**Note**: This application is not affiliated with YNAB. It's a third-party tool built by fans of YNAB to enhance the budgeting experience. 