# ARIAHR Angular API Integration Standard

**Rule Name:** `ARIAHR_ANGULAR_API_STANDARD.md`

## 1. Purpose

This document is the mandatory coding standard for all Angular 20+ frontend development in the ARIAHR project.

Every API integration with the ASP.NET Core backend MUST follow the rules defined in this document.

The goal is to ensure:

* Consistent folder structure
* Consistent DTO naming
* Consistent Service naming
* Consistent Dependency Injection
* Consistent API method naming
* Consistent request/response handling
* Strong TypeScript typing
* Clear separation between UI, API communication, and models
* Easy maintenance and scalability
* Compatibility with Angular 20+
* No duplicated API logic
* No inconsistent naming between modules

---

# 2. Mandatory Angular Version

The project MUST follow Angular 20+ recommended patterns.

Use modern Angular APIs whenever applicable.

Preferred:

```ts
inject()
```

instead of constructor-based dependency injection.

Example:

```ts
private readonly http = inject(HttpClient);
```

Do NOT introduce old Angular patterns into newly created code unless there is a specific technical reason.

Angular's current style guide explicitly recommends `inject()` over constructor parameter injection.

---

# 3. Feature-Based Folder Structure

The frontend MUST be organized by business feature/module.

Do NOT create one global folder containing all services, DTOs, components, etc.

Preferred structure:

```text
src/
└── app/
    ├── core/
    │   ├── auth/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── services/
    │   └── config/
    │
    ├── shared/
    │   ├── components/
    │   ├── directives/
    │   ├── pipes/
    │   └── models/
    │
    ├── features/
    │   ├── auth/
    │   ├── organizations/
    │   ├── employees/
    │   ├── attendance/
    │   ├── scheduling/
    │   ├── requests/
    │   ├── notifications/
    │   ├── reporting/
    │   └── payroll/
    │
    └── app.config.ts
```

Each feature MUST own its own API-related code.

Example:

```text
features/
└── organizations/
    ├── components/
    ├── pages/
    ├── services/
    ├── models/
    │   ├── organization.dto.ts
    │   ├── create-organization.dto.ts
    │   ├── update-organization.dto.ts
    │   └── organization-response.dto.ts
    └── organization.routes.ts
```

Do NOT create:

```text
services/
    organization.service.ts
    employee.service.ts
    attendance.service.ts
    ...
```

unless the service is genuinely global/shared.

Angular recommends organizing application code around feature areas and maintaining consistency throughout the project.

---

# 4. Folder Naming

All folders MUST use lowercase kebab-case.

Correct:

```text
organizations
organization-details
user-management
attendance-reports
```

Incorrect:

```text
Organizations
OrganizationDetails
organization_details
organizationDetails
```

Folder names MUST describe the feature, not the technical implementation.

Correct:

```text
features/organizations/
```

Incorrect:

```text
features/api/
features/controllers/
features/http/
```

---

# 5. File Naming

Angular file names MUST use kebab-case.

Use Angular's conventional suffixes.

Examples:

```text
organization.service.ts
organization.dto.ts
create-organization.dto.ts
update-organization.dto.ts
organization-response.dto.ts
organization-list.component.ts
organization-details.component.ts
organization.routes.ts
```

Do NOT use:

```text
OrganizationService.ts
OrganizationDTO.ts
organizationService.ts
organization_model.ts
```

File names SHOULD match their TypeScript identifiers.

Angular's style guide recommends hyphen-separated filenames and matching file names with their contained symbols.

---

# 6. DTO Rules

DTOs MUST be explicitly defined.

Do NOT use:

```ts
any
```

for API request/response models.

Do NOT directly use UI models as API request models.

Separate API contracts from UI-specific models when necessary.

Recommended structure:

```text
models/
├── organization.dto.ts
├── organization-response.dto.ts
├── create-organization.dto.ts
├── update-organization.dto.ts
└── organization-list-response.dto.ts
```

---

# 7. DTO Naming Convention

DTO names MUST follow this pattern:

### General DTO

```text
OrganizationDto
```

File:

```text
organization.dto.ts
```

