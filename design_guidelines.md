# Flashcard Application Design Guidelines

## Design Approach
**System-Based Approach**: Shadcn UI + Tailwind CSS
- Preserve the existing design system completely - no visual changes to current implementation
- Maintain all current component styles, layouts, and interactions
- Focus on functional enhancement (backend integration) while keeping UI identical

## Core Design Principles
1. **Consistency First**: Match existing visual language precisely
2. **Role-Based UI**: Conditional rendering based on user authentication state
3. **Clean Information Architecture**: Clear separation between student and admin experiences
4. **Minimal Friction**: Streamlined card review experience for students

## Typography & Spacing
- Use existing Shadcn UI typography scale without modification
- Maintain current spacing units (Tailwind's default scale: 2, 4, 6, 8, 12, 16, 20, 24)
- Preserve text hierarchy across all pages

## Page Structure & Components

### 1. Home Page (Public/Student View)
**Layout**: Grid-based pack display
- Card-based layout for pack items showing title and description
- Only display packs marked as "published"
- Click to enter pack and start reviewing flashcards
- Responsive grid: 1 column mobile, 2-3 columns desktop

### 2. PackView Page (Flashcard Viewer)
**Layout**: Centered, full-attention flashcard interface
- Single flashcard displayed prominently in center
- Click/tap card to flip between question and answer
- Navigation controls for previous/next card
- Progress indicator showing current position in deck
- Clean, distraction-free experience focusing on card content

### 3. Admin Dashboard
**Layout**: Functional admin panel
- Complete list of all packs (published and unpublished)
- Create new pack button prominently placed
- Each pack item shows:
  - Title, description
  - Published toggle switch
  - Edit and Delete action buttons
- Flashcard management within each pack
- Form interfaces for creating/editing packs and cards

### 4. Header Component
**Layout**: Horizontal navigation bar
- Application title/logo on left
- Conditional elements on right:
  - "Admin Dashboard" button (admin only)
  - "Logout" button (authenticated users)
  - Login button (unauthenticated)

### 5. Authentication UI
**Layout**: Centered login form
- Username and password fields
- Submit button
- Clear error messaging for failed attempts
- Clean, minimal design matching Shadcn form patterns

## Component Specifications

### Flashcard Component
- Large, centered card with subtle shadow
- Smooth flip animation on click
- Clear visual distinction between question and answer states
- Readable typography with ample padding

### Pack Card Component  
- Bordered card with title, description
- Hover state for interactivity
- Published badge/indicator for admin view
- Action buttons grouped logically

### Form Components
- Standard Shadcn form fields and buttons
- Inline validation feedback
- Consistent spacing and alignment
- Clear label/input relationships

## State Visualization

### Loading States
- Skeleton screens or spinners for data fetching
- Disabled states during operations
- Loading indicators on buttons during submission

### Empty States
- Friendly messaging when no packs exist
- Call-to-action for admins to create content
- Helpful guidance for students when no published packs available

### Error States  
- Toast notifications for operation failures
- Inline error messages on forms
- Clear, actionable error text

## Role-Based UI Patterns

### Student Experience
- Read-only access to published packs
- Clean, focused flashcard review interface
- No access to admin controls or unpublished content

### Admin Experience
- Full CRUD capabilities for packs and flashcards
- Publish/unpublish toggle controls
- Access to dashboard and all management features
- Clear visual indicators for unpublished content

## Images
No hero images or decorative imagery required. This is a functional educational tool where content (flashcards) is the primary visual element. Focus on clean, readable interfaces with Shadcn UI components.

## Interactions & Feedback
- Instant visual feedback on card flip
- Button states (hover, active, disabled) following Shadcn patterns
- Real-time updates reflected immediately without page refresh
- Toast notifications for successful operations
- Smooth transitions matching existing implementation

## Accessibility Considerations
- Keyboard navigation for flashcard flipping (spacebar/arrow keys)
- Proper ARIA labels on interactive elements
- Focus management in forms and modals
- Sufficient color contrast maintained throughout