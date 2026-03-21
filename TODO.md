# Chat UI Redesign TODO

## Plan Overview
Complete redesign of chat UI with animations, message controls, transitions per spec. Files: chat.component.ts/html/css.

## Steps
- [x] **Step 1: Update TypeScript** - Add UI state (activeMenuMessageId, removingMessageIds, isLoading, justEditedId), methods (toggleMenu, closeMenu, startEdit, enhanced deleteMessage/selectUser/submitEdit), HostListener. ✓
- [x] **Step 2: Update HTML Template** - Add three-dot menus/dropdowns, .removing/.just-edited classes, loading skeletons, edit banner/cancel, conditional icons, conversation transitions. ✓
- [ ] **Step 3: Update CSS Styles** - All spec keyframes (slideInLeft/Right w/spring, collapseOut, dropdownIn/Out, shimmer, etc.), enhanced hovers/focus/clicks, skeletons, global transitions.
- [ ] **Step 4: Test & Verify** - Run `ng serve`, test all anims/transitions/features (msgs entry/delete/edit, menus, contact switch, hovers, reduced-motion), fix issues.

Progress: Step 1 ✓, starting Step 2.

