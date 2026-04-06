# Ramsha — Event Creation Flow (Phase 1)

## Overview

The Event Creation Flow is a multi-step wizard that guides Ramsha providers through creating and publishing events on the platform. This document covers **Phase 1: Event Visibility Selection**.

## Architecture

### Component Structure

```
EventCreationFlow (Main orchestrator)
├── ProgressBar (3-step progress indicator)
├── EventVisibilityStep (Phase 1 — Visibility selection)
├── EventTypeStep (Phase 2 — Event type selection)
└── Event Details Forms (Hackathon + General + Workshop)
```

### Files

- **`src/components/events/EventCreationFlow.jsx`** — Main container managing multi-step state and navigation
- **`src/components/events/EventVisibilityStep.jsx`** — Phase 1 UI: Public/Private card selection
- **`src/components/events/ProgressBar.jsx`** — Visual progress indicator (steps 1, 2, 3)
- **`src/pages/CreateEventPage.jsx`** — Entry point page (accessible via `/events/create`)

## Phase 1 — Event Visibility Selection

### Purpose

Allow providers to choose whether their event is:

1. **Public Event** — Listed on the Ramsha marketplace. Anyone can discover, register, and attend.
2. **Private Event** — Invite-only. Only people with the link or an invitation can access it.

### UI Design

#### Progress Bar

- 3-step horizontal indicator at the top
- Shows: Visibility → Event Type → Details
- Active step: Border highlight and teal color
- Completed step: Filled circle with checkmark
- Pending step: Border outline only
- Mobile: Collapsed to "Step 1 of 3" with step name

#### Visibility Cards

Two side-by-side cards (mobile: stacked):

**Public Event Card**
- Icon: Globe (custom SVG)
- Title: "PUBLIC EVENT"
- Description: "Listed on the Ramsha marketplace. Anyone can discover, register, and attend."
- Badge: "Marketplace visible"
- On click: Selected state (teal border + "✓ SELECTED" indicator)

**Private Event Card**
- Icon: Lock (custom SVG)
- Title: "PRIVATE EVENT"
- Description: "Invite-only. Only people with the link or your invitation can access it."
- Badge: "Invite only"
- On click: Selected state

#### Action Button

- "CONTINUE →" button
- Disabled until a visibility option is selected
- On click: Proceeds to Phase 2 (currently a placeholder)

### State Management

```javascript
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
  visibility: null, // "public" or "private"
  eventType: null,  // Will be set in Phase 2
  // Phase 3: name, description, dates, location, etc.
});
```

### User Flow

1. User navigates to `/events/create` or clicks "Create Event" on EventsPage
2. EventCreationFlow modal opens with ProgressBar showing Step 1
3. EventVisibilityStep displays two selectable cards
4. User clicks a card to select Public or Private
5. Card highlights with teal border and "✓ SELECTED" indicator
6. "CONTINUE →" button becomes enabled
7. User clicks Continue
8. State updates `formData.visibility = "public" || "private"`
9. currentStep increments to 2 (EventTypeStep)

## Integration Points

### Route

```javascript
// In App.jsx
<Route
  path="/events/create"
  element={
    <PrivateRoute requiredRole="Provider">
      <CreateEventPage />
    </PrivateRoute>
  }
/>
```

### Access Points

1. **From EventsPage** — Update the "Create Event" button:
```javascript
<button onClick={() => navigate('/events/create')}>
  + CREATE EVENT
</button>
```

2. **From ProviderHomePage** — "New Event" quick action button already exists

3. **Direct URL** — `/events/create`

### Styling

Uses Ramsha's Neo-Brutalist design system:
- **Colors**: Semantic tokens (`th-base`, `th-surface`, `th-card`, `th-text`, `th-muted`)
- **Fonts**: Display font for headings, Monospace for labels
- **Borders**: 2px for cards, [3px] for action buttons
- **No rounded corners, gradients, or blur effects**
- **Dark/Light theme support** via CSS variables

### Responsive

