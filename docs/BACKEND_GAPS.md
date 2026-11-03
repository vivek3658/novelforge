# Backend gaps affecting the client

## Studio collaborator invitations

This capability is now implemented in the identity service through `GET /api/v1/identity/users/search?q=&limit=10`.

The endpoint is authenticated, returns only public-safe identity fields (`id`, `username`, `displayName`, `avatarUrl`), and is used by the Studio invite panel after the user selects a match. The Studio membership server-side check still validates the inviter's permission and the selected user before creating an invite.

## Studio collaboration discovery and membership

The studio service can search `PUBLIC` studios and owners can invite members, but there is no self-serve join/request-to-join operation. The client therefore supports browsing public studio summaries and explains that collaboration requires an owner invitation; it does not show a fake Join button.

The studio search query returns only `PUBLIC` studios. `UNLISTED` and `PRIVATE` studios are not discoverable, and the current `GET /studios/{studioId}` handler requires active membership. That means a direct share URL cannot yet resolve an unlisted studio page for non-members. Add a public studio profile endpoint that allows `PUBLIC` and `UNLISTED` profiles, plus an owner-controlled join policy and request/accept workflow if self-service collaboration is desired. Keep `PRIVATE` profiles member-only. The client visibility selector reflects the existing enum, but link-based profile access and join requests remain backend work.

## Comment Author Public Profiles

The engagement service comment endpoint (`GET /targets/{type}/{targetId}/comments`) returns records containing `userId` (`Long`), but does not return author metadata such as `username`, `displayName`, or `avatarUrl`. To avoid displaying raw numeric account IDs or generic "Reader" labels across comments on novels, chapters, and community posts, either the comment payload should embed public author summary objects, or a batch profile resolution endpoint should be provided by `identity-service`.

## ImageKit Upload Authorization

The identity service now exposes authenticated `GET /api/v1/identity/profile/imagekit-auth`, returning non-cacheable one-time `token`, `expire`, and `signature` values. Configure `IMAGEKIT_PRIVATE_KEY` only in the identity-service deployment environment. The client must keep only the ImageKit public key and URL endpoint; files upload directly to ImageKit and only the returned URL is sent to NovelForge.

## Moderation Enforcement

The moderation resolve endpoint currently records the report status, action label, note, and resolver. It does not remove content, warn a creator, or suspend an account. The client exposes only resolve/dismiss triage choices to avoid implying enforcement. If enforcement is required, add explicit authorized operations across Identity, Novel, and Engagement, then connect a clearly scoped action contract to the report workflow.
