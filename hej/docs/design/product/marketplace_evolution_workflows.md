# Marketplace Evolution Workflows

Document: `marketplace_evolution_workflows.md`
Version: v1.1
Status: Draft
Purpose:

Describe a future marketplace-oriented operating model that can evolve from the Canon-based governed human judgment infrastructure.

This document is intentionally broader than the current Canon.
It captures the product processes needed if the platform evolves toward a two-sided or multi-sided marketplace while preserving the same workflow engine underneath.

The goal is not to replace the Canon engine.
The goal is to layer:

* discovery
* matching
* economics
* contributor growth
* messaging
* trust signals

on top of the same core judgment system.

---

# 1. Marketplace Identity

The marketplace model turns the platform into a **knowledge-work coordination marketplace for governed annotation and judgment tasks**.

At that stage, the product serves two overlapping operating modes:

* `ToB operating mode`
  Organizations run private governed workflows.
* `ToC / marketplace operating mode`
  Requesters publish work and contributors discover, apply for, accept, and complete work under platform governance.

The same underlying judgment engine remains in place:

* tasks
* task items
* first-pass outputs
* review
* dispute
* arbitration
* provenance
* export

The marketplace adds an outer commercial and social layer.

---

# 2. Marketplace Actor Model

The marketplace expands the actor set:

* `Requester / Publisher`
  Publishes tasks, defines reward and workflow requirements, funds the job.
* `Worker / Annotator`
  Applies for or accepts tasks, produces annotation work.
* `Worker / Judge`
  Applies for or accepts judgement tasks and produces first-pass verdicts.
* `Reviewer`
  Reviews work, often unlocked through higher trust or experience.
* `Dispute Expert / Arbitrator`
  Resolves escalated conflicts.
* `Admin / Trust and Safety Operator`
  Moderates behavior, disputes, abuse, and platform operations.
* `Platform`
  Handles matching, payments, trust scoring, and notifications.

One user may simultaneously be:

* a requester for one project
* a worker for another
* a reviewer in a certified domain

This is closer to a LinkedIn-style dual-role platform than a rigid buyer/seller split.

---

# 3. Master Marketplace Process Map

```text
Account Creation and Trust Setup
  ->
Profile and Capability Modeling
  ->
Wallet / Payment Readiness
  ->
Task Publishing and Funding
  ->
Marketplace Listing and Matching
  ->
Application / Acceptance / Assignment
  ->
Annotation and Review Execution
  ->
Quality Evaluation and Hidden Checks
  ->
Dispute and Expert Resolution
  ->
Reward Settlement
  ->
Reputation and Growth Update
  ->
Long-term Retention via Messaging, Notifications, and Re-engagement
```

---

# 4. Workflow 1: Account Creation, Login, Recovery, and Security

## Goal

Establish secure user identity and anti-fraud foundations.

## Actors

* User
* Auth Service
* Admin

## User Journey

1. User registers with email or phone.
2. User verifies ownership of that channel.
3. User sets password or passwordless login method.
4. User optionally enrolls in 2FA.
5. User can recover account through secure reset flow.

## Required Functional Capabilities

* email registration
* phone registration
* email verification
* OTP verification
* password login
* forgot password
* reset password
* 2FA enrollment
* 2FA challenge during login
* suspicious login detection
* session management

## Key Data Objects

* `User`
* `Credential`
* `VerificationChallenge`
* `TwoFactorEnrollment`
* `Session`

## Key Screens / Surfaces

* sign up
* sign in
* forgot password
* 2FA setup
* security settings

## Compatibility with Canon Core

Fully compatible.
This extends the Canon identity layer rather than conflicting with it.

---

# 5. Workflow 2: Profile, Trust, Reputation, and Growth

## Goal

Model user capability so the platform can route harder work to more trustworthy participants.

## Actors

* User
* Platform
* Admin

## User Journey

1. User completes profile.
2. User declares domain interests and experience.
3. Platform records task history and quality outcomes.
4. Platform computes trust, level, badges, and qualification eligibility.
5. User unlocks higher-responsibility roles over time.

## Profile Dimensions

* public username
* real name or verified name
* region and language
* domain interests
* certification status
* quality score
* completed task count
* dispute win / loss history
* reviewer eligibility
* arbitrator eligibility
* badges and rank