- **Desktop (md+)**: Cards side-by-side, full layout
- **Mobile (sm-)**: Cards stacked, compact padding, condensed progress bar
- **Bottom padding** (`pb-20 md:pb-12`) to avoid mobile nav collision

## Current Status

### Phase 2 — Event Type Selection

Implemented and currently available:
- Hackathon (dedicated flow + Gemini generation)
- Workshop (general flow + workshop-specific fields)
- Other (general event flow)

Not yet implemented (placeholder):
- Seminar
- Training Program
- Conference

For **Hackathons**, trigger Gemini AI integration to auto-generate:
- Professional landing page
- Event structure/schedule template
- Prize categories
- Judging criteria

### Phase 3 — Event Details Form

Collect detailed event information:
- **Name** (text input)
- **Description** (rich text editor)
- **Start/End Dates** (date/time pickers)
- **Location** (text input or geolocation)
- **Registration opening/closing dates**
- **Capacity** (number input)
- **Tags/Categories** (multi-select)
- **Banner image** (upload)
- **Visibility settings** (stored from Phase 1)

Final submit action:
- POST event to backend API (`POST /api/events`)
- For Workshop: includes `workshopData` payload
- For Hackathons: trigger Gemini AI landing page generation via `POST /api/events/hackathon`
- Show success notification and redirect to EventDetailPage

## API Integration

### Endpoint: Create Event

```javascript
POST /api/events
{
  "visibility": "public" | "private",
  "eventType": "standard" | "hackathon" | "workshop" | ...,
  "name": "string",
  "description": "string",
  "startDate": "ISO 8601 string",
  "endDate": "ISO 8601 string",
  "location": "string",
  "capacity": "number",
  "tags": ["tag1", "tag2"],
  "bannerImage": "URL or file upload"
}
```

### Gemini AI Integration (Hackathon)

When `eventType === "hackathon"`:

1. Collect hackathon-specific details (Phase 3 extension)
2. Send to Gemini API with prompt:
   ```
   Generate a professional Hackathon landing page HTML/CSS
   Event Name: ${name}
   Description: ${description}
   Dates: ${startDate} - ${endDate}
   Location: ${location}
   ```
3. Store generated HTML in database
4. Publish to marketplace with dedicated URL
5. Provide sharing link to provider

## Testing

### Unit Tests

- EventVisibilityStep: Card selection, button enable/disable
- ProgressBar: Step highlighting, CSS classes
- EventCreationFlow: State management, step transitions

### Integration Tests

- Navigate from EventsPage to CreateEventPage
- Select visibility option
- Proceed through steps
- State persistence

### Manual Testing Checklist

- [ ] Desktop: Cards side-by-side, buttons aligned
- [ ] Mobile (375px): Cards stacked, progress bar collapsed
- [ ] Dark theme: Colors contrast properly
- [ ] Light theme: Colors contrast properly
- [ ] RTL (Arabic): Icons flip, text right-aligned (if applicable)
- [ ] Card selection: Teal border, text indicator appears
- [ ] Continue button: Disabled initially, enabled after selection
- [ ] Back button: Appears on Phase 2+, decrements step
- [ ] Close button: Returns to EventsPage, resets state

## Future Enhancements

1. **Auto-save drafts** — Save partial form to localStorage or backend
2. **Event templates** — Pre-fill form with common event types
3. **Duplicate event** — Clone an existing event's settings
4. **Bulk event creation** — Create multiple events at once
5. **Event scheduling** — Set publication date (schedule go-live)
6. **Analytics dashboard** — See which visibility selection is more popular

## File Locations Summary

```
src/
├── components/
│   └── events/
│       ├── EventCreationFlow.jsx    ← Main orchestrator
│       ├── EventVisibilityStep.jsx  ← Phase 1 UI
│       └── ProgressBar.jsx          ← Progress indicator
├── pages/
│   └── CreateEventPage.jsx          ← Entry point
└── App.jsx                          ← Route definition
```

---

**Created**: March 2026  
**Status**: Phase 1 Complete  
**Next Steps**: Implement Phase 2 (Event Type Selection) and Gemini AI integration
