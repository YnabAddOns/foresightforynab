# Privacy Policy Update System

This document explains how to use the privacy policy update notification system to comply with YNAB's API guidelines and best practices.

## Overview

When you make changes to your application that affect how data is collected or processed, you must:
1. Update your privacy policy
2. Notify users of the changes
3. Get their consent before accessing new data types

Since this application doesn't implement user authentication, we use a browser-based notification system that tracks privacy policy versions in cookies.

## Versioning Strategy

We use **date-based versioning** for privacy policies:

- **Format**: `YYYY-MM-DD` (e.g., `2024-01-15`)
- **Multiple changes per day**: `YYYY-MM-DD.N` (e.g., `2024-01-15.1`, `2024-01-15.2`)
- **Examples**:
  - `2024-01-15` - First version
  - `2024-01-20` - Update on January 20th
  - `2024-01-20.1` - Second update on January 20th

This approach is ideal for privacy policies because:
- ✅ Immediately clear when changes occurred
- ✅ Easy to understand for users and legal teams
- ✅ Perfect for compliance tracking
- ✅ Natural chronological ordering
- ✅ Handles multiple changes per day elegantly

## How It Works

1. **Version Tracking**: Each privacy policy has a version number stored in `config/privacy.php`
2. **User Notification**: When a user visits the site with a different version than they've seen, a banner appears
3. **Acknowledgment**: Users can view details and acknowledge the changes
4. **Persistence**: The acknowledged version is stored in cookies (1 year expiration) to prevent repeated notifications

## Cookie-Based Storage

We use cookies instead of localStorage for privacy policy acknowledgment because:

- ✅ **Survives localStorage clearing**: Users can't accidentally bypass consent
- ✅ **Expiration control**: 1-year expiration ensures periodic re-acknowledgment
- ✅ **Cross-session persistence**: Survives browser restarts and updates
- ✅ **Better compliance**: More reliable for legal requirements
- ✅ **YNAB guidelines**: Ensures users can't bypass privacy policy updates

**Cookie Details:**
- **Name**: `privacy_policy_version`
- **Expiration**: 1 year
- **Scope**: Site-wide (`path=/`)
- **Security**: `SameSite=Lax` for security
- **Size**: Minimal (just version string)

## Components

### PrivacyPolicyBanner
- Shows at the top of the page when privacy policy changes are detected
- Provides quick access to view details or acknowledge changes
- Positioned below the header to be noticeable but not intrusive

### PrivacyPolicyModal
- Detailed view of privacy policy changes
- Shows change history and specific modifications
- Requires explicit acknowledgment before continuing

### Configuration
- `config/privacy.php` - Central configuration for version management
- `app/Http/Middleware/HandleInertiaRequests.php` - Automatically shares privacy policy data to all pages

## Usage

### Updating Privacy Policy

1. **Update your privacy policy content** in `resources/js/pages/Privacy.vue`

2. **Update the configuration** in `config/privacy.php`:
   ```php
   'current_version' => '2024-01-20',
   'last_change_date' => '2024-01-20',
   'change_description' => 'Added transaction categorization features',
   ```

3. **Deploy your changes**

**Note**: Git provides the complete version history, so we only track the current version information.

### Example Update Process

```php
'current_version' => '2024-01-20',
'last_change_date' => '2024-01-20',
'change_description' => 'Added transaction categorization features',
```

## User Experience

### First Visit After Update
1. User sees a banner at the top of the page
2. Banner shows the change date and brief description
3. User can click "View Details" for more information
4. Modal shows detailed changes and history
5. User must acknowledge to continue using the app

### Subsequent Visits
- No banner appears once user has acknowledged the version
- Version is stored in cookies: `privacy_policy_version` (1 year expiration)

### Browser/Device Changes
- If user switches browsers or clears cookies, they'll see the notification again
- This ensures users are always aware of current privacy practices
- Cookie expiration ensures users are re-notified after 1 year

## Compliance Features

### YNAB API Guidelines
- ✅ Notifies users of privacy policy changes
- ✅ Requires acknowledgment before accessing new data
- ✅ Maintains clear record of changes
- ✅ Provides detailed information about modifications

### Best Practices
- ✅ Non-intrusive notification design
- ✅ Clear, readable change descriptions
- ✅ Persistent acknowledgment tracking
- ✅ Detailed change history
- ✅ Easy access to full privacy policy

## Testing

### Test the Notification
1. Clear the cookie: `document.cookie = 'privacy_policy_version=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'`
2. Refresh the page
3. You should see the privacy policy banner

### Test the Modal
1. Click "View Details" on the banner
2. Verify the modal shows correct information
3. Test acknowledgment functionality

### Test Version Updates
1. Update the version in `config/privacy.php`
2. Clear cookies
3. Verify new notification appears

## Troubleshooting

### Banner Not Showing
- Check that `privacyPolicyVersion` is being shared in the Inertia middleware
- Verify cookies don't contain the current version
- Check browser console for JavaScript errors

### Modal Not Opening
- Verify `PrivacyPolicyModal` component is imported
- Check that all required props are being passed
- Ensure no JavaScript errors in console

### Version Not Updating
- Clear browser cookies
- Verify configuration changes are deployed
- Check that the middleware is sharing the correct data

## Security Considerations

- Version information is stored client-side in cookies
- No sensitive data is transmitted
- Users can clear their acknowledgment at any time
- System respects user privacy and choice
- Cookies expire after 1 year to ensure periodic re-acknowledgment

## Future Enhancements

Potential improvements to consider:
- Git hooks to automatically detect privacy policy text changes
- Server-side tracking of acknowledged versions (if authentication is added)
- Email notifications for registered users
- More granular change tracking
- Integration with legal compliance tools
- Automated privacy policy versioning 