### Create Request

```text
CreateOrganizationDto
```

File:

```text
create-organization.dto.ts
```

### Update Request

```text
UpdateOrganizationDto
```

File:

```text
update-organization.dto.ts
```

### Response

```text
OrganizationResponseDto
```

File:

```text
organization-response.dto.ts
```

### List Response

```text
OrganizationListResponseDto
```

File:

```text
organization-list-response.dto.ts
```

### Paginated Response

```text
PagedResponseDto<T>
```

or the project's established generic pagination contract.

Example:

```ts
export interface PagedResponseDto<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
```

The exact property names MUST match the Backend API contract.

Never invent different property names on the frontend.

---

# 8. DTOs Must Match Backend Contracts

The Angular DTO MUST represent the actual Backend API contract.

If Backend returns:

```json
{
  "id": 1,
  "name": "Aria Clinic",
  "isActive": true
}
```

Angular MUST NOT arbitrarily transform it into:

```ts
{
  organizationId: 1,
  organizationName: 'Aria Clinic',
  active: true
}
```

unless an explicit mapping layer exists.

Backend contract:

```ts
export interface OrganizationResponseDto {
  id: number;
  name: string;
  isActive: boolean;
}
```

---

# 9. API Service Naming

Every feature API service MUST use:

```text
[Feature]Service
```

Example:

```ts
OrganizationService
EmployeeService
AttendanceService
SchedulingService
AuthService
NotificationService
```

Files:

```text
organization.service.ts
employee.service.ts
attendance.service.ts
scheduling.service.ts
auth.service.ts
notification.service.ts
```

Angular recommends service names that clearly describe their feature and use the `Service` suffix consistently.

---

# 10. API Service Location

API services MUST live inside their feature.

Correct:

```text
features/
└── organizations/
    └── services/
        └── organization.service.ts
```

Incorrect:

```text
src/app/services/organization.service.ts
```

unless it is explicitly a global/shared service.

---

# 11. Service Dependency Injection

All standard services SHOULD use:

```ts
@Injectable({
  providedIn: 'root'
})
```

Example:

```ts
@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly http = inject(HttpClient);
}
```

Do NOT manually register normal root services in random component providers.

Angular documents `providedIn: 'root'` as the recommended approach for most services and it also supports tree-shaking.

---

# 12. Dependency Injection Naming

Injected dependencies MUST use consistent names.

Example:

```ts
private readonly http = inject(HttpClient);
private readonly organizationService = inject(OrganizationService);
private readonly router = inject(Router);
```

Do NOT use inconsistent abbreviations:

```ts
private h = inject(HttpClient);
private org = inject(OrganizationService);
private os = inject(OrganizationService);
```

Use the class's semantic name.

Examples:

```ts
HttpClient -> http
Router -> router
ActivatedRoute -> route
OrganizationService -> organizationService
AuthService -> authService
NotificationService -> notificationService
```

---

# 13. HTTP Client

All HTTP communication MUST go through Angular `HttpClient`.

Do NOT use:

```ts
fetch()
```

directly inside feature components.

Do NOT call APIs directly from components.

Correct architecture:

```text
Component
    ↓
Feature Service
    ↓
HttpClient
    ↓
Backend API
```

Angular provides `HttpClient` through dependency injection and supports configuration through `provideHttpClient()`.

---

# 14. Components MUST NOT Call HttpClient Directly

Forbidden:

```ts
export class OrganizationComponent {
  private readonly http = inject(HttpClient);

  loadOrganizations() {
    return this.http.get('/api/organizations');
  }
}
```

Correct:

```ts
export class OrganizationComponent {
  private readonly organizationService =
    inject(OrganizationService);

  loadOrganizations() {
    return this.organizationService.getOrganizations();
  }
}
```

The component is responsible for UI behavior.

The service is responsible for API communication.

---

# 15. API Method Naming

API methods MUST describe the business operation.

Use:

```text
getOrganizations()
getOrganizationById()
createOrganization()
updateOrganization()
deleteOrganization()
activateOrganization()
deactivateOrganization()
```

