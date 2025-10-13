# Interactive Tour System Implementation Guide

A comprehensive guide for implementing an interactive guided tour feature using `react-joyride` and shadcn/ui components, inspired by the embed-builder tour system.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [File Structure](#file-structure)
- [Step-by-Step Implementation](#step-by-step-implementation)
  - [1. Create the Tour Hook](#1-create-the-tour-hook)
  - [2. Create Tour Configuration](#2-create-tour-configuration)
  - [3. Create Custom Tooltip Component](#3-create-custom-tooltip-component)
  - [4. Create Tour Component](#4-create-tour-component)
  - [5. Integrate into Page](#5-integrate-into-page)
- [Complete Code Examples](#complete-code-examples)
- [Customization Options](#customization-options)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide demonstrates how to implement an interactive onboarding tour system that:

- ✅ Automatically runs on first visit (with localStorage persistence)
- ✅ Highlights specific UI elements with spotlight effect
- ✅ Provides step-by-step guidance with custom tooltips
- ✅ Uses shadcn/ui components for consistent styling
- ✅ Includes a help button to restart the tour
- ✅ Fully responsive and accessible
- ✅ Type-safe with TypeScript

### Example Use Case: Electron App Feature Tour

We'll create a tour for a hypothetical "Electron App Manager" feature that guides users through:
- Creating a new electron app
- Configuring app settings
- Managing app permissions
- Building and deploying the app

---

## Prerequisites

Before implementing the tour, ensure you have:

1. **React 18+** with hooks support
2. **TypeScript** configured
3. **shadcn/ui** components installed:
   - `Button`
   - `Card`, `CardContent`, `CardFooter`
   - Other UI components used in your app

4. **lucide-react** for icons

---

## Installation

Install the required dependency:

```bash
pnpm add react-joyride
```

---

## File Structure

Create the following file structure for the electron app feature tour:

```
modules/electron-app/
├── hooks/
│   └── use-tour.ts                    # Tour state management hook
├── components/
│   ├── tour-config.tsx                # Tour steps and configuration
│   ├── tour-tooltip.tsx               # Custom tooltip component
│   └── electron-app-tour.tsx          # Main tour component
└── pages/
    └── electron-app-page.tsx          # Page where tour is used
```

---

## Step-by-Step Implementation

### 1. Create the Tour Hook

**File:** `modules/electron-app/hooks/use-tour.ts`

This hook manages the tour state, localStorage persistence, and tour lifecycle.

```typescript
import { useState, useEffect } from 'react'
import { CallBackProps, STATUS } from 'react-joyride'
import { TOUR_STORAGE_KEY } from '../components/tour-config'

export function useTour() {
  const [runTour, setRunTour] = useState(false)

  // Check if user has completed the tour before
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!hasCompletedTour) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setRunTour(true), 500)
    }
  }, [])

  // Handle tour callback
  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRunTour(false)
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    }
  }

  // Function to restart tour
  const restartTour = () => {
    setRunTour(true)
  }

  return {
    runTour,
    handleTourCallback,
    restartTour,
  }
}
```

**Key Features:**
- ✅ Auto-starts tour on first visit
- ✅ Persists completion state in localStorage
- ✅ Provides restart functionality
- ✅ Handles tour lifecycle events

---

### 2. Create Tour Configuration

**File:** `modules/electron-app/components/tour-config.tsx`

This file defines the tour steps, content, and targeting selectors.

```tsx
'use client'

import type { Step } from 'react-joyride'

export const TOUR_STORAGE_KEY = 'electron-app-tour-completed'

export const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Welcome to Electron App Manager! 🚀</h3>
        <p className="text-muted-foreground text-sm">
          This quick tour will help you understand how to create, configure, and deploy
          your Electron applications. Let's get started!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="create-app-button"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">Create New App</h4>
        <p className="text-muted-foreground text-sm">
          Click here to create a new Electron application. You'll be prompted to enter
          basic details like app name, description, and initial configuration.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="app-settings"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">App Settings</h4>
        <p className="text-muted-foreground text-sm">
          Configure your app's window properties, icon, description, and other metadata.
          Changes are saved automatically.
        </p>
      </div>
    ),
    placement: 'right',
    placementBeacon: 'bottom',
  },
  {
    target: '[data-tour="permissions-panel"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">Manage Permissions</h4>
        <p className="text-muted-foreground text-sm">
          Control what system resources your app can access. Enable or disable permissions
          for file system, notifications, camera, and more.
        </p>
      </div>
    ),
    placement: 'left',
    placementBeacon: 'bottom',
  },
  {
    target: '[data-tour="dependencies-section"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">Dependencies</h4>
        <p className="text-muted-foreground text-sm">
          Add npm packages and native modules your app needs. We'll handle the installation
          and configuration automatically.
        </p>
      </div>
    ),
    placement: 'auto',
  },
  {
    target: '[data-tour="build-button"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">Build Your App</h4>
        <p className="text-muted-foreground text-sm">
          When you're ready, click here to build your Electron app for Windows, macOS,
          and Linux. The build process may take a few minutes.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="deploy-section"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">Deploy & Distribute</h4>
        <p className="text-muted-foreground text-sm">
          Once built, you can publish your app to GitHub Releases, setup auto-updates,
          or download installers for manual distribution.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">You're All Set! ✨</h3>
        <p className="text-muted-foreground text-sm">
          You now know the basics of the Electron App Manager. If you need this guide
          again, click the help icon in the top-right corner.
        </p>
      </div>
    ),
    placement: 'center',
  },
]

export const tourStyles = {
  options: {
    primaryColor: 'hsl(var(--primary))',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 'var(--radius)',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    borderRadius: 'var(--radius)',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  buttonBack: {
    color: 'hsl(var(--muted-foreground))',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
  },
  buttonSkip: {
    color: 'hsl(var(--muted-foreground))',
    fontSize: '0.875rem',
  },
  buttonClose: {
    display: 'none',
  },
  spotlight: {
    borderRadius: 'var(--radius)',
  },
}

export const tourLocale = {
  back: 'Back',
  close: 'Close',
  last: 'Finish',
  next: 'Next',
  open: 'Open dialog',
  skip: 'Skip',
}
```

**Key Features:**
- ✅ Define tour steps with targets using `data-tour` attributes
- ✅ Rich content with headings and descriptions
- ✅ Customizable placement for each step
- ✅ CSS-in-JS styles matching shadcn/ui theme
- ✅ Localization support

**Important Notes:**
- `target`: CSS selector for the element to highlight
- `placement`: Tooltip position relative to target ('top', 'bottom', 'left', 'right', 'center', 'auto')
- `disableBeacon`: Set to `true` for first step to show tooltip immediately
- Use `data-tour` attributes on your HTML elements for targeting

---

### 3. Create Custom Tooltip Component

**File:** `modules/electron-app/components/tour-tooltip.tsx`

This component renders the custom tooltip using shadcn/ui Card components.

```tsx
'use client'

import type { TooltipRenderProps } from 'react-joyride'
import { X } from 'lucide-react'
import { Button } from '@animeworld/ui/components/button'
import { Card, CardContent, CardFooter } from '@animeworld/ui/components/card'

export function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  return (
    <Card
      {...(tooltipProps as any)}
      className="animate-in fade-in-0 zoom-in-95 w-full max-w-[90vw] border shadow-lg sm:max-w-md"
    >
      {/* Close button */}
      <button
        {...closeProps}
        className="ring-offset-background focus:ring-ring absolute right-2 top-2 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>

      {/* Content */}
      <CardContent className="pb-4 pr-8 pt-6">
        {step.title && <h3 className="mb-2 text-base font-semibold sm:text-lg">{step.title}</h3>}
        <div className="text-xs sm:text-sm">{step.content}</div>
      </CardContent>

      {/* Footer with navigation */}
      <CardFooter className="flex flex-col items-stretch justify-between gap-2 border-t pt-3 sm:flex-row sm:items-center sm:gap-0 sm:pt-4">
        {/* Step indicator */}
        <div className="text-muted-foreground text-center text-xs sm:text-left">
          {index + 1} / {size}
        </div>

        <div className="flex items-center justify-end gap-2">
          {/* Skip button - only show if not last step */}
          {!isLastStep && (
            <Button
              {...skipProps}
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs sm:text-sm"
            >
              Skip
            </Button>
          )}

          {/* Back button - only show if not first step */}
          {index > 0 && (
            <Button {...backProps} variant="outline" size="sm" className="text-xs sm:text-sm">
              Back
            </Button>
          )}

          {/* Next/Finish button */}
          <Button
            {...primaryProps}
            size="sm"
            className="min-w-[70px] text-xs sm:min-w-[80px] sm:text-sm"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
```

**Key Features:**
- ✅ Uses shadcn/ui Card components
- ✅ Responsive design with mobile-first approach
- ✅ Close button in top-right corner
- ✅ Step counter (e.g., "2 / 7")
- ✅ Conditional buttons (Skip, Back, Next/Finish)
- ✅ Smooth animations with Tailwind classes

---

### 4. Create Tour Component

**File:** `modules/electron-app/components/electron-app-tour.tsx`

This component wraps the Joyride component with your configuration.

```tsx
import Joyride, { CallBackProps } from 'react-joyride'
import { TourTooltip } from './tour-tooltip'
import { tourSteps } from './tour-config'

interface ElectronAppTourProps {
  run: boolean
  onCallback: (data: CallBackProps) => void
}

export function ElectronAppTour({ run, onCallback }: ElectronAppTourProps) {
  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={onCallback}
      tooltipComponent={TourTooltip}
      scrollToFirstStep
      scrollOffset={100}
      disableScrolling={false}
      disableScrollParentFix={false}
      spotlightClicks={false}
      spotlightPadding={8}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: 'hsl(var(--background))',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
      floaterProps={{
        disableAnimation: false,
        offset: 12,
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
    />
  )
}
```

**Key Props Explained:**
- `continuous`: Enables step-by-step progression
- `showProgress`: Shows progress indicator
- `showSkipButton`: Enables skip functionality
- `scrollToFirstStep`: Auto-scrolls to first highlighted element
- `scrollOffset`: Offset in pixels when scrolling
- `spotlightClicks`: If `false`, clicks on highlighted elements are disabled
- `spotlightPadding`: Padding around the spotlight

---

### 5. Integrate into Page

**File:** `modules/electron-app/pages/electron-app-page.tsx`

Example page component showing how to integrate the tour system.

```tsx
'use client'

import { use } from 'react'
import { Button } from '@animeworld/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@animeworld/ui/components/card'
import { HelpCircle, Plus } from 'lucide-react'
import { useTour } from '../hooks/use-tour'
import { ElectronAppTour } from '../components/electron-app-tour'

interface ElectronAppPageProps {
  params: Promise<{
    guildId: string
  }>
}

export default function ElectronAppPage({ params }: ElectronAppPageProps) {
  const resolvedParams = use(params)

  // Tour management
  const { runTour, handleTourCallback, restartTour } = useTour()

  return (
    <>
      {/* Tour Component */}
      <ElectronAppTour run={runTour} onCallback={handleTourCallback} />

      <div className="container mx-auto p-6">
        {/* Header with Help Button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Electron App Manager</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your Electron applications
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={restartTour}
              title="Show guide"
              data-tour="help-button"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button data-tour="create-app-button">
              <Plus className="mr-2 h-4 w-4" />
              Create App
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* App Settings Card */}
          <Card data-tour="app-settings">
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Configure your app's basic settings and metadata.
              </p>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card data-tour="permissions-panel">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Manage system permissions and access controls.
              </p>
            </CardContent>
          </Card>

          {/* Dependencies Card */}
          <Card data-tour="dependencies-section">
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Add and manage npm packages and native modules.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Build Section */}
        <div className="mt-6 flex gap-4">
          <Button data-tour="build-button" size="lg">
            Build App
          </Button>
          <div data-tour="deploy-section">
            <Button variant="outline" size="lg">
              Deploy
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
```

**Key Integration Points:**
1. Import `useTour` hook and tour component
2. Destructure `runTour`, `handleTourCallback`, `restartTour`
3. Add tour component at the top of your JSX
4. Add `data-tour` attributes to elements you want to highlight
5. Add help button that calls `restartTour()`

---

## Complete Code Examples

### Example: Adding Tour to Existing Feature

If you have an existing feature and want to add a tour:

#### Step 1: Add data-tour attributes to your components

```tsx
// Before
<Button onClick={handleSave}>
  Save Changes
</Button>

// After
<Button onClick={handleSave} data-tour="save-button">
  Save Changes
</Button>
```

#### Step 2: Define tour steps targeting these elements

```tsx
export const tourSteps: Step[] = [
  {
    target: '[data-tour="save-button"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">Save Your Work</h4>
        <p className="text-muted-foreground text-sm">
          Don't forget to save your changes before leaving!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  // ... more steps
]
```

#### Step 3: Add tour to your page

```tsx
import { useTour } from '@/modules/your-feature/hooks/use-tour'
import { YourFeatureTour } from '@/modules/your-feature/components/your-feature-tour'

export default function YourFeaturePage() {
  const { runTour, handleTourCallback, restartTour } = useTour()

  return (
    <>
      <YourFeatureTour run={runTour} onCallback={handleTourCallback} />
      {/* Your existing page content */}
    </>
  )
}
```

---

## Customization Options

### 1. Custom Storage Key

Change the localStorage key to avoid conflicts:

```typescript
export const TOUR_STORAGE_KEY = 'my-unique-feature-tour-completed'
```

### 2. Custom Tour Styles

Modify the tour appearance by adjusting styles in `tour-config.tsx`:

```typescript
export const tourStyles = {
  options: {
    primaryColor: '#3b82f6', // Custom primary color
    zIndex: 10000,
  },
  spotlight: {
    borderRadius: '12px', // Custom border radius
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay
  },
}
```

### 3. Conditional Tour Start

Only start tour based on certain conditions:

```typescript
export function useTour(condition?: boolean) {
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY)

    // Only start tour if condition is met
    if (!hasCompletedTour && condition) {
      setTimeout(() => setRunTour(true), 500)
    }
  }, [condition])

  // ... rest of the hook
}
```

Usage:
```typescript
const isFeatureEnabled = true
const { runTour, handleTourCallback } = useTour(isFeatureEnabled)
```

### 4. Multi-language Support

Add translations for different locales:

```typescript
const translations = {
  en: {
    back: 'Back',
    close: 'Close',
    last: 'Finish',
    next: 'Next',
    skip: 'Skip',
  },
  pl: {
    back: 'Wstecz',
    close: 'Zamknij',
    last: 'Zakończ',
    next: 'Dalej',
    skip: 'Pomiń',
  },
}

export const getTourLocale = (locale: string) => translations[locale] || translations.en
```

### 5. Dynamic Steps

Generate tour steps based on user permissions or feature flags:

```typescript
export const getTourSteps = (userPermissions: string[]): Step[] => {
  const baseSteps = [/* ... */]

  if (userPermissions.includes('admin')) {
    baseSteps.push({
      target: '[data-tour="admin-panel"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Admin Controls</h4>
          <p className="text-muted-foreground text-sm">
            As an admin, you have access to advanced settings.
          </p>
        </div>
      ),
      placement: 'bottom',
    })
  }

  return baseSteps
}
```

---

## Best Practices

### 1. Element Targeting

✅ **DO:** Use semantic `data-tour` attributes
```tsx
<button data-tour="submit-button">Submit</button>
```

❌ **DON'T:** Use complex CSS selectors
```tsx
// Avoid
target: '.container > div:nth-child(2) > button.primary'
```

### 2. Tour Step Order

- Start with a welcome message (`target: 'body'`, `placement: 'center'`)
- Follow the natural user workflow
- End with a completion message
- Keep it under 10 steps if possible

### 3. Content Guidelines

- Keep descriptions concise (2-3 sentences max)
- Use friendly, conversational tone
- Highlight key benefits, not just features
- Use emojis sparingly for emphasis

### 4. Performance

```typescript
// Good: Delay tour start until DOM is ready
useEffect(() => {
  const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY)
  if (!hasCompletedTour) {
    setTimeout(() => setRunTour(true), 500) // Wait for DOM
  }
}, [])
```

### 5. Accessibility

- Always include skip button
- Use semantic HTML in tour content
- Test with keyboard navigation
- Ensure sufficient color contrast

### 6. Mobile Responsiveness

```tsx
<Card className="w-full max-w-[90vw] sm:max-w-md">
  {/* Tour content */}
</Card>
```

---

## Troubleshooting

### Issue: Tour doesn't start automatically

**Solution:** Check localStorage and clear the tour completion flag:

```javascript
// In browser console
localStorage.removeItem('electron-app-tour-completed')
```

### Issue: Element not found / Tour step skipped

**Problem:** The target element doesn't exist when tour starts.

**Solution:** Increase delay or check element existence:

```typescript
useEffect(() => {
  const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY)
  if (!hasCompletedTour) {
    // Increase delay if elements load slowly
    setTimeout(() => setRunTour(true), 1000)
  }
}, [])
```

### Issue: Tooltip positioned incorrectly

**Solution:** Use `placement: 'auto'` to let Joyride choose the best position:

```typescript
{
  target: '[data-tour="my-element"]',
  content: <div>...</div>,
  placement: 'auto', // Let Joyride decide
}
```

### Issue: Tour conflicts with other modals/overlays

**Solution:** Increase z-index in tour styles:

```typescript
export const tourStyles = {
  options: {
    zIndex: 99999, // Higher than other overlays
  },
}
```

### Issue: Can't close tour on mobile

**Solution:** Ensure close button is visible and clickable:

```tsx
<button
  {...closeProps}
  className="absolute right-2 top-2 z-10 rounded-sm opacity-70 hover:opacity-100"
>
  <X className="h-4 w-4" />
</button>
```

---

## Advanced Features

### 1. Tour Analytics

Track tour completion and step interactions:

```typescript
const handleTourCallback = (data: CallBackProps) => {
  const { status, action, index, type } = data

  // Track analytics
  if (type === 'step:after') {
    analytics.track('Tour Step Completed', { step: index })
  }

  if (status === STATUS.FINISHED) {
    analytics.track('Tour Completed')
    setRunTour(false)
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
  }

  if (status === STATUS.SKIPPED) {
    analytics.track('Tour Skipped', { at_step: index })
    setRunTour(false)
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
  }
}
```

### 2. Contextual Tours

Different tours for different user roles:

```typescript
export function useTour(userRole: 'user' | 'admin') {
  const [runTour, setRunTour] = useState(false)
  const storageKey = `${userRole}-tour-completed`

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(storageKey)
    if (!hasCompletedTour) {
      setTimeout(() => setRunTour(true), 500)
    }
  }, [storageKey])

  // ... rest of hook using storageKey
}
```

### 3. Tour with Video Content

Embed videos in tour steps:

```tsx
{
  target: '[data-tour="video-tutorial"]',
  content: (
    <div className="space-y-3">
      <h4 className="font-semibold">Watch Tutorial</h4>
      <video
        className="w-full rounded-md"
        controls
        src="/tutorials/electron-app.mp4"
      >
        Your browser doesn't support video.
      </video>
      <p className="text-muted-foreground text-sm">
        This 2-minute video shows the entire workflow.
      </p>
    </div>
  ),
  placement: 'center',
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Tour starts automatically on first visit
- [ ] Help button restarts tour
- [ ] All tour steps are displayed correctly
- [ ] Tour can be skipped at any step
- [ ] Tour completion is persisted in localStorage
- [ ] Close button works on all steps
- [ ] Navigation buttons (Back/Next) work correctly
- [ ] Tour is responsive on mobile devices
- [ ] Spotlight highlights correct elements
- [ ] Tour works after page refresh

### Reset Tour for Testing

Add a development-only button to reset tour:

```tsx
{process.env.NODE_ENV === 'development' && (
  <Button
    variant="destructive"
    onClick={() => {
      localStorage.removeItem('electron-app-tour-completed')
      window.location.reload()
    }}
  >
    Reset Tour
  </Button>
)}
```

---

## Additional Resources

- [react-joyride Documentation](https://docs.react-joyride.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Example Implementation: Embed Builder Tour](apps/web/modules/embed-builder/)

---

## Summary

This guide provides a complete, production-ready implementation of an interactive tour system. The key components are:

1. **useTour Hook** - Manages tour state and persistence
2. **tour-config.tsx** - Defines tour steps and styling
3. **TourTooltip** - Custom tooltip using shadcn/ui components
4. **Tour Component** - Joyride wrapper with configuration
5. **Page Integration** - How to add tour to your page

By following this guide, you can create engaging, user-friendly onboarding experiences that help users discover and understand your application's features.

Happy touring! 🚀