## Required Functional Capabilities

* editable user profile
* profile visibility controls
* skill and domain tagging
* certification submission and verification
* badge engine
* level engine
* reputation score calculation
* trust-based role unlocks

## Key Data Objects

* `UserProfile`
* `UserBadge`
* `UserLevel`
* `Certification`
* `TrustScore`
* `DomainInterest`

## Key Screens / Surfaces

* profile page
* public contributor card
* skill and badge section
* trust dashboard

## Compatibility with Canon Core

Compatible if treated as a capability and trust layer above role assignments.
Canon role assignments remain the authorization truth.
Marketplace reputation informs who becomes eligible for those roles.

---

# 6. Workflow 3: Payment Readiness and Economic Setup

## Goal

Support the commercial reality of paid knowledge work.

## Actors

* Requester
* Worker
* Payment Service
* Admin

## User Journey

1. Requester adds payment method.
2. Worker adds payout method.
3. Platform verifies readiness for billing and payout.
4. Requester funds tasks before publication.
5. Worker receives earnings after quality and dispute resolution.

## Required Functional Capabilities

* payment method registration
* payout method registration
* escrow or pre-funded balance
* fee calculation
* invoice / receipt generation
* payout scheduling
* refund and reversal handling
* failed payment handling

## Key Data Objects

* `BillingAccount`
* `PaymentMethod`
* `PayoutMethod`
* `EscrowBalance`
* `Transaction`
* `Invoice`

## Key Screens / Surfaces

* billing settings
* payout settings
* requester checkout
* earnings dashboard

## Compatibility with Canon Core

This is explicitly outside current Canon scope, but it does not conflict with the core judgment engine if isolated as a commercial module.

---

# 7. Workflow 4: Notifications, Messaging, and Operational Communication

## Goal

Allow marketplace participants to coordinate and stay informed.

## Actors

* Requester
* Worker
* Reviewer
* Admin
* Notification Service

## User Journey

1. User receives platform notifications about state changes.
2. Users may exchange direct messages or structured conversation threads.
3. System sends alerts for assignment, deadlines, disputes, payout, and moderation events.

## Required Functional Capabilities

* in-app notifications
* email notifications
* assignment alerts
* deadline reminders
* payout notices
* dispute notices
* requester-worker messaging
* moderation tools for abuse and spam

## Key Data Objects

* `Notification`
* `Conversation`
* `Message`
* `DeliveryPreference`

## Key Screens / Surfaces

* notification center
* inbox
* conversation thread
* settings for notification preferences

## Compatibility with Canon Core

Compatible.
Useful for both marketplace and enterprise modes.

---

# 8. Workflow 5: Marketplace Discovery and Listing

## Goal

Turn tasks into discoverable opportunities for qualified contributors.

## Actors

* Requester
* Worker
* Platform Matching Service

## User Journey

1. Requester publishes a task listing.
2. Listing appears in the marketplace feed or matching results.
3. Worker explores cards, filters by domain, difficulty, reward, and trust fit.
4. Worker opens a listing detail page to inspect requirements and publisher credibility.

## Listing Model

A marketplace listing should expose:

* title
* summary
* domain
* task type
* estimated effort
* pay model
* reward
* execution mode
* difficulty
* required trust level
* review / dispute expectations
* deadline
* requester profile
* match score

## Required Functional Capabilities

* listing creation
* listing visibility controls
* search and filtering
* recommendation / match scoring
* listing detail page
* requester profile preview

## Key Data Objects

* `MarketplaceListing`
* `ListingVisibilityRule`
* `ListingRecommendation`

## Key Screens / Surfaces

* marketplace home
* search results
* listing card grid
* listing detail page

## Compatibility with Canon Core

A listing should be a wrapper around the existing `Task` concept, not a replacement for it.

---

# 9. Workflow 6: Dual User Mode

## Goal

Support users who can both publish and execute work.

## Actors

* User
* Platform

## User Journey

1. User enters the platform.
2. Platform shows role-sensitive actions based on current context.
3. The same user may:
   publish work, complete work, review work, and later arbitrate work if eligible.

## Required Functional Capabilities

* unified account identity
* multiple active role contexts
* role-aware navigation and permissions
* requester mode and contributor mode views