Avoid:

```text
callApi()
sendRequest()
request()
getData()
postData()
doSomething()
```

The method name MUST communicate what the API operation does.

---

# 16. HTTP Verb Rules

Use HTTP verbs according to the Backend API contract.

```text
GET     -> Retrieve
POST    -> Create / Action
PUT     -> Full update
PATCH   -> Partial update
DELETE  -> Delete
```

Example:

```ts
getOrganizations()
```

```ts
return this.http.get<OrganizationResponseDto[]>(
  `${this.apiUrl}/organizations`
);
```

Create:

```ts
createOrganization(
  request: CreateOrganizationDto
)
```

Update:

```ts
updateOrganization(
  id: number,
  request: UpdateOrganizationDto
)
```

Delete:

```ts
deleteOrganization(id: number)
```

---

# 17. API URL Management

Do NOT hard-code API base URLs throughout services.

Forbidden:

```ts
this.http.get(
  'https://localhost:7151/api/organizations'
);
```

Use centralized API configuration.

Example:

```ts
private readonly apiUrl = `${environment.apiUrl}/organizations`;
```

Or the project's centralized API configuration mechanism.

There MUST be one consistent strategy across the entire application.

---

# 18. Service Structure

Every API service SHOULD follow this pattern:

```ts
@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/organizations`;

  getOrganizations() {
    return this.http.get<OrganizationResponseDto[]>(
      this.apiUrl
    );
  }

  getOrganizationById(id: number) {
    return this.http.get<OrganizationResponseDto>(
      `${this.apiUrl}/${id}`
    );
  }

  createOrganization(request: CreateOrganizationDto) {
    return this.http.post<OrganizationResponseDto>(
      this.apiUrl,
      request
    );
  }

  updateOrganization(
    id: number,
    request: UpdateOrganizationDto
  ) {
    return this.http.put<OrganizationResponseDto>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  deleteOrganization(id: number) {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
```

The exact endpoints MUST always come from the Backend API contract.

---

# 19. Observable Typing

Every HTTP request MUST be strongly typed.

Correct:

```ts
this.http.get<OrganizationResponseDto[]>(url);
```

Correct:

```ts
this.http.post<OrganizationResponseDto>(
  url,
  request
);
```

Forbidden:

```ts
this.http.get<any>(url);
```

Forbidden:

```ts
this.http.post<any>(url, request);
```

Unless there is an exceptional and documented reason.

---

# 20. API Response Envelope

If the Backend uses a standard response envelope, Angular MUST use the same generic contract.

Example:

```ts
export interface ApiResponseDto<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}
```

Then:

```ts
getOrganizationById(
  id: number
): Observable<ApiResponseDto<OrganizationResponseDto>> {
  return this.http.get<
    ApiResponseDto<OrganizationResponseDto>
  >(`${this.apiUrl}/${id}`);
}
```

Do NOT create a different response structure for each API unless the Backend actually returns different structures.

---

# 21. API Error Handling

Do NOT duplicate error handling inside every component.

Bad:

```ts
this.service.getOrganizations().subscribe({
  next: ...
  error: error => {
    console.log(error);
  }
});
```

repeated across dozens of components.

Use the application's centralized HTTP error/interceptor strategy where appropriate.

Feature-specific errors may still be handled by the feature when the UI needs specific behavior.

---

# 22. Authentication

Authentication-related API communication MUST be centralized.

Examples:

```text
core/
└── auth/
    ├── auth.service.ts
    ├── auth-state.service.ts
    ├── auth.interceptor.ts
    └── auth.guard.ts
```

Do NOT manually add:

```text
Authorization: Bearer ...
```

inside every API service.

Use the application's HTTP interceptor.

---

# 23. API Services Must Not Contain UI Logic

Forbidden:

```ts
showToast()
navigate()
openModal()
```

inside normal API services.

Service responsibility:

```text
API communication
request preparation
response typing
API-specific transformation
```

Component/page responsibility:

```text
UI state
navigation
dialogs
toasts
loading presentation
user interaction
```

---

# 24. API Services Must Not Contain Business UI State

Avoid putting component-specific state into API services.

For example, this is generally wrong:

```ts
isModalOpen = false;
selectedTab = 2;
showDeleteDialog = true;
```

inside:

```text
organization.service.ts
```

If application-wide state is required, use a dedicated state/store service with a clear responsibility.

---

# 25. Mapping API DTOs

If Backend DTOs and frontend UI models are different, create an explicit mapper.

Example:

```text
models/
├── organization-response.dto.ts
└── organization.model.ts

mappers/
└── organization.mapper.ts
```

Never perform hidden transformations randomly inside components.

Example:

```ts
export class OrganizationMapper {
  static toModel(
    dto: OrganizationResponseDto
  ): Organization {
    return {
      id: dto.id,
      name: dto.name,
      active: dto.isActive
    };
  }
}
```

---

# 26. One Responsibility Per File

Each file SHOULD have one primary responsibility.

Do NOT create:

```text
organization.service.ts
```

containing:

* DTOs
* interfaces
* API service
* mappers
* validators
* UI logic

Instead:

```text
organization.service.ts
organization.dto.ts
organization-response.dto.ts
organization.mapper.ts
organization.validator.ts
```

Angular's style guidance follows the "Rule of One" and recommends keeping individual assets focused.

---

# 27. Imports

Use absolute/alias imports according to the project's configured TypeScript path aliases.

Avoid deeply nested relative imports when an established alias exists.

Bad:

```ts
../../../../core/auth/auth.service
```

Preferred:

```ts
@core/auth/auth.service
```

or whatever alias is officially configured in the project.

Do NOT introduce new aliases without establishing them globally.

---

# 28. Naming Consistency Rule

The same business concept MUST always use the same name.

If the backend calls it:

```text
Organization
```

Frontend MUST NOT randomly use:

```text
Company
Org
OrganizationData
OrganizationInfo
Business
```

unless these are genuinely different concepts.

Example:

```text
OrganizationService
OrganizationResponseDto
CreateOrganizationDto
UpdateOrganizationDto
OrganizationComponent
OrganizationPage
```

This rule applies to:

* folders
* files
* classes
* interfaces
* DTOs
* services
* methods
* variables
* routes

---

# 29. API Naming Must Match Backend

If Backend endpoint is:

```text
GET /api/organizations
GET /api/organizations/{id}
POST /api/organizations
PUT /api/organizations/{id}
DELETE /api/organizations/{id}
```

Angular service MUST expose corresponding semantic methods:

```ts
getOrganizations()
getOrganizationById(id)
createOrganization(request)
updateOrganization(id, request)
deleteOrganization(id)
```

Do NOT rename the same operation inconsistently between modules.

---

# 30. Authentication Example

For authentication:

```text
features/
└── auth/
    ├── services/
    │   └── auth.service.ts
    │
    └── models/
        ├── send-otp.dto.ts
        ├── verify-otp.dto.ts
        ├── login-response.dto.ts
        └── auth-user.dto.ts
```

Service:

```ts
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  sendOtp(request: SendOtpDto) {
    return this.http.post<ApiResponseDto<void>>(
      `${this.apiUrl}/send-otp`,
      request
    );
  }

  verifyOtp(request: VerifyOtpDto) {
    return this.http.post<ApiResponseDto<LoginResponseDto>>(
      `${this.apiUrl}/verify-otp`,
      request
    );
  }
}
```

---

# 31. Component-to-Service Communication

Preferred:

```text
Component
    ↓
