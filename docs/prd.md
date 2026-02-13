# Voobi - Product Requirements Document

## Overview

### Problem Statement

Children love YouTube Kids for its interactive experience—browsing thumbnails, selecting videos independently, and exploring content. However, the platform has significant drawbacks:

1. **Low-quality content**: Algorithm-driven recommendations often surface clickbait and low-educational-value videos
2. **Self-reinforcing loops**: Children get trapped watching the same narrow themes (e.g., princesses, unicorns) repeatedly
3. **No parental curation**: Parents cannot pre-approve specific videos or control what appears in recommendations

### Solution

Voobi is a "wrapper" application that lets parents hand-pick YouTube videos for their children. Children get the familiar YouTube-like browsing experience, but only see parent-approved content with curated recommendations.

### Goals

- Give children an independent, familiar video-browsing experience
- Give parents full control over available content
- Encourage diverse content consumption by surfacing less-watched videos first
- Build a foundation for future multi-child, multi-parent household support

---

## User Personas

### Child (Primary User)
- Age: 4-6 years old
- Needs: Simple, visual interface with large thumbnails; familiar YouTube-like experience; ability to browse and select videos independently

### Parent (Admin User)
- Needs: Easy video curation; visibility into watch history; confidence that child only sees approved content

---

## User Flows

### Flow 1: Parent Account Setup

```
1. Parent visits app.com/admin
2. Parent clicks "Sign Up"
3. Parent enters email + password
4. Email verification (Supabase default)
5. Parent lands on empty dashboard
```

### Flow 2: Parent Adds Videos

```
1. Parent is logged into /admin dashboard
2. Parent pastes a YouTube video URL into "Add Video" input
3. System validates URL format
4. System calls YouTube Data API to:
   - Verify video exists
   - Fetch thumbnail, title, duration
   - Check "Made for Kids" status
5. If valid: Video added to list with thumbnail preview
6. If invalid: Error message shown, video not added
7. Parent can remove videos via delete button
```

### Flow 3: Device Setup for Child

```
1. Parent opens browser on child's device (iPad, tablet, phone)
2. Parent navigates to app.com
3. App shows "Enter parent email to connect this device"
4. Parent enters their email
5. System looks up parent account, stores parent_id in localStorage
6. App now shows that parent's curated video list
7. Parent taps "Add to Home Screen" to install as PWA
8. Parent hands device to child
```

### Flow 4: Child Watches Videos

```
1. Child taps Voobi icon on home screen
2. App loads, reads parent_id from localStorage
3. Home screen displays thumbnail grid:
   - Videos sorted by watch_count ascending (least watched first)
   - Each thumbnail shows video title below
4. Child taps a thumbnail
5. Video player page loads with embedded YouTube player
6. Video plays (with standard YouTube controls)
7. System increments watch_count for this video
8. When child pauses or video ends:
   - Recommendations appear below player
   - Recommendations = other videos from same curated list
   - Sorted randomly or by least-watched
9. Child can tap a recommendation to play next video
10. Child can tap "Home" to return to thumbnail grid
```

### Flow 5: Parent Views Analytics (Future)

```
1. Parent logs into /admin
2. Dashboard shows:
   - List of all curated videos
   - Watch count per video
   - Last watched timestamp per video
3. Parent can sort by most/least watched
```

---

## MVP Feature Scope

### In Scope (MVP)

| Feature | Description |
|---------|-------------|
| Parent authentication | Email/password signup and login via Supabase |
| Video management | Add/remove individual YouTube video URLs |
| URL validation | Verify YouTube URL format and video existence |
| Metadata fetching | Pull thumbnail, title, duration from YouTube API |
| Child home feed | Responsive thumbnail grid, sorted by watch count |
| Device linking | Connect child device to parent account via email |
| Video playback | Embedded YouTube player (ToS compliant) |
| Curated recommendations | Show other approved videos after/during playback |
| Watch tracking | Increment view count when video plays |
| PWA support | Installable on mobile devices |
| Responsive design | Works on iPhone, iPad, Android phone/tablet |

### Out of Scope (Future)

| Feature | Description |
|---------|-------------|
| PIN-protected parent mode | Switch between child/parent mode on same device |
| Multi-child support | Multiple children per parent account |
| Multi-parent households | Multiple parents managing same child |
| Channel import | Add all videos from a YouTube channel |
| Playlist import | Add all videos from a YouTube playlist |
| Ad blocking | Block YouTube ads (likely ToS violation) |
| Browser extension | Add videos to list while browsing YouTube |
| Watch time analytics | Duration watched, not just play count |
| Other video platforms | Vimeo, educational sites, etc. |

