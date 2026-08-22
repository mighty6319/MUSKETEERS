# Financial Rules

This document describes the financial rules currently used by KNOW'E LEDGER. The
platform is an educational simulation: it helps users understand how income and
expenses affect available money, but it does not provide professional financial
advice.

## 1. Income Categories

The user selects an income category before entering a monthly salary. The salary
must be an integer within the corresponding range:

| Category | Internal value | Monthly salary range |
|---|---|---:|
| Low | `less` | INR 10,000 to INR 25,000 |
| Moderate | `average` | INR 25,000 to INR 83,000 |
| High | `high` | INR 83,000 to INR 200,000 |

The range boundaries are inclusive. A salary outside the selected range is
rejected by the frontend before the profile is submitted.

## 2. Required Profile Choices

The profile must include:

- Age
- Income category
- Gender
- Nature/personality selection
- City cost category: `expensive` or `less expensive`
- Monthly salary
- At least one selected expense category

The selected gender, income category, and city category are used to find the
matching survey profile and its expense distribution.

## 3. Expense Distribution

Each expense is represented by a category, a percentage of salary, and an amount
in INR. Expenses are displayed from the highest percentage to the lowest
percentage.

The amount represented by a percentage is calculated as:

```text
expense amount = monthly salary x expense percentage / 100
```

The application calculates total expenses by adding the stored expense amounts:

```text
total expenses = sum of all expense amounts
```

Percentages shown in charts are constrained to the display range of 0% to 100%.
This protects the visualization from invalid values, while the stored source
data remains unchanged.

## 4. Remaining Income

The amount left after the displayed expenses is:

```text
remaining income = monthly salary - total expenses
```

A positive result represents money remaining after the listed expenses. A zero
result means the listed expenses use the full salary. A negative result means
the listed expenses exceed the salary and should be reviewed in the simulation.

## 5. Example

For a monthly salary of INR 50,000:

| Expense | Percentage | Amount |
|---|---:|---:|
| Housing | 30% | INR 15,000 |
| Food | 20% | INR 10,000 |
| Transport | 10% | INR 5,000 |
| **Total** | **60%** | **INR 30,000** |

The remaining income is INR 20,000:

```text
INR 50,000 - INR 30,000 = INR 20,000
```

## 6. Data Rules

- Expense percentages must be numeric values.
- Expense amounts must be numeric INR values.
- Salary and expense values are loaded from the selected survey profile and
  stored in PostgreSQL through the FastAPI backend.
- The dashboard reads the saved profile and expense data before rendering the
	income summary and charts.