## Key Data Objects

* `RoleAssignment`
* `CapabilityEligibility`
* `UserContextPreference`

## Compatibility with Canon Core

Strongly compatible.
Canon already assumes multiple roles.

---

# 10. Workflow 7: Task Publishing and Funding

## Goal

Allow a requester to configure a judgment task in marketplace form and fund it before execution.

## Actors

* Requester
* Payment Service
* Platform

## User Journey

1. Requester starts a new task listing.
2. Requester enters title, details, deadlines, commission, and task metadata.
3. Requester configures execution mode and participant requirements.
4. Requester chooses quality controls such as cross-validation ratio.
5. Platform estimates cost.
6. Requester funds the task.
7. Listing becomes `draft`, `pending payment`, or `published`.

## Publishing Fields

At minimum:

* title
* detailed brief
* domain
* pay model
* commission / reward pool
* required annotator level
* review requirement
* AI-assisted allowed or not
* task difficulty
* deadline
* sample count or workload estimate
* cross-validation ratio
* dispute policy
* privacy and storage model

## Required Functional Capabilities

* task publish wizard
* pricing estimator
* draft save
* pending-payment state
* checkout
* publish / unpublish
* edit listing while eligible

## Key Data Objects

* `TaskDraft`
* `MarketplaceListing`
* `FundingIntent`
* `PublishState`

## Compatibility with Canon Core

Compatible if marketplace publishing maps down into existing `Project -> Task -> TaskItem` structures.

---

# 11. Workflow 8: Application, Matching, Acceptance, and Assignment

## Goal

Route the right work to the right contributors.

## Actors

* Worker
* Requester
* Platform Matching Service

## User Journey

1. Worker sees a listing.
2. Depending on policy:
   worker applies, auto-accepts, or receives invitation.
3. Requester or system approves participation.
4. Platform assigns slices of work.
5. Contributor enters the workbench.

## Required Functional Capabilities

* apply to task
* auto-match invitation
* manual approval
* acceptance and decline
* capacity management
* assignment creation
* workload balancing

## Key Data Objects

* `Application`
* `Invitation`
* `Assignment`
* `AssignmentBatch`

## Key Screens / Surfaces

* apply form
* applicant review panel
* assignment inbox

## Compatibility with Canon Core

Very compatible.
Canon already includes assignment as a core operational concept.
Marketplace simply adds pre-assignment discovery and selection.

---

# 12. Workflow 9: Real Annotation Execution

## Goal

Execute real paid work through the same underlying task engine.

## Actors

* Worker / Annotator
* Reviewer
* AI Pipeline
* Platform

## Execution Modes

* `human_first`
  Human creates initial labels.
* `ai_assisted`
  AI suggests and human verifies.

## Pricing Models

The marketplace may later support:

* pay per item
* pay per accepted annotation
* pay by estimated time band
* hybrid base + quality bonus

## Required Functional Capabilities

* first-pass runtime launch
* AI suggestion presentation
* time tracking if needed
* item count accounting
* throughput and quality analytics
* completion tracking

## Compatibility with Canon Core

Fully compatible.
This is the same first-pass execution engine as the ToB system.

---

# 13. Workflow 10: Quality Evaluation and Hidden Validation

## Goal

Measure worker quality without making the system easy to game.

## Actors

* Worker
* Reviewer
* Platform QA Engine
* Expert

## User Journey

1. Platform inserts hidden calibration items into the worker queue.
2. Worker completes them as normal items without explicit labeling that they are tests.
3. System compares outputs against expert or gold judgments.
4. Worker quality score updates.
5. Incorrect items may become non-payable or dispute-eligible depending on policy.

## Required Functional Capabilities

* gold-item injection
* blind calibration handling
* quality score calculation
* hidden evaluation item accounting
* payable / non-payable work classification
* worker feedback summary after batch close

## Key Data Objects

* `CalibrationItem`
* `GoldJudgment`
* `QualityAssessment`
* `PaymentEligibilityDecision`

## Compatibility with Canon Core

Compatible if implemented as specialized review and QA logic around TaskItems.

---

# 14. Workflow 11: Dispute, Expert Review, and Final Ruling

## Goal

Protect fairness when payment or quality decisions are contested.

## Actors