Feature Service
    ↓
HttpClient
    ↓
Interceptor
    ↓
Backend API
```

Never:

```text
Component
    ↓
HttpClient
    ↓
Backend
```

for normal feature API communication.

---

# 32. API Contract Changes

When Backend API changes:

1. Check the Backend endpoint.
2. Check request DTO.
3. Check response DTO.
4. Update Angular DTOs.
5. Update Service method.
6. Update affected components/pages.
7. Check TypeScript compilation.
8. Check API integration.
9. Check error handling.
10. Do NOT patch the frontend with `any` just to remove compiler errors.

---

# 33. No Duplicate Services

Before creating a new service, search the project.

Do NOT create:

```text
organization.service.ts
organizations.service.ts
organization-api.service.ts
organization-data.service.ts
```

for the same feature.

There MUST be one authoritative API service per feature unless there is a clearly documented reason to split responsibilities.

---

# 34. No Duplicate DTOs

Before creating a DTO, search the project.

Do NOT create:

```text
OrganizationDto
OrganizationModelDto
OrganizationDataDto
OrganizationResponse
OrganizationResult
```

for the same Backend contract.

Reuse the existing DTO when the contract is the same.

---

# 35. API Integration Checklist

Before considering an API integration complete, verify:

* [ ] Feature folder exists.
* [ ] Folder names use kebab-case/lowercase.
* [ ] DTOs are strongly typed.
* [ ] DTO names are consistent.
* [ ] DTO filenames match DTO names.
* [ ] Service name follows `[Feature]Service`.
* [ ] Service filename follows `[feature].service.ts`.
* [ ] Service uses Angular DI consistently.
* [ ] `inject()` is preferred for new Angular 20+ code.
* [ ] `providedIn: 'root'` is used where appropriate.
* [ ] `HttpClient` is injected into the service.
* [ ] Components do not directly call `HttpClient`.
* [ ] API URLs are centralized.
* [ ] HTTP verbs match the Backend contract.
* [ ] API methods have semantic names.
* [ ] Request DTOs match Backend requests.
* [ ] Response DTOs match Backend responses.
* [ ] `any` is not used to bypass typing.
* [ ] Authentication headers are handled centrally.
* [ ] Error handling follows the global application strategy.
* [ ] UI logic is not placed inside API services.
* [ ] Duplicate services do not exist.
* [ ] Duplicate DTOs do not exist.
* [ ] Existing project naming conventions are preserved.
* [ ] TypeScript compilation succeeds.
* [ ] API integration has been tested.

---

# 36. Mandatory Rule for AI Coding Agents

When an AI agent such as Claude, Jules, Cursor, Copilot, or another coding agent works on the Angular project, it MUST follow this document.

Before creating any new:

```text
Service
DTO
Model
Folder
API method
Interceptor
Guard
Component
```

the agent MUST first inspect the existing project structure and search for an existing equivalent.

The agent MUST NOT create a new naming pattern when an established project pattern already exists.

The agent MUST preserve consistency with existing ARIAHR Angular code.

If an existing pattern conflicts with this document, the agent MUST NOT silently create a third pattern.

It MUST identify the conflict and follow the project's established standard unless the developer explicitly approves changing the standard.

---

# 37. Forbidden Patterns

The following patterns are forbidden unless explicitly approved:

```text
any
unknown API response without justification
HttpClient directly inside components
fetch() for normal API communication
duplicated API services
duplicated DTOs
random folder structures
PascalCase filenames
snake_case filenames
mixed service naming
mixed DI styles in newly created code
hard-coded API URLs
hard-coded Authorization headers
UI logic inside API services
API logic inside components
generic methods such as getData()
generic services such as api.service.ts for feature-specific APIs
```

---

# 38. Final Architecture Rule

Every API integration in ARIAHR Angular MUST follow this structure:

```text
Feature
│
├── components/
│
├── pages/
│
├── services/
│   └── feature.service.ts
│
├── models/
│   ├── feature.dto.ts
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── feature-response.dto.ts
│
├── mappers/              (only when required)
│
└── feature.routes.ts
```

And the runtime communication flow MUST be:

```text
UI
 ↓
Component / Page
 ↓
Feature Service
 ↓
HttpClient
 ↓
HTTP Interceptor
 ↓
Backend API
 ↓
Typed DTO
 ↓
Component / State
```

This architecture is the single standard for Angular 20+ API integration in ARIAHR.

**Consistency is mandatory.**

When a new API is implemented, the developer must first look at an existing correctly implemented API and follow the same structure, naming, DI, DTO, service, and error-handling pattern.

Do not invent a new pattern when an established ARIAHR pattern already exists.
