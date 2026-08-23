# Double-Save Guard Specification

## Purpose

Prevent duplicate consulta creation when the "Guardar Consulta" button is clicked multiple times during slow network conditions. The guard uses async state tracking to ensure only one submission is processed at a time.

## Requirements

### Requirement: Save State Tracking

The system SHALL maintain an `isSaving` boolean state that tracks whether a consulta submission is currently in progress. The state MUST be `true` from the moment `handleSubmit` begins until the Supabase insert completes or fails.

#### Scenario: Save state activates on submit

- GIVEN the consulta form is valid and ready to save
- WHEN the user clicks "Guardar Consulta"
- THEN `isSaving` becomes `true`
- AND the button becomes disabled

#### Scenario: Save state resets after success

- GIVEN a consulta submission is in progress
- WHEN Supabase confirms the insert
- THEN `isSaving` returns to `false`
- AND the user is navigated away from the form

#### Scenario: Save state resets after error

- GIVEN a consulta submission is in progress
- WHEN Supabase returns an error
- THEN `isSaving` returns to `false`
- AND the button becomes enabled again
- AND an error message is displayed

### Requirement: Duplicate Submission Prevention

The system SHALL reject any submit action while `isSaving` is `true`. The `handleSubmit` function MUST return early without calling Supabase if a save is already in progress.

#### Scenario: Rapid double-click creates single consulta

- GIVEN the consulta form is valid
- WHEN the user double-clicks "Guardar Consulta" within 200ms
- THEN exactly one consulta is created in Supabase
- AND the second click is silently ignored

#### Scenario: Button disabled during save

- GIVEN a consulta submission is in progress
- WHEN the user attempts to click the button
- THEN the button does not respond to clicks
- AND no duplicate API call is made

### Requirement: Button Visual Feedback

The system SHALL disable the "Guardar Consulta" button when `isSaving` is `true` OR when form validation fails. The disabled state MUST be visually apparent.

#### Scenario: Button disabled during async save

- GIVEN `isSaving` is `true`
- WHEN the button renders
- THEN it has `disabled` attribute set
- AND visual styling indicates disabled state

#### Scenario: Button enabled after save completes

- GIVEN `isSaving` transitions from `true` to `false`
- WHEN the button re-renders
- THEN it becomes clickable again
- AND normal styling is restored
