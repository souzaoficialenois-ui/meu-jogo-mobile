# Security Specification - Fighter Legend

## 1. Data Invariants
- A user can only read and write their own profile document in `/users/{userId}`.
- A user can only read and write their own session document in `/sessions/{userId}`.
- Character and stage overrides are read-only for players, but writeable by admins.
- Users cannot change their own `role` or `isBanned` status.
- `createdAt` is immutable.
- `updatedAt` must be set to `request.time`.
- `numericId` is immutable once set.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to write to `/users/otherUserUid` as `authUserUid`.
2. **Privilege Escalation**: User attempts to update their own `role` to `ADMIN`.
3. **Bypass Ban**: User attempts to set `isBanned` to `false` on their own profile.
4. **Immutable Violation**: User attempts to change `createdAt` timestamp.
5. **ID Poisoning**: Attempt to use a 2KB string as a `userId` in the path.
6. **Shadow Field**: Attempt to add `ghostField: true` to a user document.
7. **Type Mismatch**: Attempt to set `coins: "lots"`.
8. **Resource Exhaustion**: Attempt to set `displayName` to a 5MB string.
9. **Orphaned Write**: Attempt to create a session for a user that doesn't exist in `/users`.
10. **Admin Bypass**: Attempt to write to `/character_overrides/goku` as a regular player.
11. **State Shortcut**: Attempt to skip a battle pass level without XP. (Handled by app logic, but rules should prevent unauthorized updates).
12. **Query Scraping**: Attempt to list all users in `/users` without a `where` clause matching the user's UID.

## 3. Test Runner Concept (Handled by rules audit)
All payloads above MUST return `PERMISSION_DENIED`.