---

## Technical Specification

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | Familiar to team, handles both child UI and admin |
| Database | Supabase (PostgreSQL) | Built-in auth, Row Level Security, real-time capable |
| Styling | Tailwind CSS | Rapid responsive development |
| PWA | next-pwa | Adds manifest and service worker to Next.js |
| YouTube API | YouTube Data API v3 | Fetch video metadata, validate URLs |
| Video Player | YouTube IFrame Embed | ToS-compliant, no extra libraries |
| Hosting | Vercel | Native Next.js support, easy deployment |

### Database Schema

```sql
-- Parents table (extends Supabase auth.users)
create table parents (
  id uuid references auth.users primary key,
  email text not null,
  created_at timestamp with time zone default now()
);

-- Videos table
create table videos (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  youtube_id text not null,
  title text,
  thumbnail_url text,
  duration_seconds integer,
  made_for_kids boolean default true,
  watch_count integer default 0,
  last_watched_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  
  unique(parent_id, youtube_id)
);

-- Row Level Security
alter table videos enable row level security;

-- Parents can only see/edit their own videos
create policy "Parents manage own videos" on videos
  for all using (auth.uid() = parent_id);

-- Public read access for child feed (filtered by parent_id in app)
create policy "Public read for child feed" on videos
  for select using (true);
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/videos` | GET | List videos for a parent_id (query param) |
| `/api/videos` | POST | Add video (requires auth) |
| `/api/videos/[id]` | DELETE | Remove video (requires auth) |
| `/api/videos/[id]/watch` | POST | Increment watch count |
| `/api/validate-youtube` | POST | Validate YouTube URL, return metadata |
| `/api/parent-by-email` | GET | Look up parent_id by email (for device linking) |

### Page Structure

```
app/
├── page.tsx                    # Child home feed (thumbnail grid)
├── watch/[videoId]/page.tsx    # Video player with recommendations
├── link-device/page.tsx        # Device linking screen
├── admin/
│   ├── page.tsx                # Parent dashboard (video list)
│   ├── login/page.tsx          # Parent login
│   └── signup/page.tsx         # Parent signup
```

---

## YouTube API Compliance

### Required

- [ ] Embedded player minimum 200x200 pixels
- [ ] Do not overlay or obscure player controls
- [ ] Do not block ads that would normally play
- [ ] Do not display third-party ads on video playback page
- [ ] Check "Made for Kids" status before embedding
- [ ] Use `youtube-nocookie.com` for privacy-enhanced embeds
- [ ] Display YouTube branding per guidelines

### Allowed

- [x] Custom video selection/curation
- [x] Custom recommendations from curated list
- [x] Tracking watch history externally
- [x] Using YouTube Data API to fetch metadata

---

## Implementation Sequence

### Phase 1: Foundation (Week 1)
1. Set up Next.js project with Tailwind
2. Configure Supabase project and database schema
3. Implement parent authentication (signup/login)
4. Create admin dashboard layout

### Phase 2: Video Management (Week 2)
5. Build YouTube URL validation
6. Integrate YouTube Data API for metadata
7. Implement add/remove video functionality
8. Display video list in admin dashboard

### Phase 3: Child Experience (Week 3)
9. Build device linking flow
10. Create child home feed with thumbnail grid
11. Implement watch count sorting
12. Build video player page with embedded YouTube

### Phase 4: Polish & PWA (Week 4)
13. Add curated recommendations on player page
14. Implement watch count tracking
15. Configure PWA (manifest, icons, service worker)
16. Responsive testing across devices
17. Deploy to Vercel

---

## Open Questions

1. **Error handling for device linking**: What happens if parent email doesn't exist? Show error or allow creating account?

2. **Watch count timing**: When exactly do we increment? On video load, after X seconds, or on video end?

3. **Offline behavior**: Should the app work offline? (Would require caching video metadata, but videos still need internet)

4. **Video ordering options**: Should parents be able to manually reorder videos, or always auto-sort by watch count?

5. **Session persistence**: How long should device linking last? Forever until cleared, or expire after X days?

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Parent can add first video | < 2 minutes from signup |
| Child can start watching | < 30 seconds from app launch |
| Device linking success rate | > 95% |
| PWA install rate | Track adoption |
| Video diversity | Child watches > 50% of curated videos within first month |

---

## Appendix

### Reference Screenshots

- `home.jpeg` - YouTube Kids home feed (thumbnail grid layout reference)
- `play.PNG` - YouTube Kids player with recommendations (player layout reference)

### Relevant Links

- [YouTube API Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