* Worker
* Requester
* Reviewer
* Expert Arbitrator
* Admin

## User Journey

1. Worker sees rejected or non-payable items after due time or batch close.
2. Worker may dispute the ruling.
3. Platform opens dispute case with all evidence.
4. Expert reviews candidate outputs, gold references, and prior judgments.
5. Expert issues final decision.
6. Decision affects payout, reputation, and canonical result.

## Required Functional Capabilities

* worker-visible dispute initiation
* evidence bundle for dispute
* expert review intake
* final ruling issuance
* payout correction after ruling
* quality score correction after ruling

## Compatibility with Canon Core

Strongly compatible.
This is one of the best examples of the Canon engine being reusable in marketplace mode.

---

# 15. Workflow 12: Growth, Experience, and Unlocks

## Goal

Create long-term contributor progression.

## Actors

* Worker
* Reviewer
* Platform

## User Journey

1. User completes tasks.
2. Platform awards experience and badges.
3. High-quality work increases trust.
4. New capabilities unlock:
   reviewer, dispute participant, domain specialist, expert.

## Required Functional Capabilities

* XP engine
* progress milestones
* unlock conditions
* quality-linked penalties
* badge awards
* contributor leaderboard or achievement views

## Key Data Objects

* `ExperienceLedger`
* `BadgeAward`
* `UnlockRule`
* `RoleEligibility`

## Compatibility with Canon Core

Compatible if XP and unlocks feed into role eligibility rather than replacing formal authorization.

---

# 16. Workflow 13: Data Privacy and Storage Choice

## Goal

Preserve data sovereignty even in marketplace mode.

## Actors

* Requester
* Platform
* External Storage Provider

## User Journey

1. Requester chooses external storage provider.
2. Requester supplies data pointers or connector settings.
3. Requester optionally chooses privacy controls:
   redaction, anonymization, tag abstraction, access limits.
4. Platform retrieves data at runtime without becoming the primary storage owner.

## Required Functional Capabilities

* storage provider integration
* pointer registration
* temporary secure retrieval
* redaction or de-identification hooks
* configurable label storage model
* export-to-client-controlled-destination support

## Key Data Objects

* `DataPointer`
* `StorageProviderConfig`
* `PrivacyPolicy`
* `RedactionPolicy`

## Compatibility with Canon Core

Directly aligned.
This should remain unchanged between ToB and marketplace modes.

---

# 17. Functional Capability Map for Marketplace Mode

Marketplace mode adds these major product modules:

* `Onboarding and Security`
* `User Profile and Trust Graph`
* `Payments and Payouts`
* `Notifications and Messaging`
* `Marketplace Listings and Discovery`
* `Matching and Applications`
* `Commercial Publishing and Funding`
* `Quality Calibration and Hidden Checks`
* `Growth and Reputation`

It still depends on these Canon modules underneath:

* identity and roles
* organization and task model
* data pointers
* first-pass runtime integration
* AI import
* review
* disagreement
* dispute
* arbitration
* provenance
* export

---

# 18. Transition Strategy: One Core, Two Operating Models

The cleanest long-term strategy is:

## Core Layer

Shared by both ToB and marketplace:

* users and roles
* organizations
* projects
* tasks
* task items
* assignments
* annotations
* reviews
* disagreements
* disputes
* arbitration
* canonical judgments
* provenance
* export
* data pointer and external storage access

## ToB Layer

Enterprise workflow and tenant-owned operations:

* private organization workflows
* internal review routing
* governance dashboards
* export controls
* audit and provenance surfaces

## Marketplace Layer

Public or semi-public coordination and economics:

* listings
* applications
* matching
* messaging
* funding
* payout
* reputation
* growth systems

---

# 19. Recommended Design Constraint

To preserve convertibility, students should avoid one major mistake:

**do not hard-code the current product as if it will always be only a private enterprise console.**

Instead:

* keep `Task` as the execution object
* allow a future `MarketplaceListing` to point to a `Task`
* keep `Assignment` generic
* keep role and eligibility systems extensible
* keep payout, XP, and trust as separate modules
* keep raw data external
* keep dispute and arbitration generic, not employer-specific

That gives you:

* a credible ToB product today
* a convertible marketplace product later

without throwing away the engine.
