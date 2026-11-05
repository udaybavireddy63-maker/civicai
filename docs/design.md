# CivicAI — Visual Design System

**Direction:** Premium civic-tech product, optimistic, trustworthy, calm, modern  
**Theme:** Light mode only

## 1. Design concept

CivicAI should feel like a well-funded public-service technology platform: welcoming to residents, efficient for administrators, and trustworthy with sensitive reports. The interface should combine warm editorial photography, crisp product UI, soft neutral surfaces, and a confident green/teal civic accent.

Avoid a generic dark AI dashboard aesthetic. The entire product remains light, including dashboards, forms, navigation, dialogs, and charts.

## 2. Color tokens

Use CSS variables or Tailwind theme tokens.

```css
:root {
  color-scheme: light;
  --color-primary: #137C72;
  --color-primary-hover: #0F665E;
  --color-primary-soft: #E5F4F1;
  --color-accent: #E6A94A;
  --color-background: #F7FAF9;
  --color-surface: #FFFFFF;
  --color-surface-muted: #EEF4F2;
  --color-text: #172B2A;
  --color-text-muted: #657674;
  --color-border: #DCE7E4;
  --color-success: #24845B;
  --color-warning: #B7791F;
  --color-danger: #C24B4B;
  --color-info: #3977A8;
}
```

Rules:
- Primary teal/green is for main actions, active navigation, and key highlights.
- Warm amber is a small accent, not a second primary color.
- Use semantic colors for status and priority.
- Do not use pure black for large text areas.
- Keep backgrounds light and surfaces clearly separated.

## 3. Typography

Recommended pairing:
- Headings: **Manrope** or **Plus Jakarta Sans**.
- Body and UI: **Inter**.

Use a small, consistent type scale:
- Display: 48–64px desktop, responsive down to 36px.
- H1: 36–44px.
- H2: 28–32px.
- H3: 20–24px.
- Body: 15–17px.
- Supporting labels: 12–14px.

Use concise headings and comfortable line height. Avoid overly thin text.

## 4. Layout and components

- Content max width: approximately 1200–1320px.
- Desktop dashboard: fixed or sticky left sidebar, flexible content area.
- Mobile: compact top bar and collapsible navigation.
- Card radius: 16–20px.
- Input radius: 10–12px.
- Buttons: 10–12px radius, clear hover/focus/disabled states.
- Use subtle borders and soft shadows; avoid heavy shadows.
- Maintain consistent spacing based on an 8px rhythm.
- Use skeletons for loading states.

## 5. Landing page visual direction

### Hero section
- Use a wide, high-quality image or short muted loop showing a clean, vibrant city/public space, community infrastructure, or a civic worker improving a street.
- Place the image as a right-side visual on desktop or as a carefully cropped background with a light overlay.
- Keep headline and CTA on a solid/light surface for readability.
- Suggested headline: **“A better city starts with being heard.”**
- Supporting copy: “Report local issues, follow every update, and help make public spaces work better for everyone.”
- Primary CTA: **Report an issue**
- Secondary CTA: **Explore how it works**

### Feature section
Use three or four clean cards:
- Report in minutes
- AI-assisted routing
- Track progress
- Transparent resolution

### How it works
Use a simple three-step visual:
1. Report an issue.
2. CivicAI helps organize it.
3. Track progress to resolution.

### Trust section
Use a soft tinted background, real product screenshots, and concise privacy/transparent-process messaging. Do not invent government partnerships, official endorsements, or impact statistics.

## 6. Appropriate use of background images and videos

Use assets purposefully, not on every screen.

| Location | Recommended asset | Treatment |
|---|---|---|
| Landing hero | Wide city/community/public infrastructure photo or 5–8 second loop video | Light overlay; keep text on a readable solid panel |
| How-it-works section | Small documentary-style image | Rounded image beside steps |
| About/mission section | Community or civic-maintenance photo | Soft crop, no text embedded in image |
| Login/signup | Subtle city photo on one side on desktop | Form remains on white/light surface |
| Citizen dashboard | Optional small banner image | Keep most of dashboard plain for clarity |
| Report form | No background video | Plain light surface to maximize form readability |
| Admin dashboard | No background video | Data clarity takes priority |
| Report detail | Actual uploaded issue photo | Clearly label as citizen-submitted evidence |

Video rules:
- Use muted, autoplay, loop, playsInline only when appropriate.
- Provide a poster image and fallback image.
- Respect `prefers-reduced-motion`; show a static image instead.
- Do not autoplay audio.
- Compress and lazy-load non-critical media.
- Add a subtle overlay if text sits over media.
- Never place moving imagery behind tables, maps, forms, or dense data.
- Do not use copyrighted stock footage without a valid license.

Asset sourcing:
- Prefer original project assets or properly licensed sources such as Unsplash/Pexels with license checks.
- Keep local assets under `frontend/public/images/` and `frontend/public/videos/`.
- Use descriptive filenames and alt text.
- Do not hotlink random image URLs in production.

## 7. Page-by-page design

### Public landing page
- Light header with logo, navigation, Sign in, and primary CTA.
- Spacious hero with one visual focal point.
- Feature cards, process section, trust section, footer.
- Mobile layout stacks image and text cleanly.

### Authentication
- Two-column layout on desktop: brand/story visual on one side, form on the other.
- Single-column form on mobile.
- Clear validation and password visibility control.
- No unnecessary background video on the form itself.

### Citizen dashboard
- Greeting and prominent “Report an issue” CTA.
- Summary cards for submitted, in progress, and resolved.
- Recent reports with status pills and dates.
- Friendly empty state with CTA.

### New report
- Calm, focused form with clear labels and progress feedback.
- Group fields logically: issue details, location, photo.
- Image preview before submit.
- Explain that AI category/priority are suggestions.
- Never put a moving background behind the form.

### Report detail
- Title, reference code, status, submitted date.
- Status timeline.
- Location and submitted image.
- AI summary in a clearly labelled “AI assistance” panel.
- Keep internal admin notes hidden from citizens.

### Admin dashboard
- Neutral light workspace.
- Sidebar navigation.
- KPI cards, charts, report table, filters.
- Use restrained semantic status colors.
- Keep table density readable and actions obvious.
- AI suggestions must be visually distinct from admin-confirmed values.

## 8. Status and priority visual language

Status:
- Submitted: neutral blue/grey.
- Under review: amber.
- Assigned: violet or blue.
- In progress: teal.
- Resolved: green.
- Rejected: muted red.

Priority:
- Low: green.
- Medium: amber.
- High: red.

Never rely on color alone; always show text labels and accessible contrast.

## 9. Motion

- Use short transitions (150–220ms) for hover, focus, and opening panels.
- Use subtle entrance motion only for non-essential content.
- Avoid parallax and constant motion.
- Respect reduced-motion preferences.
- Keep interactions responsive and calm.

## 10. Responsive behavior

- Mobile-first implementation.
- At small widths, convert multi-column layouts to a single column.
- Tables should become stacked cards or use a deliberate horizontal-scroll container.
- Keep primary actions reachable and forms easy to complete.
- Test at 360px, 768px, 1024px, and 1440px widths.

## 11. Design acceptance checklist

- [ ] Light mode only across all routes.
- [ ] Consistent color, typography, spacing, and radius tokens.
- [ ] Landing hero includes a relevant image/video with fallback.
- [ ] Forms and admin data views use calm, plain surfaces.
- [ ] All media has appropriate alt text or accessible treatment.
- [ ] Reduced-motion preference is respected.
- [ ] Mobile layouts are usable without horizontal page overflow.
- [ ] No fake endorsements, impact figures, or fabricated civic authority branding.
