ROUTE CONFIGURATION GUIDE
=========================

This file explains the route configuration system implemented in the application.

PUBLIC ROUTES (No Authentication Required):
-------------------------------------------
- /login - Login page
- /register - Public player registration (standalone, no layout)
- /player-registration-public - Alternative URL for public registration
- /teams - Teams page (accessible to everyone)
- /players - Players page (accessible to everyone)

PROTECTED ROUTES (Authentication Required):
-------------------------------------------
- / - Dashboard
- /auction - Auction page
- /analytics - Analytics dashboard
- /admin - Admin panel

CONDITIONAL ROUTES (Layout depends on authentication):
------------------------------------------------------
- /player-registration - Shows layout if logged in, no layout if not logged in
- /player-registration-enhanced - Shows layout if logged in, no layout if not logged in
- /teams - Shows layout if logged in, no layout if not logged in
- /players - Shows layout if logged in, no layout if not logged in

These routes are accessible to BOTH authenticated and non-authenticated users:
- If user is LOGGED IN: Shows with full layout (sidebar, header, navigation)
- If user is NOT LOGGED IN: Shows with limited layout (only Teams & Players in menu)

STANDALONE ROUTES (No Layout - Header/Sidebar/Footer):
------------------------------------------------------
- /login
- /register
- /player-registration-public

HOW TO ADD NEW ROUTES:
----------------------
1. Edit app/src/config/routes.js
2. Add route to appropriate array:
   - routeConfig.public - for public routes
   - routeConfig.protected - for protected routes (auth required)
   - routeConfig.standalone - for routes without layout
   - routeConfig.conditional - for routes that show layout only if logged in

3. Add route in App.js:
   - For standalone routes: <Route path="/your-route" element={<YourComponent />} />
   - For routes with conditional layout: <Route path="/your-route" element={<RouteWrapper><YourComponent /></RouteWrapper>} />

RESPONSIVE LAYOUT:
------------------
- Mobile: Hamburger menu (< 1024px)
- Desktop: Fixed sidebar (>= 1024px)
- All routes with layout use ResponsiveLayout component
- Standalone routes render without any navigation/header/footer

MOBILE-FIRST DESIGN:
--------------------
- Touch-friendly tap targets (44px minimum)
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Hamburger menu for mobile navigation
- Optimized spacing and typography for mobile devices

ACCESS CONTROL:
---------------
- AuthGuard component checks route configuration
- Public routes bypass authentication
- Protected routes require valid session
- Conditional routes allow both authenticated and non-authenticated access
- Session timeout: 24 hours
- Auto-login with saved credentials (Remember Me)

PLAYER REGISTRATION WORKFLOWS:
------------------------------

Public Registration (/register or /player-registration-public):
- No authentication required
- Always standalone (no navigation/header/footer)
- Clean, focused registration experience
- Success message with option to register another player

Conditional Registration (/player-registration or /player-registration-enhanced):
- Accessible to both logged-in and non-logged-in users
- If LOGGED IN: Shows with full dashboard layout (sidebar, navigation)
- If NOT LOGGED IN: Shows standalone (no layout, just the form)
- Perfect for admin use (logged in) or public use (not logged in)

Internal Registration (when logged in):
- Full layout with navigation
- Admin/staff use
- Can navigate to other pages easily
- Redirects to players page after registration
