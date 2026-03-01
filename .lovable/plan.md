

# GovGlide – Government Scheme Assistant

A mobile-first, voice-driven web app that helps citizens discover and apply for government schemes with an accessible, trust-evoking design.

## Global Theme Setup
- Custom color palette: Trust Blue (#1A56DB), Safe Green (#057A55), Off-White (#F9FAFB)
- Large, readable Inter font with generous sizing for elderly users
- Large tap targets (min 48px) on all interactive elements
- Fixed top navigation bar with hamburger menu and language selector (English, Hindi, Marathi)
- Smooth animations using Tailwind keyframes (glow pulse, fade-in, wave)

## Screen 1: Landing & Voice Intake (`/`)
- Centered layout with a large circular microphone button featuring a soft pulsing glow animation
- Bold heading: "Tap to speak. What government scheme do you need help with today?"
- Three quick-suggestion chips below: "Check Scholarship Eligibility", "Apply for Pension", "Farmer Subsidies"
- Floating "My Profile / Vault" button in the top-right area of the nav bar
- Clean, spacious, voice-first feel

## Screen 2: Active Conversation & Scanner (`/chat`)
- Animated audio wave visualizer at the top (CSS-based bars animation) indicating AI listening/speaking state
- Scrollable chat interface with large, legible chat bubbles
- AI messages include a friendly robot avatar icon
- User messages styled distinctly on the right side
- Bottom action bar with two large FABs side-by-side: Microphone (talk) and Camera (Scan Document)
- No keyboard input by default — voice and scan first approach
- Spacious, uncluttered layout

## Screen 3: Eligibility Dashboard (`/dashboard`)
- Header: "Your Scheme Matches"
- Card-based layout with traffic-light color coding:
  - **Green / Eligible card**: Checkmark icon, scheme name ("Post-Matric Scholarship"), brief summary, prominent "Apply using GovGlide" button
  - **Yellow / Action Needed card**: Warning icon, scheme name ("AICTE Pragati Scheme"), red highlighted text showing missing documents
  - **Red / Not Eligible card**: X icon, scheme name, explanation text for ineligibility
- Cards styled like official documents with generous whitespace, clear hierarchy, and large text
- Each card has a subtle border and shadow for depth

## Navigation & Routing
- React Router with three routes: `/`, `/chat`, `/dashboard`
- Fixed top nav with app logo/name, hamburger menu (mobile drawer), and language dropdown
- Hamburger menu links: Home, My Conversations, Eligibility Dashboard, My Profile/Vault
- Language selector updates a context (UI labels remain English for this build, but the selector UI is functional)

