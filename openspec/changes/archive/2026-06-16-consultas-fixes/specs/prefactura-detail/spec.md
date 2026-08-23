# Prefactura Detail Specification

## Purpose

Display complete product information in the prefactura (pre-invoice) detail dialog, including the product description field. Correct column header labeling to accurately reflect displayed data.

## Requirements

### Requirement: Complete Product Data Display

The system SHALL display `producto.descripcion` as a dedicated column in the prefactura detail grid. Each row MUST show: código, nombre, descripción, cantidad, precio unitario, and subtotal.

#### Scenario: Product row shows all fields

- GIVEN a prefactura with product items
- WHEN the detail dialog opens
- THEN each row displays código, nombre, descripción, cantidad, precio, and subtotal
- AND the descripción column shows the product's `descripcion` field value

#### Scenario: Product without description shows empty cell

- GIVEN a product with `descripcion` set to empty or null
- WHEN the prefactura detail renders that row
- THEN the descripción cell displays empty or a dash placeholder
- AND other columns remain unaffected

### Requirement: Correct Column Headers

The system SHALL label the product name column as "Nombre" (not "Descripción"). All column headers MUST accurately reflect the data they display.

#### Scenario: Nombre header displays correctly

- GIVEN the prefactura detail dialog is open
- WHEN the grid header row renders
- THEN the second column header reads "Nombre"
- AND the third column header reads "Descripción"

#### Scenario: Header alignment matches data

- GIVEN the grid has 6 columns
- WHEN the header row renders
- THEN each header aligns with its corresponding data column
- AND no header text is truncated or misaligned

### Requirement: Responsive Grid Layout

The system SHALL use a 12-column CSS grid layout that accommodates 6 data columns. Column span allocations MUST be adjusted to fit the additional descripción column without horizontal overflow.

#### Scenario: Grid renders 6 columns within container

- GIVEN the prefactura detail dialog is open
- WHEN the grid renders
- THEN all 6 columns fit within the dialog width
- AND no horizontal scrollbar appears on standard viewport sizes

#### Scenario: Grid adapts to long description text

- GIVEN a product with a lengthy `descripcion` value
- WHEN the row renders
- THEN the description text truncates with ellipsis or wraps within its column
- AND the row height remains consistent with other rows

### Requirement: Data Source Contract

The system SHALL read `producto.descripcion` from the product data already available in the prefactura item. No additional API calls or data fetching is required.

#### Scenario: Description data is immediately available

- GIVEN a prefactura with items containing full product objects
- WHEN the detail dialog opens
- THEN `producto.descripcion` is accessible without async loading
- AND the column populates synchronously with the grid render
