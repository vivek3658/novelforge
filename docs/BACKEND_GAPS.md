# Backend gaps affecting the client

## Studio collaborator invitations

The current studio invitation operation requires an `inviteeUserId`. The available identity API does not provide an authenticated, privacy-safe way for a studio owner to find a person by username or email. The client therefore does not request or display internal account IDs, and invitation creation is temporarily unavailable in the Studio team panel.

### Needed capability

Add an authenticated directory search scoped to eligible invitees, for example `GET /api/v1/identity/users/search?q=...`, with rate limiting and authorization checks. Return only fields needed to identify a result (for example display name, username, and a non-sensitive avatar URL). Keep the account ID as an opaque value used internally after a user selects a result. The invitation operation should verify the caller's studio permission and the selected account server-side.

This is a proposed contract shape, not an endpoint implemented or assumed by the client. The client must be updated only after the backend contract is available and documented.

## Studio collaboration discovery and membership

The studio service can search `PUBLIC` studios and owners can invite members, but there is no self-serve join/request-to-join operation. The client therefore supports browsing public studio summaries and explains that collaboration requires an owner invitation; it does not show a fake Join button.

The studio search query returns only `PUBLIC` studios. `UNLISTED` and `PRIVATE` studios are not discoverable, and the current `GET /studios/{studioId}` handler requires active membership. That means a direct share URL cannot yet resolve an unlisted studio page for non-members. Add a public studio profile endpoint that allows `PUBLIC` and `UNLISTED` profiles, plus an owner-controlled join policy and request/accept workflow if self-service collaboration is desired. Keep `PRIVATE` profiles member-only. The client visibility selector reflects the existing enum, but link-based profile access and join requests remain backend work.

## Comment Author Public Profiles

The engagement service comment endpoint (`GET /targets/{type}/{targetId}/comments`) returns records containing `userId` (`Long`), but does not return author metadata such as `username`, `displayName`, or `avatarUrl`. To avoid displaying raw numeric account IDs or generic "Reader" labels across comments on novels, chapters, and community posts, either the comment payload should embed public author summary objects, or a batch profile resolution endpoint should be provided by `identity-service`.
